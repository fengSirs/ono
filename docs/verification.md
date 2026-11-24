# 验证与接手验收

自动检查包括 Node/小程序 JavaScript 语法、JSON、WXML 标签配对、声明的事件处理器、页面文件齐全与三语引用键。自动测试覆盖服务端真实 HTTP + 临时 SQLite，以及原生 Page/App 控制器模拟运行。测试结果记录在 `TEST-RESULTS.txt`。当前 v1.0.1 构建、静态检查及 54 项自动测试通过；独立服务器 https://ono.phizminiapp.com/ 的 DNS、TLS 主机名及有效期、HTTPS 页面、公开配置、素材和登录关闭保护均已通过公网检查，原有业务健康检查正常。证书自动续期定时器及 Nginx 重载钩子已检查。更新前的历史测试记录保留在 `docs/baseline-test-results.txt`。

已覆盖的业务：发牌/合法出牌/功能牌/多张同数字与选色/连续摸牌/UNO/隐藏其他手牌；三种人数匹配和 8 秒补位；真实好友房完局积分、胜者奖励、每日上限、幂等兑换喂养；5 秒孵化与重启恢复；测试/正式隔离；任务名额并发、私密凭证、人工审核/驳回/跨天领取；真实库存审批限制；卡片邀请的鉴权、到期、满员争抢、重复入房、关闭和其他房间归属；原生冷启动/后台唤起、同步分享描述、选色取消、火鸡中心定位和定时器清理。

Phiz 分享适配器测试使用注入的模拟会话选择/聊天传输，验证好友和群聊均发送 mini_program 卡片，只有真实接口返回发送收据后才报告成功，取消或无收据不会报成功。它验证接入边界，不代表真实 Phiz SDK 联调已经完成。

## 尚需在你的开发环境完成

用户提供的 App ID `6af733830efc7c0001051c6a` 已配置。本机未安装 FinClip Studio，仍缺少 Phiz SDK 和身份接口，因此没有生成 .fap 或真机运行截图，也尚未在 Phiz 小程序平台发布。独立后端与服务入口已部署到 https://ono.phizminiapp.com/。

接手后按下列业务流程验收：

1. 在 FinClip Studio 导入项目并核对已填写的 App ID `6af733830efc7c0001051c6a`，编译原生 WXML/WXSS；使用当前匹配宿主 SDK 的基础库。建议 iOS SDK ≥2.10.4、Android SDK ≥2.11.39（依据 compressImage 支持版本，仍需核对完整宿主版本兼容性）。
2. API 设置合法 HTTPS 域名，authMode 改 finclip；真机同一 Phiz 身份重新登录能恢复钱包。
3. 360×640、375×667、390×844 与横屏检查 PT-BR/EN/ZH：昵称、多人牌桌、很多手牌、出牌/UNO 按钮、结果弹层、火鸡区及键盘。
4. Android/iOS 分别在好友会话和群聊中实际发送卡片；检查缩略图、房号和标题。分别从未运行、后台和正在其他房间三种状态点击卡片。
5. 邀请满员/失效/已开局提示正确；发送取消、聊天网络失败不显示成功。
6. 检查初次用户点牌后音频授权、静音/来电恢复、音效开关、离开页面停止播放。宿主无音频能力时牌局仍能进行。
7. 真机拍照、相册、压缩、凭证预览、操作员审核、领取饲料、申领人工发奖全流程。

这些是宿主与真机联调的剩余工作；源码和本地后端可以在未提供上述资料时独立运行和测试。

## 文档依据

- [FinClip 框架能力](https://www.finclip.com/mop/document/zh/develop/guide/feature.html)
- [App/Page 生命周期与分享](https://www.finclip.com/mop/document/zh/develop/guide/framework/app-service.html)
- [项目配置](https://www.finclip.com/mop/document/zh/develop/frameInterface/config/project.html)
- [媒体 API 与 compressImage](https://www.finclip.com/mop/document/zh/develop/api/media.html)
- [iOS 分享代理](https://www.finclip.com/mop/document/zh/runtime-sdk/ios/api/api-delegate.html)
- [Android 分享代理](https://www.finclip.com/mop/document/zh/runtime-sdk/android/api/api-delegate.html)

按 2026-11-17 访问的官方页面整理。项目未将第三方文档全文复制进源码包。

