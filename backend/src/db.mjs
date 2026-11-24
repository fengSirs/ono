import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const dbPath =
  process.env.ONO_DB ||
  resolve(dirname(fileURLToPath(import.meta.url)), "../data/ono.sqlite");
mkdirSync(dirname(dbPath), { recursive: true, mode: 0o700 });
const sqlite = new DatabaseSync(dbPath);
chmodSync(dbPath, 0o600);
sqlite.exec(
  "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;",
);
sqlite.exec(
  "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)",
);
const migrationRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "migrations",
);
for (const name of readdirSync(migrationRoot)
  .filter((x) => x.endsWith(".sql"))
  .sort()) {
  if (
    sqlite.prepare("SELECT name FROM schema_migrations WHERE name=?").get(name)
  )
    continue;
  sqlite.exec("BEGIN IMMEDIATE");
  try {
    sqlite.exec(readFileSync(resolve(migrationRoot, name), "utf8"));
    sqlite
      .prepare("INSERT INTO schema_migrations VALUES (?,?)")
      .run(name, Date.now());
    sqlite.exec("COMMIT");
  } catch (e) {
    sqlite.exec("ROLLBACK");
    throw e;
  }
}
// These indexes are self-host runtime optimizations, independent of the D1 migration journal.
sqlite.exec(
  "CREATE INDEX IF NOT EXISTS rooms_active_idx ON rooms(status,updated); CREATE INDEX IF NOT EXISTS rooms_matching_idx ON rooms(kind,status,updated);",
);
class Statement {
  constructor(sql, params = []) {
    this.sql = sql;
    this.params = params;
  }
  bind(...params) {
    return new Statement(this.sql, params);
  }
  first(column) {
    const r = sqlite.prepare(this.sql).get(...this.params) || null;
    return Promise.resolve(column && r ? r[column] : r);
  }
  all() {
    return Promise.resolve({
      results: sqlite.prepare(this.sql).all(...this.params),
      success: true,
    });
  }
  execute() {
    const r = sqlite.prepare(this.sql).run(...this.params);
    return {
      success: true,
      meta: {
        changes: Number(r.changes),
        last_row_id: Number(r.lastInsertRowid),
      },
    };
  }
  run() {
    return Promise.resolve(this.execute());
  }
}
export const env = {
  DB: {
    prepare(sql) {
      return new Statement(sql);
    },
    batch(statements) {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map((s) => s.execute());
        sqlite.exec("COMMIT");
        return Promise.resolve(results);
      } catch (e) {
        sqlite.exec("ROLLBACK");
        return Promise.reject(e);
      }
    },
  },
};
export function databaseHealth() {
  return !!sqlite.prepare("SELECT 1 AS ok").get()?.ok;
}
export function closeDatabase() {
  sqlite.close();
}
