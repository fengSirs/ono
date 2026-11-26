const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  features = require("../../utils/features"),
  words = require("../../utils/labels");
Page({
  data: {
    farm: null,
    features: features,
    name: "",
    contact: "",
    consent: false,
    error: "",
    busy: false,
  },
  onLoad: function () {
    ui.setup(this);
    if (!features.prize) {
      p.toast(words.t(getApp().globalData.lang, "featureComingSoon"));
      getApp().home();
    }
  },
  onShow: function () {
    if (!features.prize) return;
    this.refresh();
  },
  refresh: function () {
    if (!features.prize) return Promise.resolve();
    var self = this;
    return client
      .game({ op: "christmas" })
      .then(function (r) {
        self.setData({
          farm: r,
          weeklyView: require("../../utils/weekly").view(r.weekly, getApp().globalData.lang, !!r.claim),
          statusText: r.claim
            ? words.t(getApp().globalData.lang, r.claim.status)
            : "",
        });
      })
      .catch(function (e) {
        ui.fail(self, e);
      });
  },
  field: function (e) {
    var x = {};
    x[e.currentTarget.dataset.field] = e.detail.value;
    this.setData(x);
  },
  consent: function (e) {
    this.setData({ consent: e.detail.value.length > 0 });
  },
  submit: function () {
    if (!features.prize) return;
    var self = this;
    ui.busy(this, function () {
      return client
        .game({
          op: "christmasClaim",
          name: self.data.name,
          contact: self.data.contact,
          consent: self.data.consent,
        })
        .then(function (r) {
          self.setData({
            farm: r,
          weeklyView: require("../../utils/weekly").view(r.weekly, getApp().globalData.lang, !!r.claim),
            statusText: words.t(getApp().globalData.lang, r.claim.status),
          });
          p.toast(self.data.c.successClaim);
        });
    });
  },
  leaderboard: function () {
    if (!features.leaderboard) return;
    p.navigateTo({ url: "/pages/leaderboard/index" });
  },
  back: function () {
    p.navigateBack();
  },
});
