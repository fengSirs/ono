import { randomBytes, createHash } from "node:crypto";
import { env } from "./db.mjs";
export const sha = (v) => createHash("sha256").update(String(v)).digest("hex");
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
  const url = process.env.AUTH_EXCHANGE_URL,
    secret = process.env.AUTH_EXCHANGE_TOKEN,
    appId = process.env.FINCLIP_APP_ID;
  if (!url || !secret || !appId) fail("authNotConfigured", 503);
  if (!url.startsWith("https://")) fail("authNotConfigured", 503);
  await env.DB.prepare("DELETE FROM mini_auth_codes WHERE created<?")
    .bind(Date.now() - 86400000)
    .run();
  const codeKey = sha(appId + ":" + code);
  try {
    await env.DB.prepare("INSERT INTO mini_auth_codes VALUES(?,?)")
      .bind(codeKey, Date.now())
      .run();
  } catch {
    fail("loginCodeUsed", 409);
  }
  let identity;
  try {
    const res = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + secret,
      },
      body: JSON.stringify({ code, appId }),
    });
    if (!res.ok) fail("loginFailed");
    identity = await res.json();
  } catch {
    fail("loginFailed");
  }
  if (
    typeof identity.subject !== "string" ||
    !identity.subject.trim() ||
    identity.subject.length > 200
  )
    fail("loginFailed");
  const issuer = "phiz:" + appId;
  let linked = await env.DB.prepare(
    "SELECT s.id,s.name FROM mini_identities i JOIN sessions s ON s.id=i.player WHERE i.issuer=? AND i.subject=?",
  )
    .bind(issuer, identity.subject)
    .first();
  if (!linked) {
    const player = await core({ op: "session", name });
    await env.DB.prepare("INSERT OR IGNORE INTO mini_identities VALUES(?,?,?)")
      .bind(issuer, identity.subject, player.id)
      .run();
    linked = await env.DB.prepare(
      "SELECT s.id,s.name FROM mini_identities i JOIN sessions s ON s.id=i.player WHERE i.issuer=? AND i.subject=?",
    )
      .bind(issuer, identity.subject)
      .first();
  }
  return issue(linked);
}
