function start(page, fn, delay) {
  stop(page);
  page._visible = true;
  var generation = page._generation;
  function tick() {
    if (!page._visible || page._generation !== generation) return;
    Promise.resolve()
      .then(fn)
      .catch(function (e) {
        if (page.onPollError) page.onPollError(e);
      })
      .finally(function () {
        if (page._visible && page._generation === generation)
          page._poll = setTimeout(tick, delay || 1200);
      });
  }
  tick();
}
function stop(page) {
  page._visible = false;
  page._generation = (page._generation || 0) + 1;
  clearTimeout(page._poll);
  page._poll = null;
}
module.exports = { start: start, stop: stop };
