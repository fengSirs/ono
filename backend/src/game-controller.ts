import {
  christmasAction,
  christmasSnapshot,
  settleChristmasRound,
  roundRewards,
} from "./domain/christmas.mjs";
import { env } from "./db.mjs";
import { newGame, act, startRound, view, botAction } from "./domain/engine.mjs";
export const dynamic = "force-dynamic";
const json = (x: any, status = 200) =>
  Response.json(x, { status, headers: { "Cache-Control": "no-store" } });
function fail(key: string): never {
  throw new Error(key);
}
async function session(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) fail("sessionExpired");
  const s = await env
    .DB!.prepare("SELECT * FROM sessions WHERE token=?")
    .bind(token)
    .first<any>();
  if (!s) fail("sessionExpired");
  await env
    .DB!.prepare("UPDATE sessions SET seen=? WHERE id=?")
    .bind(Date.now(), s.id)
    .run();
  return s;
}
async function getRoom(id: string) {
  const r = await env
    .DB!.prepare("SELECT * FROM rooms WHERE id=?")
    .bind(id)
    .first<any>();
  if (!r) fail("roomMissing");
  r.data = JSON.parse(r.data);
  return r;
}
async function update(r: any) {
  const q = await env
    .DB!.prepare(
      "UPDATE rooms SET data=?,status=?,rev=rev+1,updated=? WHERE id=? AND rev=?",
    )
    .bind(JSON.stringify(r.data), r.status, Date.now(), r.id, r.rev)
    .run();
  if (q.meta.changes > 0) {
    r.rev++;
    return true;
  }
  return false;
}
async function mutate(id: string, fn: (r: any) => any) {
  for (let i = 0; i < 8; i++) {
    const r = await getRoom(id);
    const result = await fn(r);
    if (await update(r)) return { r, result };
  }
  fail("retry");
}
function check(r: any, s: any) {
  if (!r.data.players.some((p: any) => p.id === s.id)) fail("notMember");
}
async function response(r: any, s: any) {
  await settleChristmasRound(env.DB!, r);
  return {
    christmas: await christmasSnapshot(env.DB!, s.id),
    room: {
      id: r.id,
      code: r.code,
      kind: r.kind,
      status: r.status,
      rev: r.rev,
      host: r.data.host,
      capacity: r.data.capacity,
      rounds: r.data.rounds,
      rewards: await roundRewards(env.DB!, r),
      queuedAt: r.kind === "online" ? (r.data.queuedAt ?? r.updated) : null,
      players: r.data.players,
      game: view(r.data.game, s.id),
    },
  };
}
async function expiredTurn(r: any) {
  const g = r.data.game;
  if (g?.status === "playing" && Date.now() - g.turnAt > 30000) {
    const p = g.players[g.turn];
    act(g, p.id, { type: g.drawn ? "pass" : "draw" });
    if (g.drawn) act(g, p.id, { type: "pass" });
    r.status = g.status;
  }
}
function onlineCapacity(data: any): number {
  return [2, 3, 4].includes(Number(data.capacity)) ? Number(data.capacity) : 2;
}
async function resolveRoom(id: string): Promise<any> {
  const visited = new Set<string>();
  for (let i = 0; i < 8; i++) {
    if (visited.has(id)) fail("roomMissing");
    visited.add(id);
    const room = await getRoom(id);
    if (room.status !== "redirect") return room;
    id = room.data.redirect;
  }
  fail("retry");
}
async function activeRoomFor(player: string) {
  const row = await env
    .DB!.prepare(
      "SELECT id FROM rooms WHERE status IN ('waiting','playing','roundOver') AND updated>? AND EXISTS (SELECT 1 FROM json_each(rooms.data,'$.players') p WHERE json_extract(p.value,'$.id')=?) ORDER BY updated DESC LIMIT 1",
    )
    .bind(Date.now() - 3600000, player)
    .first<any>();
  return row ? resolveRoom(row.id) : null;
}
async function pairWaiting(initial: any): Promise<any> {
  const r = await resolveRoom(initial.id);
  if (
    r.kind !== "online" ||
    r.status !== "waiting" ||
    Date.now() - (r.data.queuedAt ?? r.updated) >= 8000
  )
    return r;
  const capacity = onlineCapacity(r.data);
  const candidates = await env
    .DB!.prepare(
      "SELECT * FROM rooms WHERE kind='online' AND status='waiting' AND id<>? AND updated>? AND coalesce(json_extract(data,'$.capacity'),2)=? ORDER BY coalesce(json_extract(data,'$.queuedAt'),updated),id LIMIT 20",
    )
    .bind(r.id, Date.now() - 30000, capacity)
    .all<any>();
  for (const item of candidates.results) {
    const other = { ...item, data: JSON.parse(item.data) };
    if (
      onlineCapacity(other.data) !== capacity ||
      Date.now() - (other.data.queuedAt ?? other.updated) >= 8000
    )
      continue;
    const host = await env
      .DB!.prepare("SELECT seen FROM sessions WHERE id=?")
      .bind(other.data.host)
      .first<any>();
    if (!host || Date.now() - host.seen > 15000) continue;
    // Always keep the oldest queue (ID breaks equal-time ties). The target's
    // ordering key never changes, so concurrent redirects cannot form a cycle.
    const rAt = r.data.queuedAt ?? r.updated,
      otherAt = other.data.queuedAt ?? other.updated;
    const moveR = rAt > otherAt || (rAt === otherAt && r.id > other.id);
    const source = moveR ? r : other;
    const destination = moveR ? other : r;
    const target = { ...destination.data };
    const combined = [...target.players, ...source.data.players];
    if (
      combined.length > capacity ||
      new Set(combined.map((p: any) => p.id)).size !== combined.length
    )
      continue;
    target.capacity = capacity;
    target.players = combined;
    target.queuedAt = Math.min(
      destination.data.queuedAt ?? destination.updated,
      source.data.queuedAt ?? source.updated,
    );
    const ready = combined.length === capacity;
    if (ready) {
      target.matchedAt = Date.now();
      target.game = newGame(combined, 1);
    }
    const now = Date.now(),
      cutoff = now - 8000;
    const results = await env.DB!.batch([
      env
        .DB!.prepare(
          "UPDATE rooms SET status='redirect',data=?,rev=rev+1,updated=? WHERE id=? AND rev=? AND status='waiting' AND coalesce(json_extract(data,'$.queuedAt'),updated)>? AND EXISTS (SELECT 1 FROM rooms WHERE id=? AND rev=? AND status='waiting' AND coalesce(json_extract(data,'$.queuedAt'),updated)>?)",
        )
        .bind(
          JSON.stringify({ ...source.data, redirect: destination.id }),
          now,
          source.id,
          source.rev,
          cutoff,
          destination.id,
          destination.rev,
          cutoff,
        ),
      env
        .DB!.prepare(
          "UPDATE rooms SET status=?,data=?,rev=rev+1,updated=? WHERE id=? AND rev=? AND status='waiting' AND EXISTS (SELECT 1 FROM rooms WHERE id=? AND status='redirect' AND rev=? AND json_extract(data,'$.redirect')=?)",
        )
        .bind(
          ready ? "playing" : "waiting",
          JSON.stringify(target),
          now,
          destination.id,
          destination.rev,
          source.id,
          source.rev + 1,
          destination.id,
        ),
    ]);
    if (results[0].meta.changes && results[1].meta.changes)
      return resolveRoom(r.id);
    // A join, cancel or fallback changed the roster. Re-read before merging again.
    return resolveRoom(r.id);
  }
  return resolveRoom(r.id);
}
async function fillWithBot(source: any) {
  const r = await resolveRoom(source.id);
  if (
    r.kind !== "online" ||
    r.status !== "waiting" ||
    Date.now() - (r.data.queuedAt ?? r.updated) < 8000
  )
    return r;
  const result = await mutate(r.id, (current) => {
    if (
      current.kind !== "online" ||
      current.status !== "waiting" ||
      Date.now() - (current.data.queuedAt ?? current.updated) < 8000
    )
      return;
    const capacity = onlineCapacity(current.data);
    current.data.capacity = capacity;
    const names = ["Luna", "Rafa", "Bia"];
    while (current.data.players.length < capacity) {
      current.data.players.push({
        id: "bot-" + crypto.randomUUID(),
        name: names[current.data.players.length - 1],
        bot: true,
      });
    }
    current.data.matchedAt = Date.now();
    current.data.game = newGame(current.data.players, 1);
    current.status = "playing";
  });
  return resolveRoom(result.r.id);
}
async function advanceRoom(r: any, s: any) {
  const g = r.data.game;
  if (g?.status !== "playing") return r;
  const p = g.players[g.turn];
  const due = p.bot
    ? Date.now() - g.turnAt >= 900
    : Date.now() - g.turnAt > 30000;
  if (!due) return r;
  const result = await mutate(r.id, async (current) => {
    check(current, s);
    const game = current.data.game;
    if (game?.status !== "playing") return;
    const player = game.players[game.turn];
    if (player.bot) {
      if (Date.now() - game.turnAt >= 900) {
        act(game, player.id, botAction(game));
        current.status = game.status;
      }
    } else await expiredTurn(current);
  });
  return result.r;
}
function cleanName(value: unknown) {
  return Array.from(
    String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .replace(/\s+/g, " "),
  )
    .slice(0, 20)
    .join("");
}
export async function POST(req: Request) {
  try {
    if (!env.DB) return json({ error: "serviceUnavailable" }, 503);
    const b: any = await req.json();
    if (b.op === "session") {
      const token = crypto.randomUUID() + crypto.randomUUID(),
        id = crypto.randomUUID();
      const name =
        cleanName(b.name) || "Jogador-" + id.slice(0, 4).toUpperCase();
      await env
        .DB!.prepare(
          "INSERT INTO sessions (id,token,name,tickets,seen) VALUES (?,?,?,0,?)",
        )
        .bind(id, token, name, Date.now())
        .run();
      return json({ id, token, name });
    }
    if (
      (b.op === "christmas" || b.op === "christmasLeaderboard") &&
      !req.headers.get("authorization")
    )
      return json(await christmasAction(env.DB!, null, b));
    const s = await session(req);
    if (
      [
        "christmas",
        "christmasGift",
        "christmasEgg",
        "christmasHatch",
        "christmasDaily",
        "christmasTaskSubmit",
        "christmasTaskClaim",
        "christmasTaskEvidence",
        "christmasExchange",
        "christmasFeed",
        "christmasClaim",
        "christmasLeaderboard",
      ].includes(b.op)
    )
      return json(await christmasAction(env.DB!, s.id, b));
    if (b.op === "profile") return json({ id: s.id, name: s.name });
    if (b.op === "rename") {
      const name = cleanName(b.name);
      if (Array.from(name).length < 2) fail("nameRequired");
      await env
        .DB!.prepare("UPDATE sessions SET name=? WHERE id=?")
        .bind(name, s.id)
        .run();
      const active = await env
        .DB!.prepare(
          "SELECT id FROM rooms WHERE status IN ('waiting','playing','roundOver') AND EXISTS (SELECT 1 FROM json_each(rooms.data,'$.players') WHERE json_extract(value,'$.id')=?)",
        )
        .bind(s.id)
        .all<any>();
      for (const item of active.results)
        await mutate(item.id, (r) => {
          const p = r.data.players.find((p: any) => p.id === s.id);
          if (p) p.name = name;
          const gp = r.data.game?.players.find((p: any) => p.id === s.id);
          if (gp) gp.name = name;
        });
      return json({ name });
    }
    if (b.op === "create" || b.op === "match") {
      const requested = b.capacity === undefined ? 2 : Number(b.capacity);
      if (b.op === "match" && ![2, 3, 4].includes(requested))
        fail("invalidMatchSize");
      const existing = await activeRoomFor(s.id);
      if (existing) {
        const current =
          existing.kind === "online" && existing.status === "waiting"
            ? await fillWithBot(await pairWaiting(existing))
            : existing;
        return json(await response(current, s));
      }
      const id = crypto.randomUUID(),
        kind = b.op === "match" ? "online" : "private";
      let code = String(
        (crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000,
      );
      const capacity =
        kind === "online"
          ? requested
          : [2, 3, 4].includes(Number(b.capacity))
            ? Number(b.capacity)
            : 4;
      const rounds =
        kind === "online"
          ? 1
          : [1, 3, 5].includes(Number(b.rounds))
            ? Number(b.rounds)
            : 1;
      const data = {
        host: s.id,
        queuedAt: kind === "online" ? Date.now() : undefined,
        capacity,
        rounds,
        players: [{ id: s.id, name: s.name }],
        game: null,
      };
      // Make membership creation atomic, including simultaneous requests from
      // the same session. Redirect sources do not count as active rooms.
      for (let attempt = 0; attempt < 12; attempt++) {
        try {
          await env
            .DB!.prepare(
              "INSERT INTO rooms (id,code,kind,status,data,rev,updated) SELECT ?,?,?,'waiting',?,0,? WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE status IN ('waiting','playing','roundOver') AND updated>? AND EXISTS (SELECT 1 FROM json_each(rooms.data,'$.players') p WHERE json_extract(p.value,'$.id')=?))",
            )
            .bind(
              id,
              code,
              kind,
              JSON.stringify(data),
              Date.now(),
              Date.now() - 3600000,
              s.id,
            )
            .run();
          break;
        } catch (e: any) {
          if (!String(e.message).includes("rooms.code") || attempt === 11)
            throw e;
          code = String(
            (crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000,
          );
        }
      }
      let current = await activeRoomFor(s.id);
      if (!current) fail("retry");
      if (current.kind === "online" && current.status === "waiting")
        current = await fillWithBot(await pairWaiting(current));
      check(current, s);
      return json(await response(current, s));
    }
    if (b.op === "join") {
      if (!/^\d{6}$/.test(String(b.code))) fail("invalidCode");
      const target = await env
        .DB!.prepare(
          b.joinRoomId
            ? "SELECT id FROM rooms WHERE id=? AND kind='private' AND status IN ('waiting','playing','roundOver') AND updated>?"
            : "SELECT id FROM rooms WHERE code=? AND kind='private' AND status IN ('waiting','playing','roundOver') AND updated>?",
        )
        .bind(b.joinRoomId || b.code, Date.now() - 3600000)
        .first<any>();
      if (!target) fail("roomMissing");
      const { r } = await mutate(target.id, (r) => {
        if (r.data.players.some((p: any) => p.id === s.id)) return;
        if (r.status !== "waiting") fail("alreadyStarted");
        if (r.data.players.length >= r.data.capacity) fail("roomFull");
        r.data.players.push({ id: s.id, name: s.name });
      });
      return json(await response(r, s));
    }
    if (b.op === "state") {
      let r = await resolveRoom(b.room);
      check(r, s);
      if (
        r.status === "waiting" &&
        r.kind === "online" &&
        r.data.queuedAt === undefined
      ) {
        const initialized = await mutate(r.id, (current) => {
          if (current.data.queuedAt === undefined)
            current.data.queuedAt = Date.now();
        });
        r = initialized.r;
      }
      if (r.status === "waiting" && r.kind === "online")
        r = await pairWaiting(r);
      if (r.status === "waiting" && r.kind === "online")
        r = await fillWithBot(r);
      if (r.status === "waiting" && r.kind === "online") {
        await env
          .DB!.prepare(
            "UPDATE rooms SET updated=? WHERE id=? AND status='waiting'",
          )
          .bind(Date.now(), r.id)
          .run();
      }
      r = await resolveRoom(r.id);
      check(r, s);
      r = await advanceRoom(r, s);
      return json(await response(r, s));
    }
    if (b.op === "start" || b.op === "next" || b.op === "action") {
      if (b.op === "next") {
        const previous = await getRoom(b.room);
        check(previous, s);
        await settleChristmasRound(env.DB!, previous);
      }
      const { r } = await mutate(b.room, async (r) => {
        check(r, s);
        if (b.op === "start") {
          if (r.kind !== "private") fail("invalidAction");
          if (r.data.host !== s.id) fail("hostOnly");
          if (r.status !== "waiting") fail("alreadyStarted");
          if (r.data.players.length < 2) fail("needPlayers");
          r.data.game = newGame(r.data.players, r.data.rounds);
          r.status = "playing";
        } else if (b.op === "next") {
          if (r.data.host !== s.id) fail("hostOnly");
          if (r.data.game?.status !== "roundOver") fail("notPlaying");
          startRound(r.data.game);
          r.status = "playing";
        } else {
          if (!r.data.game) fail("notPlaying");
          if (Number(b.rev) !== r.rev) fail("staleTurn");
          act(r.data.game, s.id, b.action);
          r.status = r.data.game.status;
        }
      });
      return json(await response(r, s));
    }
    if (b.op === "leave") {
      for (let attempt = 0; attempt < 8; attempt++) {
        const current = await resolveRoom(b.room);
        try {
          await mutate(current.id, (r) => {
            if (r.status === "redirect") fail("roomMoved");
            check(r, s);
            if (r.status === "waiting") {
              r.data.players = r.data.players.filter((p: any) => p.id !== s.id);
              if (!r.data.players.length) r.status = "closed";
              else r.data.host = r.data.players[0].id;
            } else if (r.status === "playing" || r.status === "roundOver") {
              r.status = "closed";
              if (r.data.game) {
                r.data.game.status = "abandoned";
                r.data.game.left = s.name;
              }
            } else r.status = "closed";
          });
          return json({ ok: true });
        } catch (e) {
          if ((e as Error).message !== "roomMoved") throw e;
        }
      }
      fail("retry");
    }
    fail("invalidAction");
  } catch (e) {
    const error = (e as Error).message;
    const known = [
      "notPlaying",
      "notTurn",
      "alreadyDrawn",
      "mustDraw",
      "invalidAction",
      "invalidCard",
      "invalidBatch",
      "invalidBatchColor",
      "chooseColor",
      "sessionExpired",
      "roomMissing",
      "notMember",
      "retry",
      "roomFull",
      "nameRequired",
      "noTickets",
      "invalidCode",
      "invalidMatchSize",
      "alreadyStarted",
      "hostOnly",
      "needPlayers",
      "staleTurn",
      "campaignUnavailable",
      "invalidAmount",
      "previewOnly",
      "campaignEnded",
      "notEnoughPoints",
      "taskProofRequired",
      "taskImageTooLarge",
      "taskImageInvalid",
      "taskDetailsRequired",
      "taskProfileLocked",
      "taskPhizUsed",
      "taskMissing",
      "taskNotApproved",
      "taskAttemptLimit",
      "taskDailyLimit",
      "missionNotReady",
      "hatchFirst",
      "eggFirst",
      "hatchNotReady",
      "friendPointsOnly",
      "notEnoughFeed",
      "turkeyGrown",
      "turkeyNotGrown",
      "claimClosed",
      "claimDetailsRequired",
      "contactAlreadyUsed",
      "weeklyNotQualified",
      "rankingReview",
      "invalidWeek",
    ];
    return json(
      { error: known.includes(error) ? error : "serviceUnavailable" },
      400,
    );
  }
}
