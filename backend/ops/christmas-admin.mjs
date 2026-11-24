// Run over SSH as the service user or an authorized server operator.
import { readFile } from "node:fs/promises";
import {
  christmasConfig,
  CHRISTMAS_DEFAULTS,
} from "../runtime/domain/christmas.mjs";
process.env.ONO_DB ||= new URL("../data/ono.sqlite", import.meta.url).pathname;
const { env, closeDatabase } = await import("../runtime/db.mjs");
const db = env.DB,
  [command = "status", arg, ...extra] = process.argv.slice(2);
try {
  const cfg = await christmasConfig(db);
  if (command === "status") {
    const counts = (
      await db
        .prepare(
          "SELECT campaign,status,count(*) AS count FROM christmas_claims GROUP BY campaign,status",
        )
        .all()
    ).results;
    console.log(JSON.stringify({ config: cfg, claims: counts }, null, 2));
  } else if (command === "config") {
    if (!arg)
      throw Error("Usage: christmas-admin.mjs config /absolute/settings.json");
    const changes = JSON.parse(await readFile(arg, "utf8"));
    if (
      [
        "previewGift",
        "dailyPlay1Points",
        "dailyPlay3Points",
        "dailyScore50Points",
      ].some((key) => changes[key] !== undefined && changes[key] !== 0)
    )
      throw Error(
        "Only completed friend-room rounds can award points; gifts and daily point bonuses are disabled",
      );
    const allowed = Object.keys(CHRISTMAS_DEFAULTS);
    if (Object.keys(changes).some((k) => !allowed.includes(k)))
      throw Error("Unknown config field");
    const merged = { ...cfg, ...changes };
    const { resolveChristmas } = await import(
      "../runtime/domain/christmas.mjs"
    );
    resolveChristmas(merged);
    if (
      merged.stockTotal !== null &&
      (!Number.isSafeInteger(merged.stockTotal) || merged.stockTotal < 0)
    )
      throw Error("Invalid stockTotal");
    const approved = await db
      .prepare(
        "SELECT count(*) AS n FROM christmas_claims WHERE campaign=? AND status IN ('approved','shipped')",
      )
      .bind(merged.id + "-live")
      .first();
    if (merged.stockTotal !== null && merged.stockTotal < approved.n)
      throw Error("Stock cannot be below already approved claims");
    const settings = Object.fromEntries(allowed.map((k) => [k, merged[k]]));
    await db
      .prepare(
        "INSERT INTO christmas_settings (id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      )
      .bind("natal-2026", JSON.stringify(settings))
      .run();
    console.log(
      "Campaign settings saved. Test and official wallets remain separate.",
    );
  } else if (command === "claims") {
    const result = await db
      .prepare(
        "SELECT id,campaign,name,contact,status,tracking,created,updated FROM christmas_claims WHERE campaign=? ORDER BY created DESC LIMIT 200",
      )
      .bind(
        arg === "live"
          ? cfg.id + "-live"
          : arg === "preview"
            ? cfg.id + "-preview"
            : cfg.key,
      )
      .all();
    console.log(JSON.stringify(result.results, null, 2));
  } else if (["approve", "reject", "ship"].includes(command)) {
    if (!arg) throw Error("Claim id is required");
    const claim = await db
      .prepare("SELECT * FROM christmas_claims WHERE id=?")
      .bind(arg)
      .first();
    if (!claim) throw Error("Claim not found");
    const test = claim.campaign.endsWith("-preview");
    let result;
    if (command === "approve") {
      if (test) {
        result = await db
          .prepare(
            "UPDATE christmas_claims SET status='test_approved',updated=? WHERE id=? AND status='test_pending'",
          )
          .bind(Date.now(), arg)
          .run();
      } else {
        if (cfg.stockTotal === null)
          throw Error("Set the real stockTotal before approving real claims");
        result = await db
          .prepare(
            "UPDATE christmas_claims SET status='approved',updated=? WHERE id=? AND status='pending' AND (SELECT count(*) FROM christmas_claims WHERE campaign=? AND status IN ('approved','shipped'))<?",
          )
          .bind(Date.now(), arg, claim.campaign, cfg.stockTotal)
          .run();
      }
    } else if (command === "reject") {
      result = await db
        .prepare(
          "UPDATE christmas_claims SET status='rejected',note=?,updated=? WHERE id=? AND status IN ('pending','approved','test_pending','test_approved')",
        )
        .bind(
          String(extra.join(" ") || "Manual review").slice(0, 300),
          Date.now(),
          arg,
        )
        .run();
    } else {
      if (test) throw Error("Test claims must never trigger real shipping");
      const tracking = extra.join(" ").trim().slice(0, 120);
      if (!tracking)
        throw Error("Provide a tracking number or delivery reference");
      result = await db
        .prepare(
          "UPDATE christmas_claims SET status='shipped',tracking=?,updated=? WHERE id=? AND status='approved'",
        )
        .bind(tracking, Date.now(), arg)
        .run();
    }
    if (!result.meta.changes)
      throw Error("No change: check claim status or remaining stock");
    console.log(
      JSON.stringify({ id: arg, action: command, test, changed: true }),
    );
  } else
    throw Error(
      "Commands: status | config FILE | claims [preview|live] | approve ID | reject ID REASON | ship ID TRACKING",
    );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  closeDatabase();
}
