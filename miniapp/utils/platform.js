function host() {
  if (typeof ft !== "undefined") return ft;
  if (typeof wx !== "undefined") return wx;
  throw Error("FinClip runtime required");
}
function invoke(name, options) {
  return new Promise(function (resolve, reject) {
    var api = host();
    if (typeof api[name] !== "function") {
      reject(Error("unsupportedApi"));
      return;
    }
    var original = options || {},
      bridgeOptions = Object.assign({}, original);
    bridgeOptions.success = function (response) {
      if (typeof original.success === "function") original.success(response);
      resolve(response);
    };
    bridgeOptions.fail = function (error) {
      if (typeof original.fail === "function") original.fail(error);
      reject(error || Error(name + "Failed"));
    };
    api[name](bridgeOptions);
  });
}
function profileApi() {
  if (
    typeof pz !== "undefined" &&
    typeof pz.getPhizUserInfo === "function"
  )
    return pz;
  var api = host();
  if (typeof api.getPhizUserInfo === "function") return api;
  return null;
}
function callOn(client, name, options) {
  return new Promise(function (resolve, reject) {
    if (!client || typeof client[name] !== "function") {
      reject(Error("unsupportedApi"));
      return;
    }
    client[name](Object.assign({}, options, { success: resolve, fail: reject }));
  });
}
function login() {
  var client =
    typeof pz !== "undefined" && typeof pz.login === "function"
      ? pz
      : typeof host().login === "function"
        ? host()
        : null;
  if (!client)
    return Promise.reject(Error("unsupportedApi"));
  return callOn(client, "login", {}).then(function (response) {
    var result =
      response && response.result && typeof response.result === "object"
        ? response.result
        : response;
    if (!result || typeof result.code !== "string" || !result.code)
      throw Error("loginFailed");
    return { code: result.code };
  });
}
function displayName(value) {
  return Array.from(
    String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .trim(),
  )
    .slice(0, 20)
    .join("")
    .trim();
}
function displayId(value) {
  return Array.from(
    String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .trim(),
  )
    .slice(0, 80)
    .join("")
    .trim();
}
function userInfo() {
  var client = profileApi();
  if (!client) {
    console.warn("[ONO getPhizUserInfo] API unavailable");
    return Promise.reject(Error("unsupportedApi"));
  }
  console.info("[ONO getPhizUserInfo] calling");
  return callOn(client, "getPhizUserInfo", {}).then(function (response) {
    var result =
      response && response.result && typeof response.result === "object"
        ? response.result
        : response;
    if (!result || typeof result !== "object") throw Error("userInfoFailed");
    // The Phiz host guarantees only UserID here. Username/avatar are optional
    // display data and must never be used as account identity.
    var userId = displayId(result.userId || result.userID);
    if (String(result.errMsg || "").indexOf(":fail") >= 0)
      throw Error("userInfoFailed");
    if (!userId) {
      console.warn(
        "[ONO getPhizUserInfo] UserID missing",
        Object.keys(result).join(",") || "empty",
      );
      throw Error("phizUserIdUnavailable");
    }
    console.info("[ONO getPhizUserInfo] UserID", userId);
    return {
      userId: userId,
      username: displayName(result.username),
      avatar: String(result.avatar || ""),
    };
  }, function (error) {
    console.warn(
      "[ONO getPhizUserInfo] failed",
      (error && (error.errMsg || error.message)) || "unknown",
    );
    throw error;
  });
}
const storage = {
  get: function (key, fallback) {
    try {
      var value = host().getStorageSync(key);
      return value === null || value === undefined || value === ""
        ? fallback
        : value;
    } catch (e) {
      return fallback;
    }
  },
  set: function (key, value) {
    host().setStorageSync(key, value);
  },
  remove: function (key) {
    host().removeStorageSync(key);
  },
};
function navigateTo(options) {
  return invoke("navigateTo", options).catch(function (error) {
    if (options && typeof options.fail === "function") throw error;
    return null;
  });
}
function redirectTo(options) {
  return invoke("redirectTo", options).catch(function (error) {
    if (options && typeof options.fail === "function") throw error;
    return null;
  });
}
function reLaunch(options) {
  return invoke("reLaunch", options).catch(function (error) {
    if (options && typeof options.fail === "function") throw error;
    return null;
  });
}
function navigateBack(options) {
  return invoke("navigateBack", options || {}).catch(function () {});
}
function pageScrollTo(options) {
  return invoke("pageScrollTo", options).catch(function () {});
}
function showToast(title) {
  // IDE consoles may log successful native bridge calls; this keeps the payload
  // a plain display string so an API trace can never inject an Error object.
  invoke("showToast", {
    title: Array.from(String(title || "")).slice(0, 70).join(""),
    icon: "none",
    duration: 2600,
  }).catch(function () {});
}
function request(options) {
  return invoke("request", options);
}
function setNavigationBarTitle(options) {
  return invoke("setNavigationBarTitle", options).catch(function () {});
}
function hideShareMenu() {
  return invoke("hideShareMenu", {});
}
function vibrateShort() {
  return invoke("vibrateShort", { type: "light" });
}
function showModal(options) {
  return invoke("showModal", options);
}
function showActionSheet(options) {
  return invoke("showActionSheet", options);
}
function chooseImage(options) {
  return invoke("chooseImage", options);
}
function previewImage(options) {
  return invoke("previewImage", options);
}
function compressImage(options) {
  return invoke("compressImage", options);
}
function fileSystemManager() {
  try {
    return host().getFileSystemManager();
  } catch (e) {
    return null;
  }
}
function userDataPath() {
  try {
    var api = host();
    return api.env && api.env.USER_DATA_PATH;
  } catch (e) {
    return "";
  }
}
function windowInfo() {
  var api = host();
  if (typeof api.getWindowInfo === "function") return api.getWindowInfo();
  return api.getSystemInfoSync();
}
function createSelectorQuery() {
  return host().createSelectorQuery();
}
function createInnerAudioContext() {
  return host().createInnerAudioContext();
}
function hasAudio() {
  var api = host();
  return typeof api.createInnerAudioContext === "function";
}
module.exports = {
  storage: storage,
  navigateTo: navigateTo,
  redirectTo: redirectTo,
  reLaunch: reLaunch,
  navigateBack: navigateBack,
  pageScrollTo: pageScrollTo,
  showToast: showToast,
  request: request,
  setNavigationBarTitle: setNavigationBarTitle,
  hideShareMenu: hideShareMenu,
  vibrateShort: vibrateShort,
  showModal: showModal,
  showActionSheet: showActionSheet,
  chooseImage: chooseImage,
  previewImage: previewImage,
  compressImage: compressImage,
  fileSystemManager: fileSystemManager,
  userDataPath: userDataPath,
  windowInfo: windowInfo,
  createSelectorQuery: createSelectorQuery,
  createInnerAudioContext: createInnerAudioContext,
  hasAudio: hasAudio,
  login: login,
  userInfo: userInfo,
  toast: showToast,
};
