const words = require("./labels");
function face(v) {
  return { skip: "⊘", reverse: "⇄", wild: "✦" }[v] || v;
}
function decorate(card, lang) {
  return Object.assign({}, card, {
    face: face(card.value),
    label: words.t(lang, card.color) + " " + face(card.value),
  });
}
function choose(hand, canPlay, selected, id, drawn) {
  var found = hand.find(function (c) {
    return c.id === id;
  });
  if (!found) throw Error("invalidCard");
  if (selected.indexOf(id) >= 0) {
    var remaining = selected.filter(function (v) {
      return v !== id;
    });
    if (remaining.length && canPlay.indexOf(remaining[0]) < 0) {
      var legal = remaining.find(function (v) {
        return canPlay.indexOf(v) >= 0;
      });
      if (legal === undefined) return [];
      remaining = [legal].concat(
        remaining.filter(function (v) {
          return v !== legal;
        }),
      );
    }
    return remaining;
  }
  if (!selected.length) {
    if (canPlay.indexOf(id) < 0) throw Error("invalidCard");
    return [id];
  }
  var first = hand.find(function (c) {
    return c.id === selected[0];
  });
  if (!/^\d$/.test(first.value) || found.value !== first.value)
    throw Error("invalidBatch");
  return selected.concat(id);
}
function colors(cards) {
  if (!cards.length) return [];
  if (cards[0].color === "wild") return ["red", "yellow", "green", "blue"];
  return Array.from(
    new Set(
      cards.map(function (c) {
        return c.color;
      }),
    ),
  );
}
module.exports = { decorate: decorate, choose: choose, colors: colors };
