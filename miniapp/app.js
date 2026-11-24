const platform = require("./utils/platform");
const client = require("./utils/client");
const cfg = require("./config");
const sharing = require("./utils/sharing");
App({
  globalData: { lang: "pt", session: null, room: null, pendingInvite: null },
  onLaunch: function (options) {
    var p = platform.api();
    var lang = p.getStorageSync("ono.lang");
    this.globalData.lang = ["pt", "en", "zh"].indexOf(lang) >= 0 ? lang : "pt";
    var s = p.getStorageSync("ono.session");
    if (s && s.token && s.expires > Date.now()) {
      this.globalData.session = s;
      client.setToken(s.token);
    }
    this.captureLaunch(options);
  },
  onShow: function (options) {
    this.captureLaunch(options);
    if (this.globalData.pendingInvite) {
      var pages = getCurrentPages();
      var current = pages[pages.length - 1];
      if (current && current.route !== "pages/invite/index") {
        var token = this.globalData.pendingInvite;
        this.globalData.pendingInvite = null;
        platform.api().navigateTo({
          url: "/pages/invite/index?token=" + token,
          fail: function () {
            getApp().globalData.pendingInvite = token;
          },
        });
      } else if (current && current.acceptLaunch)
        current.acceptLaunch(this.globalData.pendingInvite);
    }
  },
  captureLaunch: function (options) {
    var token = sharing.launchToken(options);
    if (token) this.globalData.pendingInvite = token;
  },
  setLang: function (lang) {
    if (["pt", "en", "zh"].indexOf(lang) < 0) return;
    this.globalData.lang = lang;
    platform.api().setStorageSync("ono.lang", lang);
  },
  ensureSession: function (name) {
    var self = this;
    if (this.globalData.session)
      return Promise.resolve(this.globalData.session);
    name = (name || platform.api().getStorageSync("ono.name") || "").trim();
    if (name.length < 2) return Promise.reject(Error("nameRequired"));
    var login =
      cfg.authMode === "finclip"
        ? platform.call("login", {}).then(function (r) {
            return client.request("/v1/auth/finclip", "POST", {
              code: r.code,
              name: name,
            });
          })
        : client.request("/v1/auth/guest", "POST", { name: name });
    return login.then(function (r) {
      self.globalData.session = r.session;
      client.setToken(r.session.token);
      platform.api().setStorageSync("ono.session", r.session);
      platform.api().setStorageSync("ono.name", r.session.name);
      return r.session;
    });
  },
  clearSession: function () {
    this.globalData.session = null;
    client.setToken("");
    platform.api().removeStorageSync("ono.session");
  },
  rememberRoom: function (room) {
    this.globalData.room = room || null;
    if (room) platform.api().setStorageSync("ono.room", room.id);
    else platform.api().removeStorageSync("ono.room");
  },
  openRoom: function (room) {
    this.rememberRoom(room);
    var page = room.status === "waiting" ? "room" : "game";
    platform
      .api()
      .redirectTo({
        url: "/pages/" + page + "/index?id=" + encodeURIComponent(room.id),
      });
  },
  home: function () {
    platform.api().reLaunch({ url: "/pages/lobby/index" });
  },
});
