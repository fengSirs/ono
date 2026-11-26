const platform = require("./platform");
const cfg = require("../config");
let token = "";
function setToken(v) {
  token = v || "";
}
function requestLabel(method, path, data) {
  var label = "[ONO request] " + method + " " + cfg.apiBase + path;
  if (data && data.op) label += " op=" + data.op;
  return label;
}
function nativeFailure(path, error) {
  var detail = String(
    (error && (error.errMsg || error.message)) ||
      (error && String(error)) ||
      "request failed",
  );
  console.warn("[ONO request failed]", cfg.apiBase + path, detail);
  if (/domain|whitelist|白名单|合法域名/i.test(detail))
    throw Error("domainNotAllowed");
  if (/cleartext|明文/i.test(detail)) throw Error("insecureRequest");
  throw Error("networkError");
}
function request(path, method, data) {
  var httpMethod = method || "GET";
  var startedAt = Date.now();
  console.info(requestLabel(httpMethod, path, data));
  return platform
    .request({
      url: cfg.apiBase.replace(/\/$/, "") + path,
      method: httpMethod,
      data: data,
      timeout: cfg.requestTimeout,
      header: Object.assign(
        { "Content-Type": "application/json" },
        token ? { Authorization: "Bearer " + token } : {},
      ),
    })
    .then(
      function (r) {
        console.info(
          "[ONO response] " +
            httpMethod +
            " " +
            path +
            " " +
            r.statusCode +
            " " +
            (Date.now() - startedAt) +
            "ms",
        );
        var body = r.data;
        if (typeof body === "string") {
          try {
            body = JSON.parse(body);
          } catch (e) {
            throw Error("serviceUnavailable");
          }
        }
        if (
          r.statusCode < 200 ||
          r.statusCode >= 300 ||
          !body ||
          typeof body !== "object" ||
          Array.isArray(body) ||
          body.error
        ) {
          var message =
            body && typeof body === "object" && !Array.isArray(body)
              ? body.error
              : "";
          var e = Error(message || "serviceUnavailable");
          console.warn(
            "[ONO response error] " + httpMethod + " " + path + " " + r.statusCode,
            message || body,
          );
          e.status = r.statusCode;
          throw e;
        }
        return body;
      },
      function (error) {
        return nativeFailure(path, error);
      },
    );
}
function game(body) {
  return request("/v1/game", "POST", body).then(function (r) {
    return body.op.indexOf("christmas") === 0 && r.christmas ? r.christmas : r;
  });
}
function requestId() {
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
