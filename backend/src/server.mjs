import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { env, closeDatabase, databaseHealth } from "./db.mjs";
import { POST } from "./game-controller.mjs";
import {
  initAuth,
  requireAuth,
  login,
  authProviderConfigured,
} from "./auth.mjs";
import {
  initInvitations,
  createInvitation,
  invitation,
  publicInvite,
  checkJoin,
} from "./invitations.mjs";
import { shareCover } from "./share-cover.mjs";
const prod = process.env.NODE_ENV === "production";
const authMode = process.env.AUTH_MODE || "finclip";
if (!["finclip", "pending"].includes(authMode)) throw Error("Invalid AUTH_MODE");
const identityConfigured = authProviderConfigured();
if (
  prod &&
  (!process.env.PUBLIC_BASE_URL?.startsWith("https://") ||
    !process.env.FINCLIP_APP_ID ||
    (authMode === "finclip" && !identityConfigured) ||
    process.env.ALLOW_DEV_GUESTS === "true")
)
  throw Error(
    "Production requires HTTPS PUBLIC_BASE_URL, FINCLIP_APP_ID, authenticated identity exchange, and disabled dev guests.",
  );
await initAuth();
await initInvitations();
const assets = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../miniapp/assets",
);
const locks = new Map(),
  limits = new Map();
let publicBase = "";
const error = (key, status = 400) => Object.assign(Error(key), { status });
async function locked(key, fn) {
  const previous = locks.get(key) || Promise.resolve();
  let unlock;
  const current = new Promise((r) => (unlock = r));
  locks.set(key, current);
  await previous;
  try {
    return await fn();
  } finally {
    unlock();
    if (locks.get(key) === current) locks.delete(key);
  }
}
const timer = setInterval(() => {
  const now = Date.now();
  for (const [key, v] of limits) if (now - v.at > 60000) limits.delete(key);
}, 60000);
timer.unref();
function limited(ip, kind) {
  const key = kind + ":" + ip,
    now = Date.now();
  let q = limits.get(key);
  if (!q || now - q.at > 60000) {
    q = { at: now, n: 0 };
    limits.set(key, q);
  }
  return ++q.n > (kind === "auth" ? 20 : 600);
}
async function core(body, auth) {
  const r = await POST(
    new Request("http://internal/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: "Bearer " + auth.legacy } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
  const json = await r.json();
  if (!r.ok || json.error)
    throw error(json.error || "serviceUnavailable", r.status);
  return json;
}
async function body(req) {
  if (!String(req.headers["content-type"]).startsWith("application/json"))
    throw error("invalidContentType", 415);
  let size = 0;
  const chunks = [];
  for await (const b of req) {
    size += b.length;
    if (size > 1048576) throw error("payloadTooLarge", 413);
    chunks.push(b);
  }
  try {
    const v = JSON.parse(Buffer.concat(chunks).toString());
    if (!v || Array.isArray(v) || typeof v !== "object") throw Error();
    return v;
  } catch {
    throw error("invalidJson", 400);
  }
}
const allowedOps = new Set([
  "profile",
  "rename",
  "create",
  "match",
  "join",
  "state",
  "start",
  "next",
  "action",
  "leave",
  "christmas",
  "christmasEgg",
  "christmasGift",
  "christmasDaily",
  "christmasHatch",
  "christmasTaskSubmit",
  "christmasTaskClaim",
  "christmasTaskEvidence",
  "christmasExchange",
  "christmasFeed",
  "christmasClaim",
  "christmasLeaderboard",
]);
export const server = http.createServer(async (req, res) => {
  const send = (status, value) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(value));
  };
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  try {
    const url = new URL(req.url, "http://localhost"),
      path = url.pathname;
    const remote = req.socket.remoteAddress,
      loopback = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote);
    const ip =
      process.env.TRUST_LOOPBACK_PROXY === "true" && loopback
        ? String(req.headers["x-real-ip"] || remote)
        : remote;
    if (limited(ip, path.startsWith("/v1/auth") ? "auth" : "api")) {
      res.setHeader("Retry-After", "60");
      throw error("rateLimited", 429);
    }
    const origin = req.headers.origin,
      origins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);
    if (origin && origin !== publicBase && !origins.includes(origin))
      throw error("originNotAllowed", 403);
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization",
      );
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (path === "/healthz" && req.method === "GET") {
      send(200, {
        ok: databaseHealth(),
        application: "ONO-FinClip",
        version: "1.0.1",
        frontend: "native-miniapp",
        sharing: "phiz-mini-program-card",
        appId: process.env.FINCLIP_APP_ID || "",
        authentication: { mode: prod ? authMode : "development", ready: authMode !== "pending" && (identityConfigured || (!prod && process.env.ALLOW_DEV_GUESTS === "true")) },
      });
      return;
    }
    if (path.startsWith("/assets/") && req.method === "GET") {
      const invite = path.match(/^\/assets\/invites\/([a-f0-9]{48})\.png$/);
      if (invite) {
        const { r } = await invitation(invite[1], { allowExpired: true });
        const png = shareCover(r.code, r.data.capacity);
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": png.length,
          "Cache-Control": "public,max-age=300",
        });
        res.end(png);
        return;
      }
      const name = decodeURIComponent(path.slice(8)),
        file = resolve(assets, name);
      if (!file.startsWith(assets + "/")) throw error("notFound", 404);
      const type = {
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".png": "image/png",
        ".jpg": "image/jpeg",
      }[extname(file)];
      if (!type) throw error("notFound", 404);
      try {
        if (!(await stat(file)).isFile()) throw Error();
        const data = await readFile(file);
        res.writeHead(200, {
          "Content-Type": type,
          "Content-Length": data.length,
          "Cache-Control": "public,max-age=3600",
        });
        res.end(data);
      } catch {
        throw error("notFound", 404);
      }
      return;
    }
    if (path === "/v1/config" && req.method === "GET") {
      send(200, {appId:process.env.FINCLIP_APP_ID || "", apiBase:publicBase, frontend:"native-miniapp", loginReady:authMode !== "pending" && (identityConfigured || (!prod && process.env.ALLOW_DEV_GUESTS === "true")), sharing:"phiz-mini-program-card"});
      return;
    }
    if (path === "/v1/campaign" && req.method === "GET") {
      send(200, (await core({ op: "christmas" })).christmas);
      return;
    }
    if (authMode === "pending") {
      send(503, {error:"authNotConfigured"});
      return;
    }
    if (path === "/v1/auth/guest" && req.method === "POST") {
      send(200, {
        session: await login(await body(req), core, { mode: "guest" }),
      });
      return;
    }
    if (path === "/v1/auth/finclip" && req.method === "POST") {
      send(200, {
        session: await login(await body(req), core, { mode: "finclip" }),
      });
      return;
    }
    if (path === "/v1/game" && req.method === "POST") {
      const b = await body(req);
      if (!allowedOps.has(b.op)) throw error("invalidAction");
      // The weekly board is public so visitors can browse it before signing in.
      if (b.op === "christmasLeaderboard" && !req.headers.authorization) {
        send(200, await core(b, null));
        return;
      }
      const auth = await requireAuth(req.headers.authorization);
      const result = await locked(auth.player, async () => {
        if (b.op === "join") {
          delete b.joinRoomId;
          const target = await env.DB.prepare(
            "SELECT id FROM rooms WHERE code=? AND kind='private' AND status IN ('waiting','playing','roundOver') AND updated>?",
          )
            .bind(String(b.code), Date.now() - 3600000)
            .first();
          if (target) await checkJoin(auth.player, target.id);
        }
        return core(b, auth);
      });
      send(200, result);
      return;
    }
    const match = path.match(/^\/v1\/invitations\/([a-f0-9]{48})(\/join)?$/);
    if (match && req.method === "GET" && !match[2]) {
      const { row, r } = await invitation(match[1]);
      send(200, { invitation: publicInvite(row, r) });
      return;
    }
    const auth = await requireAuth(req.headers.authorization);
    if (path === "/v1/auth/logout" && req.method === "POST") {
      await env.DB.prepare("DELETE FROM mini_access_tokens WHERE hash=?")
        .bind(auth.accessHash)
        .run();
      send(200, { ok: true });
      return;
    }
    if (path === "/v1/invitations" && req.method === "POST") {
      const b = await body(req);
      const result = await locked(auth.player, () =>
        createInvitation(auth.player, b.roomId, b.lang),
      );
      result.imageUrl = publicBase + "/assets/invites/" + result.token + ".png";
      result.appId = process.env.FINCLIP_APP_ID || "";
      send(201, { invitation: result });
      return;
    }
    if (match && match[2] && req.method === "POST") {
      const result = await locked(auth.player, async () => {
        const { r } = await invitation(match[1]);
        await checkJoin(auth.player, r.id);
        return core({ op: "join", code: r.code, joinRoomId: r.id }, auth);
      });
      send(200, result);
      return;
    }
    throw error("notFound", 404);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error("ONO API failure:", e.message);
    send(status, { error: status >= 500 ? "serviceUnavailable" : e.message });
  }
});
server.requestTimeout = 20000;
server.headersTimeout = 12000;
server.listen(
  Number(process.env.PORT || 4390),
  process.env.HOST || "127.0.0.1",
  () => {
    publicBase = (
      process.env.PUBLIC_BASE_URL || "http://127.0.0.1:" + server.address().port
    ).replace(/\/$/, "");
    console.log("ONO API listening " + publicBase);
    console.log("ONO API bound http://127.0.0.1:" + server.address().port);
  },
);
function stop() {
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
