const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  poll = require("../../utils/poller"),
  sharing = require("../../utils/sharing");
Page({
  data: {
    room: null,
    error: "",
    busy: false,
    shareReady: false,
    shareFailed: false,
  },
  onLoad: function (q) {
    this.id = q.id || p.storage.get("ono.room");
    ui.setup(this);
    p.hideShareMenu().catch(function () {});
  },
  onShow: function () {
    var self = this;
    ui.setup(this);
    poll.start(this, function () {
      return self.refresh();
    });
  },
  onHide: function () {
    poll.stop(this);
    this.setData({ shareReady: false });
  },
  onUnload: function () {
    poll.stop(this);
  },
  onPollError: function (e) {
    ui.fail(this, e);
  },
  refresh: function () {
    var self = this,
      generation = this._generation;
    return getApp()
      .ensureSession()
      .then(function (session) {
        return client
          .game({ op: "state", room: self.id })
          .then(function (r) {
            if (!self._visible || generation !== self._generation) return;
            self.id = r.room.id;
            getApp().rememberRoom(r.room);
            if (r.room.status !== "waiting") {
              getApp().openRoom(r.room);
              return;
            }
            self.setData({
              room: r.room,
              seats: Array.from({length:r.room.capacity}, function(_,index){return r.room.players[index] || {id:'empty-'+index};}),
              isHost: r.room.host === session.id,
              error: "",
            });
            if (
              r.room.kind === "private" &&
              (!self.invite || self.invite.expires < Date.now() + 60000) &&
              !self._preparing
            )
              self.prepare();
            else if (self.invite && r.room.kind === "private")
              self.setData({ shareReady: true });
          });
      });
  },
  prepare: function () {
    var self = this;
    if (this._preparing) return;
    this._preparing = true;
    this.setData({ shareReady: false, shareFailed: false });
    return client
      .request("/v1/invitations", "POST", {
        roomId: this.id,
        lang: getApp().globalData.lang,
      })
      .then(function (r) {
        self.invite = r.invitation;
        if (self._visible)
          self.setData({
            shareReady: !!sharing.descriptor(
              self.invite,
              getApp().globalData.lang,
            ),
          });
      })
      .catch(function (e) {
        self.setData({ shareFailed: true });
        ui.fail(self, e);
      })
      .finally(function () {
        self._preparing = false;
      });
  },
  onShareAppMessage: function () {
    var card = sharing.descriptor(this.invite, getApp().globalData.lang);
    if (!card)
      return {
        title: "ONO!",
        path: "pages/lobby/index",
        imageUrl:
          require("../../config").apiBase + "/assets/invite-default.png",
      };
    return card;
  },
  start: function () {
    var self = this;
    ui.busy(this, function () {
      return client.game({ op: "start", room: self.id }).then(function (r) {
        getApp().openRoom(r.room);
      });
    });
  },
  leave: function () {
    var self = this;
    ui.busy(this, function () {
      return ui.confirm("confirmLeave").then(function (ok) {
        if (!ok) return;
        return client.game({ op: "leave", room: self.id }).then(function () {
          getApp().rememberRoom(null);
          getApp().home();
        });
      });
    });
  },
});
