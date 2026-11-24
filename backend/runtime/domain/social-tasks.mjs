export const SOCIAL_TASKS = Object.freeze([
  { id: "phiz_friends", goal: 3, rewardKey: "taskFeedFriends" },
  { id: "phiz_group", goal: 1, rewardKey: "taskFeedGroup" },
  { id: "phiz_moment", goal: 1, rewardKey: "taskFeedMoment" },
  { id: "anjun_tracking", goal: 1, rewardKey: "taskFeedParcel" },
]);
export function socialDay(now) {
  const day = new Date(now - 10800000).toISOString().slice(0, 10);
  return { day, end: Date.parse(day + "T03:00:00.000Z") + 86400000 };
}
function text(value, max) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}
export function validateProofs(proofs) {
  if (!Array.isArray(proofs) || proofs.length < 1 || proofs.length > 3)
    throw Error("taskProofRequired");
  return proofs.map((value) => {
    if (typeof value !== "string" || value.length > 270000)
      throw Error("taskImageTooLarge");
    const m = value.match(
      /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/,
    );
    if (!m || m[2].length % 4 !== 0) throw Error("taskImageInvalid");
    let raw;
    try {
      raw = atob(m[2]);
    } catch {
      throw Error("taskImageInvalid");
    }
    if (raw.length < 12 || raw.length > 200000)
      throw Error("taskImageTooLarge");
    const valid =
      m[1] === "jpeg"
        ? raw.charCodeAt(0) === 255 &&
          raw.charCodeAt(1) === 216 &&
          raw.charCodeAt(2) === 255
        : m[1] === "png"
          ? raw.slice(0, 8) === "\x89PNG\r\n\x1a\n"
          : raw.slice(0, 4) === "RIFF" && raw.slice(8, 12) === "WEBP";
    if (!valid) throw Error("taskImageInvalid");
    let width = 0,
      height = 0;
    const byte = (i) => raw.charCodeAt(i),
      word = (i) => byte(i) * 256 + byte(i + 1),
      uint = (i) =>
        byte(i) * 16777216 +
        byte(i + 1) * 65536 +
        byte(i + 2) * 256 +
        byte(i + 3);
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
        if (
          marker === 0 ||
          marker === 216 ||
          marker === 1 ||
          (marker >= 208 && marker <= 215)
        )
          continue;
        const length = word(pos);
        if (length < 2 || pos + length > raw.length) break;
        if (
          marker >= 192 &&
          marker <= 207 &&
          ![196, 200, 204].includes(marker)
        ) {
          height = word(pos + 3);
          width = word(pos + 5);
          break;
        }
        pos += length;
      }
    }
    if (
      !width ||
      !height ||
      width > 6000 ||
      height > 10000 ||
      width * height > 20000000
    )
      throw Error("taskImageInvalid");
    return value;
  });
}
function publicSubmission(row) {
  return row
    ? {
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
        legacy: row.reward_rule === 1,
      }
    : null;
}
async function taskQuota(db, c, wallet, day) {
  const row = await db
    .prepare(
      "SELECT count(*) AS used,coalesce(sum(reward),0) AS feed FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed')",
    )
    .bind(wallet, day)
    .first();
  return {
    used: row.used,
    reservedFeed: row.feed,
    remaining: Math.max(0, c.taskDailyLimit - row.used),
    remainingFeed: Math.max(0, c.taskDailyFeedCap - row.feed),
  };
}
export async function socialTasksSnapshot(db, c, pid, now) {
  const { day, end } = socialDay(now),
    wallet = c.key + ":" + pid;
  const profile = pid
    ? await db
        .prepare("SELECT phiz_id FROM christmas_phiz_profiles WHERE id=?")
        .bind(wallet)
        .first()
    : null;
  const rows = pid
    ? (
        await db
          .prepare(
            "SELECT s.id,s.day,s.task,s.status,s.reward,s.note,s.attempts,s.created,s.updated,s.reward_rule,json_array_length(s.proofs) AS proof_count,l.id AS credited FROM christmas_feed_tasks s LEFT JOIN christmas_ledger l ON l.id='task-feed:'||s.id WHERE s.wallet=? AND s.day=?",
          )
          .bind(wallet, day)
          .all()
      ).results
    : [];
  const history = pid
    ? (
        await db
          .prepare(
            "SELECT s.id,s.day,s.task,s.status,s.reward,s.note,s.attempts,s.created,s.updated,s.reward_rule,json_array_length(s.proofs) AS proof_count,l.id AS credited FROM christmas_feed_tasks s LEFT JOIN christmas_ledger l ON l.id='task-feed:'||s.id WHERE s.wallet=? AND s.day<>? ORDER BY (s.status='approved' AND l.id IS NULL) DESC,(s.status='pending') DESC,s.day DESC,s.updated DESC LIMIT 12",
          )
          .bind(wallet, day)
          .all()
      ).results
    : [];
  const quota = pid
    ? await taskQuota(db, c, wallet, day)
    : {
        used: 0,
        reservedFeed: 0,
        remaining: c.taskDailyLimit,
        remainingFeed: c.taskDailyFeedCap,
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
      SOCIAL_TASKS.reduce((sum, t) => sum + c[t.rewardKey], 0),
    ),
    tasks: SOCIAL_TASKS.map((t) => {
      const submission = publicSubmission(rows.find((r) => r.task === t.id));
      return {
        id: t.id,
        goal: t.goal,
        canSubmit:
          c.canEarn &&
          (!submission || submission.status === "rejected") &&
          quota.remaining > 0 &&
          quota.remainingFeed >= (submission?.reward ?? c[t.rewardKey]),
        progress:
          submission && ["approved", "claimed"].includes(submission.status)
            ? t.goal
            : 0,
        reward: submission?.reward ?? c[t.rewardKey],
        status: submission?.status || "not_started",
        ready: submission?.status === "approved" && c.canEarn,
        claimed: submission?.status === "claimed",
        submission,
      };
    }),
    history: history.map(publicSubmission),
  };
}
async function owned(db, c, pid, id) {
  const row = await db
    .prepare("SELECT * FROM christmas_feed_tasks WHERE id=? AND wallet=?")
    .bind(String(id), c.key + ":" + pid)
    .first();
  if (!row) throw Error("taskMissing");
  return row;
}
export async function socialTaskAction(db, c, pid, b, now, credit) {
  if (b.op === "christmasTaskEvidence") {
    const row = await owned(db, c, pid, b.submission);
    return {
      evidence: {
        ...publicSubmission(row),
        details: row.details,
        phizId: row.phiz_id,
        proofs: JSON.parse(row.proofs),
      },
    };
  }
  if (!c.canEarn) throw Error("campaignEnded");
  if (b.op === "christmasTaskClaim") {
    const row = await owned(db, c, pid, b.submission);
    if (!["approved", "claimed"].includes(row.status))
      throw Error("taskNotApproved");
    await credit("task-feed:" + row.id, row.reward);
    await db.batch([
      db
        .prepare(
          "INSERT OR IGNORE INTO christmas_task_audit(id,submission,action,note,created,payload) SELECT ?,id,'claim','Feed credited',?,'{}' FROM christmas_feed_tasks WHERE id=? AND status='approved' AND EXISTS(SELECT 1 FROM christmas_ledger WHERE id=?)",
        )
        .bind("claim:" + row.id, now, row.id, "task-feed:" + row.id),
      db
        .prepare(
          "UPDATE christmas_feed_tasks SET status='claimed',updated=? WHERE id=? AND status='approved' AND EXISTS(SELECT 1 FROM christmas_ledger WHERE id=?)",
        )
        .bind(now, row.id, "task-feed:" + row.id),
    ]);
    return null;
  }
  if (b.op !== "christmasTaskSubmit") throw Error("invalidAction");
  const task = SOCIAL_TASKS.find((t) => t.id === b.mission);
  if (!task) throw Error("invalidAction");
  const { day } = socialDay(now),
    wallet = c.key + ":" + pid,
    id = "social-task:" + wallet + ":" + day + ":" + task.id;
  const previous = await db
    .prepare("SELECT * FROM christmas_feed_tasks WHERE id=?")
    .bind(id)
    .first();
  if (previous && previous.status !== "rejected") return null;
  const reward = previous?.reward ?? c[task.rewardKey],
    quota = await taskQuota(db, c, wallet, day);
  if (!quota.remaining || quota.remainingFeed < reward)
    throw Error("taskDailyLimit");
  const phizId = text(b.phizId, 80),
    details = text(b.details, 1600);
  if (phizId.length < 3 || details.length < 10 || b.consent !== true)
    throw Error("taskDetailsRequired");
  const proofs = validateProofs(b.proofs),
    phizKey = c.key + ":" + phizId.toLowerCase();
  const existingProfile = await db
    .prepare("SELECT * FROM christmas_phiz_profiles WHERE id=?")
    .bind(wallet)
    .first();
  if (existingProfile && existingProfile.phiz_key !== phizKey)
    throw Error("taskProfileLocked");
  try {
    await db
      .prepare(
        "INSERT OR IGNORE INTO christmas_phiz_profiles(id,campaign,player,phiz_id,phiz_key) VALUES(?,?,?,?,?)",
      )
      .bind(wallet, c.key, pid, phizId, phizKey)
      .run();
  } catch {
    throw Error("taskPhizUsed");
  }
  const profile = await db
    .prepare("SELECT * FROM christmas_phiz_profiles WHERE id=?")
    .bind(wallet)
    .first();
  if (!profile) throw Error("taskPhizUsed");
  if (profile.phiz_key !== phizKey) throw Error("taskProfileLocked");
  if (previous) {
    if (previous.attempts >= 3) throw Error("taskAttemptLimit");
    const previousPayload = JSON.stringify({
      details: previous.details,
      proofs: JSON.parse(previous.proofs),
      note: previous.note,
      attempt: previous.attempts,
    });
    const guard =
      " AND (SELECT count(*) FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed'))<? AND (SELECT coalesce(sum(reward),0) FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed'))+?<=?";
    const limits = [
      wallet,
      day,
      c.taskDailyLimit,
      wallet,
      day,
      reward,
      c.taskDailyFeedCap,
    ];
    const result = await db.batch([
      db
        .prepare(
          "INSERT OR IGNORE INTO christmas_task_audit(id,submission,action,note,created,payload) SELECT ?,id,'resubmit','Previous evidence retained',?,? FROM christmas_feed_tasks WHERE id=? AND status='rejected' AND version=?" +
            guard,
        )
        .bind(
          "resubmit:" + id + ":" + previous.version,
          now,
          previousPayload,
          id,
          previous.version,
          ...limits,
        ),
      db
        .prepare(
          "UPDATE christmas_feed_tasks SET status='pending',details=?,proofs=?,note='',reward_rule=2,attempts=attempts+1,version=version+1,updated=? WHERE id=? AND status='rejected' AND version=?" +
            guard,
        )
        .bind(
          details,
          JSON.stringify(proofs),
          now,
          id,
          previous.version,
          ...limits,
        ),
    ]);
    if (
      !result[1].meta.changes &&
      (await owned(db, c, pid, id)).status === "rejected"
    )
      throw Error("taskDailyLimit");
  } else {
    const result = await db
      .prepare(
        "INSERT OR IGNORE INTO christmas_feed_tasks(id,campaign,wallet,player,phiz_id,phiz_key,day,task,details,proofs,reward,reward_rule,status,created,updated) SELECT ?,?,?,?,?,?,?,?,?,?,?,2,'pending',?,? WHERE (SELECT count(*) FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed'))<? AND (SELECT coalesce(sum(reward),0) FROM christmas_feed_tasks WHERE wallet=? AND day=? AND status IN ('pending','approved','claimed'))+?<=?",
      )
      .bind(
        id,
        c.key,
        wallet,
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
        wallet,
        day,
        c.taskDailyLimit,
        wallet,
        day,
        reward,
        c.taskDailyFeedCap,
      )
      .run();
    if (!result.meta.changes) {
      const existing = await db
        .prepare("SELECT id FROM christmas_feed_tasks WHERE id=?")
        .bind(id)
        .first();
      if (!existing) throw Error("taskDailyLimit");
    }
  }
  return null;
}
