import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { setup, request, launch, stop } from "./harness.mjs";
const hash = (x) => createHash("sha256").update(x).digest("hex");
test("client access is hashed and expiring; internal session tokens and forged public sessions are rejected", () =>
  setup(async (c) => {
    const a = await c.user("Auth A");
    const old = c.sql
      .prepare("SELECT token FROM sessions WHERE id=?")
      .get(a.id).token;
    assert.notEqual(a.token, old);
    assert.equal(
      c.sql
        .prepare("SELECT player FROM mini_access_tokens WHERE hash=?")
        .get(hash(a.token)).player,
      a.id,
    );
    assert.equal(
      (await request(c.base, "/v1/game", null, { op: "profile" })).status,
      401,
    );
    assert.equal(
      (await request(c.base, "/v1/game", { token: old }, { op: "profile" }))
        .status,
      401,
    );
    assert.equal(
      (await request(c.base, "/v1/game", a, { op: "session", name: "Fake" }))
        .status,
      400,
    );
    assert.equal((await c.game(a, { op: "profile" })).id, a.id);
    c.sql.prepare("UPDATE mini_access_tokens SET expires=0").run();
    assert.equal(
      (await request(c.base, "/v1/game", a, { op: "profile" })).status,
      401,
    );
  }));
test("production refuses incomplete identity configuration; guest login is explicitly gated in development", async () => {
  await setup(
    async (c) => {
      assert.equal(
        (await request(c.base, "/v1/auth/guest", null, { name: "Auth A" }))
          .status,
        403,
      );
    },
    { ALLOW_DEV_GUESTS: "false" },
  );
  await setup(async (c) => {
    await assert.rejects(
      launch(c.dir + "/prod.sqlite", {
        NODE_ENV: "production",
        ALLOW_DEV_GUESTS: "false",
      }),
      /Production requires/,
    );
  });
});
test("card invite is a room capability, shares a 5:4 PNG, leaks no credentials and joins idempotently", () =>
  setup(async (c) => {
    const a = await c.user("Ana"),
      b = await c.user("Bruno"),
      outsider = await c.user("Clara");
    const room = (await c.game(a, { op: "create", capacity: 3 })).room;
    assert.equal(
      (await request(c.base, "/v1/invitations", outsider, { roomId: room.id }))
        .status,
      403,
    );
    const r = await request(c.base, "/v1/invitations", a, {
      roomId: room.id,
      lang: "pt",
    });
    assert.equal(r.status, 201);
    const invite = r.data.invitation;
    assert.match(invite.path, /^pages\/invite\/index\?token=[a-f0-9]{48}$/);
    assert.equal(invite.expires > Date.now() + 14 * 60000, true);
    assert.equal(
      c.sql
        .prepare("SELECT room FROM mini_invitations WHERE hash=?")
        .get(hash(invite.token)).room,
      room.id,
    );
    assert.equal(
      c.sql
        .prepare("SELECT room FROM mini_invitations WHERE hash=?")
        .get(invite.token),
      undefined,
    );
    const preview = await request(c.base, "/v1/invitations/" + invite.token);
    assert.equal(preview.data.invitation.code, room.code);
    assert.equal(JSON.stringify(preview.data).includes(a.id), false);
    assert.equal(JSON.stringify(invite).includes(a.token), false);
    const png = Buffer.from(await (await fetch(invite.imageUrl)).arrayBuffer());
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 800);
    assert.equal(png.readUInt32BE(20), 640);
    for (let i = 0; i < 2; i++) {
      const join = await request(
        c.base,
        "/v1/invitations/" + invite.token + "/join",
        b,
        {},
      );
      assert.equal(join.status, 200);
      assert.equal(join.data.room.players.length, 2);
    }
    const game = (await c.game(a, { op: "start", room: room.id })).room;
    assert.equal(game.game.players.find((x) => x.id === b.id).hand, undefined);
    assert.equal(game.game.players.find((x) => x.id === a.id).hand.length, 7);
    assert.equal(
      (await request(c.base, "/v1/invitations", a, { roomId: room.id })).status,
      409,
    );
    assert.equal(
      (
        await request(
          c.base,
          "/v1/invitations/" + invite.token + "/join",
          outsider,
          {},
        )
      ).data.error,
      "alreadyStarted",
    );
  }));
test("last-seat races, other-room membership, expired/closed invites and code reuse are safe", () =>
  setup(async (c) => {
    const a = await c.user("Ana"),
      b = await c.user("Bruno"),
      d = await c.user("Dora"),
      e = await c.user("Eva");
    const room = (await c.game(a, { op: "create", capacity: 2 })).room,
      inv = (await request(c.base, "/v1/invitations", a, { roomId: room.id }))
        .data.invitation;
    const races = await Promise.all(
      [b, d].map((u) =>
        request(c.base, "/v1/invitations/" + inv.token + "/join", u, {}),
      ),
    );
    assert.equal(races.filter((x) => x.status === 200).length, 1);
    assert.equal(races.find((x) => x.status !== 200).data.error, "roomFull");
    const own = (await c.game(e, { op: "create", capacity: 2 })).room;
    assert.equal(
      (await request(c.base, "/v1/invitations/" + inv.token + "/join", e, {}))
        .status,
      409,
    );
    c.sql
      .prepare("UPDATE mini_invitations SET expires=0 WHERE hash=?")
      .run(hash(inv.token));
    assert.equal(
      (await request(c.base, "/v1/invitations/" + inv.token)).status,
      410,
    );
    assert.equal(
      (await request(c.base, "/v1/invitations/" + inv.token + "/join", b, {}))
        .status,
      410,
    );
    const ownInv = (
      await request(c.base, "/v1/invitations", e, { roomId: own.id })
    ).data.invitation;
    await c.game(e, { op: "leave", room: own.id });
    assert.equal(
      (await request(c.base, "/v1/invitations/" + ownInv.token)).status,
      410,
    );
    // Reusing a cleaned-up room code cannot redirect an old room capability.
    const x = await c.user("Xavier"),
      y = await c.user("Yara"),
      z = await c.user("Zeca");
    const one = (await c.game(x, { op: "create", capacity: 2 })).room,
      two = (await c.game(y, { op: "create", capacity: 2 })).room;
    const card = (
      await request(c.base, "/v1/invitations", x, { roomId: one.id })
    ).data.invitation;
    c.sql.prepare("DELETE FROM rooms WHERE id=?").run(one.id);
    c.sql.prepare("UPDATE rooms SET code=? WHERE id=?").run(one.code, two.id);
    const joined = await request(
      c.base,
      "/v1/invitations/" + card.token + "/join",
      z,
      {},
    );
    assert.equal(joined.status, 404);
    assert.equal(
      JSON.parse(
        c.sql.prepare("SELECT data FROM rooms WHERE id=?").get(two.id).data,
      ).players.length,
      1,
    );
  }));
test("matching defaults to 1v1; queues honor 2/3/4, and fallback fills only the missing seats", () =>
  setup(async (c) => {
    const a = await c.user("A one"),
      b = await c.user("B two"),
      d = await c.user("D four"),
      e = await c.user("E four");
    let first = (await c.game(a, { op: "match" })).room;
    assert.equal(first.capacity, 2);
    const four = (await c.game(d, { op: "match", capacity: 4 })).room;
    const paired = (await c.game(b, { op: "match", capacity: 2 })).room;
    assert.equal(paired.status, "playing");
    assert.equal(paired.players.length, 2);
    let waiting = (await c.game(e, { op: "match", capacity: 4 })).room;
    assert.equal(waiting.status, "waiting");
    const raw = JSON.parse(
      c.sql.prepare("SELECT data FROM rooms WHERE id=?").get(waiting.id).data,
    );
    raw.queuedAt = Date.now() - 8100;
    c.sql
      .prepare("UPDATE rooms SET data=? WHERE id=?")
      .run(JSON.stringify(raw), waiting.id);
    const fallback = (await c.game(d, { op: "state", room: four.id })).room;
    assert.equal(fallback.status, "playing");
    assert.equal(fallback.players.length, 4);
    assert.equal(fallback.players.filter((x) => x.bot).length, 2);
    assert.equal(new Set(fallback.players.map((x) => x.id)).size, 4);
    assert.equal(
      (await c.game(d, { op: "christmas" })).christmas.wallet.points,
      0,
    );
  }));
