const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  features = require("../../utils/features"),
  words = require("../../utils/labels");
Page({
  data: { rules: [], error: "" },
  onLoad: function () {
    ui.setup(this);
    var self = this;
    client
      .request("/v1/campaign")
      .then(function (f) {
        var c = f.config,
          lang = getApp().globalData.lang;
        self.setData({
          rules: (features.leaderboard && features.prize ? [1, 2, 3, 4, 5] : [1, 2, 3, 5]).map(function (n) {
            return words.t(lang, "rules" + n, {
              bonus: c.winBonus,
              cap: c.gameDailyCap,
              rate: c.pointsPerFeed,
              goal: c.growthGoal,
            });
          }),
          tiers: c.friendRewards.map(function (points, i) {
            return words.t(lang, "roomRewardTier", {
              count: i + 2,
              points: points,
            });
          }),
        });
      })
      .catch(function (e) {
        ui.fail(self, e);
      });
  },
  back: function () {
    var pages = getCurrentPages();
    if (pages.length > 1) p.navigateBack();
    else getApp().home();
  },
});
