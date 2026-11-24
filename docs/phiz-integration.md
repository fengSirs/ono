# Phiz 好友 / 群聊小程序卡片接入

## 小程序已经完成的部分

房间页调用 `POST /v1/invitations` 异步准备邀请，准备成功才启用 `<button open-type="share">`。`onShareAppMessage` 同步返回 `title / desc / path / imageUrl / appInfo`，不在点击回调里临时发网络请求。

卡片入口是 `pages/invite/index?token=…`，48 位十六进制随机邀请值有效 15 分钟。它只能用于查看房间和请求入房，不包含登录 token。后端只存其 SHA-256 摘要，并绑定房间 UUID。房间号显著显示，另有手动输入入房入口。

`appInfo` 为 FinClip 文档支持的自定义透传对象，包含 `schema: 'ono.invitation.v1'`、`target: 'phiz'`、AppID、语言、有效期和 HTTPS 图片地址。iOS 可能将 `appThumbnail` 转成本地文件，因此同时在 appInfo 中保留网络图片地址。分享图片由后端生成 800×640 PNG（5:4）。

分享目标由 **Phiz 宿主** 选择好友或群聊。不使用未文档化的 `channel: 'PhizFriends'`，也不假设 FinClip 内置了 Phiz 聊天。

## 宿主需要补上的三个具体接口

`host-adapter/phiz-card.cjs` 中的接口是本项目定义的注入契约，**不是声称存在的 Phiz SDK 方法名**。将它们连接到实际 Phiz 聊天与 FinClip SDK：

```js
const { createPhizCardAdapter } = require('./phiz-card.cjs');
const phizConfig = require('./phiz-config.cjs');
const adapter = createPhizCardAdapter({
  appId: phizConfig.appId,
  assetBase: 'https://api.example.com',
  chat: {
    // 打开真实 Phiz 会话选择器。取消时返回 null。
    chooseConversation: chooseActualPhizConversation,
    // 调用真实聊天 SDK，成功收据必须包含 messageId。
    sendMessage: sendActualPhizMiniProgramMessage
  },
  finclip: {
    // 使用真实 FinClip SDK，按 AppID 和 path 打开小程序。
    open: openActualFinClipApplet
  }
});
```

`chooseConversation({allow:['friend','group']})` 返回 `{kind:'friend'|'group', id:string}` 或 `null`。`sendMessage(destination, card)` 在真实服务确认发送后返回 `{messageId:string}`；发送失败必须抛出错误，不能只打开分享面板就报告成功。

卡片消息协议：

```json
{
  "type": "mini_program",
  "version": 1,
  "appId": "6af75cf50efc7c0001051c74",
  "title": "ONO! • Sala 123456 • Vamos jogar?",
  "description": "Sala grátis para 4 pessoas.",
  "imageUrl": "https://api.example.com/assets/invites/OPAQUE_TOKEN.png",
  "launch": {"path": "pages/invite/index?token=OPAQUE_TOKEN"},
  "metadata": {"schema":"ono.invitation.v1","target":"phiz","expires":1790000000000}
}
```

协议字段映射到你们已有的 Phiz 小程序消息类型。聊天记录展示为“图片 + 标题 + 小程序标识”的可点击卡片。点击时调用 `adapter.open(card)`；适配器校验允许的 AppID 和入口路径，然后交给宿主打开。适配器不会用 H5 页面替代卡片。

本 JavaScript 适配器可以在宿主已有 JS 桥中运行；纯 Kotlin / Objective-C 宿主应按相同协议移植校验和异步流程。它不是可直接编译进原生工程的 Android / iOS 二进制 SDK。

## FinClip iOS 代理

官方接入点：`[FATClient sharedClient].buttonOpenTypeDelegate`，转发事件方法：

```objc
- (BOOL)forwardAppletWithInfo:(NSDictionary *)contentInfo
                 completion:(void (^)(FATExtensionCode code, NSDictionary *result))completion;
```

注册宿主代理并持有该对象。在此方法中将 `contentInfo` 交给适配器/同等原生实现，并返回 `YES` 表示已处理。原始字典支持 `appId`、`appTitle`、`appThumbnail`、`appStartParams.path` 和自定义 `appInfo`。

只有实际发送成功时才用当前 SDK 的成功枚举调用 completion；取消用取消/失败枚举，网络失败回传失败。具体 `FATExtensionCode` 常量以接入工程 SDK 头文件为准，不在此伪造枚举值。务必只回调一次。

## FinClip Android 代理

官方接入点是 Applet API manager 的 `setAppletHandler`，`IAppletHandler` 的方法：

```kotlin
shareAppMessage(appInfo: String, bitmap: Bitmap?, callback: IAppletCallback)
```

使用工程 SDK 中匹配的完整类名与签名。将 JSON 字符串 `appInfo` 交给适配器/同等原生实现。官方格式的 `.params` 中包含 `title`、`desc`、`imageUrl`、`path`；适配器同时处理 `.params.appInfo`。

本项目使用 HTTPS 图片，优先用 `params.imageUrl` 或透传的 appInfo.imageUrl，避免把本地 bitmap 路径发给别人。会话选择、发送成功、取消和失败分别映射到实际 SDK 的 callback；收到聊天消息点击后按 AppID 和 path 打开小程序。

## 冷启动、后台唤起与异常

- Page.onLoad 读取 token；App.onLaunch/onShow 同时接收 query，已运行的小程序能跳转邀请页。
- 邀请预览不需要登录；入房需要真实身份或明确启用的开发游客。
- 已在其他桌时阻止跨房加入，并提供返回原桌入口；不会自动退出正在进行的牌局。
- 满员、已开局、房间关闭、过期邀请都有服务端检查；重复入房不重复添加成员。
- 卡片即使仍留在聊天记录里，过期后也只能看到到期提示；客户端时间不决定入房权限。

## 必需联调资料

App ID 已配置为 `6af75cf50efc7c0001051c74`（来自用户提供，需在平台核对它对应 ONO! 小程序）。仍需 SDK 版本、Phiz 聊天消息类型与会话选择器接口、FinClip SDK 打开小程序的方法、Phiz 的登录 code 校验接口，以及测试好友/群聊。包内已提供可测试的适配协议与实现；实际 Phiz SDK 发送未验收。

## 官方依据

按 2026-11-17 可访问的官方资料核对：

- [App/Page 与 onShareAppMessage](https://www.finclip.com/mop/document/zh/develop/guide/framework/app-service.html)
- [iOS 代理方法](https://www.finclip.com/mop/document/zh/runtime-sdk/ios/api/api-delegate.html)
- [Android 代理方法](https://www.finclip.com/mop/document/zh/runtime-sdk/android/api/api-delegate.html)
- [小程序能力说明](https://www.finclip.com/mop/document/zh/develop/guide/feature.html)

