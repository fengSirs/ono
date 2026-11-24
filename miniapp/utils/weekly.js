const words = require("./labels");
function localParts(time) {
  var d = new Date(time - 3 * 3600000);
  function pad(n) { return String(n).padStart(2, "0"); }
  return { date: pad(d.getUTCDate()) + "/" + pad(d.getUTCMonth() + 1) + "/" + d.getUTCFullYear(), time: pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) };
}
function view(board, lang, hasClaim) {
  if (!board) return {};
  hasClaim = hasClaim || board.hasClaim;
  var own = board.own;
  var key = hasClaim ? "weeklyClaimRegistered" : own && own.needsReview ? "rankingReview" : own ? (board.eligible ? "weeklyQualified" : "weeklyNotQualified") : board.remaining === 0 ? "weeklyFull" : "weeklyNotFinished";
  var compactKey = hasClaim ? "compactRegistered" : own && own.needsReview ? "compactReview" : own ? (board.eligible ? "compactQualified" : "compactMissed") : board.remaining === 0 ? "compactFull" : "compactUnfinished";
  var ownWeek = own && own.week ? localParts(Date.parse(own.week + "T03:00:00Z")).date.slice(0,5) : "";
  return {
    compactStatus: words.t(lang, compactKey),
    compactRank: own && own.rank ? words.t(lang, "compactRank", { rank: own.rank }) : "",
    compactOwnWeek: ownWeek ? words.t(lang, "compactOwnWeek", { week: ownWeek }) : "",
    compactWindow: localParts(board.startsAt).date.slice(0,5) + " ~ " + localParts(board.endsAt - 1).date.slice(0,5),
    weeklyStatus: words.t(lang, key),
    weeklyRemaining: words.t(lang, "weeklyRemaining", { count: board.remaining }),
    weeklyCompleted: words.t(lang, "weeklyCompleted", { count: board.completed }),
    weeklyMyRank: own && own.rank ? words.t(lang, "weeklyMyRank", { rank: own.rank, week: localParts(Date.parse(own.week + "T03:00:00Z")).date }) : "",
    weeklyWindow: localParts(board.startsAt).date + " ~ " + localParts(board.endsAt - 1).date,
  };
}
function challenge(farm, lang, leader) {
  var board = farm.weekly;
  if (!board) return null;
  var own = board.own, claimed = !!(farm.claim || board.hasClaim), rank = own && own.rank;
  var current = own && own.week === board.week;
  var wallet = farm.wallet || {}, config = farm.config || {};
  var grown = Number(wallet.fed || 0) >= Number(config.growthGoal || 100);
  function label(key, values) { return words.t(lang, key, values); }
  var badge = rank ? (current ? label('ownBadge',{rank:rank}) : label('oldBadge',{week:localParts(Date.parse(own.week+'T03:00:00Z')).date,rank:rank})) : '';
  // The board entry is always available; the secondary action only shortcuts growth or the claim record.
  var primary = { action: 'board', label: label(rank ? 'myRankButton' : 'seeBoard'), ready: false };
  var secondary = null, hint = label('challengeHint');
  if (claimed) {
    hint = label('compactRegistered');
    secondary = { action: 'claim', label: label('compactMyClaim') };
  } else if (own && own.needsReview) hint = label('compactReview');
  else if (rank) {
    hint = label('compactMissed');
    if (board.eligible && config.canClaim) {
      primary = { action: 'claim', label: label('claimTurkey'), ready: true };
      secondary = { action: 'board', label: label('myRankButton') };
      hint = current ? label('winnerHint',{rank:rank}) : label('compactQualified');
    } else if (board.eligible) hint = label('compactClaimClosed');
  } else if (!config.canEarn) hint = config.phase === 'paused' ? label('paused') : label('ended');
  else if (board.remaining === 0) {
    badge = label('fullBadge');
    hint = label('compactFull');
    if (!grown) secondary = { action: 'grow', label: label('growButton') };
  } else {
    badge = board.completed === 0 ? label('firstSpot') : leader ? label('leaderBadge',{name:leader}) : '';
    if (!grown) secondary = { action: 'grow', label: label('growButton') };
  }
  return {
    badge: badge,
    hint: hint,
    button: primary.label,
    action: primary.action,
    ready: primary.ready === true,
    secondary: secondary,
  };
}
module.exports = { view: view, localParts: localParts, challenge: challenge };
