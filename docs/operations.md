# 独立后端运营

服务只需要 Node.js 标准库，不需要 Redis、外部数据库或云开发服务。SQLite 适合单服务进程部署；不要以多个 Node cluster 进程共享本实现的房间状态锁。扩大规模需迁移共享存储与队列。

`.env.example` 用于本地测试；复制为 `.env` 后 `node scripts/start.mjs`。操作员工具不自动读取 `.env`，运行前通过环境变量设置同一个 `ONO_DB` 绝对路径，防止操作到默认开发数据库。

```sh
export ONO_DB=/absolute/private/path/ono.sqlite
node backend/ops/christmas-admin.mjs status
node backend/ops/christmas-admin.mjs config /absolute/path/settings.json
```

设置示例：

```json
{"stockTotal":100,"pointsPerFeed":10,"growthGoal":100,"hatchSeconds":5,"gameDailyCap":100}
```

100 是库存配置示例，不代表已确认的实际数量。正式活动默认 `stockTotal:null`，操作员需填写实际库存后才能审批真实礼盒；已审批数量不能超过库存。修改兑换或养成门槛前应核对既有进度。默认测试与正式阶段隔离，正式开启不会把测试积分转入正式钱包。

## 每日饲料任务审核

```sh
node backend/ops/task-review.mjs list pending
node backend/ops/task-review.mjs report 'SUBMISSION_ID' /absolute/private/review.html
node backend/ops/task-review.mjs approve 'SUBMISSION_ID' '核验了 Phiz ID、日期和完成记录'
node backend/ops/task-review.mjs reject 'SUBMISSION_ID' '请补充群聊创建者和日期截图'
```

report 是含私密图片的本地 HTML；只在操作员电脑/私有目录查看。审批后玩家自行点击领取，饲料只到账一次。每日四项中可选两项，每项 5 份；待审和已通过记录也保留名额。驳回后可以重提，最多三次，审计记录保留原凭证。跨天批准的记录仍可在活动喂养截止前领取。

误填 Phiz ID 且从未有过已通过/已领取任务时，可用：

```sh
node backend/ops/task-review.mjs correct-profile 'SUBMISSION_ID' 'NEW_PHIZ_ID' '更正原因'
```

## 礼盒申领审核

```sh
node backend/ops/christmas-admin.mjs claims preview
node backend/ops/christmas-admin.mjs claims live
node backend/ops/christmas-admin.mjs approve 'CLAIM_ID'
node backend/ops/christmas-admin.mjs reject 'CLAIM_ID'
node backend/ops/christmas-admin.mjs ship 'CLAIM_ID' 'TRACKING_OR_FULFILMENT_REFERENCE'
```

测试单为 test_pending / test_approved，不能作为真实物流发货。正式单为 pending / approved / shipped / rejected。后台读取完整联系方式仅用于联系发奖；小程序只显示掩码。每阶段同一玩家/联系方式只能登记一单。

## 数据与网络

生产设置 HTTPS `PUBLIC_BASE_URL`、`FINCLIP_APP_ID` 并关闭游客。暂未接入身份接口时显式使用 `AUTH_MODE=pending`，该模式关闭所有登录、对局和奖励请求，仅提供健康检查、公开配置与素材。接入 Phiz OpenId（`PHIZ_OPEN_BASE_URL` + `PHIZ_APP_SECRET`）或自定义 `AUTH_EXCHANGE_URL` + 服务端密钥后切换 `AUTH_MODE=finclip`，默认 finclip 模式仍强制要求身份配置。按 `docs/nginx.example.conf` 配置独立 API 入口，示例没有关联任何已有域名。只在可信本机反代场景开启 `TRUST_LOOPBACK_PROXY`，反代必须覆盖 X-Real-IP。

默认每 IP 每分钟最多 20 次登录、600 次其他请求。若多人共用同一出口，结合真实规模配置独立网关限流；不要未经评估提高奖励操作限额。若请求带 Origin，则只接受 PUBLIC_BASE_URL 或 CORS_ORIGINS 中精确配置的来源；原生小程序通常没有浏览器 Origin。

数据库文件和 WAL 包含身份、凭证与申领数据。用 SQLite online backup 或停服务后复制数据库备份；不要仅在运行中复制主 sqlite 文件而遗漏 WAL。默认目录 0700、数据库 0600。包内不含任何生产数据库或凭据。

房间等待/活动成员有效窗口为一小时。旧房间、过期 access token / 邀请摘要的周期清理与备份留存可按实际运营策略添加；不要删除尚未结算的活动账本。当前实现没有公开的 Web 管理页面，操作员通过本地命令审核。

