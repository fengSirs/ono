const p = require("./platform");
var contexts = [],
  enabled = true;
function init() {
  var stored = p.api().getStorageSync("ono.sound");
  enabled = stored !== false;
  return enabled;
}
function play(cue) {
  if (!enabled || typeof p.api().createInnerAudioContext !== "function") return;
  try {
    var ctx = p.api().createInnerAudioContext();
    contexts.push(ctx);
    ctx.src = "/assets/audio/" + cue + ".wav";
    ctx.volume = 0.45;
    ctx.onEnded(function () {
      dispose(ctx);
    });
    ctx.onError(function () {
      dispose(ctx);
    });
    ctx.play();
  } catch (e) {
    /* Audio is optional on hosts without an audio session. */
  }
}
function dispose(ctx) {
  var i = contexts.indexOf(ctx);
  if (i >= 0) contexts.splice(i, 1);
  try {
    ctx.destroy();
  } catch (e) {}
}
function stop() {
  contexts.slice().forEach(dispose);
}
function toggle() {
  enabled = !enabled;
  p.api().setStorageSync("ono.sound", enabled);
  if (!enabled) stop();
  return enabled;
}
module.exports = { init: init, play: play, stop: stop, toggle: toggle };
