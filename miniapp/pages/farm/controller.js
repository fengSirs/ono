const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  poll = require("../../utils/poller"),
  words = require("../../utils/labels"),
  audio = require("../../utils/audio");
module.exports = {
  data: {
    farm: null,
    showMore: true,
    error: "",
    busy: false,
    amount: 1,
    hatchRemaining: 5,
    petTalk: "",
    scene: 0,
  },
  onLoad: function (q) {
    ui.setup(this);
    this.focus = q.focus === "pet";
    audio.init();
  },
  onShow: function () {
    var self = this;
    ui.setup(this);
    poll.start(
      this,
      function () {
        if (!self._busy) return self.refresh();
      },
      3000,
    );
    this.clock = setInterval(function () {
      self.tick();
    }, 200);
  },
  onReady: function () {
    this.centerPet();
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
  refresh: function () {
    var self = this,
      generation = this._generation;
    return client.game({ op: "christmas" }).then(function (r) {
      if (self._visible && self._generation === generation) self.apply(r);
    });
  },
  apply: function (f) {
    var self = this;
    this._snapshotAt = Date.now();
    this._serverNow = f.config.now;
    var lang = getApp().globalData.lang;
    var board=f.weekly, key=board && f.config.id+':'+board.week;
    var name=this._firstWeek===key ? this._firstName : '';
    if(board && !board.own && board.remaining>0 && board.completed>0 && !name && this._leaderPending!==key && Date.now()>=(this._leaderRetry||0)) {
      this._leaderPending=key;
      client.game({op:'christmasLeaderboard',week:board.week}).then(function(r){
        var first=r.leaderboard.entries[0], latest=self.data.farm;
        if(first && first.rank===1 && latest && latest.config.id+':'+latest.weekly.week===key){
          self._firstWeek=key;self._firstName=first.name;
          if(self._visible)self.setData({challenge:require('../../utils/weekly').challenge(latest,getApp().globalData.lang,first.name)});
        }
      }).catch(function(){self._leaderRetry=Date.now()+30000;}).finally(function(){if(self._leaderPending===key)self._leaderPending=null;});
    }
    var s = Number(p.api().getStorageSync("ono.scene." + f.config.id) || 0),
      unlocked = Math.min(
        4,
        [0, 0.1, 0.25, 0.5, 1].filter(function (n) {
          return f.wallet.fed >= f.config.growthGoal * n;
        }).length - 1,
      );
    s = Math.min(s, unlocked);
    this.setData(
      {
        farm: f,
        challenge: require('../../utils/weekly').challenge(f,lang,name),
        rewardRule: words.t(lang,'friendsPointsRule',{bonus:f.config.winBonus,cap:f.config.gameDailyCap}),
        rewardTiers: (f.config.friendRewards || []).map(function(points,index){return words.t(lang,'roomRewardTier',{count:index+2,points:points});}),
        weeklyView: require("../../utils/weekly").view(f.weekly, lang, !!f.claim),
        scene: s,
        scenes: [0, 1, 2, 3, 4].map(function (n) {
          return {
            id: n,
            label: words.t(lang, "scene" + n),
            locked: n > unlocked,
          };
        }),
        ratio: words.t(lang, "ratio", { rate: f.config.pointsPerFeed }),
        goal: words.t(lang, "goal", { goal: f.config.growthGoal }),
        quota: words.t(lang, "gameQuota", {
          remaining: f.gameDaily.remaining,
          cap: f.config.gameDailyCap,
        }),
        canExchange: Math.floor(f.wallet.points / f.config.pointsPerFeed),
        ledger: f.recent.map(function (x) {
          var key =
            {
              friend_round: "ledgerRound",
              exchange: "exchangeEntry",
              feed: "feedEntry",
              task_feed: "taskFeedEntry",
            }[x.kind] || x.kind;
          return {
            id: x.id,
            label: words.t(lang, key),
            points: x.points_delta,
            feed: x.feed_delta,
            fed: x.fed_delta,
          };
        }),
        error: "",
      },
      function () {
        self.tick();
        self.centerPet();
      },
    );
  },
  tick: function () {
    var f = this.data.farm;
    if (!f || f.pet.status !== "incubating") return;
    var now = this._serverNow + (Date.now() - this._snapshotAt),
      remaining = Math.max(0, Math.ceil((f.pet.hatchAt - now) / 1000));
    this.setData({
      hatchRemaining: remaining,
      hatchText: words.t(getApp().globalData.lang, "hatchWait", {
        seconds: remaining,
      }),
    });
    if (
      now >= f.pet.hatchAt + 120 &&
      !this._busy &&
      this._visible &&
      !this._hatchError
    )
      this.action("christmasHatch");
  },
  centerPet: function () {
    if (!this.focus || !this.data.farm || !this._visible) return;
    var self = this,
      api = p.api(),
      q = api.createSelectorQuery(),
      height = (
        api.getWindowInfo ? api.getWindowInfo() : api.getSystemInfoSync()
      ).windowHeight;
    q.select("#pet-center").boundingClientRect();
    q.selectViewport().scrollOffset();
    q.exec(function (r) {
      if (r[0] && self.focus && self._visible) {
        self.focus = false;
        api.pageScrollTo({
          scrollTop: Math.max(
            0,
            r[1].scrollTop + r[0].top - (height - r[0].height) / 2,
          ),
          duration: 350,
        });
      }
    });
  },
  amount: function (e) {
    this.setData({ amount: e.detail.value });
  },
  action: function (op) {
    var self = this;
    return ui.busy(this, function () {
      var b = { op: op };
      if (op === "christmasExchange" || op === "christmasFeed") {
        b.amount = Number(self.data.amount);
        b.requestId = client.requestId();
      }
      return client
        .game(b)
        .then(function (r) {
          self._hatchError = false;
          if(op==='christmasFeed' && self.data.farm && self.data.farm.weekly && !self.data.farm.weekly.own && r.weekly && r.weekly.own && r.weekly.eligible) self.setData({celebrate:true});
          self.apply(r);
          audio.play(
            op === "christmasFeed"
              ? "feed"
              : op === "christmasHatch"
                ? "hatch"
                : "success",
          );
          if (op === "christmasFeed")
            self.setData({ petTalk: self.data.c.petFeedTalk });
        })
        .catch(function (e) {
          if (op === "christmasHatch") self._hatchError = true;
          throw e;
        });
    });
  },
  egg: function () {
    this.action("christmasEgg");
  },
  hatch: function () {
    this._hatchError = false;
    this.action("christmasHatch");
  },
  exchange: function () {
    this.action("christmasExchange");
  },
  feed: function () {
    this.action("christmasFeed");
  },
  pet: function () {
    audio.play("pet");
    this.setData({
      petTalk: words.t(
        getApp().globalData.lang,
        "petTalk" + Math.floor(Math.random() * 3),
      ),
      bouncing: !this.data.bouncing,
    });
  },
  scene: function (e) {
    var n = Number(e.currentTarget.dataset.id);
    if (this.data.scenes[n].locked) return;
    this.setData({ scene: n });
    p.api().setStorageSync("ono.scene." + this.data.farm.config.id, n);
    audio.play("tap");
  },
  tasks: function () {
    p.api().navigateTo({ url: "/pages/tasks/index" });
  },
  toggleMore: function () {
    this.setData({ showMore: !this.data.showMore });
  },
  leaderboard: function () {
    p.api().navigateTo({ url: "/pages/leaderboard/index" });
  },
  challengeTap: function (e) {
    var card=this.data.challenge;
    if(!card)return;
    var action=(e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.action) || card.action;
    if(action==='grow'){this.focus=true;this.centerPet();}
    else if(action==='claim')this.claim();
    else {var own=this.data.farm.weekly.own; p.api().navigateTo({url:'/pages/leaderboard/index'+(own && own.week && own.week!==this.data.farm.weekly.week ? '?week='+encodeURIComponent(own.week) : '')});}
  },
  claim: function () {
    p.api().navigateTo({ url: "/pages/claim/index" });
  },
  rules: function () {
    p.api().navigateTo({ url: "/pages/rules/index" });
  },
  back: function () {
    var pages = getCurrentPages();
    if (pages.length > 1) p.api().navigateBack();
    else getApp().home();
  },
};
