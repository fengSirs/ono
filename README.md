# ONO! · FinClip 原生小程序 + 独立后端

ONO 圣诞活动的原生 FinClip 小程序与独立 Node.js 后端。小程序使用 WXML / WXSS / JS，不使用 React、浏览器 DOM 或 web-view；后端使用 Node.js 22 + `node:sqlite`，构建产物可直接运行，不需要在生产机安装依赖。

## 当前状态

- 独立后端已部署在 `https://ono.phizminiapp.com/`，健康检查、配置和活动信息接口正常。
- 生产环境当前为 `AUTH_MODE=pending`：登录、对局、周榜和奖励接口保持关闭，这是上线前的保护状态，不是故障。
- 原生 `.fap` 尚未在 Phiz 平台编译发布；真实 Phiz 身份兑换、好友/群聊卡片发送、真机全流程仍未完成。
- 本仓库是源码与部署材料的唯一来源。生产发布请从本仓库取代码，再用生产配置重新打包。

## 项目结构

```text
miniapp/                原生 FinClip 小程序（9 个页面）
  pages/                大厅、邀请、房间、对局、养成、任务、申领、规则、每周排行榜
  utils/                请求、轮询、三语文案、周榜与活动辅助
backend/src/            后端源码（HTTP、游戏、活动、SQLite、迁移）
backend/runtime/        已构建的后端运行产物
backend/migrations/     SQLite 迁移
host-adapter/           Phiz 分享注入契约
deployment/             systemd、Nginx、服务说明页
docs/                   接口、周榜、运维、Phiz 接入与验证文档
scripts/                启动、构建、检查、打包、配置切换
tests/                  Node 原生测试
handoff.md              部署交接与验收说明
```

## 环境要求

- Node.js **22.14 或以上**
- Python 3（仅在执行 `npm run package` 时需要）
- FinClip Studio（预览原生小程序时需要）

## 本地运行后端

```sh
cd ono-finclip
cp .env.example .env
npm run config:local
node scripts/start.mjs
```

健康检查：`http://127.0.0.1:4390/healthz`。首次启动会自动建库并执行迁移，默认数据文件为 `backend/data/ono.sqlite`，默认只监听本机。

`.env`、`miniapp/config.js`、SQLite 文件和日志都不进 Git。

## 在 FinClip Studio 预览

1. 保持本地后端运行在 `127.0.0.1:4390`。
2. 在 FinClip Studio 中导入 **`miniapp/` 目录**，不是仓库根目录。
3. 确认 `miniapp/config.js` 使用本地配置（`npm run config:local`）。
4. 编译后从大厅进入；业务代码统一通过 `miniapp/utils/platform.js` 调用原生 API，页面代码不要直接使用 `ft` / `wx` / `pz`。

说明：业务代码不会 `console.log` Toast。FinClip IDE/DevTools 可能会在渲染进程控制台里自动记录原生 bridge 调用（例如 `showToast:ok`），这是开发工具的 API 追踪行为，不是业务代码主动打印。

真机上的 `127.0.0.1` 指向手机自身，需要改成手机可访问的开发地址，并在 FinClip 后台配置合法域名。

## 配置切换

`miniapp/config.js` 由模板生成，不提交到 Git。

| 命令 | 生成配置 | 用途 |
| --- | --- | --- |
| `npm run config:local` | `config.local.example.js` | 本机后端 + 开发游客 |
| `npm run config:prod` | `config.production.example.js` | `https://ono.phizminiapp.com` + `finclip` |

生产配置只包含公开的 API 地址和 App ID，不包含密钥。发布前务必执行 `npm run config:prod`，不要直接使用本地 `guest` 配置。

## 构建、检查与测试

```sh
npm ci
npm run verify
```

`verify` 依次执行：

- `npm run build`：用 esbuild 重建 `backend/runtime/`
- `npm run check`：检查小程序结构、脚本、JSON、WXML、事件和三语文案
- `npm test`：运行 Node 原生测试

当前基线：56 个文件检查通过，75 项测试通过、0 失败。测试使用临时 SQLite 和本机 HTTP 服务，不需要生产数据。

重新打源码包：

```sh
npm run package -- /path/to/ono-finclip.zip
```

打包会生成 `CHECKSUMS.sha256`；校验清单属于发布产物，不提交到源码仓库。

## 部署

完整步骤见 [`handoff.md`](handoff.md)，包括：

- 服务器目录、systemd、Nginx 与 release 切换
- 生产环境变量（`.env.production.example`）
- 数据库备份与迁移
- 部署后验收清单与回滚
- 已知缺口和未验证项

生产环境变量示例：

```sh
NODE_ENV=production
HOST=127.0.0.1
PORT=4390
ALLOW_DEV_GUESTS=false
ONO_DB=/var/lib/ono-finclip/ono.sqlite
PUBLIC_BASE_URL=https://ono.phizminiapp.com
FINCLIP_APP_ID=6af733830efc7c0001051c6a
AUTH_MODE=pending
# 推荐：Phiz OpenId（AppSecret 仅服务端）
# PHIZ_OPEN_BASE_URL=https://admin.phiz.chat
# PHIZ_APP_SECRET=...
# 兼容旧部署：自定义身份交换服务
# AUTH_EXCHANGE_URL=https://...
# AUTH_EXCHANGE_TOKEN=...
TRUST_LOOPBACK_PROXY=true
```

在真实 Phiz 身份兑换配置完成前，保持 `AUTH_MODE=pending`，不要打开开发游客对公网使用。接入 `PHIZ_OPEN_BASE_URL` + `PHIZ_APP_SECRET` 后，把 `AUTH_MODE` 改为 `finclip`。后端会按 OpenId 文档调用 `GET /api/3.0/token/getOpenId`，将 AppSecret 保留在服务器环境变量中。

## 活动规则

- 只有纯真人好友房的完整轮次计入积分；2 / 3 / 4 人房每人分别 +10 / +20 / +30，胜者额外 +5，每日上限 100。
- 10 积分兑换 1 份饲料；累计喂养 100 份记为首次养成完成。
- 周榜按巴西利亚时间周一 00:00 开榜，下周一 00:00 为排他截止点。
- 每周前 100 名首次养满者取得申领资格；每人整个活动最多获奖一次。
- 申领需要人工审核；测试环境不得接真实库存或发放实物。

接口与业务细节见 [`docs/api.md`](docs/api.md) 和 [`docs/weekly-leaderboard.md`](docs/weekly-leaderboard.md)。

## 安全约定

- 不提交 `.env`、`miniapp/config.js`、生产数据库、日志、私钥、令牌或真实用户数据。
- 生产密钥只放在服务器环境变量中，不写进小程序，也不写进仓库。
- 建议仓库保持私有；如需公开，先移除服务器地址、内部路径和部署证据。
- 安全说明见 [`SECURITY.md`](SECURITY.md)。

## 语言

小程序默认葡萄牙语（巴西），支持英语和简体中文。三语文案位于 `miniapp/utils/labels.js`。葡语项目简介见 [`README.pt-BR.md`](README.pt-BR.md)。

## 许可

内部项目，未授权不得对外分发或用于第三方商业部署。
