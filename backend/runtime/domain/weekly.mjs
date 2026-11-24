export const WEEKLY_LIMIT = 100;
const DAY = 86400000;
// Brasília's UTC-03:00 calendar, matching the campaign's daily boundaries.
export function brasiliaWeek(now) {
  const local = new Date(now - 3 * 3600000);
  const monday = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - ((local.getUTCDay() + 6) % 7) * DAY);
  const start = monday.getTime() + 3 * 3600000;
  return { key: monday.toISOString().slice(0, 10), start, end: start + 7 * DAY };
}

// Executed inside the SAME transaction as the successful feeding ledger/wallet update.
// SQLite serializes writers; the immutable position also breaks millisecond ties.
export function completionStatement(db, c, pid, w, ledgerId, now) {
  const week = brasiliaWeek(now);
  return db.prepare(`INSERT OR IGNORE INTO christmas_completions
    (campaign,player,wallet,week_start,position,completed_at,display_name,source)
    SELECT ?,?,?,?,(SELECT coalesce(max(position),0)+1 FROM christmas_completions WHERE campaign=? AND week_start=?),?,coalesce((SELECT name FROM sessions WHERE id=?),'ONO!'),'live'
    WHERE EXISTS (SELECT 1 FROM christmas_wallets w JOIN christmas_ledger l ON l.wallet=w.id
      WHERE w.id=? AND w.version=? AND w.fed>=? AND l.id=? AND l.wallet_version=?)`)
    .bind(c.key, pid, w.id, week.key, c.key, week.key,
      now, pid, w.id, w.version + 1, c.growthGoal, ledgerId, w.version);
}

export async function weeklySummary(db, c, pid, now, hasClaim = null) {
  const week = brasiliaWeek(now);
  if (hasClaim === null) hasClaim = !!(pid && await db.prepare('SELECT id FROM christmas_claims WHERE wallet=?').bind(c.key + ':' + pid).first());
  const total = await db.prepare('SELECT count(*) AS n FROM christmas_completions WHERE campaign=? AND week_start=?').bind(c.key, week.key).first();
  const own = pid ? await db.prepare('SELECT week_start,position,completed_at,source FROM christmas_completions WHERE campaign=? AND player=?').bind(c.key, pid).first() : null;
  return {
    week: week.key, startsAt: week.start, endsAt: week.end, timezone: 'America/Sao_Paulo',
    limit: WEEKLY_LIMIT, completed: total.n, remaining: Math.max(0, WEEKLY_LIMIT - total.n),
    hasClaim, eligible: hasClaim || !!(own?.position && own.position <= WEEKLY_LIMIT),
    own: own ? { week: own.week_start, rank: own.position, completedAt: own.completed_at, needsReview: own.source === 'legacy_unknown' } : null,
  };
}

export async function weeklyLeaderboard(db, c, pid, now, key) {
  const current = brasiliaWeek(now);
  let selected = current;
  if (key !== undefined) {
    if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) throw Error('invalidWeek');
    const start = Date.parse(key + 'T03:00:00.000Z');
    if (!Number.isFinite(start)) throw Error('invalidWeek');
    selected = brasiliaWeek(start);
    if (selected.key !== key || selected.start > current.start || selected.end <= (c.preview ? c.previewStart : c.start)) throw Error('invalidWeek');
  }
  const summary = await weeklySummary(db, c, pid, now);
  const count = await db.prepare('SELECT count(*) AS n FROM christmas_completions WHERE campaign=? AND week_start=?').bind(c.key, selected.key).first();
  const entries = (await db.prepare('SELECT position AS rank,display_name AS name,completed_at AS completedAt,player=? AS isMe FROM christmas_completions WHERE campaign=? AND week_start=? AND position<=? ORDER BY position').bind(pid || '', c.key, selected.key, WEEKLY_LIMIT).all()).results;
  return { ...summary, currentWeek: current.key, week: selected.key, startsAt: selected.start, endsAt: selected.end,
    completed: count.n, remaining: Math.max(0, WEEKLY_LIMIT - count.n), closed: now >= selected.end,
    previousWeek: selected.start > (c.preview ? c.previewStart : c.start) ? brasiliaWeek(selected.start - 1).key : null,
    nextWeek: selected.start < current.start ? brasiliaWeek(selected.end).key : null,
    preview: c.preview, canEarn: c.canEarn, phase: c.phase, now, entries };
}
