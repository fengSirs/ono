import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { createPhizCardAdapter, normalize } = createRequire(import.meta.url)(
  "../host-adapter/phiz-card.cjs",
);
const token = "a".repeat(48),
  path = "pages/invite/index?token=" + token,
  appId = "test-app";
function config(extra = {}) {
  return {
    appId,
    assetBase: "https://api.example.com",
    chat: {
      async chooseConversation() {
        return { kind: "group", id: "group-1" };
      },
      async sendMessage() {
        return { messageId: "receipt-1" };
      },
    },
    finclip: {
      async open(x) {
        return x;
      },
    },
    ...extra,
  };
}
function envelope() {
  return {
    appId,
    params: {
      title: "ONO! Sala 123456",
      desc: "Vamos jogar",
      path,
      imageUrl: "https://api.example.com/assets/invites/" + token + ".png",
      appInfo: {
        schema: "ono.invitation.v1",
        target: "phiz",
        expires: Date.now() + 60000,
      },
    },
  };
}
test("official iOS and Android payload shapes normalize to the same invitation", () => {
  const android = envelope();
  const ios = {
    appId,
    appTitle: android.params.title,
    appThumbnail: android.params.imageUrl,
    appStartParams: { path },
    appInfo: android.params.appInfo,
  };
  const a = normalize(JSON.stringify(android)),
    b = normalize(ios);
  for (const k of ["appId", "title", "path", "imageUrl"])
    assert.equal(a[k], b[k]);
});
test("friend and group sharing forwards a mini-program card and reports success after delivery receipt", async () => {
  for (const kind of ["friend", "group"]) {
    var sent;
    const adapter = createPhizCardAdapter(
      config({
        chat: {
          async chooseConversation(o) {
            assert.deepEqual(o.allow, ["friend", "group"]);
            return { kind, id: "conversation-1" };
          },
          async sendMessage(to, card) {
            sent = card;
            assert.equal(to.kind, kind);
            return { messageId: "real-receipt" };
          },
        },
      }),
    );
    assert.deepEqual(await adapter.share(envelope()), {
      status: "sent",
      messageId: "real-receipt",
    });
    assert.equal(sent.type, "mini_program");
    assert.equal(sent.launch.path, path);
    assert.equal(sent.appId, appId);
    assert.deepEqual(await adapter.open(sent), { appId, path });
  }
});
test("cancel, failed delivery, spoofed app IDs, URLs, paths and expired cards never report success", async () => {
  const cancelled = createPhizCardAdapter(
    config({
      chat: {
        async chooseConversation() {
          return null;
        },
        async sendMessage() {
          assert.fail("must not send");
        },
      },
    }),
  );
  assert.deepEqual(await cancelled.share(envelope()), { status: "cancelled" });
  const noReceipt = createPhizCardAdapter(
    config({
      chat: {
        async chooseConversation() {
          return { kind: "friend", id: "f" };
        },
        async sendMessage() {
          return {};
        },
      },
    }),
  );
  await assert.rejects(noReceipt.share(envelope()), /deliveryUnconfirmed/);
  for (const mutate of [
    (e) => (e.appId = "evil"),
    (e) => (e.params.path = "https://evil.example"),
    (e) => (e.params.imageUrl = "https://evil.example/" + token + ".png"),
    (e) => (e.params.appInfo.expires = 1),
  ]) {
    const e = envelope();
    mutate(e);
    await assert.rejects(createPhizCardAdapter(config()).share(e));
  }
  await assert.rejects(
    createPhizCardAdapter(config()).open({
      type: "mini_program",
      version: 1,
      appId: "evil",
      launch: { path },
    }),
    /invalidCard/,
  );
});
