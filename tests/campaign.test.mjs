import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
const folder = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(folder, "backend/runtime/server.mjs");
async function launch(db) {
  const child = spawn(process.execPath, [entry], {
    env: {
      ...process.env,
      ONO_DB: db,
      PORT: "0",
      NODE_ENV: "test",
      ALLOW_DEV_GUESTS: "true",
      PUBLIC_BASE_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(Error(logs || "Server startup timeout"));
    }, 10000);
    child.stderr.on("data", (x) => (logs += x));
    child.stdout.on("data", (x) => {
      logs += x;
      const m = logs.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (m) {
        clearTimeout(timeout);
        resolve({ child, base: "http://127.0.0.1:" + m[1] });
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timeout);
      if (code) reject(Error(logs));
    });
  });
}
async function stop(child) {
  return new Promise((resolve) => {
    child.once("exit", resolve);
    child.kill("SIGTERM");
  });
}
async function call(base, s, b) {
  if (b.op === "session") {
    const res = await fetch(base + "/v1/auth/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: b.name }),
    });
    const r = await res.json();
    assert.equal(res.status, 200, JSON.stringify(r));
    return r.session;
  }
  if (!s && b.op === "christmas") {
    const res = await fetch(base + "/v1/campaign");
    return { christmas: await res.json() };
  }

  const res = await fetch(base + "/v1/game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(s ? { Authorization: "Bearer " + s.token } : {}),
    },
    body: JSON.stringify(b),
  });
  const r = await res.json();
  assert.equal(res.status, 200, JSON.stringify(r));
  return r;
}
import {
  resolveChristmas,
  christmasDay,
} from "../backend/src/domain/christmas.mjs";
import { createHash, randomUUID } from "node:crypto";

test("Brasília phase boundaries and input validation", () => {
  assert.equal(
    resolveChristmas({}, Date.parse("2026-12-10T02:59:59.999Z")).phase,
    "preview",
  );
  assert.equal(
    resolveChristmas({}, Date.parse("2026-12-10T03:00:00Z")).phase,
    "live",
  );
  assert.equal(
    resolveChristmas({}, Date.parse("2026-12-25T02:59:59.999Z")).canEarn,
    true,
  );
  assert.equal(
    resolveChristmas({}, Date.parse("2026-12-25T03:00:00Z")).canEarn,
    false,
  );
  assert.equal(
    resolveChristmas({}, Date.parse("2026-12-29T03:00:00Z")).canClaim,
    false,
  );
  assert.equal(
    christmasDay(Date.parse("2026-12-10T02:59:59.999Z")).day,
    "2026-12-09",
  );
  assert.equal(
    christmasDay(Date.parse("2026-12-10T03:00:00Z")).day,
    "2026-12-10",
  );
  assert.equal(resolveChristmas().growthGoal, 100);
  assert.throws(() => resolveChristmas({ pointsPerFeed: 0 }));
});

async function setup(fn) {
  const dir = await mkdtemp(join(tmpdir(), "bora-friends-egg-")),
    path = join(dir, "test.sqlite");
  const ctx = {
    ...(await launch(path)),
    dir,
    path,
    sql: new DatabaseSync(path),
  };
  const now = Date.now();
  ctx.settings = {
    previewStartsAt: new Date(now - 86400000).toISOString(),
    officialStartsAt: new Date(now + 86400000).toISOString(),
    endsAt: new Date(now + 3 * 86400000).toISOString(),
    claimEndsAt: new Date(now + 4 * 86400000).toISOString(),
  };
  ctx.save = () =>
    ctx.sql
      .prepare(
        "INSERT INTO christmas_settings(id,data) VALUES('natal-2026',?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      )
      .run(JSON.stringify(ctx.settings));
  ctx.save();
  ctx.snap = async (user) =>
    (await call(ctx.base, user, { op: "christmas" })).christmas;
  ctx.user = (name) => call(ctx.base, null, { op: "session", name });
  ctx.bad = async (user, body, error) => {
    const r = await fetch(ctx.base + "/v1/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user.token,
      },
      body: JSON.stringify(body),
    });
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error, error);
  };
  ctx.hatch = async (user) => {
    await call(ctx.base, user, { op: "christmasEgg" });
    const key = (await ctx.snap(user)).config.id;
    ctx.sql
      .prepare("UPDATE christmas_pets SET hatch_at=? WHERE id=?")
      .run(Date.now() - 1, key + ":" + user.id);
    await call(ctx.base, user, { op: "christmasHatch" });
  };
  try {
    await fn(ctx);
  } finally {
    ctx.sql.close();
    if (ctx.child.exitCode === null) await stop(ctx.child);
    await rm(dir, { recursive: true, force: true });
  }
}
async function finish(ctx, room, users, winnerIndex = 0) {
  const data = JSON.parse(
      ctx.sql.prepare("SELECT data FROM rooms WHERE id=?").get(room.id).data,
    ),
    g = data.game;
  g.players.forEach(
    (p, i) =>
      (p.hand = [
        { id: 900 + i, color: "red", value: i === winnerIndex ? "1" : "9" },
      ]),
  );
  g.discard = [{ id: 999, color: "red", value: "5" }];
  g.color = "red";
  g.turn = winnerIndex;
  g.drawn = null;
  g.turnAt = Date.now();
  ctx.sql
    .prepare("UPDATE rooms SET data=?,rev=rev+1 WHERE id=?")
    .run(JSON.stringify(data), room.id);
  room = (
    await call(ctx.base, users[winnerIndex], { op: "state", room: room.id })
  ).room;
  return (
    await call(ctx.base, users[winnerIndex], {
      op: "action",
      room: room.id,
      rev: room.rev,
      points: 999999,
      playerCount: 4,
      action: { type: "play", cardIds: [900 + winnerIndex] },
    })
  ).room;
}
async function friendRoom(ctx, users, capacity = users.length, rounds = 1) {
  let room = (
    await call(ctx.base, users[0], { op: "create", capacity, rounds })
  ).room;
  for (const u of users.slice(1))
    await call(ctx.base, u, { op: "join", code: room.code });
  return (await call(ctx.base, users[0], { op: "start", room: room.id })).room;
}

test("egg claim, timed hatch, restart persistence and no gifting bypass", () =>
  setup(async (c) => {
    const a = await c.user("Egg player");
    assert.equal((await c.snap(null)).pet.status, "unclaimed");
    await c.bad(a, { op: "christmasHatch" }, "eggFirst");
    await c.bad(
      a,
      { op: "christmasExchange", amount: 1, requestId: randomUUID() },
      "hatchFirst",
    );
    await c.bad(a, { op: "christmasGift" }, "friendPointsOnly");
    const [one, two] = await Promise.all([
      call(c.base, a, { op: "christmasEgg" }),
      call(c.base, a, { op: "christmasEgg" }),
    ]);
    assert.equal(one.christmas.pet.status, "incubating");
    assert.equal(one.christmas.pet.claimedAt, two.christmas.pet.claimedAt);
    assert.equal(one.christmas.pet.hatchAt - one.christmas.pet.claimedAt, 5000);
    await c.bad(
      a,
      { op: "christmasHatch", now: Date.now() + 100000 },
      "hatchNotReady",
    );
    await stop(c.child);
    Object.assign(c, await launch(c.path));
    assert.equal((await c.snap(a)).pet.hatchAt, one.christmas.pet.hatchAt);
    c.sql
      .prepare("UPDATE christmas_pets SET hatch_at=? WHERE id=?")
      .run(Date.now() - 1, "natal-2026-preview:" + a.id);
    const results = await Promise.all([
      call(c.base, a, { op: "christmasHatch" }),
      call(c.base, a, { op: "christmasHatch" }),
    ]);
    assert.equal(
      results[0].christmas.pet.hatchedAt,
      results[1].christmas.pet.hatchedAt,
    );
    assert.equal((await c.snap(a)).pet.status, "hatched");
    assert.equal((await c.snap(a)).wallet.points, 0);
  }));

test("friend rooms award 2/3/4-player participation plus a five-point winner bonus", () =>
  setup(async (c) => {
    for (const n of [2, 3, 4]) {
      const users = await Promise.all(
        Array.from({ length: n }, (_, i) => c.user("Friends " + n + " " + i)),
      );
      // Legacy ticket balances must not gate free creation, including zero or negative balances.
      c.sql
        .prepare("UPDATE sessions SET tickets=-1 WHERE id=?")
        .run(users[0].id);
      let room = await friendRoom(c, users, n === 2 ? 4 : n);
      room = await finish(c, room, users, n - 1);
      const expected = (n - 1) * 10;
      assert.equal(room.game.players[n - 1].score, 9 * (n - 1));
      for (const u of users) {
        const total = expected + (u.id === users[n - 1].id ? 5 : 0);
        assert.equal((await c.snap(u)).wallet.points, total);
        assert.equal((await c.snap(u)).wallet.earned, total);
        assert.equal(
          room.rewards.find((row) => row.player === u.id).points,
          total,
        );
      }
      await Promise.all(
        users.map((u) => call(c.base, u, { op: "state", room: room.id })),
      );
      assert.equal(
        c.sql
          .prepare(
            "SELECT count(*) AS n FROM christmas_ledger WHERE kind='friend_round' AND id LIKE ?",
          )
          .get("round:natal-2026-preview:" + room.id + ":%").n,
        n,
      );
      assert.equal(
        c.sql
          .prepare("SELECT tickets FROM sessions WHERE id=?")
          .get(users[0].id).tickets,
        -1,
      );
      assert.equal(
        (await call(c.base, users[0], { op: "profile" })).tickets,
        undefined,
      );
    }
  }));

test("online human/bot games and abandoned rounds never award activity points or daily achievement progress", () =>
  setup(async (c) => {
    const a = await c.user("Online A"),
      b = await c.user("Online B");
    await call(c.base, a, { op: "match" });
    let room = (await call(c.base, b, { op: "match" })).room;
    room = await finish(c, room, [a, b], 0);
    assert.equal((await c.snap(a)).wallet.points, 0);
    assert.equal((await c.snap(b)).wallet.points, 0);
    assert.equal(
      (await c.snap(a)).feedTasks.tasks.every((t) => t.progress === 0),
      true,
    );
    const botUser = await c.user("Bot fallback");
    room = (await call(c.base, botUser, { op: "match" })).room;
    const d = JSON.parse(
      c.sql.prepare("SELECT data FROM rooms WHERE id=?").get(room.id).data,
    );
    d.queuedAt = Date.now() - 8100;
    c.sql
      .prepare("UPDATE rooms SET data=? WHERE id=?")
      .run(JSON.stringify(d), room.id);
    room = (await call(c.base, botUser, { op: "state", room: room.id })).room;
    assert.equal(
      room.players.some((p) => p.bot),
      true,
    );
    await finish(c, room, [botUser], 0);
    assert.equal((await c.snap(botUser)).wallet.points, 0);
    room = await friendRoom(c, [a, b]);
    await call(c.base, a, { op: "leave", room: room.id });
    assert.equal((await c.snap(a)).wallet.points, 0);
  }));

test("multi-round participation, crash recovery, cosmetic achievements and phase isolation", () =>
  setup(async (c) => {
    const users = [await c.user("Round A"), await c.user("Round B")];
    let room = await friendRoom(c, users, 2, 3);
    for (let i = 0; i < 3; i++) {
      room = await finish(c, room, users, i % 2);
      if (i < 2)
        room = (await call(c.base, users[0], { op: "next", room: room.id }))
          .room;
    }
    for (let i = 0; i < users.length; i++)
      assert.equal((await c.snap(users[i])).wallet.points, i === 0 ? 40 : 35);
    const a = users[0],
      id = "round:natal-2026-preview:" + room.id + ":3:" + a.id;
    c.sql.prepare("DELETE FROM christmas_ledger WHERE id=?").run(id);
    c.sql
      .prepare("UPDATE christmas_wallets SET points=25,earned=25 WHERE id=?")
      .run("natal-2026-preview:" + a.id);
    assert.equal((await c.snap(a)).wallet.points, 40);
    assert.equal((await c.snap(a)).wallet.points, 40);
    await c.bad(
      a,
      { op: "christmasDaily", mission: "play1" },
      "taskProofRequired",
    );
    assert.equal((await c.snap(a)).wallet.points, 40);
    assert.equal((await c.snap(a)).feedTasks.tasks.length, 4);
    await c.hatch(a);
    c.settings.officialStartsAt = new Date(Date.now() + 40).toISOString();
    c.save();
    await new Promise((resolve) => setTimeout(resolve, 70));
    const official = await c.snap(a);
    assert.equal(official.wallet.points, 0);
    assert.equal(official.pet.status, "unclaimed");
    assert.equal(
      official.feedTasks.tasks.every((t) => t.progress === 0 && !t.claimed),
      true,
    );
  }));

test("wallet safety, growth, private claims and manual stock controls remain intact", () =>
  setup(async (c) => {
    const a = await c.user("Claim A"),
      b = await c.user("Claim B");
    await c.hatch(a);
    await c.hatch(b);
    // Trusted fixture supplies a pre-existing balance; there is no public gifting endpoint.
    for (const u of [a, b])
      c.sql
        .prepare("UPDATE christmas_wallets SET points=1000 WHERE id=?")
        .run("natal-2026-preview:" + u.id);
    const requestId = randomUUID();
    await Promise.all([
      call(c.base, a, { op: "christmasExchange", amount: 100, requestId }),
      call(c.base, a, { op: "christmasExchange", amount: 100, requestId }),
    ]);
    assert.equal((await c.snap(a)).wallet.points, 0);
    assert.equal((await c.snap(a)).wallet.feed, 100);
    await c.bad(
      a,
      { op: "christmasExchange", amount: 1, requestId: randomUUID() },
      "notEnoughPoints",
    );
    const feedId = randomUUID();
    await Promise.all([
      call(c.base, a, { op: "christmasFeed", amount: 100, requestId: feedId }),
      call(c.base, a, { op: "christmasFeed", amount: 100, requestId: feedId }),
    ]);
    assert.equal((await c.snap(a)).wallet.fed, 100);
    await c.bad(
      a,
      { op: "christmasClaim", name: "Ana", contact: "+5511000000001" },
      "claimDetailsRequired",
    );
    const body = {
        op: "christmasClaim",
        name: "Ana",
        contact: "+5511000000001",
        consent: true,
      },
      claim = (await call(c.base, a, body)).christmas.claim;
    assert.equal(claim.status, "test_pending");
    assert.equal((await call(c.base, a, body)).christmas.claim.id, claim.id);
    assert.equal((await c.snap(b)).claim, null);
    assert.equal(
      JSON.stringify(await c.snap(a)).includes("5511000000001"),
      false,
    );
    await call(c.base, b, {
      op: "christmasExchange",
      amount: 100,
      requestId: randomUUID(),
    });
    await call(c.base, b, {
      op: "christmasFeed",
      amount: 100,
      requestId: randomUUID(),
    });
    await c.bad(b, body, "contactAlreadyUsed");
    const adminEntry = join(dirname(dirname(entry)), "ops/christmas-admin.mjs");
    async function admin(args, expected = 0) {
      const child = spawn(process.execPath, [adminEntry, ...args], {
        env: { ...process.env, ONO_DB: c.path },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let logs = "";
      child.stdout.on("data", (v) => (logs += v));
      child.stderr.on("data", (v) => (logs += v));
      const code = await new Promise((resolve) => child.once("exit", resolve));
      assert.equal(code, expected, logs);
      return logs;
    }
    await admin(["approve", claim.id]);
    await admin(["ship", claim.id, "TEST"], 1);
    c.settings.officialStartsAt = new Date(Date.now() - 3600000).toISOString();
    c.save();
    for (const u of [a, b]) {
      await c.hatch(u);
      c.sql
        .prepare("UPDATE christmas_pets SET hatch_at=?,hatched_at=? WHERE id=?")
        .run(Date.now() - 1, Date.now() - 1, "natal-2026-live:" + u.id);
      await c.snap(u);
      c.sql
        .prepare("UPDATE christmas_wallets SET feed=100 WHERE id=?")
        .run("natal-2026-live:" + u.id);
      await call(c.base, u, { op: "christmasFeed", amount: 100, requestId: randomUUID() });
    }
    const liveA = (await call(c.base, a, body)).christmas.claim,
      liveB = (await call(c.base, b, { ...body, contact: "+5511000000002" }))
        .christmas.claim;
    await admin(["approve", liveA.id], 1);
    const file = join(c.dir, "settings.json");
    await writeFile(file, JSON.stringify({ stockTotal: 1 }));
    await admin(["config", file]);
    await admin(["approve", liveA.id]);
    await admin(["approve", liveB.id], 1);
    await admin(["ship", liveA.id, "DELIVERY-TEST"]);
    assert.equal((await c.snap(a)).claim.status, "shipped");
    c.settings.endsAt = new Date(Date.now() - 1).toISOString();
    c.save();
    await c.bad(
      a,
      { op: "christmasFeed", amount: 1, requestId: randomUUID() },
      "campaignEnded",
    );
  }));

test("upgrading an existing grown turkey preserves balances and auto-marks it hatched without re-awarding old rounds", async () => {
  const dir = await mkdtemp(join(tmpdir(), "bora-legacy-egg-")),
    path = join(dir, "old.sqlite"),
    sql = new DatabaseSync(path);
  let service;
  try {
    sql.exec(
      "CREATE TABLE schema_migrations(name TEXT PRIMARY KEY,applied_at INTEGER NOT NULL)",
    );
    const migrations = join(dirname(entry), "migrations");
    for (const name of (await readdir(migrations))
      .filter((n) => n.endsWith(".sql") && n < "0003")
      .sort()) {
      sql.exec(await readFile(join(migrations, name), "utf8"));
      sql
        .prepare("INSERT INTO schema_migrations VALUES(?,?)")
        .run(name, Date.now());
    }
    sql
      .prepare(
        "INSERT INTO sessions(id,token,name,tickets,seen) VALUES('legacy','legacy-token','Legacy',0,?)",
      )
      .run(Date.now());
    sql
      .prepare(
        "INSERT INTO christmas_wallets(id,campaign,player,points,feed,fed,earned) VALUES('natal-2026-preview:legacy','natal-2026-preview','legacy',60,3,25,80)",
      )
      .run();
    const now = Date.now();
    sql
      .prepare("INSERT INTO christmas_settings(id,data) VALUES('natal-2026',?)")
      .run(
        JSON.stringify({
          previewStartsAt: new Date(now - 86400000).toISOString(),
          officialStartsAt: new Date(now + 86400000).toISOString(),
          endsAt: new Date(now + 3 * 86400000).toISOString(),
          claimEndsAt: new Date(now + 4 * 86400000).toISOString(),
        }),
      );
    sql
      .prepare(
        "INSERT INTO rooms(id,code,kind,status,data,rev,updated) VALUES('old-room','112233','private','finished',?,1,?)",
      )
      .run(
        JSON.stringify({
          players: [{ id: "legacy" }, { id: "other" }],
          game: {
            players: [{ id: "legacy" }, { id: "other" }],
            roundResults: [
              { round: 1, winner: "legacy", points: 1000, finishedAt: now },
            ],
          },
        }),
        now,
      );
    service = await launch(path);
    sql
      .prepare("INSERT INTO mini_access_tokens VALUES(?,?,?)")
      .run(
        createHash("sha256").update("L".repeat(43)).digest("hex"),
        "legacy",
        Date.now() + 86400000,
      );
    const snapshot = (
      await call(service.base, { token: "L".repeat(43) }, { op: "christmas" })
    ).christmas;
    assert.equal(snapshot.pet.status, "hatched");
    assert.equal(snapshot.wallet.fed, 25);
    assert.equal(snapshot.wallet.points, 60);
    assert.equal(snapshot.wallet.feed, 3);
    assert.equal(snapshot.wallet.earned, 80);
  } finally {
    sql.close();
    if (service?.child.exitCode === null) await stop(service.child);
    await rm(dir, { recursive: true, force: true });
  }
});

const TASK_PROOF =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jA2sAAAAASUVORK5CYII=";
async function taskAdmin(c, args, expected = 0) {
  const child = spawn(
    process.execPath,
    [join(dirname(dirname(entry)), "ops/task-review.mjs"), ...args],
    {
      env: { ...process.env, ONO_DB: c.path },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";
  child.stdout.on("data", (x) => (logs += x));
  child.stderr.on("data", (x) => (logs += x));
  const code = await new Promise((resolve) => child.once("exit", resolve));
  assert.equal(code, expected, logs);
  return logs;
}
const taskBody = (mission, phizId = "proof-user") => ({
  op: "christmasTaskSubmit",
  mission,
  phizId,
  details:
    "TEST local fixture: task completion evidence for manual verification.",
  proofs: [TASK_PROOF],
  consent: true,
});

test("Phiz task evidence is private; approval grants feed once without UNO, points, or spending", () =>
  setup(async (c) => {
    const a = await c.user("Task A"),
      b = await c.user("Task B");
    assert.equal((await c.snap(a)).feedTasks.tasks.length, 4);
    assert.equal((await c.snap(a)).feedTasks.totalFeed, 10);
    assert.deepEqual(
      (await c.snap(a)).daily.tasks.map((t) => t.id),
      ["play1", "play3", "score50"],
    );
    assert.equal(
      (await c.snap(a)).daily.tasks.every((t) => !t.ready && t.reward === 0),
      true,
    );
    await c.bad(
      a,
      { ...taskBody("phiz_group"), proofs: [] },
      "taskProofRequired",
    );
    await c.bad(
      a,
      { ...taskBody("phiz_group"), consent: false },
      "taskDetailsRequired",
    );
    await c.bad(
      a,
      {
        ...taskBody("phiz_group"),
        proofs: ["data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="],
      },
      "taskImageInvalid",
    );
    const padded = Buffer.concat([
      Buffer.from(TASK_PROOF.split(",")[1], "base64"),
      Buffer.alloc(20000),
    ]);
    const body = {
      ...taskBody("phiz_group"),
      reward: 9999,
      details: "TEST <script>alert(1)</script> group evidence.",
      proofs: ["data:image/png;base64," + padded.toString("base64")],
    };
    const first = (await call(c.base, a, body)).christmas.feedTasks.tasks.find(
      (t) => t.id === "phiz_group",
    );
    assert.equal(first.status, "pending");
    assert.equal(first.reward, 5);
    assert.equal(
      (await call(c.base, a, body)).christmas.feedTasks.tasks.find(
        (t) => t.id === "phiz_group",
      ).submission.id,
      first.submission.id,
    );
    assert.equal(
      c.sql.prepare("SELECT count(*) AS n FROM christmas_feed_tasks").get().n,
      1,
    );
    assert.equal(JSON.stringify(await c.snap(a)).includes("data:image"), false);
    assert.equal((await c.snap(b)).feedTasks.profile, null);
    await c.bad(
      b,
      { op: "christmasTaskEvidence", submission: first.submission.id },
      "taskMissing",
    );
    assert.equal(
      (
        await call(c.base, a, {
          op: "christmasTaskEvidence",
          submission: first.submission.id,
        })
      ).evidence.proofs.length,
      1,
    );
    await c.bad(
      a,
      { op: "christmasTaskClaim", submission: first.submission.id },
      "taskNotApproved",
    );
    await c.bad(b, taskBody("phiz_group"), "taskPhizUsed");
    await c.bad(
      a,
      taskBody("phiz_moment", "different-id"),
      "taskProfileLocked",
    );
    const report = join(c.dir, "private", "review.html");
    await taskAdmin(c, ["report", first.submission.id, report]);
    const html = await readFile(report, "utf8");
    assert.match(html, /&lt;script&gt;/);
    assert.equal(html.includes("<script>"), false);
    assert.ok(html.includes("data:image/png;base64"));
    await taskAdmin(c, ["approve", first.submission.id], 1);
    await taskAdmin(c, [
      "approve",
      first.submission.id,
      "TEST verified local evidence",
    ]);
    assert.equal(
      (await c.snap(a)).feedTasks.tasks.find((t) => t.id === "phiz_group")
        .ready,
      true,
    );
    await taskAdmin(c, ["reject", first.submission.id, "Too late"], 1);
    await Promise.all([
      call(c.base, a, {
        op: "christmasTaskClaim",
        submission: first.submission.id,
      }),
      call(c.base, a, {
        op: "christmasTaskClaim",
        submission: first.submission.id,
      }),
    ]);
    const after = await c.snap(a);
    assert.equal(after.wallet.feed, 5);
    assert.equal(after.wallet.points, 0);
    assert.equal(after.wallet.earned, 0);
    assert.equal(
      after.feedTasks.tasks.find((t) => t.id === "phiz_group").status,
      "claimed",
    );
    c.sql
      .prepare("UPDATE christmas_feed_tasks SET status='approved' WHERE id=?")
      .run(first.submission.id);
    assert.equal(
      (await c.snap(a)).feedTasks.tasks.find((t) => t.id === "phiz_group")
        .status,
      "claimed",
    );
    await call(c.base, a, {
      op: "christmasTaskClaim",
      submission: first.submission.id,
    });
    assert.equal((await c.snap(a)).wallet.feed, 5);
    assert.equal(
      c.sql
        .prepare(
          "SELECT count(*) AS n FROM christmas_ledger WHERE kind='task_feed'",
        )
        .get().n,
      1,
    );
    assert.equal(c.sql.prepare("SELECT count(*) AS n FROM rooms").get().n, 0);
    await c.hatch(a);
    await call(c.base, a, {
      op: "christmasFeed",
      amount: 5,
      requestId: randomUUID(),
    });
    assert.equal((await c.snap(a)).wallet.fed, 5);
    await stop(c.child);
    Object.assign(c, await launch(c.path));
    assert.equal((await c.snap(a)).wallet.fed, 5);
    assert.equal((await c.snap(a)).feedTasks.profile.phizId, "proof-user");
  }));

test("rejected Phiz evidence can be resubmitted with retained audit, bounded attempts and no unapproved feed", () =>
  setup(async (c) => {
    const a = await c.user("Task retry");
    let task = (
        await call(c.base, a, taskBody("phiz_friends", "retry-user"))
      ).christmas.feedTasks.tasks.find((t) => t.id === "phiz_friends"),
      id = task.submission.id;
    await taskAdmin(c, [
      "reject",
      id,
      "TEST three new friends are not visible",
    ]);
    task = (await c.snap(a)).feedTasks.tasks.find(
      (t) => t.id === "phiz_friends",
    );
    assert.equal(task.status, "rejected");
    assert.match(task.submission.note, /not visible/);
    await c.bad(
      a,
      { op: "christmasTaskClaim", submission: id },
      "taskNotApproved",
    );
    await Promise.all([
      call(c.base, a, {
        ...taskBody("phiz_friends", "retry-user"),
        details: "TEST second evidence includes three friend IDs A B C",
      }),
      call(c.base, a, taskBody("phiz_friends", "retry-user")),
    ]);
    task = (await c.snap(a)).feedTasks.tasks.find(
      (t) => t.id === "phiz_friends",
    );
    assert.equal(task.status, "pending");
    assert.equal(task.submission.attempts, 2);
    const audit = c.sql
      .prepare(
        "SELECT payload FROM christmas_task_audit WHERE submission=? AND action='resubmit'",
      )
      .get(id);
    assert.ok(JSON.parse(audit.payload).proofs[0] === TASK_PROOF);
    await taskAdmin(c, ["reject", id, "TEST still incomplete"]);
    await call(c.base, a, taskBody("phiz_friends", "retry-user"));
    await taskAdmin(c, ["reject", id, "TEST final review"]);
    await c.bad(a, taskBody("phiz_friends", "retry-user"), "taskAttemptLimit");
    assert.equal((await c.snap(a)).wallet.feed, 0);
  }));

test("late task approval remains claimable across daily reset, reward is frozen, and phases stay isolated", () =>
  setup(async (c) => {
    const a = await c.user("Late task");
    const first = (
      await call(c.base, a, taskBody("anjun_tracking", "late-user"))
    ).christmas.feedTasks.tasks.find((t) => t.id === "anjun_tracking");
    const today = (await c.snap(a)).feedTasks.day,
      yesterday = new Date(Date.now() - 86400000 - 10800000)
        .toISOString()
        .slice(0, 10),
      oldId = first.submission.id.replace(
        ":" + today + ":",
        ":" + yesterday + ":",
      );
    c.sql
      .prepare("UPDATE christmas_feed_tasks SET id=?,day=? WHERE id=?")
      .run(oldId, yesterday, first.submission.id);
    c.settings.taskFeedParcel = 7;
    c.save();
    await taskAdmin(c, ["approve", oldId, "TEST prior-day evidence verified"]);
    let snapshot = await c.snap(a);
    assert.equal(
      snapshot.feedTasks.tasks.find((t) => t.id === "anjun_tracking").status,
      "not_started",
    );
    assert.equal(
      snapshot.feedTasks.history.find((r) => r.id === oldId).reward,
      5,
    );
    await call(c.base, a, { op: "christmasTaskClaim", submission: oldId });
    assert.equal((await c.snap(a)).wallet.feed, 5);
    const next = (
      await call(c.base, a, taskBody("anjun_tracking", "late-user"))
    ).christmas.feedTasks.tasks.find((t) => t.id === "anjun_tracking");
    assert.equal(next.reward, 7);
    assert.notEqual(next.submission.id, oldId);
    await taskAdmin(c, [
      "approve",
      next.submission.id,
      "TEST today evidence verified",
    ]);
    await call(c.base, a, {
      op: "christmasTaskClaim",
      submission: next.submission.id,
    });
    assert.equal((await c.snap(a)).wallet.feed, 12);
    c.settings.officialStartsAt = new Date(Date.now() - 3600000).toISOString();
    c.save();
    snapshot = await c.snap(a);
    assert.equal(snapshot.wallet.feed, 0);
    assert.equal(snapshot.feedTasks.profile, null);
    assert.equal(snapshot.feedTasks.history.length, 0);
    await c.bad(
      a,
      { op: "christmasTaskClaim", submission: oldId },
      "taskMissing",
    );
    c.settings.endsAt = new Date(Date.now() - 1000).toISOString();
    c.save();
    await c.bad(a, taskBody("phiz_group", "late-user"), "campaignEnded");
  }));

test("operators can correct an unapproved Phiz ID with audit, but cannot change identities after approval", () =>
  setup(async (c) => {
    const a = await c.user("Correct profile");
    let task = (
      await call(c.base, a, taskBody("phiz_moment", "misspelled-id"))
    ).christmas.feedTasks.tasks.find((t) => t.id === "phiz_moment");
    await taskAdmin(c, [
      "correct-profile",
      task.submission.id,
      "correct-phiz-id",
      "TEST ownership correction verified",
    ]);
    assert.equal((await c.snap(a)).feedTasks.profile.phizId, "correct-phiz-id");
    assert.equal(
      (await c.snap(a)).feedTasks.tasks.find((t) => t.id === "phiz_moment")
        .status,
      "rejected",
    );
    await call(c.base, a, taskBody("phiz_moment", "correct-phiz-id"));
    await taskAdmin(c, [
      "approve",
      task.submission.id,
      "TEST corrected evidence approved",
    ]);
    await taskAdmin(
      c,
      [
        "correct-profile",
        task.submission.id,
        "third-id",
        "TEST forbidden identity switch",
      ],
      1,
    );
    assert.equal((await c.snap(a)).feedTasks.profile.phizId, "correct-phiz-id");
  }));

test("unified game points cap atomically at 100, preserve win standings, survive spending and reset by earning day", () =>
  setup(async (c) => {
    const users = await Promise.all(
      Array.from({ length: 4 }, (_, i) => c.user("Unified " + i)),
    );
    let room = await friendRoom(c, users, 4, 5);
    for (let round = 1; round <= 2; round++) {
      room = await finish(c, room, users, 0);
      room = (await call(c.base, users[0], { op: "next", room: room.id })).room;
    }
    assert.equal((await c.snap(users[0])).wallet.points, 70);
    const data = JSON.parse(
      c.sql.prepare("SELECT data FROM rooms WHERE id=?").get(room.id).data,
    );
    data.game.roundResults.push({
      round: 3,
      winner: users[0].id,
      points: 99999,
      finishedAt: Date.now(),
      activityRule: "friends-v2",
      participantIds: users.map((u) => u.id),
    });
    data.game.status = "roundOver";
    data.game.winner = users[0].id;
    data.game.players[0].hand = [];
    c.sql
      .prepare(
        "UPDATE rooms SET data=?,status='roundOver',rev=rev+1 WHERE id=?",
      )
      .run(JSON.stringify(data), room.id);
    await Promise.all(
      users.flatMap((u) => [
        c.snap(u),
        call(c.base, u, { op: "state", room: room.id }),
      ]),
    );
    room = (await call(c.base, users[0], { op: "state", room: room.id })).room;
    const receipt = room.rewards.find((row) => row.player === users[0].id);
    assert.equal(receipt.points, 30);
    assert.equal(receipt.base, 30);
    assert.equal(receipt.bonus, 0);
    assert.equal(receipt.limited, true);
    assert.equal(receipt.expectedBonus, 5);
    for (let round = 4; round <= 5; round++) {
      room = (await call(c.base, users[0], { op: "next", room: room.id })).room;
      room = await finish(c, room, users, 0);
    }
    for (const u of users) {
      const s = await c.snap(u);
      assert.equal(s.wallet.points, 100);
      assert.equal(s.gameDaily.remaining, 0);
      assert.equal(s.gameDaily.earned, 100);
      assert.equal(
        c.sql
          .prepare(
            "SELECT count(*) AS n FROM christmas_ledger WHERE player=? AND kind='friend_round'",
          )
          .get(u.id).n,
        5,
      );
    }
    assert.equal(room.game.players[0].wins, 5);
    assert.equal(
      room.rewards.find((row) => row.player === users[0].id).points,
      0,
    );
    await c.hatch(users[0]);
    await call(c.base, users[0], {
      op: "christmasExchange",
      amount: 1,
      requestId: randomUUID(),
    });
    assert.equal((await c.snap(users[0])).wallet.points, 90);
    assert.equal((await c.snap(users[0])).gameDaily.remaining, 0);
    c.sql
      .prepare(
        "UPDATE christmas_ledger SET created=created-86400000 WHERE kind='friend_round'",
      )
      .run();
    const reset = await c.snap(users[0]);
    assert.equal(reset.wallet.points, 90);
    assert.equal(reset.gameDaily.remaining, 100);
    let next = await friendRoom(c, users.slice(0, 2), 2, 1);
    next = await finish(c, next, users.slice(0, 2), 0);
    assert.equal((await c.snap(users[0])).wallet.points, 105);
    assert.equal((await c.snap(users[0])).gameDaily.earned, 15);
    assert.equal(
      next.rewards.find((row) => row.player === users[0].id).bonus,
      5,
    );
  }));

test("legacy uncredited friend rounds retain participation only, without converting historical UNO scores", () =>
  setup(async (c) => {
    const users = [
      await c.user("Legacy round A"),
      await c.user("Legacy round B"),
    ];
    let room = await friendRoom(c, users, 2, 1);
    const data = JSON.parse(
      c.sql.prepare("SELECT data FROM rooms WHERE id=?").get(room.id).data,
    );
    data.game.status = "finished";
    data.game.winner = users[0].id;
    data.game.players[0].score = 99999;
    data.game.roundResults = [
      {
        round: 1,
        winner: users[0].id,
        points: 99999,
        finishedAt: Date.now(),
        activityRule: "friends-v1",
        participantIds: users.map((u) => u.id),
      },
    ];
    c.sql
      .prepare("UPDATE rooms SET data=?,status='finished' WHERE id=?")
      .run(JSON.stringify(data), room.id);
    room = (await call(c.base, users[0], { op: "state", room: room.id })).room;
    for (const user of users)
      assert.equal((await c.snap(user)).wallet.points, 10);
    assert.equal(room.rewards[0].rule, "legacy");
    assert.equal(room.rewards[0].bonus, 0);
    assert.equal(room.game.players[0].wins, 1);
    await Promise.all(users.map((u) => c.snap(u)));
    assert.equal((await c.snap(users[0])).wallet.points, 10);
  }));

test("four task submissions racing reserve only two slots and ten feed, with rejection and resubmission respecting the quota", () =>
  setup(async (c) => {
    const a = await c.user("Quota A");
    const missions = [
      "phiz_friends",
      "phiz_group",
      "phiz_moment",
      "anjun_tracking",
    ];
    const responses = await Promise.all(
      missions.map((mission) =>
        fetch(c.base + "/v1/game", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + a.token,
          },
          body: JSON.stringify(taskBody(mission, "quota-a")),
        }),
      ),
    );
    assert.equal(responses.filter((r) => r.status === 200).length, 2);
    assert.equal(responses.filter((r) => r.status === 400).length, 2);
    for (const response of responses)
      if (response.status === 400)
        assert.equal((await response.json()).error, "taskDailyLimit");
    let snapshot = await c.snap(a);
    assert.equal(snapshot.feedTasks.quota.remaining, 0);
    assert.equal(snapshot.feedTasks.quota.reservedFeed, 10);
    const rows = c.sql
      .prepare("SELECT * FROM christmas_feed_tasks WHERE player=?")
      .all(a.id);
    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row.reward_rule === 2));
    for (const row of rows)
      await taskAdmin(c, ["approve", row.id, "TEST quota evidence approved"]);
    await Promise.all(
      rows.flatMap((row) => [
        call(c.base, a, { op: "christmasTaskClaim", submission: row.id }),
        call(c.base, a, { op: "christmasTaskClaim", submission: row.id }),
      ]),
    );
    assert.equal((await c.snap(a)).wallet.feed, 10);
    assert.equal((await c.snap(a)).wallet.points, 0);
    const b = await c.user("Quota B");
    let group = (
      await call(c.base, b, taskBody("phiz_group", "quota-b"))
    ).christmas.feedTasks.tasks.find((t) => t.id === "phiz_group");
    await call(c.base, b, taskBody("phiz_moment", "quota-b"));
    await taskAdmin(c, [
      "reject",
      group.submission.id,
      "TEST missing group creator",
    ]);
    assert.equal((await c.snap(b)).feedTasks.quota.remaining, 1);
    const friends = (
      await call(c.base, b, taskBody("phiz_friends", "quota-b"))
    ).christmas.feedTasks.tasks.find((t) => t.id === "phiz_friends");
    await c.bad(b, taskBody("phiz_group", "quota-b"), "taskDailyLimit");
    await taskAdmin(c, [
      "reject",
      friends.submission.id,
      "TEST missing friend IDs",
    ]);
    await call(c.base, b, taskBody("phiz_group", "quota-b"));
    snapshot = await c.snap(b);
    assert.equal(snapshot.feedTasks.quota.used, 2);
    assert.equal(
      snapshot.feedTasks.tasks.find((t) => t.id === "phiz_group").submission
        .attempts,
      2,
    );
  }));

test("task limits follow submission day so late approvals do not consume the new day or allow a third reward", () =>
  setup(async (c) => {
    const a = await c.user("Two-day quota"),
      old = [];
    const today = (await c.snap(a)).feedTasks.day,
      yesterday = new Date(Date.now() - 86400000 - 10800000)
        .toISOString()
        .slice(0, 10);
    for (const mission of ["phiz_group", "phiz_moment"]) {
      const row = (
        await call(c.base, a, taskBody(mission, "two-day-user"))
      ).christmas.feedTasks.tasks.find((t) => t.id === mission).submission;
      const id = row.id.replace(":" + today + ":", ":" + yesterday + ":");
      c.sql
        .prepare("UPDATE christmas_feed_tasks SET id=?,day=? WHERE id=?")
        .run(id, yesterday, row.id);
      old.push(id);
    }
    assert.equal((await c.snap(a)).feedTasks.quota.remaining, 2);
    const current = [];
    for (const mission of ["phiz_friends", "anjun_tracking"])
      current.push(
        (
          await call(c.base, a, taskBody(mission, "two-day-user"))
        ).christmas.feedTasks.tasks.find((t) => t.id === mission).submission.id,
      );
    await c.bad(a, taskBody("phiz_group", "two-day-user"), "taskDailyLimit");
    for (const id of [...old, ...current])
      await taskAdmin(c, ["approve", id, "TEST verified two-day submissions"]);
    await Promise.all(
      [...old, ...current].map((id) =>
        call(c.base, a, { op: "christmasTaskClaim", submission: id }),
      ),
    );
    const result = await c.snap(a);
    assert.equal(result.wallet.feed, 20);
    assert.equal(result.feedTasks.quota.reservedFeed, 10);
    assert.equal(result.feedTasks.quota.remaining, 0);
    assert.equal(result.gameDaily.earned, 0);
  }));

test("upgrading pre-quota evidence preserves balances, growth and every already-promised task reward", async () => {
  const dir = await mkdtemp(join(tmpdir(), "bora-unified-migration-")),
    path = join(dir, "old.sqlite"),
    sql = new DatabaseSync(path);
  let service;
  try {
    sql.exec(
      "CREATE TABLE schema_migrations(name TEXT PRIMARY KEY,applied_at INTEGER NOT NULL)",
    );
    const migrations = join(dirname(entry), "migrations");
    for (const name of (await readdir(migrations))
      .filter((n) => n.endsWith(".sql") && n < "0005")
      .sort()) {
      sql.exec(await readFile(join(migrations, name), "utf8"));
      sql
        .prepare("INSERT INTO schema_migrations VALUES(?,?)")
        .run(name, Date.now());
    }
    const now = Date.now(),
      day = new Date(now - 10800000).toISOString().slice(0, 10),
      wallet = "natal-2026-preview:legacy-quota";
    sql
      .prepare(
        "INSERT INTO sessions(id,token,name,tickets,seen) VALUES('legacy-quota','legacy-quota-token','Legacy quota',0,?)",
      )
      .run(now);
    sql
      .prepare(
        "INSERT INTO christmas_wallets(id,campaign,player,points,feed,fed,earned) VALUES(?,'natal-2026-preview','legacy-quota',60,3,25,80)",
      )
      .run(wallet);
    sql
      .prepare("INSERT INTO christmas_settings(id,data) VALUES('natal-2026',?)")
      .run(
        JSON.stringify({
          previewStartsAt: new Date(now - 86400000).toISOString(),
          officialStartsAt: new Date(now + 86400000).toISOString(),
          endsAt: new Date(now + 3 * 86400000).toISOString(),
          claimEndsAt: new Date(now + 4 * 86400000).toISOString(),
        }),
      );
    const ids = [];
    for (const mission of [
      "phiz_friends",
      "phiz_group",
      "phiz_moment",
      "anjun_tracking",
    ]) {
      const id = "social-task:" + wallet + ":" + day + ":" + mission;
      ids.push(id);
      sql
        .prepare(
          "INSERT INTO christmas_feed_tasks(id,campaign,wallet,player,phiz_id,phiz_key,day,task,details,proofs,reward,status,created,updated) VALUES(?,'natal-2026-preview',?,'legacy-quota','legacy-phiz','natal-2026-preview:legacy-phiz',?,?,?, ?,5,'approved',?,?)",
        )
        .run(
          id,
          wallet,
          day,
          mission,
          "TEST approved before update",
          JSON.stringify([TASK_PROOF]),
          now,
          now,
        );
    }
    service = await launch(path);
    sql
      .prepare("INSERT INTO mini_access_tokens VALUES(?,?,?)")
      .run(
        createHash("sha256").update("Q".repeat(43)).digest("hex"),
        "legacy-quota",
        Date.now() + 86400000,
      );
    const session = { token: "Q".repeat(43) };
    let snapshot = (await call(service.base, session, { op: "christmas" }))
      .christmas;
    assert.equal(snapshot.wallet.points, 60);
    assert.equal(snapshot.wallet.feed, 3);
    assert.equal(snapshot.wallet.fed, 25);
    assert.equal(snapshot.feedTasks.legacyAllowance, true);
    assert.equal(snapshot.feedTasks.quota.remaining, 0);
    for (const id of ids)
      await call(service.base, session, {
        op: "christmasTaskClaim",
        submission: id,
      });
    snapshot = (await call(service.base, session, { op: "christmas" }))
      .christmas;
    assert.equal(snapshot.wallet.points, 60);
    assert.equal(snapshot.wallet.feed, 23);
    assert.equal(snapshot.wallet.fed, 25);
    assert.equal(snapshot.wallet.earned, 80);
    assert.equal(
      sql
        .prepare(
          "SELECT count(*) AS n FROM christmas_feed_tasks WHERE reward_rule=1",
        )
        .get().n,
      4,
    );
  } finally {
    sql.close();
    if (service?.child.exitCode === null) await stop(service.child);
    await rm(dir, { recursive: true, force: true });
  }
});
