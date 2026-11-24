const ui = require("../../utils/page"),
  client = require("../../utils/client"),
  p = require("../../utils/platform"),
  sharing = require("../../utils/sharing");
Page({
  data: {
    busy: false,
    error: "",
    preview: null,
    name: "",
    token: "",
    savedRoom: "",
  },
  onLoad: function (q) {
    ui.setup(this);
    this.setData({
      name:
        (getApp().globalData.session || {}).name ||
        p.api().getStorageSync("ono.name") ||
        "",
    });
    this.acceptLaunch(q.token || getApp().globalData.pendingInvite);
  },
  onShow: function () {
    ui.setup(this);
    this.setData({ savedRoom: p.api().getStorageSync("ono.room") || "" });
    if (this.data.preview) this.refresh();
  },
  acceptLaunch: function (token) {
    if (!token) {
      ui.fail(this, Error("inviteInvalid"));
      return;
    }
    getApp().globalData.pendingInvite = null;
    if (this.data.token === token && this.data.preview) return;
    this.setData({ token: token, preview: null, error: "" });
    this.refresh();
  },
  refresh: function () {
    var self = this,
      token = this.data.token;
    if (!/^[a-f0-9]{48}$/.test(token || "")) {
      this.setData({
        error: require("../../utils/labels").t(
          getApp().globalData.lang,
          "inviteInvalid",
        ),
      });
      return;
    }
    return client
      .request("/v1/invitations/" + token)
      .then(function (r) {
        if (self.data.token === token)
          self.setData({
            preview: r.invitation,
            error: r.invitation.full
              ? require("../../utils/labels").t(
                  getApp().globalData.lang,
                  "roomFull",
                )
              : r.invitation.status !== "waiting"
                ? require("../../utils/labels").t(
                    getApp().globalData.lang,
                    "alreadyStarted",
                  )
                : "",
          });
      })
      .catch(function (e) {
        if (self.data.token === token) {
          self.setData({ preview: null });
          ui.fail(self, e);
        }
      });
  },
  nameInput: function (e) {
    this.setData({ name: e.detail.value });
  },
  join: function () {
    var self = this;
    ui.busy(this, function () {
      return getApp()
        .ensureSession(self.data.name)
        .then(function () {
          return client.request(
            "/v1/invitations/" + self.data.token + "/join",
            "POST",
            {},
          );
        })
        .then(function (r) {
          getApp().openRoom(r.room);
        });
    });
  },
  resume: function () {
    var id = p.api().getStorageSync("ono.room");
    if (id) p.api().redirectTo({ url: "/pages/room/index?id=" + id });
  },
  home: function () {
    getApp().home();
  },
});
