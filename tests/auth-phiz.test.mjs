import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("Phiz OpenId exchanges the Developer AppSecret for a stable openId", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "ono-auth-phiz-"));
  process.env.ONO_DB = join(dir, "auth.sqlite");
  process.env.NODE_ENV = "production";
  process.env.FINCLIP_APP_ID = "app-1";
  process.env.PHIZ_OPEN_BASE_URL = "https://admin.phiz.chat";
  process.env.PHIZ_APP_SECRET = "test-only-secret";
  delete process.env.AUTH_EXCHANGE_URL;
  delete process.env.AUTH_EXCHANGE_TOKEN;

  const auth = await import("../backend/runtime/auth.mjs"),
    { POST } = await import("../backend/runtime/game-controller.mjs"),
    db = await import("../backend/runtime/db.mjs");
  await auth.initAuth();

  const original = globalThis.fetch;
  let reply = { openId: "phiz-openid-1" },
    replyStatus = 200;
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(String(url));
    assert.equal(parsed.origin, "https://admin.phiz.chat");
    assert.equal(parsed.pathname, "/api/3.0/token/getOpenId");
    assert.equal(parsed.searchParams.get("appId"), "app-1");
    assert.equal(parsed.searchParams.get("appSecret"), "test-only-secret");
    assert.match(parsed.searchParams.get("code") || "", /^code-000[1-7]$/);
    assert.equal(options.method, "GET");
    assert.equal(options.body, undefined);
    assert.equal(options.headers.Authorization, undefined);
    return Response.json(reply, { status: replyStatus });
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
    assert.equal(b.name, "Ana");
    assert.notEqual(a.token, b.token);
    assert.equal((await auth.requireAuth("Bearer " + b.token)).player, a.id);

    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0001" }, core, {
        mode: "finclip",
      }),
      /loginCodeUsed/,
    );

    reply = { code: 401, msg: "authentication failed" };
    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0003" }, core, {
        mode: "finclip",
      }),
      /loginFailed/,
    );

    // Provider failure must release the reserved code so the host's still-valid
    // one-time code is not poisoned into a permanent 409 replay error.
    reply = { openId: "phiz-openid-1" };
    const recovered = await auth.login({ name: "Changed", code: "code-0003" }, core, {
      mode: "finclip",
    });
    assert.equal(recovered.id, a.id);
    assert.equal(recovered.name, "Ana");

    reply = { code: 0, data: { sessionKey: "missing-openid" } };
    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0004" }, core, {
        mode: "finclip",
      }),
      /loginFailed/,
    );

    replyStatus = 500;
    reply = { code: 0, data: { openId: "phiz-openid-1" } };
    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0005" }, core, {
        mode: "finclip",
      }),
      /loginFailed/,
    );

    process.env.PHIZ_OPEN_BASE_URL = "http://unsafe.example.com";
    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0006" }, core, {
        mode: "finclip",
      }),
      /authNotConfigured/,
    );

    process.env.PHIZ_OPEN_BASE_URL = "https://admin.phiz.chat";
    delete process.env.PHIZ_APP_SECRET;
    await assert.rejects(
      auth.login({ name: "Ana", code: "code-0007" }, core, {
        mode: "finclip",
      }),
      /authNotConfigured/,
    );
  } finally {
    globalThis.fetch = original;
    db.closeDatabase();
    await rm(dir, { recursive: true, force: true });
  }
});
