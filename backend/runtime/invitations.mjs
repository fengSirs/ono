import { randomBytes } from "node:crypto";
import { env } from "./db.mjs";
import { sha } from "./auth.mjs";
const fail = (key, status = 400) => {
  throw Object.assign(Error(key), { status });
};
export async function initInvitations() {
  await env.DB.batch([
    env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS mini_invitations(hash TEXT PRIMARY KEY,room TEXT NOT NULL,issuer TEXT NOT NULL,lang TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS mini_invites_expiry ON mini_invitations(expires)",
    ),
  ]);
}
export async function room(id) {
  const r = await env.DB.prepare("SELECT * FROM rooms WHERE id=?")
    .bind(String(id))
    .first();
  if (!r) fail("roomMissing", 404);
  return { ...r, data: JSON.parse(r.data) };
}
export async function active(player) {
  return env.DB.prepare(
    "SELECT id FROM rooms WHERE status IN ('waiting','playing','roundOver') AND updated>? AND EXISTS (SELECT 1 FROM json_each(rooms.data,'$.players') p WHERE json_extract(p.value,'$.id')=?) ORDER BY updated DESC LIMIT 1",
  )
    .bind(Date.now() - 3600000, player)
    .first();
}
export async function checkJoin(player, target) {
  const a = await active(player);
  if (a && a.id !== target) fail("alreadyInRoom", 409);
}
export async function createInvitation(
  player,
  id,
  lang = "pt",
  now = Date.now(),
) {
  const r = await room(id);
  if (r.kind !== "private" || !r.data.players.some((p) => p.id === player))
    fail("notMember", 403);
  if (r.status !== "waiting" || r.updated < now - 3600000)
    fail("alreadyStarted", 409);
  const token = randomBytes(24).toString("hex"),
    expires = now + 15 * 60000;
  lang = ["pt", "en", "zh"].includes(lang) ? lang : "pt";
  await env.DB.prepare("DELETE FROM mini_invitations WHERE expires<?")
    .bind(now - 86400000)
    .run();
  await env.DB.prepare("INSERT INTO mini_invitations VALUES(?,?,?,?,?,?)")
    .bind(sha(token), r.id, player, lang, now, expires)
    .run();
  return {
    token,
    expires,
    roomId: r.id,
    code: r.code,
    capacity: r.data.capacity,
    players: r.data.players.length,
    path: "pages/invite/index?token=" + token,
    lang,
  };
}
export async function invitation(
  token,
  { allowExpired = false, now = Date.now() } = {},
) {
  if (!/^[a-f0-9]{48}$/.test(token)) fail("inviteInvalid", 404);
  const row = await env.DB.prepare(
    "SELECT * FROM mini_invitations WHERE hash=?",
  )
    .bind(sha(token))
    .first();
  if (!row) fail("inviteInvalid", 404);
  if (!allowExpired && row.expires <= now) fail("inviteExpired", 410);
  const r = await room(row.room);
  if (!allowExpired && (r.updated < now - 3600000 || r.status === "closed"))
    fail("roomMissing", 410);
  return { row, r };
}
export function publicInvite(row, r) {
  return {
    roomId: r.id,
    code: r.code,
    host: r.data.players.find((p) => p.id === r.data.host)?.name || "ONO!",
    players: r.data.players.map((p) => ({ name: p.name })),
    capacity: r.data.capacity,
    rounds: r.data.rounds,
    status: r.status,
    full: r.data.players.length >= r.data.capacity,
    expires: row.expires,
    lang: row.lang,
  };
}
