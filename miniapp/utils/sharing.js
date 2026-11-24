const words = require("./labels");
function descriptor(invite, lang) {
  if (!invite || !invite.token || invite.expires <= Date.now()) return null;
  return {
    title: words.t(lang, "cardTitle", { code: invite.code }),
    desc: words.t(lang, "cardDesc", { count: invite.capacity }),
    path: invite.path,
    imageUrl: invite.imageUrl,
    appInfo: {
      schema: "ono.invitation.v1",
      target: "phiz",
      appId: invite.appId,
      lang: lang,
      expires: invite.expires,
      imageUrl: invite.imageUrl,
      title: words.t(lang, "cardTitle", { code: invite.code }),
      desc: words.t(lang, "cardDesc", { count: invite.capacity }),
    },
  };
}
function launchToken(options) {
  var q = (options && options.query) || options || {};
  var token = q.token;
  return typeof token === "string" && /^[a-f0-9]{48}$/.test(token)
    ? token
    : null;
}
module.exports = { descriptor: descriptor, launchToken: launchToken };
