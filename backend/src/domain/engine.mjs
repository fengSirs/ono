export const COLORS = ["red", "yellow", "green", "blue"];
export function deck() {
  let n = 0,
    a = [];
  for (const c of COLORS) {
    a.push({ id: ++n, color: c, value: "0" });
    for (const v of [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "skip",
      "reverse",
      "+2",
    ])
      for (let i = 0; i < 2; i++) a.push({ id: ++n, color: c, value: v });
  }
  for (const v of ["wild", "+4"])
    for (let i = 0; i < 4; i++) a.push({ id: ++n, color: "wild", value: v });
  return a;
}
export function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function newGame(players, rounds = 1) {
  return startRound({
    players: players.map((p) => ({ ...p, hand: [], score: 0 })),
    rounds,
    round: 0,
    direction: 1,
    events: [],
  });
}
export function startRound(g) {
  g.round++;
  g.deck = shuffle(deck());
  g.discard = [];
  g.status = "playing";
  g.winner = null;
  g.roundStartedAt = Date.now();
  g.roundResults ||= [];
  g.drawn = null;
  g.turn = 0;
  g.turnSeq = (g.turnSeq || 0) + 1;
  g.direction = 1;
  for (const p of g.players) p.hand = g.deck.splice(0, 7);
  let i = g.deck.findIndex((c) => /^\d$/.test(c.value));
  g.discard.push(g.deck.splice(i, 1)[0]);
  g.color = g.discard[0].color;
  g.turnAt = Date.now();
  g.eventSeq = (g.eventSeq || 0) + 1;
  g.events = [{ seq: g.eventSeq, key: "roundStart", name: "", value: g.round }];
  return g;
}
export function canPlay(g, p, c) {
  if (g.drawn && g.drawn !== c.id) return false;
  if (c.value === "+4") return !p.hand.some((x) => x.color === g.color);
  return (
    c.color === "wild" ||
    c.color === g.color ||
    c.value === g.discard.at(-1).value
  );
}
export function drawCards(g, p, n) {
  const before = p.hand.length;
  for (let i = 0; i < n; i++) {
    if (!g.deck.length) {
      const top = g.discard.pop();
      g.deck = shuffle(g.discard);
      g.discard = [top];
    }
    if (g.deck.length) p.hand.push(g.deck.pop());
  }
  return p.hand.length - before;
}
function next(g, n = 1) {
  g.turn = (g.turn + g.direction * n + g.players.length * 4) % g.players.length;
  g.drawn = null;
  g.turnSeq = (g.turnSeq || 0) + 1;
  g.turnAt = Date.now();
}
function event(g, key, p, value) {
  g.eventSeq = (g.eventSeq || 0) + 1;
  g.events.push({ seq: g.eventSeq, player: p.id, key, name: p.name, value });
  g.events = g.events.slice(-8);
}
export function act(g, pid, a) {
  if (g.status !== "playing") throw Error("notPlaying");
  const p = g.players[g.turn];
  if (p.id !== pid) throw Error("notTurn");
  if (a.type === "draw") {
    if (g.drawn) throw Error("alreadyDrawn");
    let count = 0;
    let playable = null;
    // A finite pool of 108 cards: stop safely if no cards can be recycled.
    while (count < 108) {
      if (!drawCards(g, p, 1)) break;
      count++;
      const card = p.hand.at(-1);
      if (canPlay(g, p, card)) {
        playable = card;
        break;
      }
    }
    event(g, count === 1 ? "drew" : "drewMany", p, count);
    if (playable) g.drawn = playable.id;
    else next(g);
    return g;
  }
  if (a.type === "pass") {
    if (!g.drawn) throw Error("mustDraw");
    next(g);
    return g;
  }
  if (a.type !== "play") throw Error("invalidAction");
  const ids = a.cardIds === undefined ? [a.cardId] : a.cardIds;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > p.hand.length ||
    new Set(ids).size !== ids.length
  )
    throw Error("invalidCard");
  const cards = ids.map((id) => p.hand.find((c) => c.id === id));
  if (cards.some((c) => !c)) throw Error("invalidCard");
  const first = cards[0];
  if (!canPlay(g, p, first)) throw Error("invalidCard");
  if (
    cards.length > 1 &&
    (!/^\d$/.test(first.value) || cards.some((c) => c.value !== first.value))
  )
    throw Error("invalidBatch");
  if (first.color === "wild" && !COLORS.includes(a.color))
    throw Error("chooseColor");
  const batchColors = [...new Set(cards.map((c) => c.color))];
  if (
    cards.length > 1 &&
    a.color !== undefined &&
    !batchColors.includes(a.color)
  )
    throw Error("invalidBatchColor");
  // Validate before changing the hand or pile. Keep an actual card of the
  // chosen color on top; the original lead was already checked for legality.
  const played = [...cards];
  if (cards.length > 1 && a.color !== undefined) {
    const topIndex = played.findLastIndex((c) => c.color === a.color);
    played.push(...played.splice(topIndex, 1));
  }
  p.hand = p.hand.filter((c) => !ids.includes(c.id));
  g.discard.push(...played);
  const c = played.at(-1);
  g.color = c.color === "wild" ? a.color : c.color;
  g.drawn = null;
  event(
    g,
    cards.length > 1 ? "playedMany" : "played",
    p,
    cards.length > 1 ? cards.length : c.value,
  );
  if (p.hand.length === 1) {
    if (!a.uno) {
      drawCards(g, p, 2);
      event(g, "unoPenalty", p, 2);
    } else event(g, "calledUno", p, 0);
  }
  if (c.value === "reverse") g.direction *= -1;
  if (c.value === "+2" || c.value === "+4") {
    const target =
      g.players[(g.turn + g.direction + g.players.length) % g.players.length];
    drawCards(g, target, c.value === "+2" ? 2 : 4);
    event(g, "penalty", target, c.value === "+2" ? 2 : 4);
  }
  if (!p.hand.length) {
    const points = g.players
      .filter((x) => x.id !== p.id)
      .reduce(
        (s, x) =>
          s +
          x.hand.reduce(
            (sum, card) =>
              sum +
              (card.color === "wild"
                ? 50
                : /^\d$/.test(card.value)
                  ? Number(card.value)
                  : 20),
            0,
          ),
        0,
      );
    p.score += points;
    g.roundResults ||= [];
    g.roundResults.push({
      round: g.round,
      winner: p.id,
      points,
      finishedAt: Date.now(),
      activityRule: "friends-v2",
      participantIds: g.players
        .filter((player) => !player.bot)
        .map((player) => player.id),
    });
    g.winner = p.id;
    g.status = g.round >= g.rounds ? "finished" : "roundOver";
    event(g, "won", p, points);
    return g;
  }
  next(
    g,
    ["skip", "+2", "+4"].includes(c.value) ||
      (c.value === "reverse" && g.players.length === 2)
      ? 2
      : 1,
  );
  return g;
}
export function botAction(g) {
  const p = g.players[g.turn],
    options = p.hand.filter((c) => canPlay(g, p, c));
  if (!options.length) return { type: g.drawn ? "pass" : "draw" };
  const c = options.sort(
    (a, b) => (a.color === "wild") - (b.color === "wild"),
  )[0];
  const companions = /^\d$/.test(c.value)
    ? p.hand.filter((x) => x.id !== c.id && x.value === c.value)
    : [];
  const played = [c, ...companions];
  const allowed =
    c.color === "wild"
      ? COLORS
      : [...new Set(played.map((card) => card.color))];
  const remaining = p.hand.filter(
    (card) => !played.some((chosen) => chosen.id === card.id),
  );
  const color = allowed.reduce(
    (best, value) =>
      remaining.filter((card) => card.color === value).length >
      remaining.filter((card) => card.color === best).length
        ? value
        : best,
    allowed[0],
  );
  return {
    type: "play",
    cardIds: [c.id, ...companions.map((x) => x.id)],
    color,
    uno: true,
  };
}
export function view(g, pid) {
  if (!g) return null;
  return {
    ...g,
    deck: undefined,
    deckCount: g.deck.length,
    discard: [g.discard.at(-1)],
    players: g.players.map((p) => ({
      ...p,
      hand: p.id === pid ? p.hand : undefined,
      count: p.hand.length,
      wins: (g.roundResults || []).filter((result) => result.winner === p.id)
        .length,
    })),
    canPlay:
      g.status === "playing" && g.players[g.turn].id === pid
        ? g.players[g.turn].hand
            .filter((c) => canPlay(g, g.players[g.turn], c))
            .map((c) => c.id)
        : [],
  };
}
