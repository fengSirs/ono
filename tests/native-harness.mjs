import vm from "node:vm";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
const root = resolve(import.meta.dirname, "../miniapp");
export function native() {
  var definition,
    app,
    storage = {},
    calls = [],
    pages = [],
    cache = new Map(),
    timers = new Set();
  var handler = () => ({});
  var ft = {
    getStorageSync: (k) => storage[k],
    setStorageSync: (k, v) => (storage[k] = v),
    removeStorageSync: (k) => delete storage[k],
    setNavigationBarTitle() {},
    showToast(o) {
      calls.push({ type: "toast", ...o });
    },
    navigateTo(o) {
      calls.push({ type: "navigateTo", ...o });
    },
    redirectTo(o) {
      calls.push({ type: "redirectTo", ...o });
    },
    reLaunch(o) {
      calls.push({ type: "reLaunch", ...o });
    },
    navigateBack() {},
    hideShareMenu() {},
    showActionSheet(o) {
      calls.push({ type: "color", ...o });
      if (ft.cancelColor) o.fail({ errMsg: "cancel" });
      else o.success({ tapIndex: ft.colorIndex || 0 });
    },
    showModal(o) {
      o.success({ confirm: true });
    },
    request(o) {
      calls.push({ type: "request", ...o });
      Promise.resolve()
        .then(() => handler(o))
        .then(
          (data) => o.success({ statusCode: 200, data }),
          () => o.fail({}),
        );
    },
    getWindowInfo() {
      return { windowHeight: 700 };
    },
    createSelectorQuery() {
      return {
        select() {
          return this;
        },
        boundingClientRect() {
          return this;
        },
        selectViewport() {
          return this;
        },
        scrollOffset() {
          return this;
        },
        exec(cb) {
          cb([{ top: 400, height: 300 }, { scrollTop: 0 }]);
        },
      };
    },
    pageScrollTo(o) {
      calls.push({ type: "scroll", ...o });
    },
    getFileSystemManager() {
      return { unlink() {} };
    },
  };
  var context = vm.createContext({
    console,
    ft,
    getApp: () => app,
    getCurrentPages: () => pages,
    App: (x) => (app = x),
    Page: (x) => (definition = x),
    Component: (x) => (definition = x),
    Date,
    Promise,
    URL,
    setTimeout: (fn, ms) => {
      var t = setTimeout(fn, ms);
      timers.add(t);
      return t;
    },
    clearTimeout: (t) => {
      timers.delete(t);
      clearTimeout(t);
    },
    setInterval: (fn, ms) => {
      var t = setInterval(fn, ms);
      timers.add(t);
      return t;
    },
    clearInterval: (t) => {
      timers.delete(t);
      clearInterval(t);
    },
  });
  function load(file) {
    file = resolve(file);
    if (!file.endsWith(".js")) file += ".js";
    if (cache.has(file)) return cache.get(file).exports;
    var module = { exports: {} };
    cache.set(file, module);
    var fn = vm.runInContext(
      "(function(require,module,exports){" +
        readFileSync(file, "utf8") +
        "\n})",
      context,
      { filename: file },
    );
    fn(
      (n) => {
        if (!n.startsWith(".")) throw Error("Only native relative modules");
        return load(resolve(dirname(file), n));
      },
      module,
      module.exports,
    );
    return module.exports;
  }
  load(resolve(root, "app.js"));
  app.onLaunch({});
  return {
    ft,
    calls,
    storage,
    get app() {
      return app;
    },
    pages,
    load: (name) => load(resolve(root, name)),
    respond(fn) {
      handler = fn;
    },
    page(name) {
      load(resolve(root, "pages/" + name + "/index.js"));
      var page = Object.assign({}, definition, {
        data: JSON.parse(JSON.stringify(definition.data)),
        setData(value, callback) {
          Object.assign(this.data, value);
          if (callback) callback();
        },
        route: "pages/" + name + "/index",
      });
      return page;
    },
    dispose() {
      for (var t of timers) {
        clearInterval(t);
        clearTimeout(t);
      }
      timers.clear();
    },
    timerCount: () => timers.size,
  };
}
export const flush = () => new Promise((resolve) => setTimeout(resolve, 15));
