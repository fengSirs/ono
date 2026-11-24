import test from "node:test";
import assert from "node:assert/strict";
import { native, flush } from "./native-harness.mjs";
const token = "a".repeat(48);
function sample() {
  return {
    room: {
      id: "room-a",
      code: "123456",
      kind: "private",
      status: "playing",
      rev: 3,
      host: "me",
      rounds: 1,
      players: [
        { id: "me", name: "Ana" },
        { id: "other", name: "Beatriz" },
      ],
      rewards: [],
      game: {
        status: "playing",
        round: 1,
        rounds: 1,
        turn: 0,
        turnSeq: 1,
        turnAt: Date.now(),
        drawn: null,
        color: "red",
        events: [],
        discard: [{ id: 9, color: "red", value: "5" }],
        canPlay: [1],
        players: [
          {
            id: "me",
            name: "Ana",
            count: 3,
            wins: 0,
            hand: [
              { id: 1, color: "red", value: "1" },
              { id: 2, color: "yellow", value: "1" },
              { id: 3, color: "green", value: "8" },
            ],
          },
          { id: "other", name: "Beatriz", count: 7, wins: 0 },
        ],
      },
    },
  };
}
test("native app handles cold and warm card launches without carrying session credentials", async () => {
  const n = native();
  try {
    n.app.captureLaunch({ query: { token } });
    const lobby = n.page("lobby");
    lobby.onLoad();
    n.pages.push(lobby);
    lobby.onShow();
    assert.equal(n.calls.filter((c) => c.type === "navigateTo").length, 1);
    assert.equal(n.app.globalData.pendingInvite, null);
    assert.equal(
      n.calls.find((c) => c.type === "navigateTo").url,
      "/pages/invite/index?token=" + token,
    );
    n.calls.length = 0;
    n.app.onShow({ query: { token } });
    assert.equal(n.calls.filter((c) => c.type === "navigateTo").length, 1);
    const invite = n.page("invite");
    n.pages.splice(0, 1, invite);
    n.respond(() => ({
      invitation: {
        code: "123456",
        capacity: 4,
        players: [],
        status: "waiting",
      },
    }));
    invite.onLoad({ token });
    await flush();
    assert.equal(invite.data.preview.code, "123456");
    n.app.onShow({ query: { token: "b".repeat(48) } });
    await flush();
    assert.equal(invite.data.token, "b".repeat(48));
    assert.equal(n.app.globalData.pendingInvite, null);
  } finally {
    n.dispose();
  }
});
test("share is prepared before a synchronous native onShareAppMessage and expires safely", async () => {
  const n = native();
  try {
    n.app.globalData.session = { id: "me" };
    const page = n.page("room");
    page.onLoad({ id: "room-a" });
    page._visible = true;
    const invite = {
      token,
      expires: Date.now() + 60000,
      code: "123456",
      capacity: 4,
      appId: "app-1",
      path: "pages/invite/index?token=" + token,
      imageUrl: "https://api.example.com/assets/invites/" + token + ".png",
    };
    n.respond((o) => {
      assert.equal(o.data.roomId, "room-a");
      return { invitation: invite };
    });
    await page.prepare();
    assert.equal(page.data.shareReady, true);
    const card = page.onShareAppMessage();
    assert.equal(card.path, invite.path);
    assert.equal(card.appInfo.target, "phiz");
    assert.equal(typeof card.then, "undefined");
    assert.equal(JSON.stringify(card).includes("Bearer"), false);
    page.invite.expires = 1;
    assert.equal(page.onShareAppMessage().path, "pages/lobby/index");
    page.onHide();
    assert.equal(page.data.shareReady, false);
  } finally {
    n.dispose();
  }
});
test("mixed colors require choice; cancel preserves cards and explicit Play sends the chosen color", async () => {
  const n = native();
  try {
    n.app.globalData.session = { id: "me" };
    const page = n.page("game");
    page.onLoad({ id: "room-a" });
    page.apply(sample());
    page.choose({ detail: { id: 1 } });
    page.choose({ detail: { id: 2 } });
    assert.deepEqual(Array.from(page.data.selected), [1, 2]);
    n.ft.cancelColor = true;
    page.play();
    await flush();
    assert.equal(n.calls.filter((x) => x.type === "request").length, 0);
    assert.deepEqual(Array.from(page.data.selected), [1, 2]);
    n.ft.cancelColor = false;
    n.ft.colorIndex = 1;
    let action;
    n.respond((o) => {
      action = o.data.action;
      return sample();
    });
    page.uno();
    page.play();
    await flush();
    assert.deepEqual(Array.from(action.cardIds), [1, 2]);
    assert.equal(action.color, "yellow");
    assert.equal(action.uno, true);
    page.choose({ detail: { id: 1 } });
    assert.deepEqual(Array.from(page.data.selected), []);
  } finally {
    n.dispose();
  }
});
test("wild cards expose all four colors and stale snapshots never replace newer hands", () => {
  const n = native();
  try {
    const cards = n.load("utils/cards");
    assert.deepEqual(
      Array.from(cards.colors([{ color: "wild", value: "+4" }])),
      ["red", "yellow", "green", "blue"],
    );
    n.app.globalData.session = { id: "me" };
    const page = n.page("game");
    page.onLoad({ id: "room-a" });
    page.apply(sample());
    const old = sample();
    old.room.rev = 2;
    old.room.game.players[0].hand = [];
    page.apply(old);
    assert.equal(page.data.hand.length, 3);
  } finally {
    n.dispose();
  }
});
test("native campaign client unwraps API snapshots, centers the pet, and stops timers on hide", async () => {
  const n = native();
  try {
    n.app.globalData.session = { id: "me" };
    const page = n.page("farm");
    page.onLoad({ focus: "pet" });
    const snap = {
      config: {
        id: "test",
        now: Date.now(),
        growthGoal: 100,
        pointsPerFeed: 10,
        gameDailyCap: 100,
        hatchSeconds: 5,
      },
      wallet: { points: 20, feed: 1, fed: 0, stage: "baby" },
      pet: { status: "incubating", hatchAt: Date.now() + 5000 },
      gameDaily: { remaining: 100 },
      recent: [],
    };
    n.respond(() => ({ christmas: snap }));
    page.onShow();
    await flush();
    assert.equal(page.data.farm.config.growthGoal, 100);
    assert.equal(page.data.hatchRemaining, 5);
    assert.equal(n.calls.find((x) => x.type === "scroll").scrollTop, 200);
    page.onHide();
    assert.equal(n.timerCount(), 0);
  } finally {
    n.dispose();
  }
});
test("lobby name prompt preserves room settings and returns to the create dialog", async () => {
  const n = native();
  try {
    const page = n.page('lobby');
    page.onLoad();
    n.pages.push(page);
    n.respond(o => o.url.endsWith('/auth/guest') ? {session:{id:'u',name:'Ana',token:'sample'}} : {name:'Ana'});
    page.showModal({currentTarget:{dataset:{modal:'create'}}});
    page.select({currentTarget:{dataset:{field:'capacity',value:3}}});
    page.enter({currentTarget:{dataset:{op:'create'}}});
    assert.equal(page.data.modal,'name');
    page.nameInput({detail:{value:'Ana'}});
    page.save();
    await flush();
    assert.equal(page.data.modal,'create');
    assert.equal(page.data.capacity,3);
    assert.equal(page.data.signedIn,true);
    assert.equal(n.calls.some(call=>call.data?.op==='create'),false);
    page.onHide();
    assert.equal(n.timerCount(),0);
  } finally {n.dispose();}
});
test('signed-in lobby loads the farm and uses server quotas and reward tiers', async () => {
  const n = native();
  try {
    n.app.globalData.session = {id:'u', name:'Ana'};
    const page = n.page('lobby');
    n.respond(() => ({christmas:{config:{id:'preview',growthGoal:100,gameDailyCap:85,friendRewards:[7,14,21],winBonus:5,pointsPerFeed:10,now:Date.now()},wallet:{points:20,feed:2,fed:3},pet:{status:'hatched'},gameDaily:{remaining:63},recent:[]}}));
    page.onLoad(); page.onShow(); await flush();
    assert.match(page.data.quota,/63\/85/);
    assert.equal(page.data.rewardTiers.length,3);
    assert.equal(page.data.farm.wallet.feed,2);
    page.farm();
    assert.ok(n.calls.some(call=>call.type==='scroll'));
    page.onHide(); assert.equal(n.timerCount(),0);
  } finally {n.dispose();}
});
test("all languages provide every visible page label and dynamic template", () => {
  const n = native();
  try {
    const labels = n.load("utils/labels");
    for (const lang of ["pt", "en", "zh"]) {
      const data = labels.labels(lang);
      for (const key of [
        "play",
        "inviteCard",
        "cardPreparing",
        "nickname",
        "matchEntry",
        "lobby",
        "weeklyJoinTitle",
        "weeklyJoinHint",
        "weeklyGuestHint",
        "weeklySignIn",
        "compactRulesHint",
      ]) {
        assert.ok(data.t[key]);
        assert.notEqual(data.t[key], key);
      }
      for (const key of [
        "feedAction",
        "exchange",
        "claimEgg",
        "taskGo",
        "taskView",
        "taskQuota",
      ]) {
        assert.ok(data.c[key]);
        assert.notEqual(data.c[key], key);
      }
      assert.equal(
        labels.t(lang, "cardTitle", { code: "123456" }).includes("123456"),
        true,
      );
    }
  } finally {
    n.dispose();
  }
});

test("a newly drawn number can lead a same-number batch without selecting an illegal lead", () => {
  const n = native();
  try {
    const cards = n.load("utils/cards");
    const hand = [
      { id: 1, color: "red", value: "1" },
      { id: 2, color: "yellow", value: "1" },
    ];
    assert.throws(() => cards.choose(hand, [2], [], 1, 2), /invalidCard/);
    const lead = cards.choose(hand, [2], [], 2, 2);
    assert.deepEqual(Array.from(cards.choose(hand, [2], lead, 1, 2)), [2, 1]);
  } finally {
    n.dispose();
  }
});
