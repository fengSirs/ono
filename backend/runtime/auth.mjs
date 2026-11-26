import { randomBytes, createHash } from "node:crypto";
import { env } from "./db.mjs";
export const sha = (v) => createHash("sha256").update(String(v)).digest("hex");
const DEFAULT_PHIZ_OPEN_BASE_URL = "https://admin.phiz.chat";
const identityLocks = new Map();
const fail = (key, status = 401) => {
  throw Object.assign(Error(key), { status });
};
export function initAuth(db = env.DB) {
  return db.batch([
    db.prepare(
      "CREATE TABLE IF NOT EXISTS mini_access_tokens(hash TEXT PRIMARY KEY,player TEXT NOT NULL,expires INTEGER NOT NULL)",
    ),
    db.prepare(
      "CREATE TABLE IF NOT EXISTS mini_identities(issuer TEXT NOT NULL,subject TEXT NOT NULL,player TEXT NOT NULL,PRIMARY KEY(issuer,subject))",
    ),
    db.prepare(
      "CREATE TABLE IF NOT EXISTS mini_auth_codes(hash TEXT PRIMARY KEY,created INTEGER NOT NULL)",
    ),
  ]);
}
export async function requireAuth(header, db = env.DB) {
  const token = String(header || "").match(
    /^Bearer ([A-Za-z0-9_-]{40,100})$/,
  )?.[1];
  if (!token) fail("sessionExpired");
  const row = await db
    .prepare(
      "SELECT a.player,a.expires,s.token AS legacy,s.name FROM mini_access_tokens a JOIN sessions s ON s.id=a.player WHERE a.hash=? AND a.expires>?",
    )
    .bind(sha(token), Date.now())
    .first();
  if (!row) fail("sessionExpired");
  return { ...row, accessHash: sha(token) };
}
export async function issue(player, db = env.DB) {
  const token = randomBytes(32).toString("base64url"),
    expires = Date.now() + 30 * 86400000;
  await db
    .prepare("DELETE FROM mini_access_tokens WHERE expires<=?")
    .bind(Date.now())
    .run();
  await db
    .prepare("INSERT INTO mini_access_tokens VALUES(?,?,?)")
    .bind(sha(token), player.id, expires)
    .run();
  return { id: player.id, name: player.name, token, expires };
}
export function cleanName(name) {
  const value = Array.from(
    String(name || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .replace(/\s+/g, " "),
  )
    .slice(0, 20)
    .join("");
  if (Array.from(value).length < 2) fail("nameRequired", 400);
  return value;
}
function identityProvider() {
  const appId = process.env.FINCLIP_APP_ID;
  if (!appId) fail("authNotConfigured", 503);

  // Preferred: the Phiz OpenId exchange documented for native pz.login.
  const phizBase =
    process.env.PHIZ_OPEN_BASE_URL?.trim() || DEFAULT_PHIZ_OPEN_BASE_URL;
  const phizSecret = process.env.PHIZ_APP_SECRET?.trim();
  if (phizSecret) {
    let base;
    try {
      base = new URL(phizBase);
    } catch {
      fail("authNotConfigured", 503);
    }
    if (
      base.protocol !== "https:" ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    )
      fail("authNotConfigured", 503);
    return {
      kind: "phiz",
      appId,
      secret: phizSecret,
      url: new URL("/api/3.0/token/getOpenId", base).toString(),
    };
  }

  // Compatibility: a trusted exchange service implementing {code,appId} -> {subject}.
  const url = process.env.AUTH_EXCHANGE_URL;
  const secret = process.env.AUTH_EXCHANGE_TOKEN;
  if (!url || !secret) fail("authNotConfigured", 503);
  if (!url.startsWith("https://")) fail("authNotConfigured", 503);
  return { kind: "exchange", appId, secret, url };
}

export function authProviderConfigured() {
  try {
    identityProvider();
    return true;
  } catch {
    return false;
  }
}

async function withIdentityLock(key, fn) {
  const previous = identityLocks.get(key) || Promise.resolve();
  let unlock;
  const current = new Promise((resolve) => (unlock = resolve));
  identityLocks.set(key, current);
  await previous;
  try {
    return await fn();
  } finally {
    unlock();
    if (identityLocks.get(key) === current) identityLocks.delete(key);
  }
}

function openIdFrom(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (
    payload.code !== undefined &&
    ![0, 200, "0", "200"].includes(payload.code)
  )
    return "";
  const candidates = [
    payload.openId,
    payload.openid,
    payload.data?.openId,
    payload.data?.openid,
    payload.result?.openId,
    payload.result?.openid,
  ];
  return candidates.find(
    (value) => typeof value === "string" && value.trim(),
  ) || "";
}

async function exchangeIdentity(provider, code) {
  const url = provider.kind === "phiz" ? new URL(provider.url) : provider.url;
  if (provider.kind === "phiz") {
    url.search = new URLSearchParams({
      appId: provider.appId,
      appSecret: provider.secret,
      code,
    }).toString();
  }
  const res = await fetch(url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/json" },
    ...(provider.kind === "exchange"
      ? {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + provider.secret,
          },
          body: JSON.stringify({ code, appId: provider.appId }),
        }
      : {}),
  });
  if (!res.ok)
    throw Object.assign(Error("loginFailed"), {
      reason: "providerRejected",
      providerStatus: res.status,
    });
  const payload = await res.json();
  if (provider.kind === "phiz") {
    const openId = openIdFrom(payload);
    if (!openId)
      throw Object.assign(Error("loginFailed"), {
        reason: "providerIdentityMissing",
      });
    return { subject: openId };
  }
  return payload;
}

export async function login(body, core, { mode = "guest" } = {}) {
  const name = cleanName(body.name);
  if (mode === "guest") {
    if (
      process.env.NODE_ENV === "production" ||
      process.env.ALLOW_DEV_GUESTS !== "true"
    )
      fail("guestDisabled", 403);
    const res = await core({ op: "session", name });
    return issue(res);
  }
  const code = String(body.code || "");
  if (!/^[A-Za-z0-9._-]{6,512}$/.test(code)) fail("loginCodeRequired", 400);
  const provider = identityProvider();
  await env.DB.prepare("DELETE FROM mini_auth_codes WHERE created<?")
    .bind(Date.now() - 86400000)
    .run();
  const codeKey = sha(provider.appId + ":" + code);
  try {
    await env.DB.prepare("INSERT INTO mini_auth_codes VALUES(?,?)")
      .bind(codeKey, Date.now())
      .run();
  } catch {
    fail("loginCodeUsed", 409);
  }
  let identity;
  try {
    identity = await exchangeIdentity(provider, code);
  } catch (error) {
    // A one-time auth code must not remain reserved when the provider did not
    // complete identity exchange. Otherwise the user's next attempt with the
    // same host code turns a useful provider failure into a confusing 409.
    await env.DB.prepare("DELETE FROM mini_auth_codes WHERE hash=?")
      .bind(codeKey)
      .run();
    console.warn(
      "[auth] identity exchange failed",
      provider.kind,
      (error && error.reason) || "exchangeError",
      (error && error.providerStatus) || "",
    );
    fail("loginFailed");
  }
  if (
    typeof identity.subject !== "string" ||
    !identity.subject.trim() ||
    identity.subject.length > 200
  )
  {
    await env.DB.prepare("DELETE FROM mini_auth_codes WHERE hash=?")
      .bind(codeKey)
      .run();
    fail("loginFailed");
  }
  const issuer = "phiz:" + provider.appId;
  const linked = await withIdentityLock(issuer + ":" + identity.subject, async () => {
    let player = await env.DB.prepare(
      "SELECT s.id,s.name FROM mini_identities i JOIN sessions s ON s.id=i.player WHERE i.issuer=? AND i.subject=?",
    )
      .bind(issuer, identity.subject)
      .first();
    if (!player) {
      const created = await core({ op: "session", name });
      await env.DB.prepare("INSERT OR IGNORE INTO mini_identities VALUES(?,?,?)")
        .bind(issuer, identity.subject, created.id)
        .run();
      player = await env.DB.prepare(
        "SELECT s.id,s.name FROM mini_identities i JOIN sessions s ON s.id=i.player WHERE i.issuer=? AND i.subject=?",
      )
        .bind(issuer, identity.subject)
        .first();
    }
    return player;
  });
  return issue(linked);
}
