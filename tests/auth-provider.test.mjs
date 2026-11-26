import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("trusted Phiz code exchange maps stable identities, blocks replay, and rejects invalid provider replies", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "ono-auth-"));
  process.env.ONO_DB = join(dir, "auth.sqlite");
  process.env.AUTH_EXCHANGE_URL = "https://identity.example.com/exchange";
  process.env.AUTH_EXCHANGE_TOKEN = "test-only-secret";
  process.env.FINCLIP_APP_ID = "app-1";
  process.env.NODE_ENV = "production";
  const auth = await import("../backend/runtime/auth.mjs"),
    { POST } = await import("../backend/runtime/game-controller.mjs"),
    db = await import("../backend/runtime/db.mjs");
  await auth.initAuth();
  const original = globalThis.fetch;
  let subject = "phiz-id-1",
    replyStatus = 200;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://identity.example.com/exchange");
    assert.equal(options.headers.Authorization, "Bearer test-only-secret");
    assert.equal(JSON.parse(options.body).appId, "app-1");
    assert.equal(options.redirect, "error");
    return Response.json({ subject }, { status: replyStatus });
  };
  const core = async (b) => {
    const response = await POST(
      new Request("http://internal/game", {
        method: "POST",
        body: JSON.stringify(b),
      }),
    );
    return response.json();
  };
  try {
    const a = await auth.login({ name: "Ana", code: "code-0001" }, core, {
        mode: "finclip",
      }),
      b = await auth.login({ name: "Changed", code: "code-0002" }, core, {
        mode: "finclip",
      });
    assert.equal(a.id, b.id);
    assert.notEqual(a.token, b.token);
    assert.equal(b.name, "Ana");
    assert.equal((await auth.requireAuth("Bearer " + b.token)).player, a.id);
    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0001" }, core, { mode: "finclip" }),
      /loginCodeUsed/,
    );
    subject = { spoof: "invalid" };
    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0003" }, core, { mode: "finclip" }),
      /loginFailed/,
    );

    // Failed provider exchange releases the one-time code for a retry.
    subject = "phiz-id-1";
    const recovered = await auth.login(
      { name: "Changed", code: "code-0003" },
      core,
      { mode: "finclip" },
    );
    assert.equal(recovered.id, a.id);
    assert.equal(recovered.name, "Ana");

    replyStatus = 403;
    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0004" }, core, { mode: "finclip" }),
      /loginFailed/,
    );
    await assert.rejects(
      auth.login({ name: "Ana" }, core, { mode: "guest" }),
      /guestDisabled/,
    );
    process.env.AUTH_EXCHANGE_URL = "http://unsafe.example.com";
    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0005" }, core, { mode: "finclip" }),
      /authNotConfigured/,
    );
  } finally {
    globalThis.fetch = original;
    db.closeDatabase();
    await rm(dir, { recursive: true, force: true });
  }
});
