const platform = require("./platform"),
  words = require("./labels");
function setup(page) {
  var app = getApp();
  page.setData(words.labels(app.globalData.lang));
  platform.api().setNavigationBarTitle({ title: "ONO!" });
}
function changeLang(page, event) {
  var languages = ["pt", "en", "zh"],
    lang = languages[Number(event.detail.value)];
  getApp().setLang(lang);
  page.setData(words.labels(lang));
  if (page.refresh) page.refresh();
}
function fail(page, e) {
  if (e.message === "sessionExpired") {
    getApp().clearSession();
    var pages = getCurrentPages(),
      current = pages[pages.length - 1];
    if (
      current &&
      [
        "pages/game/index",
        "pages/room/index",
        "pages/farm/index",
        "pages/tasks/index",
        "pages/claim/index",
      ].indexOf(current.route) >= 0
    ) {
      require("./poller").stop(page);
      getApp().home();
    }
  }
  var key = e.message || "serviceUnavailable",
    message = words.t(getApp().globalData.lang, key);
  if (message === key)
    message = words.t(getApp().globalData.lang, "serviceUnavailable");
  platform.toast(message);
  page.setData({ error: message });
}
function confirm(key) {
  return platform
    .call("showModal", {
      title: "ONO!",
      content: words.t(getApp().globalData.lang, key),
      cancelText: words.t(getApp().globalData.lang, "cancel"),
      confirmText: words.t(getApp().globalData.lang, "confirm"),
    })
    .then(function (r) {
      return r.confirm;
    });
}
function busy(page, fn) {
  if (page._busy) return Promise.resolve();
  page._busy = true;
  page.setData({ busy: true, error: "" });
  return Promise.resolve()
    .then(fn)
    .catch(function (e) {
      fail(page, e);
    })
    .finally(function () {
      page._busy = false;
      page.setData({ busy: false });
    });
}
module.exports = {
  setup: setup,
  changeLang: changeLang,
  fail: fail,
  confirm: confirm,
  busy: busy,
};
