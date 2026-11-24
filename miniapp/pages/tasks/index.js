const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  words = require("../../utils/labels"),
  poll = require("../../utils/poller");
var names = {
  phiz_friends: "taskFriends",
  phiz_group: "taskGroup",
  phiz_moment: "taskMoment",
  anjun_tracking: "taskParcel",
};
var status = {
  not_started: "taskNotStarted",
  pending: "taskPending",
  approved: "taskApproved",
  claimed: "taskClaimed",
  rejected: "taskRejected",
};
Page({
  data: {
    tasks: [],
    history: [],
    editing: null,
    proofs: [],
    previews: [],
    details: "",
    phizId: "",
    consent: false,
    busy: false,
    error: "",
  },
  onLoad: function () {
    ui.setup(this);
  },
  onShow: function () {
    var self = this;
    ui.setup(this);
    poll.start(
      this,
      function () {
        if (!self._busy) return self.refresh();
      },
      10000,
    );
  },
  onHide: function () {
    poll.stop(this);
  },
  onUnload: function () {
    poll.stop(this);
    var manager = p.api().getFileSystemManager();
    (this._privateFiles || []).forEach(function (path) {
      manager.unlink({ filePath: path, fail: function () {} });
    });
  },
  onPollError: function (e) {
    ui.fail(this, e);
  },
  refresh: function () {
    var self = this,
      generation = this._generation;
    return client.game({ op: "christmas" }).then(function (f) {
      if (!self._visible || generation !== self._generation) return;
      var lang = getApp().globalData.lang,
        s = f.feedTasks;
      function decorate(t) {
        var n = names[t.id || t.task];
        return Object.assign({}, t, {
          title: words.t(lang, n),
          guide: words.t(lang, n + "Guide"),
          statusText: words.t(lang, status[t.status]),
          rewardText: words.t(lang, "taskReward", { count: t.reward }),
          claimText: words.t(lang, "taskClaim", { count: t.reward }),
          note: t.submission ? t.submission.note : t.note || "",
        });
      }
      self.setData({
        tasks: s.tasks.map(decorate),
        history: s.history.map(decorate),
        phizId: s.profile ? s.profile.phizId : self.data.phizId,
        profileLocked: !!s.profile,
        quota: words.t(lang, "taskQuota", {
          limit: s.limit,
          remaining: s.quota.remaining,
        }),
        maxText: words.t(lang, "taskDailyMax", {
          count: f.config.taskDailyFeedCap,
        }),
      });
    });
  },
  edit: function (e) {
    var t = this.data.tasks.find(function (x) {
      return x.id === e.currentTarget.dataset.id;
    });
    if (!t || !t.canSubmit) return;
    this.setData({
      editing: t,
      proofs: [],
      previews: [],
      details: "",
      consent: false,
      error: "",
    });
    p.api().pageScrollTo({ scrollTop: 0, duration: 200 });
  },
  close: function () {
    this.setData({ editing: null, proofs: [], previews: [] });
  },
  field: function (e) {
    var x = {};
    x[e.currentTarget.dataset.field] = e.detail.value;
    this.setData(x);
  },
  consent: function (e) {
    this.setData({ consent: e.detail.value.length > 0 });
  },
  choose: function () {
    var self = this;
    return ui.busy(this, function () {
      var count = 3 - self.data.proofs.length;
      if (count < 1) return;
      return p
        .call("chooseImage", {
          count: count,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
        })
        .then(function (result) {
          return Promise.all(
            (result.tempFilePaths || []).map(function (path) {
              return require("../../utils/proofs").prepare(path);
            }),
          );
        })
        .then(function (images) {
          self.setData({
            proofs: self.data.proofs.concat(
              images.map(function (x) {
                return x.data;
              }),
            ),
            previews: self.data.previews.concat(
              images.map(function (x) {
                return x.path;
              }),
            ),
          });
        });
    });
  },
  remove: function (e) {
    var i = Number(e.currentTarget.dataset.index);
    this.setData({
      proofs: this.data.proofs.filter(function (_, n) {
        return n !== i;
      }),
      previews: this.data.previews.filter(function (_, n) {
        return n !== i;
      }),
    });
  },
  submit: function () {
    var self = this;
    ui.busy(this, function () {
      return client
        .game({
          op: "christmasTaskSubmit",
          mission: self.data.editing.id,
          phizId: self.data.phizId,
          details: self.data.details,
          proofs: self.data.proofs,
          consent: self.data.consent,
        })
        .then(function () {
          self.close();
          p.toast(self.data.t.taskSuccess);
          return self.refresh();
        });
    });
  },
  claim: function (e) {
    var self = this;
    ui.busy(this, function () {
      return client
        .game({
          op: "christmasTaskClaim",
          submission: e.currentTarget.dataset.id,
        })
        .then(function () {
          return self.refresh();
        });
    });
  },
  evidence: function (e) {
    var self = this;
    ui.busy(this, function () {
      return client
        .game({
          op: "christmasTaskEvidence",
          submission: e.currentTarget.dataset.id,
        })
        .then(function (r) {
          var manager = p.api().getFileSystemManager(),
            api = p.api(),
            root = api.env && api.env.USER_DATA_PATH;
          if (!root) throw Error("unsupportedApi");
          return Promise.all(
            r.evidence.proofs.map(function (data, i) {
              return new Promise(function (resolve, reject) {
                var m = data.match(/^data:image\/(png|jpeg);base64,(.*)$/);
                var file =
                  root + "/ono-proof-" + Date.now() + "-" + i + "." + m[1];
                manager.writeFile({
                  filePath: file,
                  data: m[2],
                  encoding: "base64",
                  success: function () {
                    (self._privateFiles || (self._privateFiles = [])).push(
                      file,
                    );
                    resolve(file);
                  },
                  fail: reject,
                });
              });
            }),
          ).then(function (paths) {
            return p.call("previewImage", { urls: paths, current: paths[0] });
          });
        });
    });
  },
  back: function () {
    p.api().navigateBack();
  },
});
