const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  words = require("../../utils/labels");
Page({
  data: {
    farm: null,
    name: "",
    contact: "",
    consent: false,
    error: "",
    busy: false,
  },
  onLoad: function () {
    ui.setup(this);
  },
  onShow: function () {
    this.refresh();
  },
  refresh: function () {
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
    p.api().navigateTo({ url: "/pages/leaderboard/index" });
  },
  back: function () {
    p.api().navigateBack();
  },
});
