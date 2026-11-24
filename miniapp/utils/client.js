const platform = require("./platform");
const cfg = require("../config");
let token = "";
function setToken(v) {
  token = v || "";
}
function request(path, method, data) {
  return new Promise(function (resolve, reject) {
    platform.api().request({
      url: cfg.apiBase.replace(/\/$/, "") + path,
      method: method || "GET",
      data: data,
      timeout: cfg.requestTimeout,
      header: Object.assign(
        { "Content-Type": "application/json" },
        token ? { Authorization: "Bearer " + token } : {},
      ),
      success: function (r) {
        var body = r.data;
        if (typeof body === "string") {
          try {
            body = JSON.parse(body);
          } catch (e) {
            reject(Error("serviceUnavailable"));
            return;
          }
        }
        if (r.statusCode < 200 || r.statusCode >= 300 || body.error) {
          var e = Error(body.error || "serviceUnavailable");
          e.status = r.statusCode;
          reject(e);
          return;
        }
        resolve(body);
      },
      fail: function () {
        reject(Error("networkError"));
      },
    });
  });
}
function game(body) {
  return request("/v1/game", "POST", body).then(function (r) {
    return body.op.indexOf("christmas") === 0 && r.christmas ? r.christmas : r;
  });
}
function requestId() {
  var p = platform.api();
  if (typeof p.getRandomValues === "function") {
    /* platform-specific randomness is not required for a deduplication ID */
  }
  return (
    "mini-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2) +
    "-" +
    Math.random().toString(36).slice(2)
  );
}
module.exports = {
  request: request,
  game: game,
  setToken: setToken,
  requestId: requestId,
};
