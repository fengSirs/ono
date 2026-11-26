import test from "node:test";
import assert from "node:assert/strict";
import { setup, request } from "./harness.mjs";

test("nickname changes persist and propagate to the active room", () =>
  setup(async (c) => {
    const user = await c.user("Ana");
    const room = await c.game(user, {
      op: "create",
      capacity: 3,
      rounds: 1,
    });
    const renamed = await c.game(user, {
      op: "rename",
      name: "Beatriz",
    });
    assert.equal(renamed.name, "Beatriz");
    assert.equal(
      c.sql.prepare("SELECT name FROM sessions WHERE id=?").get(user.id).name,
      "Beatriz",
    );
    const state = await c.game(user, { op: "state", room: room.room.id });
    assert.equal(state.room.players[0].name, "Beatriz");

    const invalid = await request(c.base, "/v1/game", user, {
      op: "rename",
      name: " ",
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.data.error, "nameRequired");
  }));
