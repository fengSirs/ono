import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
export const folder = resolve(import.meta.dirname, "..");
export async function launch(path, overrides = {}) {
  const child = spawn(
    process.execPath,
    [join(folder, "backend/runtime/server.mjs")],
    {
      cwd: folder,
      env: {
        ...process.env,
        ONO_DB: path,
        PORT: "0",
        HOST: "127.0.0.1",
        NODE_ENV: "test",
        ALLOW_DEV_GUESTS: "true",
        PUBLIC_BASE_URL: "",
        ...overrides,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(Error(logs || "Startup timeout"));
    }, 10000);
    child.stdout.on("data", (data) => {
      logs += data;
      const m = logs.match(/ONO API (?:listening|bound) (http:\/\/127\.0\.0\.1:\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve({ child, base: m[1] });
      }
    });
    child.stderr.on("data", (d) => (logs += d));
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code) reject(Error(logs));
    });
  });
}
export async function stop(child) {
  if (child.exitCode !== null) return;
  await new Promise((resolve) => {
    child.once("exit", resolve);
    child.kill("SIGTERM");
  });
}
export async function setup(fn, overrides = {}) {
  const dir = await mkdtemp(join(tmpdir(), "ono-finclip-test-")),
    path = join(dir, "test.sqlite");
  let s;
  try {
    s = await launch(path, overrides);
    const sql = new DatabaseSync(path);
    try {
      await fn({
        ...s,
        dir,
        path,
        sql,
        async user(name) {
          const r = await request(s.base, "/v1/auth/guest", null, { name });
          assert.equal(r.status, 200, JSON.stringify(r.data));
          return r.data.session;
        },
        game(user, b) {
          return game(s.base, user, b);
        },
      });
    } finally {
      sql.close();
    }
  } finally {
    if (s) await stop(s.child);
    await rm(dir, { recursive: true, force: true });
  }
}
export async function request(base, path, user, body, method) {
  const res = await fetch(base + path, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(user ? { Authorization: "Bearer " + user.token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}
export async function game(base, user, b) {
  const r = await request(base, "/v1/game", user, b);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return r.data;
}
