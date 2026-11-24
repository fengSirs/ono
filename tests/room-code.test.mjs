import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("room creation retries a random room-code collision without stealing another table", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ono-room-code-"));
  process.env.ONO_DB = join(dir, "test.sqlite");
  const { POST } = await import("../backend/runtime/game-controller.mjs");
  const { closeDatabase } = await import("../backend/runtime/db.mjs");
  const original = crypto.getRandomValues;
  async function call(body, user) {
    const r = await POST(
      new Request("http://internal/game", {
        method: "POST",
        headers: user ? { Authorization: "Bearer " + user.token } : {},
        body: JSON.stringify(body),
      }),
    );
    const data = await r.json();
    assert.equal(r.status, 200, JSON.stringify(data));
    return data;
  }
  try {
    const a = await call({ op: "session", name: "Collision A" }),
      b = await call({ op: "session", name: "Collision B" });
    const sequence = [42, 42, 43];
    Object.defineProperty(crypto, "getRandomValues", {
      configurable: true,
      value: function (array) {
        array[0] = sequence.shift();
        return array;
      },
    });
    const one = (await call({ op: "create", capacity: 2 }, a)).room,
      two = (await call({ op: "create", capacity: 2 }, b)).room;
    assert.equal(one.code, "100042");
    assert.equal(two.code, "100043");
    assert.notEqual(one.id, two.id);
    assert.equal(sequence.length, 0);
    assert.equal(
      (await call({ op: "state", room: one.id }, a)).room.players[0].id,
      a.id,
    );
  } finally {
    Object.defineProperty(crypto, "getRandomValues", {
      configurable: true,
      value: original,
    });
    closeDatabase();
    await rm(dir, { recursive: true, force: true });
  }
});
