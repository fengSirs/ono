import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { native, flush } from "./native-harness.mjs";
const require = createRequire(import.meta.url);
const cfg = require("../miniapp/config.js");
const token = "a".repeat(48);
const apiBase = cfg.apiBase.replace(/\/$/, "");
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
  const n = native({autoLogin:false});
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
test("native Phiz login unwraps pz.login result.code before sending it to the API", async () => {
  const n = native({ provider: "pz", autoLogin: false });
  try {
    n.respond((o) => {
      assert.equal(o.url, apiBase + "/v1/auth/finclip");
      assert.equal(o.data.code, "pz-test-code");
      assert.equal(o.data.name, "Phiz Tester");
      return {
        session: {
          id: "u",
          name: "Ana",
          token: "sample",
          expires: Date.now() + 60000,
        },
      };
    });
    const session = await n.app.ensureSession("Ana");
    assert.equal(session.id, "u");
    assert.equal(session.name, "Ana");
    assert.equal(n.calls.filter((call) => call.type === "login").length, 1);
    assert.equal(typeof n.pz.request, "undefined");
  } finally {
    n.dispose();
  }
});
test("native login falls back to ft.login when pz.login is unavailable", async () => {
  const n = native({autoLogin:false});
  try {
    const result = await n.load("utils/platform").login();
    assert.equal(result.code, "test-code");
    assert.deepEqual(
      n.calls.filter((call) => call.type === "login").map((call) => call.provider),
      ["ft"],
    );
  } finally {
    n.dispose();
  }
});
test("lobby exposes a login failure and retry recovers", async () => {
  const n = native({provider: "pz", autoLogin:false});
  try {
    const page = n.page("lobby");
    n.app.globalData.lang = "en";
    n.pages.push(page);
    n.respond(function () { return { error: "loginFailed" }; });
    page.onLoad();
    page.onShow();
    await flush();
    assert.equal(page.data.authenticating, false);
    assert.equal(page.data.authError, "Phiz sign-in failed.");
    n.respond(function () {
      return { session: { id: "u", name: "Ana", token: "sample", expires: Date.now() + 60000 } };
    });
    page.retryAuth();
    await flush();
    assert.equal(page.data.signedIn, true);
    assert.equal(page.data.authError, "");
    assert.equal(page.data.name, "Ana");
  } finally {
    n.dispose();
  }
});
test("nickname save updates the server identity before local storage", async () => {
  const n = native({autoLogin:false});
  try {
    n.app.globalData.session = {
      id: "u",
      name: "Ana",
      token: "sample",
      expires: Date.now() + 60000,
    };
    const page = n.page("lobby");
    page.onLoad();
    n.respond((o) => {
      assert.equal(o.url, apiBase + "/v1/game");
      assert.equal(o.data.op, "rename");
      assert.equal(o.data.name, "Beatriz");
      return { name: "Beatriz" };
    });
    page.showModal({ currentTarget: { dataset: { modal: "name" } } });
    page.nameInput({ detail: { value: "Beatriz" } });
    page.save();
    await flush();
    assert.equal(page.data.name, "Beatriz");
    assert.equal(n.app.globalData.session.name, "Beatriz");
    assert.equal(n.storage["ono.name"], "Beatriz");
    assert.equal(page.data.error, "");
    assert.equal(page.data.busy, false);
  } finally {
    n.dispose();
  }
});
test("launch refreshes the server nickname before using local cache", async () => {
  const n = native({ autoLogin: false });
  try {
    n.app.globalData.session = {
      id: "u",
      name: "Cached Name",
      token: "sample",
      expires: Date.now() + 60000,
    };
    n.load("utils/client").setToken("sample");
    n.storage["ono.name"] = "Cached Name";
    n.respond((o) => {
      assert.equal(o.url, apiBase + "/v1/game");
      assert.equal(o.data.op, "profile");
      return { id: "u", name: "Server Name" };
    });
    await n.app.refreshProfile();
    assert.equal(n.app.globalData.session.name, "Server Name");
    assert.equal(n.storage["ono.name"], "Server Name");
  } finally {
    n.dispose();
  }
});
test("app launch silently logs in with the Phiz username", async () => {
  const n = native({
    provider: "pz",
    autoLogin: true,
    phizUser: { userId: "phiz-user-1", username: "Phiz Ana" },
  });
  try {
    n.respond((o) => {
      if (o.url.endsWith("/v1/auth/finclip")) {
        assert.equal(o.data.name, "Phiz Ana");
        return {
          session: {
            id: "stable-account",
            name: "Phiz Ana",
            token: "sample",
            expires: Date.now() + 60000,
          },
        };
      }
      assert.equal(o.data.op, "profile");
      return { id: "stable-account", name: "Server Phiz Ana" };
    });
    await flush();
    assert.equal(n.app.globalData.session.id, "stable-account");
    assert.equal(n.app.globalData.session.name, "Server Phiz Ana");
    assert.equal(n.storage["ono.name"], "Server Phiz Ana");
    assert.equal(n.calls.filter((call) => call.type === "login").length, 1);
    assert.equal(n.calls.filter((call) => call.type === "profile").length, 1);
  } finally {
    n.dispose();
  }
});
test("invalid native response bodies reject safely without crashing the renderer", async () => {
  const n = native({provider: "pz", autoLogin:false});
  try {
    const client = n.load("utils/client");
    n.respond(() => null);
    await assert.rejects(
      client.request("/v1/game", "POST", { op: "rename" }),
      Error("serviceUnavailable"),
    );
    n.respond(() => []);
    await assert.rejects(
      client.request("/v1/game", "POST", { op: "rename" }),
      Error("serviceUnavailable"),
    );
    n.respond(() => "gateway timeout");
    await assert.rejects(
      client.request("/v1/game", "POST", { op: "rename" }),
      Error("serviceUnavailable"),
    );
  } finally {
    n.dispose();
  }
});
test("task form prefills the current Phiz ID without overriding server or manual values", async () => {
  const n = native({
    provider: "pz",
    autoLogin: false,
    phizUser: {
      userId: "auto-phiz-id-0123456789012345678901234567890123456789",
      username: "Phiz Ana",
    },
  });
  try {
    n.app.globalData.session = {
      id: "stable-account",
      name: "Phiz Ana",
      token: "sample",
      expires: Date.now() + 60000,
    };
    n.load("utils/client").setToken("sample");
    const page = n.page("tasks");
    n.pages.push(page);
    page._visible = true;
    n.respond(() => ({
      config: { taskDailyFeedCap: 20 },
      feedTasks: {
        tasks: [],
        history: [],
        profile: null,
        limit: 2,
        quota: { remaining: 2 },
      },
    }));
    page.onShow();
    await flush();
    assert.equal(
      page.data.phizId,
      "auto-phiz-id-0123456789012345678901234567890123456789",
    );
    assert.equal(page.data.profileLocked, false);

    page.data.profileLocked = true;
    page.data.phizId = "server-phiz-id";
    await page.autoFillPhizId();
    assert.equal(page.data.phizId, "server-phiz-id");

    page.data.profileLocked = false;
    page.data.phizId = "manually-typed-id";
    await page.autoFillPhizId();
    assert.equal(page.data.phizId, "manually-typed-id");
    assert.equal(n.calls.filter((call) => call.type === "profile").length, 1);
  } finally {
    n.dispose();
  }
});
test("task form waits for Phiz login before reading the real UserID", async () => {
  const n = native({
    provider: "pz",
    autoLogin: true,
    phizUser: { userId: "real-phiz-user-id" },
  });
  try {
    n.respond((o) => {
      if (o.url.endsWith("/v1/auth/finclip")) {
        return {
          session: {
            id: "stable-account",
            name: "Ana",
            token: "sample",
            expires: Date.now() + 60000,
          },
        };
      }
      if (o.data && o.data.op === "profile")
        return { id: "stable-account", name: "Ana" };
      return {
        config: { taskDailyFeedCap: 20 },
        feedTasks: {
          tasks: [],
          history: [],
          profile: null,
          limit: 2,
          quota: { remaining: 2 },
        },
      };
    });
    const page = n.page("tasks");
    n.pages.push(page);
    page._visible = true;
    page.onShow();
    await flush();
    await flush();
    assert.equal(n.app.globalData.session.id, "stable-account");
    assert.equal(page.data.phizId, "real-phiz-user-id");
    assert.equal(n.calls.filter((call) => call.type === "login").length, 1);
    assert.equal(n.calls.filter((call) => call.type === "profile").length, 1);
  } finally {
    n.dispose();
  }
});
test("share is prepared before a synchronous native onShareAppMessage and expires safely", async () => {
  const n = native({autoLogin:false});
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
  const n = native({autoLogin:false});
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
  const n = native({autoLogin:false});
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
  const n = native({autoLogin:false});
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
test("auto sign-in preserves room settings and does not prompt for a nickname", async () => {
  const n = native({provider: "pz", autoLogin:false});
  try {
    const page = n.page('lobby');
    page.onLoad();
    n.pages.push(page);
    n.respond(o => (o.url.endsWith('/auth/guest') || o.url.endsWith('/auth/finclip')) ? {session:{id:'u',name:'Ana',token:'sample'}} : {name:'Ana'});
    page.showModal({currentTarget:{dataset:{modal:'create'}}});
    page.select({currentTarget:{dataset:{field:'capacity',value:3}}});
    page.enter({currentTarget:{dataset:{op:'create'}}});
    await flush();
    assert.equal(page.data.authenticating,false);
    assert.equal(page.data.modal,'create');
    assert.equal(page.data.capacity,3);
    assert.equal(page.data.signedIn,true);
    assert.equal(n.calls.some(call=>call.data?.op==='create'),false);
    page.onHide();
    assert.equal(n.timerCount(),0);
  } finally {n.dispose();}
});
test('signed-in lobby loads the farm and uses server quotas and reward tiers', async () => {
  const n = native({autoLogin:false});
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
  const n = native({autoLogin:false});
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
  const n = native({autoLogin:false});
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
