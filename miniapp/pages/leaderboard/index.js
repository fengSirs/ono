const ui = require("../../utils/page"), client = require("../../utils/client"), p = require("../../utils/platform"), poll = require("../../utils/poller"), words = require("../../utils/labels"), weekly = require("../../utils/weekly"), features = require("../../utils/features");
Page({
  data: { board: null, farm: null, join: null, signedIn: false, error: "", countdown: "", countdownLabel: "", fill: 0, showResult: false, loading: true, showRules: false },
  onLoad: function (query) {
    this.week=query && query.week || undefined;
    ui.setup(this);
    if (!features.leaderboard) {
      p.toast(words.t(getApp().globalData.lang, "featureComingSoon"));
      getApp().home();
    }
  },
  onShow: function () {
    if (!features.leaderboard) return;
    var self = this;
    ui.setup(this);
    poll.start(this, function () { return self.refresh(); }, 10000);
    this.clock = setInterval(function () { self.tick(); }, 1000);
  },
  onHide: function () { poll.stop(this); clearInterval(this.clock); },
  onUnload: function () { poll.stop(this); clearInterval(this.clock); },
  onPollError: function (e) { this.setData({ loading: false }); ui.fail(this, e); },
  refresh: function () {
    if (!features.leaderboard) return Promise.resolve();
    var self = this, generation = this._generation, request = this._request = (this._request || 0) + 1;
    var signedIn = !!(getApp().globalData.session);
    var snapshot = signedIn ? client.game({ op: "christmas" }).catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([client.game({ op: "christmasLeaderboard", week: this.week }), snapshot]).then(function (results) {
      if (!self._visible || generation !== self._generation || request !== self._request) return;
      var board = results[0].leaderboard, farm = results[1], lang = getApp().globalData.lang;
      self._serverNow = board.now; self._snapshotAt = Date.now();
      self.setData({ board: board, farm: farm, signedIn: signedIn, loading: false, error: "", weeklyView: weekly.view(board, lang, false),
        fill: Math.min(100, Math.round(board.completed / board.limit * 100)),
        showResult: !!(board.own || board.hasClaim),
        join: self.joinState(board, farm, signedIn),
        entries: board.entries.map(function (entry) { var d = weekly.localParts(entry.completedAt); return Object.assign({}, entry, { date: d.date.slice(0,5), time: d.time }); }) });
      self.tick();
    });
  },
  joinState: function (board, farm, signedIn) {
    var lang = getApp().globalData.lang;
    function t(key, values) { return words.t(lang, key, values); }
    if (!signedIn) return { hint: t("weeklyGuestHint"), button: t("weeklySignIn"), action: "signin" };
    var config = (farm && farm.config) || {}, wallet = (farm && farm.wallet) || {}, pet = (farm && farm.pet) || {};
    if ((board && board.hasClaim) || (farm && farm.claim))
      return { hint: t("compactRegistered"), button: t("compactMyClaim"), action: "claim" };
    if (board && board.eligible)
      return config.canClaim
        ? { hint: t("compactQualified"), button: t("claimTurkey"), action: "claim" }
        : { hint: t("compactClaimClosed"), button: t("compactMyClaim"), action: "claim" };
    if (!farm) return { hint: t("weeklyNotFinished"), button: t("growButton"), action: "grow" };
    var goal = Number(config.growthGoal || 100);
    if (pet.status !== "hatched") return { hint: t("weeklyStartHint", { goal: goal }), button: t("claimEgg"), action: "grow" };
    if (Number(wallet.fed || 0) < goal) return { hint: t("weeklyJoinHint", { goal: goal }), button: t("growButton"), action: "grow" };
    return { hint: t("weeklyGrownHint"), button: t("compactFarm"), action: "farm" };
  },
  joinAction: function () {
    if (!features.leaderboard) return;
    var join = this.data.join;
    if (!join) return;
    if (join.action === "claim") return this.claim();
    if (join.action === "signin") return getApp().home();
    p.navigateTo({ url: "/pages/farm/index" + (join.action === "grow" ? "?focus=pet" : "") });
  },
  tick: function () {
    var board = this.data.board;
    if (!board) return;
    var lang = getApp().globalData.lang, now = this._serverNow + Date.now() - this._snapshotAt;
    if (now >= board.endsAt) {
      this.setData({ countdown: words.t(lang, "weeklyClosed"), countdownLabel: "" });
      if (!this.week && !this._rolling) {
        var self = this; this._rolling = true;
        this.refresh().catch(function (e) { self.onPollError(e); }).finally(function () { self._rolling = false; });
      }
      return;
    }
    var seconds = Math.max(0, Math.ceil((board.endsAt - now) / 1000));
    var days = Math.floor(seconds / 86400), hours = Math.floor(seconds % 86400 / 3600), minutes = Math.floor(seconds % 3600 / 60), rest = seconds % 60;
    var clock = String(hours).padStart(2,"0") + ":" + String(minutes).padStart(2,"0") + ":" + String(rest).padStart(2,"0");
    this.setData({ countdownLabel: words.t(lang, "weeklyCountdownLabel"), countdown: days > 0 ? words.t(lang, "weeklyDayUnit", { days: days }) + clock : clock });
  },
  selectWeek: function (key) {
    if (this.data.loading) return;
    this.week = key || undefined; this.setData({ loading: true, error: "" });
    var self = this; return this.refresh().catch(function (e) { self.onPollError(e); });
  },
  previous: function () { if (this.data.board.previousWeek) return this.selectWeek(this.data.board.previousWeek); },
  next: function () { if (this.data.board.nextWeek) return this.selectWeek(this.data.board.nextWeek === this.data.board.currentWeek ? null : this.data.board.nextWeek); },
  current: function () { return this.selectWeek(null); },
  toggleRules: function () { this.setData({ showRules: !this.data.showRules }); },
  claim: function () {
    if (!features.prize) return;
    p.navigateTo({ url: "/pages/claim/index" });
  },
  back: function () { p.navigateBack(); }
});
