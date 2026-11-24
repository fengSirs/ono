// backend/src/domain/weekly.mjs
var WEEKLY_LIMIT = 100;
var DAY = 864e5;
function brasiliaWeek(now) {
  const local = new Date(now - 3 * 36e5);
  const monday = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - (local.getUTCDay() + 6) % 7 * DAY);
  const start = monday.getTime() + 3 * 36e5;
  return { key: monday.toISOString().slice(0, 10), start, end: start + 7 * DAY };
}
function completionStatement(db, c, pid, w, ledgerId, now) {
  const week = brasiliaWeek(now);
  return db.prepare(`INSERT OR IGNORE INTO christmas_completions
    (campaign,player,wallet,week_start,position,completed_at,display_name,source)
    SELECT ?,?,?,?,(SELECT coalesce(max(position),0)+1 FROM christmas_completions WHERE campaign=? AND week_start=?),?,coalesce((SELECT name FROM sessions WHERE id=?),'ONO!'),'live'
    WHERE EXISTS (SELECT 1 FROM christmas_wallets w JOIN christmas_ledger l ON l.wallet=w.id
      WHERE w.id=? AND w.version=? AND w.fed>=? AND l.id=? AND l.wallet_version=?)`).bind(
    c.key,
    pid,
    w.id,
    week.key,
    c.key,
    week.key,
    now,
    pid,
    w.id,
    w.version + 1,
    c.growthGoal,
    ledgerId,
    w.version
  );
}
async function weeklySummary(db, c, pid, now, hasClaim = null) {
  const week = brasiliaWeek(now);
  if (hasClaim === null) hasClaim = !!(pid && await db.prepare("SELECT id FROM christmas_claims WHERE wallet=?").bind(c.key + ":" + pid).first());
  const total = await db.prepare("SELECT count(*) AS n FROM christmas_completions WHERE campaign=? AND week_start=?").bind(c.key, week.key).first();
  const own = pid ? await db.prepare("SELECT week_start,position,completed_at,source FROM christmas_completions WHERE campaign=? AND player=?").bind(c.key, pid).first() : null;
  return {
    week: week.key,
    startsAt: week.start,
    endsAt: week.end,
    timezone: "America/Sao_Paulo",
    limit: WEEKLY_LIMIT,
    completed: total.n,
    remaining: Math.max(0, WEEKLY_LIMIT - total.n),
    hasClaim,
    eligible: hasClaim || !!(own?.position && own.position <= WEEKLY_LIMIT),
    own: own ? { week: own.week_start, rank: own.position, completedAt: own.completed_at, needsReview: own.source === "legacy_unknown" } : null
  };
}
async function weeklyLeaderboard(db, c, pid, now, key) {
  const current = brasiliaWeek(now);
  let selected = current;
  if (key !== void 0) {
    if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) throw Error("invalidWeek");
    const start = Date.parse(key + "T03:00:00.000Z");
    if (!Number.isFinite(start)) throw Error("invalidWeek");
    selected = brasiliaWeek(start);
    if (selected.key !== key || selected.start > current.start || selected.end <= (c.preview ? c.previewStart : c.start)) throw Error("invalidWeek");
  }
  const summary = await weeklySummary(db, c, pid, now);
  const count = await db.prepare("SELECT count(*) AS n FROM christmas_completions WHERE campaign=? AND week_start=?").bind(c.key, selected.key).first();
  const entries = (await db.prepare("SELECT position AS rank,display_name AS name,completed_at AS completedAt,player=? AS isMe FROM christmas_completions WHERE campaign=? AND week_start=? AND position<=? ORDER BY position").bind(pid || "", c.key, selected.key, WEEKLY_LIMIT).all()).results;
  return {
    ...summary,
    currentWeek: current.key,
    week: selected.key,
    startsAt: selected.start,
    endsAt: selected.end,
    completed: count.n,
    remaining: Math.max(0, WEEKLY_LIMIT - count.n),
    closed: now >= selected.end,
    previousWeek: selected.start > (c.preview ? c.previewStart : c.start) ? brasiliaWeek(selected.start - 1).key : null,
    nextWeek: selected.start < current.start ? brasiliaWeek(selected.end).key : null,
    preview: c.preview,
    canEarn: c.canEarn,
    phase: c.phase,
    now,
    entries
  };
}

// backend/src/domain/social-tasks.mjs
var SOCIAL_TASKS = Object.freeze([
  { id: "phiz_friends", goal: 3, rewardKey: "taskFeedFriends" },
  { id: "phiz_group", goal: 1, rewardKey: "taskFeedGroup" },
  { id: "phiz_moment", goal: 1, rewardKey: "taskFeedMoment" },
  { id: "anjun_tracking", goal: 1, rewardKey: "taskFeedParcel" }
]);
function socialDay(now) {
  const day = new Date(now - 108e5).toISOString().slice(0, 10);
  return { day, end: Date.parse(day + "T03:00:00.000Z") + 864e5 };
}
function text(value, max) {
  return String(value || "").normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}
function validateProofs(proofs) {
  if (!Array.isArray(proofs) || proofs.length < 1 || proofs.length > 3)
    throw Error("taskProofRequired");
  return proofs.map((value) => {
    if (typeof value !== "string" || value.length > 27e4)
      throw Error("taskImageTooLarge");
    const m = value.match(
      /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/
    );
    if (!m || m[2].length % 4 !== 0) throw Error("taskImageInvalid");
    let raw;
    try {
      raw = atob(m[2]);
    } catch {
      throw Error("taskImageInvalid");
    }
    if (raw.length < 12 || raw.length > 2e5)
      throw Error("taskImageTooLarge");
    const valid = m[1] === "jpeg" ? raw.charCodeAt(0) === 255 && raw.charCodeAt(1) === 216 && raw.charCodeAt(2) === 255 : m[1] === "png" ? raw.slice(0, 8) === "\x89PNG\r\n\n" : raw.slice(0, 4) === "RIFF" && raw.slice(8, 12) === "WEBP";
    if (!valid) throw Error("taskImageInvalid");
    let width = 0, height = 0;
    const byte = (i) => raw.charCodeAt(i), word = (i) => byte(i) * 256 + byte(i + 1), uint = (i) => byte(i) * 16777216 + byte(i + 1) * 65536 + byte(i + 2) * 256 + byte(i + 3);
    if (m[1] === "png") {
      if (raw.length < 24 || raw.slice(12, 16) !== "IHDR")
        throw Error("taskImageInvalid");
      width = uint(16);
      height = uint(20);
    } else {
      let pos = 2;
      while (pos + 8 < raw.length) {
        if (byte(pos++) !== 255) continue;
        while (byte(pos) === 255) pos++;
        const marker = byte(pos++);
        if (marker === 218 || marker === 217) break;
        if (marker === 0 || marker === 216 || marker === 1 || marker >= 208 && marker <= 215)
          continue;
        const length = word(pos);
        if (length < 2 || pos + length > raw.length) break;
        if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
          height = word(pos + 3);
          width = word(pos + 5);
          break;
        }
        pos += length;
      }
    }
    if (!width || !height || width > 6e3 || height > 1e4 || width * height > 2e7)
      throw Error("taskImageInvalid");
    return value;
  });
}
function publicSubmission(row) {
  return row ? {
    id: row.id,
    day: row.day,
    task: row.task,
    status: row.credited ? "claimed" : row.status,
    reward: row.reward,
    note: row.note || "",
    attempts: row.attempts,
    created: row.created,
    updated: row.updated,
    proofCount: row.proof_count,
    legacy: row.reward_rule === 1
  } : null;
}
async function taskQuota(db, c, wallet2, day) {
  const row = await db.prepare(
    "SELECT count(*) AS used,coalesce(sum(reward),0) AS feed FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed')"
  ).bind(wallet2, day).first();
  return {
    used: row.used,
    reservedFeed: row.feed,
    remaining: Math.max(0, c.taskDailyLimit - row.used),
    remainingFeed: Math.max(0, c.taskDailyFeedCap - row.feed)
  };
}
async function socialTasksSnapshot(db, c, pid, now) {
  const { day, end } = socialDay(now), wallet2 = c.key + ":" + pid;
  const profile = pid ? await db.prepare("SELECT phiz_id FROM christmas_phiz_profiles WHERE id=?").bind(wallet2).first() : null;
  const rows = pid ? (await db.prepare(
    "SELECT s.id,s.day,s.task,s.status,s.reward,s.note,s.attempts,s.created,s.updated,s.reward_rule,json_array_length(s.proofs) AS proof_count,l.id AS credited FROM christmas_feed_tasks s LEFT JOIN christmas_ledger l ON l.id='task-feed:'||s.id WHERE s.wallet=? AND s.day=?"
  ).bind(wallet2, day).all()).results : [];
  const history = pid ? (await db.prepare(
    "SELECT s.id,s.day,s.task,s.status,s.reward,s.note,s.attempts,s.created,s.updated,s.reward_rule,json_array_length(s.proofs) AS proof_count,l.id AS credited FROM christmas_feed_tasks s LEFT JOIN christmas_ledger l ON l.id='task-feed:'||s.id WHERE s.wallet=? AND s.day<>? ORDER BY (s.status='approved' AND l.id IS NULL) DESC,(s.status='pending') DESC,s.day DESC,s.updated DESC LIMIT 12"
  ).bind(wallet2, day).all()).results : [];
  const quota = pid ? await taskQuota(db, c, wallet2, day) : {
    used: 0,
    reservedFeed: 0,
    remaining: c.taskDailyLimit,
    remainingFeed: c.taskDailyFeedCap
  };
  return {
    day,
    quota,
    limit: c.taskDailyLimit,
    legacyAllowance: rows.some((row) => row.reward_rule === 1),
    resetsAt: new Date(end).toISOString(),
    verification: "manual",
    profile: profile ? { phizId: profile.phiz_id } : null,
    totalFeed: Math.min(
      c.taskDailyFeedCap,
      SOCIAL_TASKS.reduce((sum, t) => sum + c[t.rewardKey], 0)
    ),
    tasks: SOCIAL_TASKS.map((t) => {
      const submission = publicSubmission(rows.find((r) => r.task === t.id));
      return {
        id: t.id,
        goal: t.goal,
        canSubmit: c.canEarn && (!submission || submission.status === "rejected") && quota.remaining > 0 && quota.remainingFeed >= (submission?.reward ?? c[t.rewardKey]),
        progress: submission && ["approved", "claimed"].includes(submission.status) ? t.goal : 0,
        reward: submission?.reward ?? c[t.rewardKey],
        status: submission?.status || "not_started",
        ready: submission?.status === "approved" && c.canEarn,
        claimed: submission?.status === "claimed",
        submission
      };
    }),
    history: history.map(publicSubmission)
  };
}
async function owned(db, c, pid, id) {
  const row = await db.prepare("SELECT * FROM christmas_feed_tasks WHERE id=? AND wallet=?").bind(String(id), c.key + ":" + pid).first();
  if (!row) throw Error("taskMissing");
  return row;
}
async function socialTaskAction(db, c, pid, b, now, credit) {
  if (b.op === "christmasTaskEvidence") {
    const row = await owned(db, c, pid, b.submission);
    return {
      evidence: {
        ...publicSubmission(row),
        details: row.details,
        phizId: row.phiz_id,
        proofs: JSON.parse(row.proofs)
      }
    };
  }
  if (!c.canEarn) throw Error("campaignEnded");
  if (b.op === "christmasTaskClaim") {
    const row = await owned(db, c, pid, b.submission);
    if (!["approved", "claimed"].includes(row.status))
      throw Error("taskNotApproved");
    await credit("task-feed:" + row.id, row.reward);
    await db.batch([
      db.prepare(
        "INSERT OR IGNORE INTO christmas_task_audit(id,submission,action,note,created,payload) SELECT ?,id,'claim','Feed credited',?,'{}' FROM christmas_feed_tasks WHERE id=? AND status='approved' AND EXISTS(SELECT 1 FROM christmas_ledger WHERE id=?)"
      ).bind("claim:" + row.id, now, row.id, "task-feed:" + row.id),
      db.prepare(
        "UPDATE christmas_feed_tasks SET status='claimed',updated=? WHERE id=? AND status='approved' AND EXISTS(SELECT 1 FROM christmas_ledger WHERE id=?)"
      ).bind(now, row.id, "task-feed:" + row.id)
    ]);
    return null;
  }
  if (b.op !== "christmasTaskSubmit") throw Error("invalidAction");
  const task = SOCIAL_TASKS.find((t) => t.id === b.mission);
  if (!task) throw Error("invalidAction");
  const { day } = socialDay(now), wallet2 = c.key + ":" + pid, id = "social-task:" + wallet2 + ":" + day + ":" + task.id;
  const previous = await db.prepare("SELECT * FROM christmas_feed_tasks WHERE id=?").bind(id).first();
  if (previous && previous.status !== "rejected") return null;
  const reward = previous?.reward ?? c[task.rewardKey], quota = await taskQuota(db, c, wallet2, day);
  if (!quota.remaining || quota.remainingFeed < reward)
    throw Error("taskDailyLimit");
  const phizId = text(b.phizId, 80), details = text(b.details, 1600);
  if (phizId.length < 3 || details.length < 10 || b.consent !== true)
    throw Error("taskDetailsRequired");
  const proofs = validateProofs(b.proofs), phizKey = c.key + ":" + phizId.toLowerCase();
  const existingProfile = await db.prepare("SELECT * FROM christmas_phiz_profiles WHERE id=?").bind(wallet2).first();
  if (existingProfile && existingProfile.phiz_key !== phizKey)
    throw Error("taskProfileLocked");
  try {
    await db.prepare(
      "INSERT OR IGNORE INTO christmas_phiz_profiles(id,campaign,player,phiz_id,phiz_key) VALUES(?,?,?,?,?)"
    ).bind(wallet2, c.key, pid, phizId, phizKey).run();
  } catch {
    throw Error("taskPhizUsed");
  }
  const profile = await db.prepare("SELECT * FROM christmas_phiz_profiles WHERE id=?").bind(wallet2).first();
  if (!profile) throw Error("taskPhizUsed");
  if (profile.phiz_key !== phizKey) throw Error("taskProfileLocked");
  if (previous) {
    if (previous.attempts >= 3) throw Error("taskAttemptLimit");
    const previousPayload = JSON.stringify({
      details: previous.details,
      proofs: JSON.parse(previous.proofs),
      note: previous.note,
      attempt: previous.attempts
    });
    const guard = " AND (SELECT count(*) FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed'))<? AND (SELECT coalesce(sum(reward),0) FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed'))+?<=?";
    const limits = [
      wallet2,
      day,
      c.taskDailyLimit,
      wallet2,
      day,
      reward,
      c.taskDailyFeedCap
    ];
    const result = await db.batch([
      db.prepare(
        "INSERT OR IGNORE INTO christmas_task_audit(id,submission,action,note,created,payload) SELECT ?,id,'resubmit','Previous evidence retained',?,? FROM christmas_feed_tasks WHERE id=? AND status='rejected' AND version=?" + guard
      ).bind(
        "resubmit:" + id + ":" + previous.version,
        now,
        previousPayload,
        id,
        previous.version,
        ...limits
      ),
      db.prepare(
        "UPDATE christmas_feed_tasks SET status='pending',details=?,proofs=?,note='',reward_rule=2,attempts=attempts+1,version=version+1,updated=? WHERE id=? AND status='rejected' AND version=?" + guard
      ).bind(
        details,
        JSON.stringify(proofs),
        now,
        id,
        previous.version,
        ...limits
      )
    ]);
    if (!result[1].meta.changes && (await owned(db, c, pid, id)).status === "rejected")
      throw Error("taskDailyLimit");
  } else {
    const result = await db.prepare(
      "INSERT OR IGNORE INTO christmas_feed_tasks(id,campaign,wallet,player,phiz_id,phiz_key,day,task,details,proofs,reward,reward_rule,status,created,updated) SELECT ?,?,?,?,?,?,?,?,?,?,?,2,'pending',?,? WHERE (SELECT count(*) FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed'))<? AND (SELECT coalesce(sum(reward),0) FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed'))+?<=?"
    ).bind(
      id,
      c.key,
      wallet2,
      pid,
      profile.phiz_id,
      profile.phiz_key,
      day,
      task.id,
      details,
      JSON.stringify(proofs),
      reward,
      now,
      now,
      wallet2,
      day,
      c.taskDailyLimit,
      wallet2,
      day,
      reward,
      c.taskDailyFeedCap
    ).run();
    if (!result.meta.changes) {
      const existing = await db.prepare("SELECT id FROM christmas_feed_tasks WHERE id=?").bind(id).first();
      if (!existing) throw Error("taskDailyLimit");
    }
  }
  return null;
}

// backend/src/domain/christmas.mjs
var CHRISTMAS_DEFAULTS = Object.freeze({
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
  claimsEnabled: true
});
function resolveChristmas(settings = {}, now = Date.now()) {
  const c = {
    ...CHRISTMAS_DEFAULTS,
    ...settings,
    previewGift: 0,
    dailyPlay1Points: 0,
    dailyPlay3Points: 0,
    dailyScore50Points: 0
  };
  if ([c.winBonus, c.gameDailyCap, c.taskDailyLimit, c.taskDailyFeedCap].some(
    (n) => !Number.isSafeInteger(n) || n < 1 || n > 1e4
  ) || c.taskDailyLimit > 4 || !Number.isSafeInteger(c.pointsPerFeed) || c.pointsPerFeed < 1 || [
    c.taskFeedFriends,
    c.taskFeedGroup,
    c.taskFeedMoment,
    c.taskFeedParcel
  ].some((n) => !Number.isSafeInteger(n) || n < 1 || n > 100) || c.pointsPerFeed > 1e4 || !Number.isSafeInteger(c.growthGoal) || c.growthGoal < 1 || c.growthGoal > 1e5 || !Number.isSafeInteger(c.previewGift) || c.previewGift < 0 || [c.friend2Points, c.friend3Points, c.friend4Points].some(
    (n) => !Number.isSafeInteger(n) || n < 1 || n > 1e4
  ) || c.friend3Points <= c.friend2Points || c.friend4Points <= c.friend3Points || !Number.isSafeInteger(c.hatchSeconds) || c.hatchSeconds < 3 || c.hatchSeconds > 60 || [c.dailyPlay1Points, c.dailyPlay3Points, c.dailyScore50Points].some(
    (n) => !Number.isSafeInteger(n) || n < 0 || n > 1e4
  ))
    throw Error("campaignUnavailable");
  const start = Date.parse(c.officialStartsAt), end = Date.parse(c.endsAt), claimEnd = Date.parse(c.claimEndsAt), previewStart = Date.parse(c.previewStartsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(claimEnd) || !Number.isFinite(previewStart) || end <= start || claimEnd < end)
    throw Error("campaignUnavailable");
  const preview = now < start, phase = !c.enabled ? "paused" : now > end ? "ended" : preview ? "preview" : "live";
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
    canClaim: c.enabled && c.claimsEnabled && now <= claimEnd
  };
}
async function christmasConfig(db, now = Date.now()) {
  const row = await db.prepare("SELECT data FROM christmas_settings WHERE id=?").bind("natal-2026").first();
  return resolveChristmas(row ? JSON.parse(row.data) : {}, now);
}
async function wallet(db, c, pid) {
  const id = c.key + ":" + pid;
  await db.prepare(
    "INSERT OR IGNORE INTO christmas_wallets (id,campaign,player) VALUES (?,?,?)"
  ).bind(id, c.key, pid).run();
  return db.prepare("SELECT * FROM christmas_wallets WHERE id=?").bind(id).first();
}
function christmasDay(now) {
  const day = new Date(now - 3 * 60 * 60 * 1e3).toISOString().slice(0, 10);
  const start = Date.parse(day + "T03:00:00.000Z");
  return { day, start, end: start + 864e5 };
}
async function petSnapshot(db, c, pid) {
  const row = pid ? await db.prepare(
    "SELECT claimed_at,hatch_at,hatched_at FROM christmas_pets WHERE id=?"
  ).bind(c.key + ":" + pid).first() : null;
  return {
    status: !row ? "unclaimed" : row.hatched_at !== null ? "hatched" : "incubating",
    claimedAt: row?.claimed_at ?? null,
    hatchAt: row?.hatch_at ?? null,
    hatchedAt: row?.hatched_at ?? null
  };
}
async function requireHatched(db, c, pid) {
  if ((await petSnapshot(db, c, pid)).status !== "hatched")
    throw Error("hatchFirst");
}
async function gameDailySnapshot(db, c, pid, now) {
  const { day, start, end } = christmasDay(now);
  const row = pid ? await db.prepare(
    "SELECT coalesce(sum(points_delta),0) AS n FROM christmas_ledger WHERE wallet=? AND kind='friend_round' AND created>=? AND created<?"
  ).bind(c.key + ":" + pid, start, end).first() : null;
  const earned = Number(row?.n || 0);
  return {
    day,
    earned,
    limit: c.gameDailyCap,
    remaining: Math.max(0, c.gameDailyCap - earned),
    resetsAt: new Date(end).toISOString()
  };
}
async function roundRewards(db, room) {
  const g = room.data?.game;
  if (!g) return [];
  const result = g.roundResults?.find((row) => row.round === g.round);
  if (!result) return [];
  const c = await christmasConfig(db, result.finishedAt);
  const rows = (await db.prepare(
    "SELECT player,points_delta,details FROM christmas_ledger WHERE campaign=? AND kind='friend_round' AND id LIKE ?"
  ).bind(c.key, "round:" + c.key + ":" + room.id + ":" + g.round + ":%").all()).results;
  return rows.map((row) => ({
    player: row.player,
    points: row.points_delta,
    ...JSON.parse(row.details || "{}")
  }));
}
async function christmasSnapshot(db, pid, now = Date.now()) {
  const c = await christmasConfig(db, now), w = pid ? await wallet(db, c, pid) : { points: 0, feed: 0, fed: 0, earned: 0 };
  const claim = pid ? await db.prepare(
    "SELECT id,status,created,updated,tracking FROM christmas_claims WHERE wallet=?"
  ).bind(w.id).first() : null;
  const recent = pid ? (await db.prepare(
    "SELECT id,kind,points_delta,feed_delta,fed_delta,created,details FROM christmas_ledger WHERE wallet=? ORDER BY created DESC,id DESC LIMIT 8"
  ).bind(w.id).all()).results : [];
  const giftTaken = pid ? !!await db.prepare("SELECT id FROM christmas_ledger WHERE id=?").bind("gift:" + w.id).first() : false;
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
      now
    },
    wallet: {
      points: w.points,
      feed: w.feed,
      fed: w.fed,
      earned: w.earned,
      progress: Math.min(100, Math.floor(w.fed / c.growthGoal * 100)),
      stage: w.fed >= c.growthGoal ? "grown" : w.fed >= c.growthGoal * 0.25 ? "growing" : "baby",
      giftTaken
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
        { id: "score50", goal: 50 }
      ].map((t) => ({
        ...t,
        progress: 0,
        reward: 0,
        ready: false,
        claimed: false
      }))
    },
    recent
  };
}
async function changeWallet(db, c, pid, id, kind, calculate, now) {
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await db.prepare("SELECT id FROM christmas_ledger WHERE id=?").bind(id).first())
      return;
    const w = await wallet(db, c, pid), delta = await calculate(w);
    if (!delta) throw Error("invalidAmount");
    const results = await db.batch([
      db.prepare(
        "INSERT OR IGNORE INTO christmas_ledger (id,wallet,campaign,player,kind,points_delta,feed_delta,fed_delta,wallet_version,created,details) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM christmas_wallets WHERE id=? AND version=?)"
      ).bind(
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
        w.version
      ),
      db.prepare(
        "UPDATE christmas_wallets SET points=points+?,feed=feed+?,fed=fed+?,earned=earned+?,version=version+1 WHERE id=? AND version=? AND EXISTS (SELECT 1 FROM christmas_ledger WHERE id=? AND wallet_version=?)"
      ).bind(
        delta.points,
        delta.feed,
        delta.fed,
        delta.earned || 0,
        w.id,
        w.version,
        id,
        w.version
      ),
      ...kind === "feed" && w.fed < c.growthGoal ? [completionStatement(db, c, pid, w, id, now)] : []
    ]);
    if (results[1].meta.changes) return;
  }
  throw Error("retry");
}
async function settleChristmasRound(db, room, now = Date.now()) {
  const g = room.data?.game;
  if (room.kind !== "private" || !g?.roundResults?.length) return;
  const current = await christmasConfig(db, now);
  if (!current.enabled) return;
  for (const result of g.roundResults) {
    if (!["friends-v1", "friends-v2"].includes(result.activityRule)) continue;
    const ids = result.participantIds;
    if (!Array.isArray(ids) || ![2, 3, 4].includes(ids.length) || new Set(ids).size !== ids.length || g.players.some((p) => p.bot) || !ids.every((id) => g.players.some((p) => p.id === id)))
      continue;
    const c = await christmasConfig(db, result.finishedAt);
    if (!c.canEarn || result.finishedAt > now + 1e3) continue;
    const base = c["friend" + ids.length + "Points"], modern = result.activityRule === "friends-v2";
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
          const daily = modern ? await gameDailySnapshot(db, c, pid, result.finishedAt) : null;
          const points = modern ? Math.min(base + bonus, daily.remaining) : base;
          const paidBase = Math.min(base, points), paidBonus = points - paidBase;
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
              limited: points < base + bonus
            }
          };
        },
        result.finishedAt
      );
    }
  }
}
function amount(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > 1e5)
    throw Error("invalidAmount");
  return n;
}
async function reconcileChristmas(db, pid, now = Date.now()) {
  if (!pid) return;
  const c = await christmasConfig(db, now);
  if (!c.enabled) return;
  const rows = await db.prepare(
    "SELECT DISTINCT r.id,r.kind,r.data FROM rooms r,json_each(r.data,'$.game.roundResults') result WHERE r.kind='private' AND json_extract(result.value,'$.activityRule') IN ('friends-v1','friends-v2') AND EXISTS (SELECT 1 FROM json_each(r.data,'$.players') p WHERE json_extract(p.value,'$.id')=?) AND json_extract(result.value,'$.finishedAt')>=? AND json_extract(result.value,'$.finishedAt')<=? AND NOT EXISTS (SELECT 1 FROM christmas_ledger l WHERE l.id='round:' || ? || CASE WHEN json_extract(result.value,'$.finishedAt')<? THEN '-preview:' ELSE '-live:' END || r.id || ':' || json_extract(result.value,'$.round') || ':' || ?) LIMIT 100"
  ).bind(pid, c.previewStart, Math.min(now, c.end), c.id, c.start, pid).all();
  for (const r of rows.results)
    await settleChristmasRound(db, { ...r, data: JSON.parse(r.data) }, now);
}
async function christmasAction(db, pid, b, now = Date.now()) {
  const c = await christmasConfig(db, now);
  await reconcileChristmas(db, pid, now);
  if (b.op === "christmas")
    return { christmas: await christmasSnapshot(db, pid, now) };
  if (b.op === "christmasLeaderboard")
    return { leaderboard: await weeklyLeaderboard(db, c, pid, now, b.week) };
  if (!pid) throw Error("sessionExpired");
  if (b.op === "christmasTaskEvidence")
    return socialTaskAction(db, c, pid, b, now, null);
  if (!c.enabled) throw Error("campaignUnavailable");
  if (b.op === "christmasEgg") {
    if (!c.canEarn) throw Error("campaignEnded");
    await wallet(db, c, pid);
    await db.prepare(
      "INSERT OR IGNORE INTO christmas_pets(id,claimed_at,hatch_at) VALUES(?,?,?)"
    ).bind(c.key + ":" + pid, now, now + c.hatchSeconds * 1e3).run();
  } else if (b.op === "christmasHatch") {
    if (!c.canEarn) throw Error("campaignEnded");
    const pet = await petSnapshot(db, c, pid);
    if (pet.status === "unclaimed") throw Error("eggFirst");
    if (pet.status !== "hatched") {
      if (now < pet.hatchAt) throw Error("hatchNotReady");
      await db.prepare(
        "UPDATE christmas_pets SET hatched_at=? WHERE id=? AND hatched_at IS NULL AND hatch_at<=?"
      ).bind(now, c.key + ":" + pid, now).run();
    }
  } else if ([
    "christmasTaskSubmit",
    "christmasTaskClaim",
    "christmasTaskEvidence"
  ].includes(b.op)) {
    const result = await socialTaskAction(
      db,
      c,
      pid,
      b,
      now,
      (id, reward) => changeWallet(
        db,
        c,
        pid,
        id,
        "task_feed",
        () => ({ points: 0, feed: reward, fed: 0 }),
        now
      )
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
    const count = amount(b.amount), kind = b.op === "christmasExchange" ? "exchange" : "feed";
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
      now
    );
  } else if (b.op === "christmasClaim") {
    if (!c.canClaim) throw Error("claimClosed");
    await requireHatched(db, c, pid);
    const w = await wallet(db, c, pid);
    const existing = await db.prepare("SELECT id FROM christmas_claims WHERE wallet=?").bind(w.id).first();
    if (!existing) {
      const completion = await db.prepare("SELECT id,position FROM christmas_completions WHERE campaign=? AND player=?").bind(c.key, pid).first();
      if (!completion) throw Error(w.fed < c.growthGoal ? "turkeyNotGrown" : "rankingReview");
      if (completion.position === null) throw Error("rankingReview");
      if (completion.position > 100) throw Error("weeklyNotQualified");
      const name = String(b.name || "").trim().slice(0, 80), contact = String(b.contact || "").replace(/[^\d+]/g, "");
      if (name.length < 2 || !/^\+?\d{10,15}$/.test(contact) || b.consent !== true)
        throw Error("claimDetailsRequired");
      const normalized = contact.replace(/^\+/, ""), contactKey = c.key + ":" + normalized;
      if (await db.prepare("SELECT id FROM christmas_claims WHERE contact_key=?").bind(contactKey).first())
        throw Error("contactAlreadyUsed");
      const id = crypto.randomUUID();
      try {
        await db.prepare(
          "INSERT INTO christmas_claims (id,campaign,wallet,player,name,contact,contact_key,status,created,updated,completion_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
        ).bind(
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
          completion.id
        ).run();
      } catch (error) {
        if (await db.prepare("SELECT id FROM christmas_claims WHERE wallet=?").bind(w.id).first())
          return { christmas: await christmasSnapshot(db, pid, now) };
        if (await db.prepare("SELECT id FROM christmas_claims WHERE contact_key=?").bind(contactKey).first())
          throw Error("contactAlreadyUsed");
        throw error;
      }
    }
  } else throw Error("invalidAction");
  return { christmas: await christmasSnapshot(db, pid, now) };
}

// backend/src/game-controller.ts
import { env } from "./db.mjs";

// backend/src/domain/engine.mjs
var COLORS = ["red", "yellow", "green", "blue"];
function deck() {
  let n = 0, a = [];
  for (const c of COLORS) {
    a.push({ id: ++n, color: c, value: "0" });
    for (const v of [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "skip",
      "reverse",
      "+2"
    ])
      for (let i = 0; i < 2; i++) a.push({ id: ++n, color: c, value: v });
  }
  for (const v of ["wild", "+4"])
    for (let i = 0; i < 4; i++) a.push({ id: ++n, color: "wild", value: v });
  return a;
}
function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function newGame(players, rounds = 1) {
  return startRound({
    players: players.map((p) => ({ ...p, hand: [], score: 0 })),
    rounds,
    round: 0,
    direction: 1,
    events: []
  });
}
function startRound(g) {
  g.round++;
  g.deck = shuffle(deck());
  g.discard = [];
  g.status = "playing";
  g.winner = null;
  g.roundStartedAt = Date.now();
  g.roundResults ||= [];
  g.drawn = null;
  g.turn = 0;
  g.turnSeq = (g.turnSeq || 0) + 1;
  g.direction = 1;
  for (const p of g.players) p.hand = g.deck.splice(0, 7);
  let i = g.deck.findIndex((c) => /^\d$/.test(c.value));
  g.discard.push(g.deck.splice(i, 1)[0]);
  g.color = g.discard[0].color;
  g.turnAt = Date.now();
  g.eventSeq = (g.eventSeq || 0) + 1;
  g.events = [{ seq: g.eventSeq, key: "roundStart", name: "", value: g.round }];
  return g;
}
function canPlay(g, p, c) {
  if (g.drawn && g.drawn !== c.id) return false;
  if (c.value === "+4") return !p.hand.some((x) => x.color === g.color);
  return c.color === "wild" || c.color === g.color || c.value === g.discard.at(-1).value;
}
function drawCards(g, p, n) {
  const before = p.hand.length;
  for (let i = 0; i < n; i++) {
    if (!g.deck.length) {
      const top = g.discard.pop();
      g.deck = shuffle(g.discard);
      g.discard = [top];
    }
    if (g.deck.length) p.hand.push(g.deck.pop());
  }
  return p.hand.length - before;
}
function next(g, n = 1) {
  g.turn = (g.turn + g.direction * n + g.players.length * 4) % g.players.length;
  g.drawn = null;
  g.turnSeq = (g.turnSeq || 0) + 1;
  g.turnAt = Date.now();
}
function event(g, key, p, value) {
  g.eventSeq = (g.eventSeq || 0) + 1;
  g.events.push({ seq: g.eventSeq, player: p.id, key, name: p.name, value });
  g.events = g.events.slice(-8);
}
function act(g, pid, a) {
  if (g.status !== "playing") throw Error("notPlaying");
  const p = g.players[g.turn];
  if (p.id !== pid) throw Error("notTurn");
  if (a.type === "draw") {
    if (g.drawn) throw Error("alreadyDrawn");
    let count = 0;
    let playable = null;
    while (count < 108) {
      if (!drawCards(g, p, 1)) break;
      count++;
      const card = p.hand.at(-1);
      if (canPlay(g, p, card)) {
        playable = card;
        break;
      }
    }
    event(g, count === 1 ? "drew" : "drewMany", p, count);
    if (playable) g.drawn = playable.id;
    else next(g);
    return g;
  }
  if (a.type === "pass") {
    if (!g.drawn) throw Error("mustDraw");
    next(g);
    return g;
  }
  if (a.type !== "play") throw Error("invalidAction");
  const ids = a.cardIds === void 0 ? [a.cardId] : a.cardIds;
  if (!Array.isArray(ids) || !ids.length || ids.length > p.hand.length || new Set(ids).size !== ids.length)
    throw Error("invalidCard");
  const cards = ids.map((id) => p.hand.find((c2) => c2.id === id));
  if (cards.some((c2) => !c2)) throw Error("invalidCard");
  const first = cards[0];
  if (!canPlay(g, p, first)) throw Error("invalidCard");
  if (cards.length > 1 && (!/^\d$/.test(first.value) || cards.some((c2) => c2.value !== first.value)))
    throw Error("invalidBatch");
  if (first.color === "wild" && !COLORS.includes(a.color))
    throw Error("chooseColor");
  const batchColors = [...new Set(cards.map((c2) => c2.color))];
  if (cards.length > 1 && a.color !== void 0 && !batchColors.includes(a.color))
    throw Error("invalidBatchColor");
  const played = [...cards];
  if (cards.length > 1 && a.color !== void 0) {
    const topIndex = played.findLastIndex((c2) => c2.color === a.color);
    played.push(...played.splice(topIndex, 1));
  }
  p.hand = p.hand.filter((c2) => !ids.includes(c2.id));
  g.discard.push(...played);
  const c = played.at(-1);
  g.color = c.color === "wild" ? a.color : c.color;
  g.drawn = null;
  event(
    g,
    cards.length > 1 ? "playedMany" : "played",
    p,
    cards.length > 1 ? cards.length : c.value
  );
  if (p.hand.length === 1) {
    if (!a.uno) {
      drawCards(g, p, 2);
      event(g, "unoPenalty", p, 2);
    } else event(g, "calledUno", p, 0);
  }
  if (c.value === "reverse") g.direction *= -1;
  if (c.value === "+2" || c.value === "+4") {
    const target = g.players[(g.turn + g.direction + g.players.length) % g.players.length];
    drawCards(g, target, c.value === "+2" ? 2 : 4);
    event(g, "penalty", target, c.value === "+2" ? 2 : 4);
  }
  if (!p.hand.length) {
    const points = g.players.filter((x) => x.id !== p.id).reduce(
      (s, x) => s + x.hand.reduce(
        (sum, card) => sum + (card.color === "wild" ? 50 : /^\d$/.test(card.value) ? Number(card.value) : 20),
        0
      ),
      0
    );
    p.score += points;
    g.roundResults ||= [];
    g.roundResults.push({
      round: g.round,
      winner: p.id,
      points,
      finishedAt: Date.now(),
      activityRule: "friends-v2",
      participantIds: g.players.filter((player) => !player.bot).map((player) => player.id)
    });
    g.winner = p.id;
    g.status = g.round >= g.rounds ? "finished" : "roundOver";
    event(g, "won", p, points);
    return g;
  }
  next(
    g,
    ["skip", "+2", "+4"].includes(c.value) || c.value === "reverse" && g.players.length === 2 ? 2 : 1
  );
  return g;
}
function botAction(g) {
  const p = g.players[g.turn], options = p.hand.filter((c2) => canPlay(g, p, c2));
  if (!options.length) return { type: g.drawn ? "pass" : "draw" };
  const c = options.sort(
    (a, b) => (a.color === "wild") - (b.color === "wild")
  )[0];
  const companions = /^\d$/.test(c.value) ? p.hand.filter((x) => x.id !== c.id && x.value === c.value) : [];
  const played = [c, ...companions];
  const allowed = c.color === "wild" ? COLORS : [...new Set(played.map((card) => card.color))];
  const remaining = p.hand.filter(
    (card) => !played.some((chosen) => chosen.id === card.id)
  );
  const color = allowed.reduce(
    (best, value) => remaining.filter((card) => card.color === value).length > remaining.filter((card) => card.color === best).length ? value : best,
    allowed[0]
  );
  return {
    type: "play",
    cardIds: [c.id, ...companions.map((x) => x.id)],
    color,
    uno: true
  };
}
function view(g, pid) {
  if (!g) return null;
  return {
    ...g,
    deck: void 0,
    deckCount: g.deck.length,
    discard: [g.discard.at(-1)],
    players: g.players.map((p) => ({
      ...p,
      hand: p.id === pid ? p.hand : void 0,
      count: p.hand.length,
      wins: (g.roundResults || []).filter((result) => result.winner === p.id).length
    })),
    canPlay: g.status === "playing" && g.players[g.turn].id === pid ? g.players[g.turn].hand.filter((c) => canPlay(g, g.players[g.turn], c)).map((c) => c.id) : []
  };
}

// backend/src/game-controller.ts
var dynamic = "force-dynamic";
var json = (x, status = 200) => Response.json(x, { status, headers: { "Cache-Control": "no-store" } });
function fail(key) {
  throw new Error(key);
}
async function session(req) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) fail("sessionExpired");
  const s = await env.DB.prepare("SELECT * FROM sessions WHERE token=?").bind(token).first();
  if (!s) fail("sessionExpired");
  await env.DB.prepare("UPDATE sessions SET seen=? WHERE id=?").bind(Date.now(), s.id).run();
  return s;
}
async function getRoom(id) {
  const r = await env.DB.prepare("SELECT * FROM rooms WHERE id=?").bind(id).first();
  if (!r) fail("roomMissing");
  r.data = JSON.parse(r.data);
  return r;
}
async function update(r) {
  const q = await env.DB.prepare(
    "UPDATE rooms SET data=?,status=?,rev=rev+1,updated=? WHERE id=? AND rev=?"
  ).bind(JSON.stringify(r.data), r.status, Date.now(), r.id, r.rev).run();
  if (q.meta.changes > 0) {
    r.rev++;
    return true;
  }
  return false;
}
async function mutate(id, fn) {
  for (let i = 0; i < 8; i++) {
    const r = await getRoom(id);
    const result = await fn(r);
    if (await update(r)) return { r, result };
  }
  fail("retry");
}
function check(r, s) {
  if (!r.data.players.some((p) => p.id === s.id)) fail("notMember");
}
async function response(r, s) {
  await settleChristmasRound(env.DB, r);
  return {
    christmas: await christmasSnapshot(env.DB, s.id),
    room: {
      id: r.id,
      code: r.code,
      kind: r.kind,
      status: r.status,
      rev: r.rev,
      host: r.data.host,
      capacity: r.data.capacity,
      rounds: r.data.rounds,
      rewards: await roundRewards(env.DB, r),
      queuedAt: r.kind === "online" ? r.data.queuedAt ?? r.updated : null,
      players: r.data.players,
      game: view(r.data.game, s.id)
    }
  };
}
async function expiredTurn(r) {
  const g = r.data.game;
  if (g?.status === "playing" && Date.now() - g.turnAt > 3e4) {
    const p = g.players[g.turn];
    act(g, p.id, { type: g.drawn ? "pass" : "draw" });
    if (g.drawn) act(g, p.id, { type: "pass" });
    r.status = g.status;
  }
}
function onlineCapacity(data) {
  return [2, 3, 4].includes(Number(data.capacity)) ? Number(data.capacity) : 2;
}
async function resolveRoom(id) {
  const visited = /* @__PURE__ */ new Set();
  for (let i = 0; i < 8; i++) {
    if (visited.has(id)) fail("roomMissing");
    visited.add(id);
    const room = await getRoom(id);
    if (room.status !== "redirect") return room;
    id = room.data.redirect;
  }
  fail("retry");
}
async function activeRoomFor(player) {
  const row = await env.DB.prepare(
    "SELECT id FROM rooms WHERE status IN ('waiting','playing','roundOver') AND updated>? AND EXISTS (SELECT 1 FROM json_each(rooms.data,'$.players') p WHERE json_extract(p.value,'$.id')=?) ORDER BY updated DESC LIMIT 1"
  ).bind(Date.now() - 36e5, player).first();
  return row ? resolveRoom(row.id) : null;
}
async function pairWaiting(initial) {
  const r = await resolveRoom(initial.id);
  if (r.kind !== "online" || r.status !== "waiting" || Date.now() - (r.data.queuedAt ?? r.updated) >= 8e3)
    return r;
  const capacity = onlineCapacity(r.data);
  const candidates = await env.DB.prepare(
    "SELECT * FROM rooms WHERE kind='online' AND status='waiting' AND id<>? AND updated>? AND coalesce(json_extract(data,'$.capacity'),2)=? ORDER BY coalesce(json_extract(data,'$.queuedAt'),updated),id LIMIT 20"
  ).bind(r.id, Date.now() - 3e4, capacity).all();
  for (const item of candidates.results) {
    const other = { ...item, data: JSON.parse(item.data) };
    if (onlineCapacity(other.data) !== capacity || Date.now() - (other.data.queuedAt ?? other.updated) >= 8e3)
      continue;
    const host = await env.DB.prepare("SELECT seen FROM sessions WHERE id=?").bind(other.data.host).first();
    if (!host || Date.now() - host.seen > 15e3) continue;
    const rAt = r.data.queuedAt ?? r.updated, otherAt = other.data.queuedAt ?? other.updated;
    const moveR = rAt > otherAt || rAt === otherAt && r.id > other.id;
    const source = moveR ? r : other;
    const destination = moveR ? other : r;
    const target = { ...destination.data };
    const combined = [...target.players, ...source.data.players];
    if (combined.length > capacity || new Set(combined.map((p) => p.id)).size !== combined.length)
      continue;
    target.capacity = capacity;
    target.players = combined;
    target.queuedAt = Math.min(
      destination.data.queuedAt ?? destination.updated,
      source.data.queuedAt ?? source.updated
    );
    const ready = combined.length === capacity;
    if (ready) {
      target.matchedAt = Date.now();
      target.game = newGame(combined, 1);
    }
    const now = Date.now(), cutoff = now - 8e3;
    const results = await env.DB.batch([
      env.DB.prepare(
        "UPDATE rooms SET status='redirect',data=?,rev=rev+1,updated=? WHERE id=? AND rev=? AND status='waiting' AND coalesce(json_extract(data,'$.queuedAt'),updated)>? AND EXISTS (SELECT 1 FROM rooms WHERE id=? AND rev=? AND status='waiting' AND coalesce(json_extract(data,'$.queuedAt'),updated)>?)"
      ).bind(
        JSON.stringify({ ...source.data, redirect: destination.id }),
        now,
        source.id,
        source.rev,
        cutoff,
        destination.id,
        destination.rev,
        cutoff
      ),
      env.DB.prepare(
        "UPDATE rooms SET status=?,data=?,rev=rev+1,updated=? WHERE id=? AND rev=? AND status='waiting' AND EXISTS (SELECT 1 FROM rooms WHERE id=? AND status='redirect' AND rev=? AND json_extract(data,'$.redirect')=?)"
      ).bind(
        ready ? "playing" : "waiting",
        JSON.stringify(target),
        now,
        destination.id,
        destination.rev,
        source.id,
        source.rev + 1,
        destination.id
      )
    ]);
    if (results[0].meta.changes && results[1].meta.changes)
      return resolveRoom(r.id);
    return resolveRoom(r.id);
  }
  return resolveRoom(r.id);
}
async function fillWithBot(source) {
  const r = await resolveRoom(source.id);
  if (r.kind !== "online" || r.status !== "waiting" || Date.now() - (r.data.queuedAt ?? r.updated) < 8e3)
    return r;
  const result = await mutate(r.id, (current) => {
    if (current.kind !== "online" || current.status !== "waiting" || Date.now() - (current.data.queuedAt ?? current.updated) < 8e3)
      return;
    const capacity = onlineCapacity(current.data);
    current.data.capacity = capacity;
    const names = ["Luna", "Rafa", "Bia"];
    while (current.data.players.length < capacity) {
      current.data.players.push({
        id: "bot-" + crypto.randomUUID(),
        name: names[current.data.players.length - 1],
        bot: true
      });
    }
    current.data.matchedAt = Date.now();
    current.data.game = newGame(current.data.players, 1);
    current.status = "playing";
  });
  return resolveRoom(result.r.id);
}
async function advanceRoom(r, s) {
  const g = r.data.game;
  if (g?.status !== "playing") return r;
  const p = g.players[g.turn];
  const due = p.bot ? Date.now() - g.turnAt >= 900 : Date.now() - g.turnAt > 3e4;
  if (!due) return r;
  const result = await mutate(r.id, async (current) => {
    check(current, s);
    const game = current.data.game;
    if (game?.status !== "playing") return;
    const player = game.players[game.turn];
    if (player.bot) {
      if (Date.now() - game.turnAt >= 900) {
        act(game, player.id, botAction(game));
        current.status = game.status;
      }
    } else await expiredTurn(current);
  });
  return result.r;
}
function cleanName(value) {
  return Array.from(
    String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().replace(/\s+/g, " ")
  ).slice(0, 20).join("");
}
async function POST(req) {
  try {
    if (!env.DB) return json({ error: "serviceUnavailable" }, 503);
    const b = await req.json();
    if (b.op === "session") {
      const token = crypto.randomUUID() + crypto.randomUUID(), id = crypto.randomUUID();
      const name = cleanName(b.name) || "Jogador-" + id.slice(0, 4).toUpperCase();
      await env.DB.prepare(
        "INSERT INTO sessions (id,token,name,tickets,seen) VALUES (?,?,?,0,?)"
      ).bind(id, token, name, Date.now()).run();
      return json({ id, token, name });
    }
    if ((b.op === "christmas" || b.op === "christmasLeaderboard") && !req.headers.get("authorization"))
      return json(await christmasAction(env.DB, null, b));
    const s = await session(req);
    if ([
      "christmas",
      "christmasGift",
      "christmasEgg",
      "christmasHatch",
      "christmasDaily",
      "christmasTaskSubmit",
      "christmasTaskClaim",
      "christmasTaskEvidence",
      "christmasExchange",
      "christmasFeed",
      "christmasClaim",
      "christmasLeaderboard"
    ].includes(b.op))
      return json(await christmasAction(env.DB, s.id, b));
    if (b.op === "profile") return json({ id: s.id, name: s.name });
    if (b.op === "rename") {
      const name = cleanName(b.name);
      if (Array.from(name).length < 2) fail("nameRequired");
      await env.DB.prepare("UPDATE sessions SET name=? WHERE id=?").bind(name, s.id).run();
      const active = await env.DB.prepare(
        "SELECT id FROM rooms WHERE status IN ('waiting','playing','roundOver') AND EXISTS (SELECT 1 FROM json_each(rooms.data,'$.players') WHERE json_extract(value,'$.id')=?)"
      ).bind(s.id).all();
      for (const item of active.results)
        await mutate(item.id, (r) => {
          const p = r.data.players.find((p2) => p2.id === s.id);
          if (p) p.name = name;
          const gp = r.data.game?.players.find((p2) => p2.id === s.id);
          if (gp) gp.name = name;
        });
      return json({ name });
    }
    if (b.op === "create" || b.op === "match") {
      const requested = b.capacity === void 0 ? 2 : Number(b.capacity);
      if (b.op === "match" && ![2, 3, 4].includes(requested))
        fail("invalidMatchSize");
      const existing = await activeRoomFor(s.id);
      if (existing) {
        const current2 = existing.kind === "online" && existing.status === "waiting" ? await fillWithBot(await pairWaiting(existing)) : existing;
        return json(await response(current2, s));
      }
      const id = crypto.randomUUID(), kind = b.op === "match" ? "online" : "private";
      let code = String(
        crypto.getRandomValues(new Uint32Array(1))[0] % 9e5 + 1e5
      );
      const capacity = kind === "online" ? requested : [2, 3, 4].includes(Number(b.capacity)) ? Number(b.capacity) : 4;
      const rounds = kind === "online" ? 1 : [1, 3, 5].includes(Number(b.rounds)) ? Number(b.rounds) : 1;
      const data = {
        host: s.id,
        queuedAt: kind === "online" ? Date.now() : void 0,
        capacity,
        rounds,
        players: [{ id: s.id, name: s.name }],
        game: null
      };
      for (let attempt = 0; attempt < 12; attempt++) {
        try {
          await env.DB.prepare(
            "INSERT INTO rooms (id,code,kind,status,data,rev,updated) SELECT ?,?,?,'waiting',?,0,? WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE status IN ('waiting','playing','roundOver') AND updated>? AND EXISTS (SELECT 1 FROM json_each(rooms.data,'$.players') p WHERE json_extract(p.value,'$.id')=?))"
          ).bind(
            id,
            code,
            kind,
            JSON.stringify(data),
            Date.now(),
            Date.now() - 36e5,
            s.id
          ).run();
          break;
        } catch (e) {
          if (!String(e.message).includes("rooms.code") || attempt === 11)
            throw e;
          code = String(
            crypto.getRandomValues(new Uint32Array(1))[0] % 9e5 + 1e5
          );
        }
      }
      let current = await activeRoomFor(s.id);
      if (!current) fail("retry");
      if (current.kind === "online" && current.status === "waiting")
        current = await fillWithBot(await pairWaiting(current));
      check(current, s);
      return json(await response(current, s));
    }
    if (b.op === "join") {
      if (!/^\d{6}$/.test(String(b.code))) fail("invalidCode");
      const target = await env.DB.prepare(
        b.joinRoomId ? "SELECT id FROM rooms WHERE id=? AND kind='private' AND status IN ('waiting','playing','roundOver') AND updated>?" : "SELECT id FROM rooms WHERE code=? AND kind='private' AND status IN ('waiting','playing','roundOver') AND updated>?"
      ).bind(b.joinRoomId || b.code, Date.now() - 36e5).first();
      if (!target) fail("roomMissing");
      const { r } = await mutate(target.id, (r2) => {
        if (r2.data.players.some((p) => p.id === s.id)) return;
        if (r2.status !== "waiting") fail("alreadyStarted");
        if (r2.data.players.length >= r2.data.capacity) fail("roomFull");
        r2.data.players.push({ id: s.id, name: s.name });
      });
      return json(await response(r, s));
    }
    if (b.op === "state") {
      let r = await resolveRoom(b.room);
      check(r, s);
      if (r.status === "waiting" && r.kind === "online" && r.data.queuedAt === void 0) {
        const initialized = await mutate(r.id, (current) => {
          if (current.data.queuedAt === void 0)
            current.data.queuedAt = Date.now();
        });
        r = initialized.r;
      }
      if (r.status === "waiting" && r.kind === "online")
        r = await pairWaiting(r);
      if (r.status === "waiting" && r.kind === "online")
        r = await fillWithBot(r);
      if (r.status === "waiting" && r.kind === "online") {
        await env.DB.prepare(
          "UPDATE rooms SET updated=? WHERE id=? AND status='waiting'"
        ).bind(Date.now(), r.id).run();
      }
      r = await resolveRoom(r.id);
      check(r, s);
      r = await advanceRoom(r, s);
      return json(await response(r, s));
    }
    if (b.op === "start" || b.op === "next" || b.op === "action") {
      if (b.op === "next") {
        const previous = await getRoom(b.room);
        check(previous, s);
        await settleChristmasRound(env.DB, previous);
      }
      const { r } = await mutate(b.room, async (r2) => {
        check(r2, s);
        if (b.op === "start") {
          if (r2.kind !== "private") fail("invalidAction");
          if (r2.data.host !== s.id) fail("hostOnly");
          if (r2.status !== "waiting") fail("alreadyStarted");
          if (r2.data.players.length < 2) fail("needPlayers");
          r2.data.game = newGame(r2.data.players, r2.data.rounds);
          r2.status = "playing";
        } else if (b.op === "next") {
          if (r2.data.host !== s.id) fail("hostOnly");
          if (r2.data.game?.status !== "roundOver") fail("notPlaying");
          startRound(r2.data.game);
          r2.status = "playing";
        } else {
          if (!r2.data.game) fail("notPlaying");
          if (Number(b.rev) !== r2.rev) fail("staleTurn");
          act(r2.data.game, s.id, b.action);
          r2.status = r2.data.game.status;
        }
      });
      return json(await response(r, s));
    }
    if (b.op === "leave") {
      for (let attempt = 0; attempt < 8; attempt++) {
        const current = await resolveRoom(b.room);
        try {
          await mutate(current.id, (r) => {
            if (r.status === "redirect") fail("roomMoved");
            check(r, s);
            if (r.status === "waiting") {
              r.data.players = r.data.players.filter((p) => p.id !== s.id);
              if (!r.data.players.length) r.status = "closed";
              else r.data.host = r.data.players[0].id;
            } else if (r.status === "playing" || r.status === "roundOver") {
              r.status = "closed";
              if (r.data.game) {
                r.data.game.status = "abandoned";
                r.data.game.left = s.name;
              }
            } else r.status = "closed";
          });
          return json({ ok: true });
        } catch (e) {
          if (e.message !== "roomMoved") throw e;
        }
      }
      fail("retry");
    }
    fail("invalidAction");
  } catch (e) {
    const error = e.message;
    const known = [
      "notPlaying",
      "notTurn",
      "alreadyDrawn",
      "mustDraw",
      "invalidAction",
      "invalidCard",
      "invalidBatch",
      "invalidBatchColor",
      "chooseColor",
      "sessionExpired",
      "roomMissing",
      "notMember",
      "retry",
      "roomFull",
      "nameRequired",
      "noTickets",
      "invalidCode",
      "invalidMatchSize",
      "alreadyStarted",
      "hostOnly",
      "needPlayers",
      "staleTurn",
      "campaignUnavailable",
      "invalidAmount",
      "previewOnly",
      "campaignEnded",
      "notEnoughPoints",
      "taskProofRequired",
      "taskImageTooLarge",
      "taskImageInvalid",
      "taskDetailsRequired",
      "taskProfileLocked",
      "taskPhizUsed",
      "taskMissing",
      "taskNotApproved",
      "taskAttemptLimit",
      "taskDailyLimit",
      "missionNotReady",
      "hatchFirst",
      "eggFirst",
      "hatchNotReady",
      "friendPointsOnly",
      "notEnoughFeed",
      "turkeyGrown",
      "turkeyNotGrown",
      "claimClosed",
      "claimDetailsRequired",
      "contactAlreadyUsed",
      "weeklyNotQualified",
      "rankingReview",
      "invalidWeek"
    ];
    return json(
      { error: known.includes(error) ? error : "serviceUnavailable" },
      400
    );
  }
}
export {
  POST,
  dynamic
};
