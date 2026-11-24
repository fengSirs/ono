// Authorized SSH operators only. Evidence is never served from a public URL.
import { mkdir, writeFile, chmod } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { christmasConfig } from "../runtime/domain/christmas.mjs";
process.env.ONO_DB ||= new URL("../data/ono.sqlite", import.meta.url).pathname;
const { env, closeDatabase } = await import("../runtime/db.mjs");
const db = env.DB,
  [command = "list", arg, ...rest] = process.argv.slice(2);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
try {
  const cfg = await christmasConfig(db);
  if (command === "list") {
    const status = arg || "pending",
      offset = Number(rest[0] || 0);
    if (
      !["pending", "approved", "rejected", "claimed", "all"].includes(status) ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    )
      throw Error(
        "Usage: list [pending|approved|rejected|claimed|all] [offset]",
      );
    const result = await db
      .prepare(
        "SELECT id,wallet,player,day,task,phiz_id,reward,status,attempts,note,created,updated FROM christmas_feed_tasks WHERE campaign=? AND (?='all' OR status=?) ORDER BY created LIMIT 100 OFFSET ?",
      )
      .bind(cfg.key, status, status, offset)
      .all();
    console.log(
      JSON.stringify(
        {
          campaign: cfg.key,
          offset,
          nextOffset: result.results.length === 100 ? offset + 100 : null,
          tasks: result.results,
        },
        null,
        2,
      ),
    );
  } else if (
    ["report", "approve", "reject", "correct-profile"].includes(command)
  ) {
    const row = await db
      .prepare("SELECT * FROM christmas_feed_tasks WHERE id=?")
      .bind(arg || "")
      .first();
    if (!row) throw Error("Task submission not found");
    if (command === "correct-profile") {
      if (row.campaign !== cfg.key)
        throw Error("Profile is outside the current phase");
      const phizId = String(rest[0] || "")
          .normalize("NFKC")
          .replace(/[\u0000-\u001f\u007f]/g, " ")
          .trim()
          .slice(0, 80),
        note = rest.slice(1).join(" ").trim().slice(0, 500);
      if (phizId.length < 3 || note.length < 2)
        throw Error("Usage: correct-profile SUBMISSION_ID NEW_PHIZ_ID REASON");
      const granted = await db
        .prepare(
          "SELECT count(*) AS n FROM christmas_feed_tasks WHERE wallet=? AND status IN ('approved','claimed')",
        )
        .bind(row.wallet)
        .first();
      if (granted.n)
        throw Error("Cannot change an identity with approved or claimed tasks");
      const phizKey = cfg.key + ":" + phizId.toLowerCase(),
        other = await db
          .prepare(
            "SELECT id FROM christmas_phiz_profiles WHERE phiz_key=? AND id<>?",
          )
          .bind(phizKey, row.wallet)
          .first();
      if (other) throw Error("Phiz ID already linked");
      const stamp = Date.now(),
        reason = "Phiz ID corrected; resubmit evidence. " + note;
      const updates = await db.batch([
        db
          .prepare(
            "INSERT INTO christmas_task_audit(id,submission,action,note,created,payload) SELECT ?||':'||id,id,'correct-profile',?,?,? FROM christmas_feed_tasks WHERE wallet=? AND NOT EXISTS(SELECT 1 FROM christmas_feed_tasks WHERE wallet=? AND status IN ('approved','claimed'))",
          )
          .bind(
            crypto.randomUUID(),
            reason,
            stamp,
            JSON.stringify({ from: row.phiz_id, to: phizId }),
            row.wallet,
            row.wallet,
          ),
        db
          .prepare(
            "UPDATE christmas_phiz_profiles SET phiz_id=?,phiz_key=? WHERE id=? AND NOT EXISTS(SELECT 1 FROM christmas_feed_tasks WHERE wallet=? AND status IN ('approved','claimed'))",
          )
          .bind(phizId, phizKey, row.wallet, row.wallet),
        db
          .prepare(
            "UPDATE christmas_feed_tasks SET phiz_id=?,phiz_key=?,status='rejected',note=?,version=version+1,updated=? WHERE wallet=? AND status IN ('pending','rejected') AND NOT EXISTS(SELECT 1 FROM christmas_feed_tasks WHERE wallet=? AND status IN ('approved','claimed'))",
          )
          .bind(phizId, phizKey, reason, stamp, row.wallet, row.wallet),
      ]);
      if (!updates[1].meta.changes)
        throw Error(
          "Identity changed concurrently or already has approved tasks",
        );
      console.log(
        JSON.stringify({ wallet: row.wallet, phizId, corrected: true }),
      );
    } else if (command === "report") {
      if (!rest[0])
        throw Error("Usage: report ID /absolute/private/review.html");
      const out = resolve(rest[0]);
      if (out.includes("/public/") || out.startsWith("/www/wwwroot/"))
        throw Error(
          "Evidence reports must stay outside public web directories",
        );
      const audits = (
        await db
          .prepare(
            "SELECT action,note,created,payload FROM christmas_task_audit WHERE submission=? ORDER BY created",
          )
          .bind(row.id)
          .all()
      ).results;
      const images = (proofs) =>
        proofs
          .map(
            (src, i) =>
              '<figure><img src="' +
              src +
              '" alt="Evidence ' +
              (i + 1) +
              '"></figure>',
          )
          .join("");
      const html =
        '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Private task review</title><style>body{max-width:1000px;margin:30px auto;padding:20px;font:16px/1.7 system-ui;color:#25372c;background:#faf7ed}h1{font-size:26px}dl{background:#fff;padding:20px;border:1px solid #ddd}dt{font-weight:bold}dd{margin:0 0 12px;white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:100%;height:auto;border:1px solid #ddd}figure{margin:20px 0}small{color:#666}pre{white-space:pre-wrap}article{padding:15px;border-top:1px solid #ccc}</style><h1>Private evidence review · ' +
        esc(row.task) +
        "</h1><p>Manual verification required. Compare the Phiz ID, task date and actual completion; this report does not verify actions automatically.</p><dl>" +
        Object.entries({
          ID: row.id,
          Campaign: row.campaign,
          Day: row.day,
          "Phiz ID": row.phiz_id,
          Task: row.task,
          Status: row.status,
          "Feed reward": row.reward,
          Attempt: row.attempts,
          Details: row.details,
          "Review note": row.note,
        })
          .map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>")
          .join("") +
        "</dl>" +
        images(JSON.parse(row.proofs)) +
        "<h2>Audit history</h2>" +
        audits
          .map((a) => {
            let payload = {};
            try {
              payload = JSON.parse(a.payload);
            } catch {}
            return (
              "<article><b>" +
              esc(a.action) +
              "</b> · " +
              esc(new Date(a.created).toISOString()) +
              "<p>" +
              esc(a.note) +
              "</p>" +
              (payload.details
                ? "<pre>" + esc(payload.details) + "</pre>"
                : "") +
              (payload.proofs ? images(payload.proofs) : "") +
              "</article>"
            );
          })
          .join("") +
        "<small>Contains private evidence. Do not publish or forward outside the authorized review team.</small></html>";
      await mkdir(dirname(out), { recursive: true, mode: 0o700 });
      await writeFile(out, html, { mode: 0o600 });
      await chmod(out, 0o600);
      console.log("Private review report saved: " + out);
    } else {
      if (!cfg.canEarn || row.campaign !== cfg.key)
        throw Error("Task is outside the active reward phase");
      const note = rest.join(" ").trim().slice(0, 500);
      if (note.length < 2)
        throw Error("A review note or rejection reason is required");
      const next = command === "approve" ? "approved" : "rejected",
        stamp = Date.now();
      const results = await db.batch([
        db
          .prepare(
            "INSERT INTO christmas_task_audit(id,submission,action,note,created,payload) SELECT ?,id,?,?,?,'{}' FROM christmas_feed_tasks WHERE id=? AND status='pending' AND version=?",
          )
          .bind(crypto.randomUUID(), command, note, stamp, row.id, row.version),
        db
          .prepare(
            "UPDATE christmas_feed_tasks SET status=?,note=?,version=version+1,updated=? WHERE id=? AND status='pending' AND version=?",
          )
          .bind(next, note, stamp, row.id, row.version),
      ]);
      if (!results[1].meta.changes)
        throw Error("No change: task is no longer pending");
      console.log(
        JSON.stringify({ id: row.id, status: next, feed: row.reward }),
      );
    }
  } else
    throw Error(
      "Commands: list [STATUS] [OFFSET] | report ID FILE | approve ID NOTE | reject ID REASON | correct-profile ID PHIZ_ID REASON",
    );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  closeDatabase();
}
