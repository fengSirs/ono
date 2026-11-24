import { completionStatement, weeklySummary, weeklyLeaderboard } from "./weekly.mjs";
import { socialTasksSnapshot, socialTaskAction } from "./social-tasks.mjs";
export const CHRISTMAS_DEFAULTS = Object.freeze({
  id: "natal-2026",
  officialStartsAt: "2026-12-10T03:00:00.000Z",
  endsAt: "2026-12-25T02:59:59.999Z",
  claimEndsAt: "2026-12-29T02:59:59.999Z",
  previewStartsAt: "2026-11-11T00:00:00.000Z",
  pointsPerFeed: 10,
  growthGoal: 100,
  previewGift: 0,
  friend2Points: 10,
  friend3Points: 20,
  friend4Points: 30,
  hatchSeconds: 5,
  winBonus: 5,
  gameDailyCap: 100,
  taskDailyLimit: 2,
  taskDailyFeedCap: 10,
  taskFeedFriends: 5,
  taskFeedGroup: 5,
  taskFeedMoment: 5,
  taskFeedParcel: 5,
  dailyPlay1Points: 0,
  dailyPlay3Points: 0,
  dailyScore50Points: 0,
  stockTotal: null,
  enabled: true,
  claimsEnabled: true,
});
export function resolveChristmas(settings = {}, now = Date.now()) {
  // Deprecated bonus settings cannot re-enable non-participation point sources.
  const c = {
    ...CHRISTMAS_DEFAULTS,
    ...settings,
    previewGift: 0,
    dailyPlay1Points: 0,
    dailyPlay3Points: 0,
    dailyScore50Points: 0,
  };
  if (
    [c.winBonus, c.gameDailyCap, c.taskDailyLimit, c.taskDailyFeedCap].some(
      (n) => !Number.isSafeInteger(n) || n < 1 || n > 10000,
    ) ||
    c.taskDailyLimit > 4 ||
    !Number.isSafeInteger(c.pointsPerFeed) ||
    c.pointsPerFeed < 1 ||
    [
      c.taskFeedFriends,
      c.taskFeedGroup,
      c.taskFeedMoment,
      c.taskFeedParcel,
    ].some((n) => !Number.isSafeInteger(n) || n < 1 || n > 100) ||
    c.pointsPerFeed > 10000 ||
    !Number.isSafeInteger(c.growthGoal) ||
    c.growthGoal < 1 ||
    c.growthGoal > 100000 ||
    !Number.isSafeInteger(c.previewGift) ||
    c.previewGift < 0 ||
    [c.friend2Points, c.friend3Points, c.friend4Points].some(
      (n) => !Number.isSafeInteger(n) || n < 1 || n > 10000,
    ) ||
    c.friend3Points <= c.friend2Points ||
    c.friend4Points <= c.friend3Points ||
    !Number.isSafeInteger(c.hatchSeconds) ||
    c.hatchSeconds < 3 ||
    c.hatchSeconds > 60 ||
    [c.dailyPlay1Points, c.dailyPlay3Points, c.dailyScore50Points].some(
      (n) => !Number.isSafeInteger(n) || n < 0 || n > 10000,
    )
  )
    throw Error("campaignUnavailable");
  const start = Date.parse(c.officialStartsAt),
    end = Date.parse(c.endsAt),
    claimEnd = Date.parse(c.claimEndsAt),
    previewStart = Date.parse(c.previewStartsAt);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(claimEnd) ||
    !Number.isFinite(previewStart) ||
    end <= start ||
    claimEnd < end
  )
    throw Error("campaignUnavailable");
  const preview = now < start,
    phase = !c.enabled
      ? "paused"
      : now > end
        ? "ended"
        : preview
          ? "preview"
          : "live";
  return {
    ...c,
    phase,
    key: c.id + (preview ? "-preview" : "-live"),
    preview,
    now,
    start,
    end,
    claimEnd,
    previewStart,
    canEarn: c.enabled && now >= (preview ? previewStart : start) && now <= end,
    canClaim: c.enabled && c.claimsEnabled && now <= claimEnd,
  };
}
export async function christmasConfig(db, now = Date.now()) {
  const row = await db
    .prepare("SELECT data FROM christmas_settings WHERE id=?")
    .bind("natal-2026")
    .first();
  return resolveChristmas(row ? JSON.parse(row.data) : {}, now);
}
async function wallet(db, c, pid) {
  const id = c.key + ":" + pid;
  await db
    .prepare(
      "INSERT OR IGNORE INTO christmas_wallets (id,campaign,player) VALUES (?,?,?)",
    )
    .bind(id, c.key, pid)
    .run();
  return db
    .prepare("SELECT * FROM christmas_wallets WHERE id=?")
    .bind(id)
    .first();
}
export function christmasDay(now) {
  const day = new Date(now - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const start = Date.parse(day + "T03:00:00.000Z");
  return { day, start, end: start + 86400000 };
}
async function petSnapshot(db, c, pid) {
  const row = pid
    ? await db
        .prepare(
          "SELECT claimed_at,hatch_at,hatched_at FROM christmas_pets WHERE id=?",
        )
        .bind(c.key + ":" + pid)
        .first()
    : null;
  return {
    status: !row
      ? "unclaimed"
      : row.hatched_at !== null
        ? "hatched"
        : "incubating",
    claimedAt: row?.claimed_at ?? null,
    hatchAt: row?.hatch_at ?? null,
    hatchedAt: row?.hatched_at ?? null,
  };
}
async function requireHatched(db, c, pid) {
  if ((await petSnapshot(db, c, pid)).status !== "hatched")
    throw Error("hatchFirst");
}
export async function gameDailySnapshot(db, c, pid, now) {
  const { day, start, end } = christmasDay(now);
  const row = pid
    ? await db
        .prepare(
          "SELECT coalesce(sum(points_delta),0) AS n FROM christmas_ledger WHERE wallet=? AND kind='friend_round' AND created>=? AND created<?",
        )
        .bind(c.key + ":" + pid, start, end)
        .first()
    : null;
  const earned = Number(row?.n || 0);
  return {
    day,
    earned,
    limit: c.gameDailyCap,
    remaining: Math.max(0, c.gameDailyCap - earned),
    resetsAt: new Date(end).toISOString(),
  };
}
export async function roundRewards(db, room) {
  const g = room.data?.game;
  if (!g) return [];
  const result = g.roundResults?.find((row) => row.round === g.round);
  if (!result) return [];
  const c = await christmasConfig(db, result.finishedAt);
  const rows = (
    await db
      .prepare(
        "SELECT player,points_delta,details FROM christmas_ledger WHERE campaign=? AND kind='friend_round' AND id LIKE ?",
      )
      .bind(c.key, "round:" + c.key + ":" + room.id + ":" + g.round + ":%")
      .all()
  ).results;
  return rows.map((row) => ({
    player: row.player,
    points: row.points_delta,
    ...JSON.parse(row.details || "{}"),
  }));
}
export async function christmasSnapshot(db, pid, now = Date.now()) {
  const c = await christmasConfig(db, now),
    w = pid
      ? await wallet(db, c, pid)
      : { points: 0, feed: 0, fed: 0, earned: 0 };
  const claim = pid
    ? await db
        .prepare(
          "SELECT id,status,created,updated,tracking FROM christmas_claims WHERE wallet=?",
        )
        .bind(w.id)
        .first()
    : null;
  const recent = pid
    ? (
        await db
          .prepare(
            "SELECT id,kind,points_delta,feed_delta,fed_delta,created,details FROM christmas_ledger WHERE wallet=? ORDER BY created DESC,id DESC LIMIT 8",
          )
          .bind(w.id)
          .all()
      ).results
    : [];
  const giftTaken = pid
    ? !!(await db
        .prepare("SELECT id FROM christmas_ledger WHERE id=?")
        .bind("gift:" + w.id)
        .first())
    : false;
  const feedTasks = await socialTasksSnapshot(db, c, pid, now);
  return {
    config: {
      id: c.key,
      phase: c.phase,
      preview: c.preview,
      officialStartsAt: c.officialStartsAt,
      endsAt: c.endsAt,
      claimEndsAt: c.claimEndsAt,
      pointsPerFeed: c.pointsPerFeed,
      growthGoal: c.growthGoal,
      previewGift: 0,
      hatchSeconds: c.hatchSeconds,
      friendRewards: [c.friend2Points, c.friend3Points, c.friend4Points],
      winBonus: c.winBonus,
      gameDailyCap: c.gameDailyCap,
      taskDailyLimit: c.taskDailyLimit,
      taskDailyFeedCap: c.taskDailyFeedCap,
      canEarn: c.canEarn,
      canClaim: c.canClaim,
      stockTotal: c.stockTotal,
      now,
    },
    wallet: {
      points: w.points,
      feed: w.feed,
      fed: w.fed,
      earned: w.earned,
      progress: Math.min(100, Math.floor((w.fed / c.growthGoal) * 100)),
      stage:
        w.fed >= c.growthGoal
          ? "grown"
          : w.fed >= c.growthGoal * 0.25
            ? "growing"
            : "baby",
      giftTaken,
    },
    claim,
    weekly: await weeklySummary(db, c, pid, now, !!claim),
    pet: await petSnapshot(db, c, pid),
    feedTasks,
    gameDaily: await gameDailySnapshot(db, c, pid, now),
    // Keep the retired three-card shape for already-open 0.6 clients; current UI uses feedTasks.
    daily: {
      day: feedTasks.day,
      resetsAt: feedTasks.resetsAt,
      tasks: [
        { id: "play1", goal: 1 },
        { id: "play3", goal: 3 },
        { id: "score50", goal: 50 },
      ].map((t) => ({
        ...t,
        progress: 0,
        reward: 0,
        ready: false,
        claimed: false,
      })),
    },
    recent,
  };
}
async function changeWallet(db, c, pid, id, kind, calculate, now) {
  for (let attempt = 0; attempt < 10; attempt++) {
    if (
      await db
        .prepare("SELECT id FROM christmas_ledger WHERE id=?")
        .bind(id)
        .first()
    )
      return;
    const w = await wallet(db, c, pid),
      delta = await calculate(w);
    if (!delta) throw Error("invalidAmount");
    const results = await db.batch([
      db
        .prepare(
          "INSERT OR IGNORE INTO christmas_ledger (id,wallet,campaign,player,kind,points_delta,feed_delta,fed_delta,wallet_version,created,details) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM christmas_wallets WHERE id=? AND version=?)",
        )
        .bind(
          id,
          w.id,
          c.key,
          pid,
          kind,
          delta.points,
          delta.feed,
          delta.fed,
          w.version,
          now,
          JSON.stringify(delta.details || {}),
          w.id,
          w.version,
        ),
      db
        .prepare(
          "UPDATE christmas_wallets SET points=points+?,feed=feed+?,fed=fed+?,earned=earned+?,version=version+1 WHERE id=? AND version=? AND EXISTS (SELECT 1 FROM christmas_ledger WHERE id=? AND wallet_version=?)",
        )
        .bind(
          delta.points,
          delta.feed,
          delta.fed,
          delta.earned || 0,
          w.id,
          w.version,
          id,
          w.version,
        ),
      ...(kind === "feed" && w.fed < c.growthGoal ? [completionStatement(db, c, pid, w, id, now)] : []),
    ]);
    if (results[1].meta.changes) return;
  }
  throw Error("retry");
}
export async function settleChristmasRound(db, room, now = Date.now()) {
  const g = room.data?.game;
  if (room.kind !== "private" || !g?.roundResults?.length) return;
  const current = await christmasConfig(db, now);
  if (!current.enabled) return;
  for (const result of g.roundResults) {
    // Results recorded by the new engine freeze the actual participants at round completion.
    if (!["friends-v1", "friends-v2"].includes(result.activityRule)) continue;
    const ids = result.participantIds;
    if (
      !Array.isArray(ids) ||
      ![2, 3, 4].includes(ids.length) ||
      new Set(ids).size !== ids.length ||
      g.players.some((p) => p.bot) ||
      !ids.every((id) => g.players.some((p) => p.id === id))
    )
      continue;
    const c = await christmasConfig(db, result.finishedAt);
    if (!c.canEarn || result.finishedAt > now + 1000) continue;
    const base = c["friend" + ids.length + "Points"],
      modern = result.activityRule === "friends-v2";
    if (modern && !ids.includes(result.winner)) continue;
    for (const pid of ids) {
      const bonus = modern && result.winner === pid ? c.winBonus : 0;
      await changeWallet(
        db,
        c,
        pid,
        "round:" + c.key + ":" + room.id + ":" + result.round + ":" + pid,
        "friend_round",
        async () => {
          const daily = modern
            ? await gameDailySnapshot(db, c, pid, result.finishedAt)
            : null;
          const points = modern
            ? Math.min(base + bonus, daily.remaining)
            : base;
          const paidBase = Math.min(base, points),
            paidBonus = points - paidBase;
          return {
            points,
            feed: 0,
            fed: 0,
            earned: points,
            details: {
              rule: modern ? "unified-v1" : "legacy",
              base: paidBase,
              bonus: paidBonus,
              expectedBase: base,
              expectedBonus: bonus,
              limited: points < base + bonus,
            },
          };
        },
        result.finishedAt,
      );
    }
  }
}
function amount(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > 100000)
    throw Error("invalidAmount");
  return n;
}
export async function reconcileChristmas(db, pid, now = Date.now()) {
  if (!pid) return;
  const c = await christmasConfig(db, now);
  if (!c.enabled) return;
  const rows = await db
    .prepare(
      "SELECT DISTINCT r.id,r.kind,r.data FROM rooms r,json_each(r.data,'$.game.roundResults') result WHERE r.kind='private' AND json_extract(result.value,'$.activityRule') IN ('friends-v1','friends-v2') AND EXISTS (SELECT 1 FROM json_each(r.data,'$.players') p WHERE json_extract(p.value,'$.id')=?) AND json_extract(result.value,'$.finishedAt')>=? AND json_extract(result.value,'$.finishedAt')<=? AND NOT EXISTS (SELECT 1 FROM christmas_ledger l WHERE l.id='round:' || ? || CASE WHEN json_extract(result.value,'$.finishedAt')<? THEN '-preview:' ELSE '-live:' END || r.id || ':' || json_extract(result.value,'$.round') || ':' || ?) LIMIT 100",
    )
    .bind(pid, c.previewStart, Math.min(now, c.end), c.id, c.start, pid)
    .all();
  for (const r of rows.results)
    await settleChristmasRound(db, { ...r, data: JSON.parse(r.data) }, now);
}
export async function christmasAction(db, pid, b, now = Date.now()) {
  const c = await christmasConfig(db, now);
  await reconcileChristmas(db, pid, now);
  if (b.op === "christmas")
    return { christmas: await christmasSnapshot(db, pid, now) };
  // The weekly board and its rules are public: visitors can browse before signing in.
  if (b.op === "christmasLeaderboard")
    return { leaderboard: await weeklyLeaderboard(db, c, pid, now, b.week) };
  if (!pid) throw Error("sessionExpired");
  if (b.op === "christmasTaskEvidence")
    return socialTaskAction(db, c, pid, b, now, null);
  if (!c.enabled) throw Error("campaignUnavailable");
  if (b.op === "christmasEgg") {
    if (!c.canEarn) throw Error("campaignEnded");
    await wallet(db, c, pid);
    await db
      .prepare(
        "INSERT OR IGNORE INTO christmas_pets(id,claimed_at,hatch_at) VALUES(?,?,?)",
      )
      .bind(c.key + ":" + pid, now, now + c.hatchSeconds * 1000)
      .run();
  } else if (b.op === "christmasHatch") {
    if (!c.canEarn) throw Error("campaignEnded");
    const pet = await petSnapshot(db, c, pid);
    if (pet.status === "unclaimed") throw Error("eggFirst");
    if (pet.status !== "hatched") {
      if (now < pet.hatchAt) throw Error("hatchNotReady");
      await db
        .prepare(
          "UPDATE christmas_pets SET hatched_at=? WHERE id=? AND hatched_at IS NULL AND hatch_at<=?",
        )
        .bind(now, c.key + ":" + pid, now)
        .run();
    }
  } else if (
    [
      "christmasTaskSubmit",
      "christmasTaskClaim",
      "christmasTaskEvidence",
    ].includes(b.op)
  ) {
    const result = await socialTaskAction(db, c, pid, b, now, (id, reward) =>
      changeWallet(
        db,
        c,
        pid,
        id,
        "task_feed",
        () => ({ points: 0, feed: reward, fed: 0 }),
        now,
      ),
    );
    if (result) return result;
  } else if (b.op === "christmasDaily") {
    throw Error("taskProofRequired");
  } else if (b.op === "christmasGift") {
    throw Error("friendPointsOnly");
  } else if (b.op === "christmasExchange" || b.op === "christmasFeed") {
    if (!c.canEarn) throw Error("campaignEnded");
    if (typeof b.requestId !== "string" || !/^[-\w]{16,80}$/.test(b.requestId))
      throw Error("invalidAction");
    await requireHatched(db, c, pid);
    const count = amount(b.amount),
      kind = b.op === "christmasExchange" ? "exchange" : "feed";
    await changeWallet(
      db,
      c,
      pid,
      kind + ":" + c.key + ":" + pid + ":" + b.requestId,
      kind,
      (w) => {
        if (kind === "exchange") {
          const cost = count * c.pointsPerFeed;
          if (w.points < cost) throw Error("notEnoughPoints");
          return { points: -cost, feed: count, fed: 0 };
        }
        if (w.fed >= c.growthGoal) throw Error("turkeyGrown");
        const used = Math.min(count, c.growthGoal - w.fed);
        if (w.feed < used) throw Error("notEnoughFeed");
        return { points: 0, feed: -used, fed: used };
      },
      now,
    );
  } else if (b.op === "christmasClaim") {
    if (!c.canClaim) throw Error("claimClosed");
    await requireHatched(db, c, pid);
    const w = await wallet(db, c, pid);
    const existing = await db
      .prepare("SELECT id FROM christmas_claims WHERE wallet=?")
      .bind(w.id)
      .first();
    if (!existing) {
      const completion = await db.prepare("SELECT id,position FROM christmas_completions WHERE campaign=? AND player=?").bind(c.key, pid).first();
      if (!completion) throw Error(w.fed < c.growthGoal ? "turkeyNotGrown" : "rankingReview");
      if (completion.position === null) throw Error("rankingReview");
      if (completion.position > 100) throw Error("weeklyNotQualified");
      const name = String(b.name || "")
          .trim()
          .slice(0, 80),
        contact = String(b.contact || "").replace(/[^\d+]/g, "");
      if (
        name.length < 2 ||
        !/^\+?\d{10,15}$/.test(contact) ||
        b.consent !== true
      )
        throw Error("claimDetailsRequired");
      const normalized = contact.replace(/^\+/, ""),
        contactKey = c.key + ":" + normalized;
      if (
        await db
          .prepare("SELECT id FROM christmas_claims WHERE contact_key=?")
          .bind(contactKey)
          .first()
      )
        throw Error("contactAlreadyUsed");
      const id = crypto.randomUUID();
      try {
        await db
          .prepare(
            "INSERT INTO christmas_claims (id,campaign,wallet,player,name,contact,contact_key,status,created,updated,completion_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          )
          .bind(
            id,
            c.key,
            w.id,
            pid,
            name,
            contact,
            contactKey,
            c.preview ? "test_pending" : "pending",
            now,
            now,
            completion.id,
          )
          .run();
      } catch (error) {
        if (
          await db
            .prepare("SELECT id FROM christmas_claims WHERE wallet=?")
            .bind(w.id)
            .first()
        )
          return { christmas: await christmasSnapshot(db, pid, now) };
        if (
          await db
            .prepare("SELECT id FROM christmas_claims WHERE contact_key=?")
            .bind(contactKey)
            .first()
        )
          throw Error("contactAlreadyUsed");
        throw error;
      }
    }
  } else throw Error("invalidAction");
  return { christmas: await christmasSnapshot(db, pid, now) };
}
