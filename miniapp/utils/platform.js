function api() {
  if (typeof ft !== "undefined") return ft;
  if (typeof wx !== "undefined") return wx;
  throw Error("FinClip runtime required");
}
function call(name, options) {
  return new Promise(function (resolve, reject) {
    var p = api();
    if (typeof p[name] !== "function") {
      reject(Error("unsupportedApi"));
      return;
    }
    p[name](Object.assign({}, options, { success: resolve, fail: reject }));
  });
}
function toast(title) {
  api().showToast({
    title: String(title).slice(0, 70),
    icon: "none",
    duration: 2600,
  });
}
module.exports = { api: api, call: call, toast: toast };
