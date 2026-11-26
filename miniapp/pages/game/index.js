const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  poll = require("../../utils/poller"),
  cards = require("../../utils/cards"),
  audio = require("../../utils/audio"),
  words = require("../../utils/labels");
Page({
  data: {
    room: null,
    hand: [],
    opponents: [],
    selected: [],
    busy: false,
    error: "",
    uno: false,
    sound: true,
    remaining: 30,
    myTurn: false,
  },
  onLoad: function (q) {
    ui.setup(this);
    this.id = q.id || p.storage.get("ono.room");
    this.setData({ sound: audio.init() });
  },
  onShow: function () {
    var self = this;
    ui.setup(this);
    poll.start(
      this,
      function () {
        if (self._busy) return;
        return self.refresh();
      },
      1000,
    );
    this.clock = setInterval(function () {
      var g = self.data.room && self.data.room.game;
      if (g)
        self.setData({
          remaining: Math.max(
            0,
            30 - Math.floor((Date.now() - g.turnAt) / 1000),
          ),
        });
    }, 250);
  },
  onHide: function () {
    poll.stop(this);
    clearInterval(this.clock);
    audio.stop();
  },
  onUnload: function () {
    poll.stop(this);
    clearInterval(this.clock);
    audio.stop();
  },
  onPollError: function (e) {
    ui.fail(this, e);
  },
  meId: function () {
    var session = getApp().globalData.session;
    if (!session || !session.id) throw Error("sessionExpired");
    return session.id;
  },
  refresh: function () {
    var self = this,
      generation = this._generation;
    return getApp()
      .ensureSession()
      .then(function () {
        return client.game({ op: "state", room: self.id });
      })
      .then(function (r) {
        if (self._visible && generation === self._generation) self.apply(r);
      });
  },
  apply: function (result) {
    var room = result.room,
      g = room.game,
      old = this.data.room;
    if (old && old.id === room.id && old.rev > room.rev) return;
    this.id = room.id;
    getApp().rememberRoom(room);
    if (room.status === "waiting") {
      getApp().openRoom(room);
      return;
    }
    if (!g) return;
    var lang = getApp().globalData.lang,
      meId = this.meId(),
      me = g.players.find(function (x) {
        return x.id === meId;
      });
    if (!me) throw Error("sessionExpired");
    var turnKey = g.round + ":" + g.turnSeq,
      myTurn = g.status === "playing" && g.players[g.turn].id === meId,
      selected = this.data.selected.filter(function (id) {
        return me.hand.some(function (c) {
          return c.id === id;
        });
      });
    if (this._turnKey !== turnKey) {
      selected = [];
      this.setData({ uno: false });
      if (myTurn) {
        audio.play("turn");
        p.vibrateShort().catch(function () {});
      }
    }
    this._turnKey = turnKey;
    var latest = g.events[g.events.length - 1];
    if (this._eventSeq && latest && latest.seq > this._eventSeq) {
      var map = {
        played: "play",
        playedMany: "play",
        calledUno: "uno",
        penalty: "penalty",
        drew: "draw",
        drewMany: "draw",
        unoPenalty: "penalty",
        won: "win",
        roundStart: "start",
        skipped: "skip",
        reversed: "reverse",
      };
      audio.play(
        latest.key === "played"
          ? {
              skip: "skip",
              reverse: "reverse",
              "+2": "penalty",
              "+4": "penalty",
            }[latest.value] || "play"
          : map[latest.key] || "tap",
      );
    }
    this._eventSeq = latest ? latest.seq : 0;
    var ownReward = (room.rewards || []).filter(function (x) {
      return x.player === meId;
    })[0];
    var winner = g.players.find(function (x) {
      return x.id === g.winner;
    });
    var hand = me.hand.slice();
    if (this._sorted)
      hand.sort(function (a, b) {
        return a.color.localeCompare(b.color) || a.value.localeCompare(b.value);
      });
    this.setData({
      room: room,
      myTurn: myTurn,
      selected: selected,
      hand: hand.map(function (c) {
        return Object.assign(cards.decorate(c, lang), {
          selected: selected.indexOf(c.id) >= 0,
          disabled:
            !myTurn || (selected.length === 0 && g.canPlay.indexOf(c.id) < 0),
        });
      }),
      opponents: g.players
        .filter(function (x) {
          return x.id !== me.id;
        })
        .map(function (x) {
          return {
            id: x.id,
            name: x.name,
            count: x.count,
            backs: [0,1,2,3,4].slice(0,x.count),
            active: g.status === "playing" && g.players[g.turn].id === x.id,
            wins: x.wins,
          };
        }),
      top: cards.decorate(g.discard[0], lang),
      colorName: words.t(lang, g.color),
      turnName: g.players[g.turn].name,
      isHost: room.host === me.id,
      winnerName: winner ? winner.name : "",
      results: g.players.map(function (x) {
        return { id: x.id, name: x.name, wins: x.wins };
      }),
      reward: ownReward
        ? words.t(lang, "reward", { count: ownReward.points })
        : room.kind === "online"
          ? words.t(lang, "noReward")
          : "",
      selectedLabel: words.t(lang, "selected", { count: selected.length }),
      error: "",
    });
  },
  choose: function (e) {
    if (this._busy || !this.data.myTurn) return;
    var room = this.data.room,
      meId = this.meId(),
      me = room.game.players.find(function (x) {
        return x.id === meId;
      });
    if (!me) {
      getApp().clearSession();
      ui.fail(this, Error("sessionExpired"));
      return;
    }
    try {
      var selected = cards.choose(
        me.hand,
        room.game.canPlay,
        this.data.selected,
        e.detail.id,
        room.game.drawn,
      );
      this.setData({ selected: selected });
      audio.play("select");
      this.apply({ room: room });
    } catch (err) {
      p.toast(words.t(getApp().globalData.lang, err.message));
      audio.play("error");
    }
  },
  clear: function () {
    this.setData({ selected: [] });
    this.apply({ room: this.data.room });
  },
  sort: function () {
    this._sorted = !this._sorted;
    this.apply({ room: this.data.room });
  },
  uno: function () {
    if (!this.data.myTurn) return;
    this.setData({ uno: !this.data.uno });
    audio.play("uno");
  },
  sound: function () {
    this.setData({ sound: audio.toggle() });
    audio.play("tap");
  },
  act: function (action) {
    var self = this;
    return client
      .game({
        op: "action",
        room: this.id,
        rev: this.data.room.rev,
        action: action,
      })
      .then(function (r) {
        self.apply(r);
      })
      .catch(function (e) {
        if (e.message === "staleTurn") self.refresh();
        throw e;
      });
  },
  play: function () {
    var self = this;
    if (!this.data.myTurn || !this.data.selected.length) return;
    ui.busy(this, function () {
      var g = self.data.room.game,
        meId = self.meId(),
        me = g.players.find(function (x) {
          return x.id === meId;
        });
      if (!me) throw Error("sessionExpired");
      var selection = self.data.selected.map(function (id) {
          return me.hand.find(function (c) {
            return c.id === id;
          });
        }),
        options = cards.colors(selection),
        choose =
          options.length > 1
            ? p
              .showActionSheet({
                itemList: options.map(function (c) {
                  return words.t(getApp().globalData.lang, c);
                }),
              })
              .then(function (r) {
                return options[r.tapIndex];
              })
              .catch(function () {
                return null;
              })
          : Promise.resolve(options[0]);
      return choose.then(function (color) {
        if (!color) return;
        return self.act({
          type: "play",
          cardIds: self.data.selected.slice(),
          color: color,
          uno: self.data.uno,
        });
      });
    });
  },
  draw: function () {
    if (!this.data.myTurn || this._busy) return;
    var self = this;
    ui.busy(this, function () {
      return self.act({ type: self.data.room.game.drawn ? "pass" : "draw" });
    });
  },
  next: function () {
    var self = this;
    ui.busy(this, function () {
      return client.game({ op: "next", room: self.id }).then(function (r) {
        self.apply(r);
      });
    });
  },
  home: function () {
    var self = this;
    ui.busy(this, function () {
      var playing = self.data.room && self.data.room.game.status === "playing";
      return (
        playing ? ui.confirm("confirmLeave") : Promise.resolve(true)
      ).then(function (ok) {
        if (!ok) return;
        return client.game({ op: "leave", room: self.id }).then(function () {
          getApp().rememberRoom(null);
          getApp().home();
        });
      });
    });
  },
  farm: function () {
    p.navigateTo({ url: "/pages/farm/index?focus=pet" });
  },
});
