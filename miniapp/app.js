const platform = require("./utils/platform");
const client = require("./utils/client");
const cfg = require("./config");
const sharing = require("./utils/sharing");
App({
  globalData: {
    lang: "pt",
    session: null,
    room: null,
    pendingInvite: null,
    phizProfile: null,
  },
  onLaunch: function (options) {
    var lang = platform.storage.get("ono.lang");
    this.globalData.lang = ["pt", "en", "zh"].indexOf(lang) >= 0 ? lang : "pt";
    var s = platform.storage.get("ono.session");
    if (s && s.token && s.expires > Date.now()) {
      this.globalData.session = s;
      client.setToken(s.token);
    } else if (s) {
      platform.storage.remove("ono.session");
    }
    this.captureLaunch(options);
    // The server session is authoritative. Refresh its nickname on launch;
    // Phiz profile data is only used to create a first-time server account.
    this.ensureSession()
      .then(() => this.refreshProfile())
      .catch(function () {});
  },
  onShow: function (options) {
    this.captureLaunch(options);
    if (this.globalData.pendingInvite) {
      var pages = getCurrentPages();
      var current = pages[pages.length - 1];
      if (current && current.route !== "pages/invite/index") {
        var token = this.globalData.pendingInvite;
        this.globalData.pendingInvite = null;
        platform.navigateTo({
          url: "/pages/invite/index?token=" + token,
          fail: function () {
            getApp().globalData.pendingInvite = token;
          },
        }).catch(function () {});
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
    platform.storage.set("ono.lang", lang);
  },
  ensureSession: function (name) {
    var self = this;
    if (this._authPromise) return this._authPromise;
    if (this.globalData.session)
      return Promise.resolve(this.globalData.session);
    var storedName = String(
      platform.storage.get("ono.name") || "",
    ).trim();
    this._authPromise =
      cfg.authMode === "finclip"
        ? function () {
            console.info(
              "[ONO auth mode]",
              cfg.authMode,
              cfg.apiBase,
              cfg.appId,
            );
            return platform.login();
          }()
            .then(function (loginResult) {
              // getPhizUserInfo is only meaningful after native login has
              // established the host session. A profile failure must not
              // block sign-in; the server generates a stable fallback name.
              return platform
                .userInfo()
                .catch(function () {
                  return null;
                })
                .then(function (profile) {
                  self.globalData.phizProfile = profile;
                  var initialName =
                    profile &&
                    profile.username &&
                    Array.from(profile.username).length >= 2
                      ? profile.username
                      : self.defaultName();
                  return client.request("/v1/auth/finclip", "POST", {
                    code: loginResult.code,
                    name: initialName,
                  });
                });
            })
        : client.request("/v1/auth/guest", "POST", {
            name: name || storedName || self.defaultName(),
          });
    this._authPromise = this._authPromise
      .then(function (r) {
        self.globalData.session = r.session;
        client.setToken(r.session.token);
        platform.storage.set("ono.session", r.session);
        platform.storage.set("ono.name", r.session.name);
        return r.session;
      })
      .finally(function () {
        self._authPromise = null;
      });
    return this._authPromise;
  },
  phizProfile: function () {
    var self = this;
    if (this.globalData.phizProfile) {
      return Promise.resolve(this.globalData.phizProfile);
    }
    if (this._phizProfilePromise) return this._phizProfilePromise;
    // getPhizUserInfo is only valid after native login has established the host
    // session. Reuse ensureSession so a page opened during cold launch does
    // not call it too early and then cache a failure.
    this._phizProfilePromise = (this.globalData.session
      ? platform.userInfo()
      : this.ensureSession().then(function () {
          return self.globalData.phizProfile;
        })
    )
      .catch(function (error) {
        console.warn(
          "[ONO phizProfile] unavailable",
          (error && error.message) || "unknown",
        );
        return null;
      })
      .then(function (profile) {
        if (profile && profile.userId) self.globalData.phizProfile = profile;
        return profile;
      })
      .finally(function () {
        self._phizProfilePromise = null;
      });
    return this._phizProfilePromise;
  },
  refreshProfile: function (canRetry) {
    var self = this;
    if (!this.globalData.session) return Promise.resolve(null);
    return client.game({ op: "profile" }).then(function (profile) {
      var session = self.globalData.session;
      if (profile && profile.name && session && session.name !== profile.name) {
        session.name = profile.name;
        platform.storage.set("ono.session", session);
        platform.storage.set("ono.name", profile.name);
      }
      var pages = getCurrentPages(),
        current = pages[pages.length - 1];
      if (current && current.onServerProfile) current.onServerProfile(profile);
      return profile;
    }).catch(function (error) {
      if (error.message !== "sessionExpired" || canRetry === false) throw error;
      self.clearSession();
      return self.ensureSession().then(function () {
        return self.refreshProfile(false);
      });
    });
  },
  rename: function (name) {
    var self = this,
      displayName = String(name || "").trim();
    return this.ensureSession()
      .then(function () {
        return client.game({ op: "rename", name: displayName });
      })
      .then(function (result) {
        var session = self.globalData.session;
        if (!session || typeof result.name !== "string") return result;
        session.name = result.name;
        client.setToken(session.token);
        platform.storage.set("ono.session", session);
        platform.storage.set("ono.name", result.name);
        return result;
      });
  },
  defaultName: function () {
    var lang = this.globalData.lang,
      prefix = lang === "en" ? "Player-" : lang === "zh" ? "玩家-" : "Jogador-";
    return (
      prefix +
      (
        Date.now().toString(36).slice(-3) +
        Math.random().toString(36).slice(2, 5)
      )
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 6)
        .toUpperCase()
    );
  },
  clearSession: function () {
    this.globalData.session = null;
    client.setToken("");
    platform.storage.remove("ono.session");
    platform.storage.remove("ono.name");
  },
  rememberRoom: function (room) {
    this.globalData.room = room || null;
    if (room) platform.storage.set("ono.room", room.id);
    else platform.storage.remove("ono.room");
  },
  openRoom: function (room) {
    this.rememberRoom(room);
    var page = room.status === "waiting" ? "room" : "game";
    platform.redirectTo({
      url: "/pages/" + page + "/index?id=" + encodeURIComponent(room.id),
    });
  },
  home: function () {
    platform.reLaunch({ url: "/pages/lobby/index" });
  },
});
