import test from "node:test";
import assert from "node:assert/strict";
import {
  deck,
  newGame,
  startRound,
  act,
  canPlay,
  botAction,
  view,
} from "../backend/src/domain/engine.mjs";
const c = (id, color, value) => ({ id, color, value });
function setup(n = 4) {
  const g = newGame(
    Array.from({ length: n }, (_, i) => ({ id: String(i), name: "P" + i })),
  );
  g.discard = [c(999, "red", "5")];
  g.color = "red";
  g.players[0].hand = [
    c(1000, "red", "2"),
    c(1001, "blue", "5"),
    c(1002, "wild", "+4"),
  ];
  return g;
}
test("108 unique cards, 7 dealt to each player", () => {
  assert.equal(deck().length, 108);
  assert.equal(new Set(deck().map((x) => x.id)).size, 108);
  let g = newGame([{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }]);
  assert.ok(g.players.every((p) => p.hand.length === 7));
  assert.equal(g.deck.length + g.discard.length + 28, 108);
});
test("server rejects out of turn and illegal play", () => {
  let g = setup();
  assert.throws(() => act(g, "1", { type: "draw" }), /notTurn/);
  g.players[0].hand.push(c(1003, "green", "8"));
  assert.throws(
    () => act(g, "0", { type: "play", cardId: 1003 }),
    /invalidCard/,
  );
  assert.equal(canPlay(g, g.players[0], g.players[0].hand[2]), false);
});
test("skip, reverse and +2 apply correct next turn", () => {
  for (const [v, turn, dir] of [
    ["skip", 2, 1],
    ["reverse", 3, -1],
    ["+2", 2, 1],
  ]) {
    let g = setup();
    g.players[0].hand.push(c(123, "red", v));
    const count = g.players[1].hand.length;
    act(g, "0", { type: "play", cardId: 123 });
    assert.equal(g.turn, turn);
    assert.equal(g.direction, dir);
    if (v === "+2") assert.equal(g.players[1].hand.length, count + 2);
  }
});
test("2-player reverse keeps turn", () => {
  let g = setup(2);
  g.players[0].hand.push(c(123, "red", "reverse"));
  act(g, "0", { type: "play", cardId: 123 });
  assert.equal(g.turn, 0);
});
test("UNO penalty and declaration", () => {
  for (const uno of [false, true]) {
    let g = setup();
    g.players[0].hand = g.players[0].hand.slice(0, 2);
    act(g, "0", { type: "play", cardId: 1000, uno });
    assert.equal(g.players[0].hand.length, uno ? 1 : 3);
  }
});
test("wild requires color; +4 penalizes next", () => {
  let g = setup();
  g.players[0].hand = [c(1, "wild", "+4"), c(2, "blue", "3")];
  assert.throws(() => act(g, "0", { type: "play", cardId: 1 }), /chooseColor/);
  let count = g.players[1].hand.length;
  act(g, "0", { type: "play", cardId: 1, color: "yellow", uno: true });
  assert.equal(g.color, "yellow");
  assert.equal(g.turn, 2);
  assert.equal(g.players[1].hand.length, count + 4);
});
test("draw only allows new card, pass advances turn", () => {
  let g = setup();
  g.deck.push(c(321, "red", "9"));
  act(g, "0", { type: "draw" });
  assert.equal(g.drawn, 321);
  assert.throws(
    () => act(g, "0", { type: "play", cardId: 1000 }),
    /invalidCard/,
  );
  act(g, "0", { type: "pass" });
  assert.equal(g.turn, 1);
});
test("private view never exposes opponents hands or deck", () => {
  let g = setup(),
    v = view(g, "0");
  assert.equal(v.deck, undefined);
  assert.ok(v.players[0].hand);
  assert.ok(
    v.players.slice(1).every((p) => p.hand === undefined && p.count === 7),
  );
  assert.equal(v.discard.length, 1);
});
test("100 simulated games finish without invalid bot actions or card loss", () => {
  for (let i = 0; i < 100; i++) {
    let g = newGame(
      Array.from({ length: 4 }, (_, j) => ({ id: String(j), name: "B" + j })),
    );
    let steps = 0;
    while (g.status === "playing" && steps++ < 4000) {
      act(g, g.players[g.turn].id, botAction(g));
      assert.equal(
        g.deck.length +
          g.discard.length +
          g.players.reduce((s, p) => s + p.hand.length, 0),
        108,
      );
    }
    assert.equal(g.status, "finished");
    assert.ok(g.players.some((p) => p.score > 0));
  }
});

test("draws continuously until a legal card, then preserves the turn", () => {
  const g = setup();
  g.players[0].hand = [c(1000, "blue", "2")];
  g.deck = [c(1, "red", "7"), c(2, "green", "3"), c(3, "yellow", "9")];
  act(g, "0", { type: "draw" });
  assert.equal(g.players[0].hand.length, 4);
  assert.equal(g.drawn, 1);
  assert.equal(g.turn, 0);
  assert.equal(g.events.at(-1).value, 3);
  assert.equal(g.events.at(-1).key, "drewMany");
});
test("draw stops on a legal wild or matching number; +4 is still validated", () => {
  for (const end of [c(1, "wild", "wild"), c(1, "blue", "5")]) {
    const g = setup();
    g.deck = [end, c(2, "green", "3")];
    act(g, "0", { type: "draw" });
    assert.equal(g.drawn, 1);
    assert.equal(g.players[0].hand.length, 5);
  }
  const g = setup();
  g.deck = [c(1, "red", "9"), c(2, "wild", "+4")];
  act(g, "0", { type: "draw" });
  assert.equal(g.drawn, 1);
});
test("draw recycles discards and safely passes when all cards are held", () => {
  const g = setup();
  g.deck = [];
  g.discard = [c(11, "red", "9"), c(999, "red", "5")];
  act(g, "0", { type: "draw" });
  assert.equal(g.drawn, 11);
  const h = setup();
  h.deck = [];
  act(h, "0", { type: "draw" });
  assert.equal(h.turn, 1);
  assert.equal(h.drawn, null);
});
test("legacy batches without a requested color keep the last selected color", () => {
  const g = setup();
  g.players[0].hand = [
    c(1, "red", "1"),
    c(2, "red", "1"),
    c(3, "blue", "1"),
    c(4, "green", "9"),
  ];
  const seq = g.turnSeq;
  act(g, "0", { type: "play", cardIds: [1, 2, 3], uno: true });
  assert.equal(g.players[0].hand.length, 1);
  assert.equal(g.color, "blue");
  assert.equal(g.discard.at(-1).id, 3);
  assert.equal(g.turn, 1);
  assert.equal(g.turnSeq, seq + 1);
});
test("batch applies UNO penalty once and can finish the round", () => {
  const g = setup();
  g.players[0].hand = [
    c(1, "red", "1"),
    c(2, "blue", "1"),
    c(3, "yellow", "9"),
  ];
  act(g, "0", { type: "play", cardIds: [1, 2] });
  assert.equal(g.players[0].hand.length, 3);
  const h = setup();
  h.players[0].hand = [c(1, "red", "1"), c(2, "blue", "1")];
  act(h, "0", { type: "play", cardIds: [1, 2] });
  assert.equal(h.status, "finished");
  assert.equal(h.winner, "0");
});
test("rejects illegal, mixed, duplicate and action batches without partial mutation", () => {
  for (const ids of [
    [1, 1],
    [1, 4],
    [3, 1],
    [1, 999],
    [2, 5],
  ]) {
    const g = setup();
    g.players[0].hand = [
      c(1, "red", "1"),
      c(2, "red", "+2"),
      c(3, "blue", "1"),
      c(4, "red", "2"),
      c(5, "blue", "+2"),
    ];
    const before = JSON.stringify(g);
    assert.throws(
      () => act(g, "0", { type: "play", cardIds: ids }),
      /invalidCard|invalidBatch/,
    );
    assert.equal(JSON.stringify(g), before);
  }
});
test("drawn number can lead a batch with matching cards already in hand", () => {
  const g = setup();
  g.players[0].hand = [c(3, "blue", "1"), c(4, "yellow", "9")];
  g.deck = [c(1, "red", "1")];
  act(g, "0", { type: "draw" });
  act(g, "0", { type: "play", cardIds: [1, 3], uno: true });
  assert.equal(g.players[0].hand.length, 1);
  assert.equal(g.color, "blue");
});

test("mixed-color batches allow either played color and leave a matching card on top", () => {
  for (const order of [
    [1, 2],
    [2, 1],
  ])
    for (const color of ["red", "yellow"]) {
      const g = setup();
      g.discard = [c(99, "red", "5")];
      g.color = "red";
      g.players[0].hand = [
        c(1, "red", "5"),
        c(2, "yellow", "5"),
        c(3, "blue", "8"),
        c(4, "green", "9"),
      ];
      const turnSeq = g.turnSeq;
      act(g, "0", { type: "play", cardIds: order, color });
      assert.equal(g.color, color);
      assert.equal(g.discard.at(-1).color, color);
      assert.equal(g.discard.at(-1).value, "5");
      assert.deepEqual(
        g.players[0].hand.map((card) => card.id),
        [3, 4],
      );
      assert.equal(g.turn, 1);
      assert.equal(g.turnSeq, turnSeq + 1);
      assert.equal(new Set(g.discard.slice(-2).map((card) => card.id)).size, 2);
    }
  const drawn = setup();
  drawn.players[0].hand = [
    c(1, "red", "1"),
    c(2, "yellow", "1"),
    c(3, "green", "7"),
  ];
  drawn.drawn = 1;
  act(drawn, "0", { type: "play", cardIds: [1, 2], color: "red", uno: true });
  assert.equal(drawn.color, "red");
  assert.equal(drawn.discard.at(-1).id, 1);
  assert.equal(drawn.players[0].hand.length, 1);
});

test("batch colors cannot be chosen from cards not played and rejection does not mutate the game", () => {
  for (const color of ["green", "blue", "wild", null]) {
    const g = setup();
    g.players[0].hand = [
      c(1, "red", "1"),
      c(2, "yellow", "1"),
      c(3, "green", "9"),
    ];
    const before = JSON.stringify(g);
    assert.throws(
      () => act(g, "0", { type: "play", cardIds: [1, 2], color }),
      /invalidBatchColor/,
    );
    assert.equal(JSON.stringify(g), before);
  }
  const g = setup();
  g.players[0].hand = [c(1, "red", "1"), c(2, "red", "1"), c(3, "blue", "9")];
  const before = JSON.stringify(g);
  assert.throws(
    () => act(g, "0", { type: "play", cardIds: [1, 2], color: "blue" }),
    /invalidBatchColor/,
  );
  assert.equal(JSON.stringify(g), before);
});

test("bots choose a legal batch color even when the remaining hand favors an unavailable color", () => {
  const g = setup();
  g.players[0].hand = [
    c(1, "red", "1"),
    c(2, "yellow", "1"),
    c(3, "green", "9"),
    c(4, "green", "8"),
    c(5, "green", "7"),
  ];
  const action = botAction(g);
  assert.deepEqual(action.cardIds, [1, 2]);
  assert.ok(["red", "yellow"].includes(action.color));
  act(g, "0", action);
  assert.equal(g.color, action.color);
  assert.equal(g.discard.at(-1).color, action.color);
  assert.equal(g.players[0].hand.length, 3);
});

test("public event sequences are unique across repeated draws and rounds", () => {
  const g = newGame(
    [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ],
    3,
  );
  const initial = g.events[0].seq;
  for (let i = 0; i < 12; i++) {
    const pid = g.players[g.turn].id;
    act(g, pid, { type: "draw" });
    const last = g.events.at(-1);
    assert.equal(last.player, pid);
    if (g.drawn) act(g, pid, { type: "pass" });
  }
  assert.equal(g.events.length, 8);
  assert.equal(new Set(g.events.map((e) => e.seq)).size, 8);
  assert.ok(g.events[0].seq > initial);
  const before = g.eventSeq;
  startRound(g);
  assert.ok(g.events[0].seq > before);
});
