/* Phiz host boundary: the functions below are injected, not claimed Phiz SDK APIs. */
function object(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      throw Error("invalidShare");
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("invalidShare");
  return value;
}
function normalize(input) {
  var raw = object(input),
    params = raw.params ? object(raw.params) : raw,
    meta = params.appInfo ? object(params.appInfo) : {};
  var start = raw.appStartParams ? object(raw.appStartParams) : {};
  return {
    appId: raw.appId || meta.appId,
    title: params.title || meta.title || raw.appTitle,
    description: params.desc || meta.desc || raw.appDescription || "",
    imageUrl: params.imageUrl || meta.imageUrl || raw.appThumbnail,
    path: params.path || start.path,
    meta: meta,
  };
}
function createPhizCardAdapter(options) {
  if (
    !options.appId ||
    typeof options.chat?.chooseConversation !== "function" ||
    typeof options.chat?.sendMessage !== "function" ||
    typeof options.finclip?.open !== "function"
  )
    throw Error("hostAdapterNotConfigured");
  var now = options.now || Date.now;
  function validate(input) {
    var c = normalize(input);
    if (c.appId !== options.appId) throw Error("appNotAllowed");
    if (
      typeof c.path !== "string" ||
      !/^pages\/invite\/index\?token=[a-f0-9]{48}$/.test(c.path)
    )
      throw Error("invalidSharePath");
    var image;
    try {
      image = new URL(c.imageUrl);
    } catch {
      throw Error("invalidShareImage");
    }
    if (
      image.username ||
      image.password ||
      image.hash ||
      image.search ||
      !image.pathname.endsWith("/" + c.path.split("token=")[1] + ".png")
    )
      throw Error("invalidShareImage");
    var origin = new URL(options.assetBase).origin;
    if (image.origin !== origin) throw Error("invalidShareImage");
    if (
      image.protocol !== "https:" &&
      !(
        options.allowLocalHttp === true &&
        image.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(image.hostname)
      )
    )
      throw Error("httpsRequired");
    if (
      c.meta.expires &&
      (!Number.isFinite(c.meta.expires) || c.meta.expires <= now())
    )
      throw Error("inviteExpired");
    return c;
  }
  return {
    share: async function (envelope) {
      var c = validate(envelope);
      var destination = await options.chat.chooseConversation({
        allow: ["friend", "group"],
      });
      if (!destination) return { status: "cancelled" };
      if (
        !["friend", "group"].includes(destination.kind) ||
        typeof destination.id !== "string" ||
        !destination.id
      )
        throw Error("invalidConversation");
      var card = {
        type: "mini_program",
        version: 1,
        appId: options.appId,
        title: String(c.title || "ONO!").slice(0, 120),
        description: String(c.description).slice(0, 240),
        imageUrl: c.imageUrl,
        launch: { path: c.path },
        metadata: {
          schema: "ono.invitation.v1",
          target: "phiz",
          expires: c.meta.expires || null,
        },
      };
      var receipt = await options.chat.sendMessage(destination, card);
      if (
        !receipt ||
        typeof receipt.messageId !== "string" ||
        !receipt.messageId
      )
        throw Error("deliveryUnconfirmed");
      return { status: "sent", messageId: receipt.messageId };
    },
    open: async function (card) {
      card = object(card);
      if (
        card.type !== "mini_program" ||
        card.version !== 1 ||
        card.appId !== options.appId ||
        !/^pages\/invite\/index\?token=[a-f0-9]{48}$/.test(
          card.launch?.path || "",
        )
      )
        throw Error("invalidCard");
      return options.finclip.open({
        appId: options.appId,
        path: card.launch.path,
      });
    },
    normalize: normalize,
  };
}
module.exports = {
  createPhizCardAdapter: createPhizCardAdapter,
  normalize: normalize,
};
