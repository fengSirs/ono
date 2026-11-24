# ONO 圣诞活动 · 交接与部署说明（handoff.md）

版本：`v1.0.1` + 2026-11-24 周榜改动  
基线：2026-11-18 独立后端部署版  
适用对象：接手部署的工程师，以及协助部署的 AI

---

## 0. 给接手 AI 的硬性指令

请先完整读完本文件，再动任何命令或代码。不要只读标题就开始部署。

执行顺序必须是：

1. 校验代码包完整性（见 §2.1），确认 `CHECKSUMS.sha256` 全部匹配。
2. 确认目标服务器已有 Node.js **22.14+**，并确认这次是「升级现有服务」还是「新服务器首次部署」。
3. 部署前备份生产数据库；不要用空库覆盖现有 `ono.sqlite`。
4. 先部署后端并验证 `/healthz`，再处理小程序前端。
5. **不要直接发布当前 `miniapp/config.js`**。它现在是本地联调配置（`http://127.0.0.1:4390` + `authMode: "guest"`），只能用于本机预览。生产必须按 §2.3 换成 HTTPS 域名和 `authMode: "finclip"`。
6. 不要伪造 Phiz 登录已完成。`AUTH_MODE=pending` 时登录、对局、榜单和奖励接口都会关闭，这是预期行为，不是 bug。
7. 完成后按 §8 的验收清单逐项给出结果；无法完成的项要明确写「未验证」，不要口头声称已通过。

如果你需要生产密钥、Phiz 身份兑换地址、服务器 SSH 或礼盒库存，向发起人索取；不要在包里寻找，也不要用开发游客模式替代正式身份。

---

## 1. 这个包是什么

- 原生 FinClip 小程序：`miniapp/`，WXML / WXSS / JS，无 React、无浏览器 DOM、无 web-view。
- 独立后端：Node.js 22 + `node:sqlite`，源码在 `backend/src/`，已构建的独立运行产物在 `backend/runtime/`。
- 后端运行**不需要** `npm install`，`backend/runtime/` 只依赖 Node 标准库。
- 包含 9 个页面：大厅、邀请、房间、对局、养成、任务、申领、规则、每周排行榜。
- 已包含 App ID `6af733830efc7c0001051c6a` 的项目配置。
- **不包含**：`node_modules`、生产 `.env`、线上数据库、真实用户数据、SSH 密钥、服务器密码、Phiz 私有 SDK、已编译的 `.fap`。

包内另外提供：

- `.env.production.example`：生产环境变量模板。
- `miniapp/config.production.example.js`：生产小程序配置模板。
- `deployment/ono-finclip.service`：systemd 单元。
- `deployment/ono.phizminiapp.com.https.conf`：Nginx 反向代理示例。
- `Dockerfile`：可选的容器部署方式。
- `CHECKSUMS.sha256`：打包时生成的文件校验清单。

---

## 2. 部署步骤

### 2.1 解压与完整性校验

```sh
unzip ono-finclip-*.zip
cd ono-finclip
```

Linux：

```sh
sha256sum -c CHECKSUMS.sha256
```

macOS：

```sh
shasum -a 256 -c CHECKSUMS.sha256
```

必须全部 `OK`。如果只有 `CHECKSUMS.sha256` 自身没有对应行，这是正常的：打包脚本不会把校验文件自己的哈希写进清单。

### 2.2 后端部署

#### 新服务器首次部署

```sh
# 1) 运行用户与目录
sudo useradd --system --home /opt/ono-finclip --shell /usr/sbin/nologin ono-finclip
sudo mkdir -p /opt/ono-finclip/releases /var/lib/ono-finclip
sudo chown -R ono-finclip:ono-finclip /opt/ono-finclip /var/lib/ono-finclip

# 2) 放入 release
sudo mkdir -p /opt/ono-finclip/releases/20261124
sudo cp -R . /opt/ono-finclip/releases/20261124/
sudo chown -R ono-finclip:ono-finclip /opt/ono-finclip/releases/20261124

# 3) 切换 current
sudo ln -sfn /opt/ono-finclip/releases/20261124 /opt/ono-finclip/current

# 4) 生产环境变量
sudo cp .env.production.example /etc/ono-finclip.env
sudo chmod 600 /etc/ono-finclip.env
sudo editor /etc/ono-finclip.env

# 5) systemd
sudo cp deployment/ono-finclip.service /etc/systemd/system/ono-finclip.service
sudo systemctl daemon-reload
sudo systemctl enable --now ono-finclip
```

#### 升级现有服务

不要覆盖 `/var/lib/ono-finclip/ono.sqlite`。只替换 release 并切换软链：

```sh
sudo mkdir -p /opt/ono-finclip/releases/20261124
sudo cp -R . /opt/ono-finclip/releases/20261124/
sudo chown -R ono-finclip:ono-finclip /opt/ono-finclip/releases/20261124
sudo ln -sfn /opt/ono-finclip/releases/20261124 /opt/ono-finclip/current
sudo systemctl restart ono-finclip
```

切换前先备份数据库：

```sh
sudo -u ono-finclip cp /var/lib/ono-finclip/ono.sqlite \
  /var/lib/ono-finclip/ono.sqlite.bak-$(date +%Y%m%d-%H%M%S)
```

首次启动会自动建库并执行迁移；迁移是串行写入，不要同时启动两个后端实例指向同一个库。

#### 关键环境变量

| 变量 | 生产建议 | 说明 |
| --- | --- | --- |
| `NODE_ENV` | `production` | 生产必须为 production |
| `HOST` | `127.0.0.1` | 由 Nginx 反代，不直接暴露 |
| `PORT` | `4390` | 默认端口 |
| `ONO_DB` | `/var/lib/ono-finclip/ono.sqlite` | 必须可写，不能放在 release 目录 |
| `PUBLIC_BASE_URL` | `https://ono.phizminiapp.com` | 公开 HTTPS 地址 |
| `FINCLIP_APP_ID` | `6af733830efc7c0001051c6a` | 与小程序一致 |
| `AUTH_MODE` | 先 `pending`，接入身份后 `finclip` | `pending` 会关闭登录/对局/榜单/奖励 |
| `AUTH_EXCHANGE_URL` | 身份服务地址 | 仅在 `AUTH_MODE=finclip` 时需要 |
| `AUTH_EXCHANGE_TOKEN` | 服务端密钥 | 不要写进小程序 |
| `ALLOW_DEV_GUESTS` | `false` | 生产禁止游客登录 |
| `TRUST_LOOPBACK_PROXY` | `true` | 仅本机 Nginx 反代时开启 |

#### 健康检查

```sh
curl -sS http://127.0.0.1:4390/healthz
```

期望 `ok: true`，且能看到 `application: "ONO-FinClip"`、`version`、`appId`、`authentication`。

#### Nginx

使用 `deployment/ono.phizminiapp.com.https.conf`，确认：

- `root` 指向当前 release 的 `deployment/public`。
- `/healthz`、`/v1/`、`/assets/` 反代到 `127.0.0.1:4390`。
- 证书路径与域名正确。
- 改完后 `nginx -t && systemctl reload nginx`。

公网检查：

```sh
curl -sS https://ono.phizminiapp.com/healthz
curl -sS https://ono.phizminiapp.com/v1/config
```

#### App ID 切换（Bora Ono）

2026-11-24 平台侧已切换到 Bora Ono，小程序 App ID 为 `6af733830efc7c0001051c6a`。生产服务器必须同步，否则 `/v1/config` 和 Phiz 身份交换仍使用旧 App ID：

```sh
sudo sed -i 's/^FINCLIP_APP_ID=.*/FINCLIP_APP_ID=6af733830efc7c0001051c6a/' /etc/ono-finclip.env
sudo systemctl restart ono-finclip
curl -sS https://ono.phizminiapp.com/healthz
curl -sS https://ono.phizminiapp.com/v1/config
```

确认两个响应里的 `appId` 都是 `6af733830efc7c0001051c6a`。如果只改前端、不改服务器，`AUTH_MODE` 切到 `finclip` 后身份交换会失败。

### 2.3 小程序前端部署

1. 进入 `miniapp/`，复制生产配置：

```sh
cp config.production.example.js config.js
```

2. 核对 `config.js`：

```js
module.exports = {
  apiBase: "https://ono.phizminiapp.com",
  appId: "6af733830efc7c0001051c6a",
  authMode: "finclip",
  pollMs: 1200,
  requestTimeout: 15000,
};
```

3. 在 FinClip Studio 导入 `miniapp/`，确认 App ID 为 `6af733830efc7c0001051c6a`。
4. 在 FinClip 后台配置 request / downloadFile 合法域名，必须包含 `https://ono.phizminiapp.com`。
5. 编译生成 `.fap`，在 Phiz 平台发布。
6. **不要把本地 `authMode: "guest"` 的 `config.js` 打进正式包。** 本机预览可以保留，但发布前必须替换。

当前仓库的 `miniapp/config.js` 已在发布前切到生产值；每次重新打包前仍建议执行 `npm run config:prod` 再确认一次。

---

## 3. 本轮改了什么

改动时间：2026-11-23 至 2026-11-24。  
改动目标：让所有用户都能看到周榜和规则，并修正周榜页排版、重复文案和按钮居中问题。

### 3.1 业务与入口

1. **周榜改为公开只读**
   - `POST /v1/game` 的 `{"op":"christmasLeaderboard"}` 允许不带 `Authorization` 读取。
   - 匿名读取时 `own = null`，`entries[].isMe = false`。
   - 其余游戏/活动操作仍然需要 Bearer。
   - 注意：这个公开分支在 `AUTH_MODE=pending` 之后，所以 `pending` 模式下整个 `/v1/game` 仍返回 `503 authNotConfigured`；只有 `AUTH_MODE=finclip` 且身份服务可用时，匿名周榜才真正开放。

2. **所有用户都能进入周榜**
   - 大厅挑战卡主按钮是「查看本周榜单」，未养满时另给「去养火鸡」次按钮。
   - 大厅底部规则卡、「查看每周排行榜」入口已接周榜页。
   - 未登录领蛋面板也提供「查看每周排行榜」。
   - 周榜页内新增「参与本周挑战」区，按状态显示：
     - 未登录：登录并参与
     - 未领蛋：领取我的火鸡蛋
     - 已领蛋未养满：去养火鸡
     - 已养满可领奖：领取火鸡
     - 已登记：查看申领

3. **周榜资格规则未改**
   - 仅纯真人好友房完整轮次计活动积分；在线匹配不发积分。
   - 2 / 3 / 4 人房每人 +10 / +20 / +30，胜者额外 +5。
   - 每日游戏积分上限 100。
   - 10 积分换 1 份饲料；累计喂养 100 份记为首次养成完成。
   - 每周前 100 位首次养满者取得该周申领资格；每人整个活动最多获奖一次。
   - 申领仍需人工审核，测试环境不得接真实库存或自动发货。

### 3.2 周榜页 UI 重构

文件：`miniapp/pages/leaderboard/index.wxml`、`index.wxss`、`index.js`

- 头部改为单行导航：返回胶囊、居中标题、活动规则胶囊；高度和间距统一，不再使用全局 `.compact-header` 的整条白底和彩色虚线。
- 规则条压缩为一行，只保留「仅首次养满参榜，每人限领一次」；不再和下方参与卡重复。
- 上一周 / 下一周改为日期两侧的细箭头，日期和「本周」标签紧凑居中；历史周才出现「回到本周」。
- 汇总卡改为渐变卡：标题、剩余名额大数字、距封榜倒计时（按天显示，如「5 天 23:10:43」）、进度条。
- 本页不再出现 Brasília / 巴西利亚，包括展开规则里的截止时间。
- 个人结果区只在本人有完成记录或已有申领时显示，避免对未养满用户重复提示。
- 参与卡提示按状态区分；未孵蛋用户使用新的 `weeklyStartHint`。
- 榜单前三名加金银铜圆形奖牌；空榜显示火鸡图。
- 时间显示改为「日/月 + 时分」两行，窄屏不挤。

### 3.3 三语文案

文件：`miniapp/utils/labels.js`、`miniapp/utils/weekly.js`

新增或调整：

- `weeklyBoardTitle`：Ranking da semana / Weekly ranking / 本周火鸡挑战
- `weeklyDeadline`：Crescimento até 24/12 · 23:59 / Grow by Dec 24 · 23:59 / 养满截止 12 月 24 日 23:59
- `weeklyCountdownLabel`、`weeklyDayUnit`、`weeklyThisWeek`
- `weeklyStartHint`
- `weeklyJoinTitle`、`weeklyJoinHint`、`weeklyJoinGuest`、`weeklyJoinSignIn`、`weeklyGrownHint`
- 删除 `compactPreview`（「测试中，不发实物」）
- `weeklyWindow`、`weeklySchedule`、`weeklyPrivacy` 去掉 Brasília 字样

三语必须同时存在；`npm run check` 会检查引用键。

### 3.4 全局清理与按钮居中

- 全项目删除「测试中，不发实物」：
  - `miniapp/pages/farm/index.wxml`
  - `miniapp/pages/claim/index.wxml`
  - `miniapp/pages/leaderboard/index.wxml`
  - 相关样式和 `labels.js` key
- 全局 `button` 增加 `text-align: center`，避免不同页面按钮文字偏左/偏右。
- `pages/farm/index.wxss` 的 `.challenge-link`（「去养火鸡」次级按钮）改为 flex 水平垂直居中。
- `pages/leaderboard/index.wxss` 的 `.join-action` 改为 flex 居中。

### 3.5 后端与 API

- `backend/src/server.mjs`
  - `christmasLeaderboard` 在 `/v1/game` 中增加无 Bearer 的公开分支。
  - 其他 op 仍走 `requireAuth`。
- `backend/src/game-controller.ts`
  - 匿名允许 `christmasLeaderboard`。
- `backend/src/domain/christmas.mjs`
  - 将 leaderboard 判断移到 `sessionExpired` 之前，保证匿名可读。
- `backend/runtime/*`
  - 已重新构建，包含上述改动。
- 文档：
  - `docs/api.md` 标注榜单公开只读。
  - `docs/weekly-leaderboard.md` 同步公开读取规则。

### 3.6 测试

- `tests/weekly.test.mjs`
  - 匿名榜单 200、`own = null`、`isMe = false`
  - 私有 op 无 Bearer 返回 401
  - 未登录/未养满用户走「去养火鸡」入口
  - 原生周榜页请求乱序、双请求、`join=claim` 适配
- `tests/native.test.mjs`
  - 三语文案 key 增加 `weekly*` 键

本轮实测：

```text
npm run check  → 55 files passed
npm test       → 68 tests, 68 pass, 0 fail
```

`docs/verification.md` 中「54 项 / 65 项」是历史记录，不是本轮最新数字。

### 3.7 文件改动清单

| 文件 | 改动 |
| --- | --- |
| `miniapp/pages/leaderboard/index.wxml` | 周榜页结构重写：头部、单行规则、周导航、汇总卡、条件个人结果、参与卡、奖牌榜、空榜 |
| `miniapp/pages/leaderboard/index.wxss` | 整页样式重写；移除全局 compact-header 覆盖；新增 board-header / week-nav / summary / medal |
| `miniapp/pages/leaderboard/index.js` | 新增 fill / showResult / countdownLabel；并行拉取 christmas 快照；joinState 区分未孵蛋/未养满；倒计时支持天数和已封榜 |
| `miniapp/utils/labels.js` | 新增 weekly* 文案；删除 compactPreview；周榜时间文案去 Brasília |
| `miniapp/utils/weekly.js` | challenge 支持主/次动作；weeklyWindow 去 Brasília |
| `miniapp/pages/farm/index.wxml` | 挑战卡主按钮「查看本周榜单」+ 次按钮「去养火鸡」；删除测试文案 |
| `miniapp/pages/farm/index.wxss` | 头部 36rpx 标题 + 64rpx 胶囊规则按钮；挑战卡次按钮居中 |
| `miniapp/pages/farm/controller.js` | challengeTap 支持 data-action |
| `miniapp/pages/claim/index.wxml` / `.wxss` | 删除测试文案；头部标题 36rpx |
| `miniapp/pages/lobby/index.wxml` / `.js` | 规则卡、领蛋面板增加「查看每周排行榜」；新增 leaderboard 导航 |
| `miniapp/app.wxss` | 全局 button 居中 |
| `miniapp/config.production.example.js` | 新增生产配置模板 |
| `backend/src/server.mjs` | 匿名周榜公开分支 |
| `backend/src/game-controller.ts` | 允许匿名 christmasLeaderboard |
| `backend/src/domain/christmas.mjs` | leaderboard 判断前移 |
| `backend/runtime/*` | 重建产物 |
| `tests/weekly.test.mjs` | 公开榜单、入口、页面测试 |
| `tests/native.test.mjs` | 三语 key 更新 |
| `docs/api.md` / `docs/weekly-leaderboard.md` | 公开读取说明 |
| `handoff.md` | 本文件 |

---

## 4. 关键业务规则（不要改错）

### 积分与喂养

- 只有**纯真人好友房**的完整轮次产生圣诞活动积分。
- 在线匹配可以继续玩，但不产生活动积分。
- 2 人房每人 +10；3 人房每人 +20；4 人房每人 +30。
- 胜者额外 +5。
- 每日游戏积分上限 100。
- 10 活动积分兑换 1 份饲料。
- 累计喂养 100 份，记为首次养成完成。

### 周榜

- 时区固定为巴西利亚 UTC-3。
- 自然周从周一 00:00 开始，到下周一 00:00 结束，结束时刻不包含。
- 每周前 100 位首次养满的用户取得该周申领资格。
- 每个正式活动身份只可申领一次；跨周不会重置资格。
- 未养满、榜外、历史时间无法核实分别返回 `turkeyNotGrown`、`weeklyNotQualified`、`rankingReview`。
- 榜单只返回昵称、名次、达成时间、是否本人；不返回联系方式、令牌、内部玩家 ID。

### 活动时间

- 正式活动开始：`2026-12-10T03:00:00.000Z`（巴西利亚 12-10 00:00）。
- 喂养截止：`2026-12-25T02:59:59.999Z`（巴西利亚 12-24 23:59:59.999）。
- 申领登记截止：`2026-12-29T02:59:59.999Z`。

### 申领

- 申领必须登录并满足养成/榜单资格。
- 人工审核后发奖；不要在测试环境配置真实库存。
- 生产审核工具在 `backend/ops/`，具体命令见 `docs/operations.md`。

---

## 5. 公开接口与鉴权边界

| 接口 | 鉴权 | 说明 |
| --- | --- | --- |
| `GET /healthz` | 无 | 健康检查 |
| `GET /v1/config` | 无 | App ID、API 地址、登录是否就绪 |
| `GET /v1/campaign` | 无 | 活动规则快照 |
| `POST /v1/game` `christmasLeaderboard` | 无 Bearer | 匿名只读；`own = null`、`isMe = false` |
| `POST /v1/game` 其他 op | Bearer | 无令牌 401 |
| `POST /v1/auth/guest` | 无 | 仅开发游客；生产必须关闭 |
| `POST /v1/auth/finclip` | 无 | 需服务端身份兑换配置 |

注意：

- `AUTH_MODE=pending` 时，`/v1/game` 在公开分支之前就返回 `503 authNotConfigured`；这是预期保护。
- 周榜公开读取不等于整个活动无需登录；只有榜单是公开只读。
- 不要为了「让用户先看到榜单」把生产切成 `ALLOW_DEV_GUESTS=true` 或 `authMode: "guest"`。

---

## 6. 验证状态

已完成：

- `npm run build`
- `npm run check`：55 个文件通过
- `npm test`：68 项通过，0 失败
- 本机后端 `4390` 启动，`/healthz` 正常
- FinClip Studio 3.0.6、iPhone 5 模拟器、100% 缩放，周榜页实际预览通过
- 匿名榜单 200、`own=null`；私有 op 401（在开发/联调模式验证）

未完成/未验证：

- 未在 FinClip 真机（iOS / Android）做视觉和交互验收。
- 未做 Phiz 真实身份兑换联调。
- 未做 Phiz 好友/群聊卡片真实发送验收；`host-adapter` 仍依赖宿主注入。
- 未生成正式 `.fap`，未在 Phiz 平台发布。
- 未在生产库副本上演练历史完成记录迁移。
- 未接真实礼盒库存和人工发奖全流程。

`docs/verification.md` 和 `README.md` 中有部分历史描述（例如「本机没有 FinClip Studio」「54/65 项测试」；本轮静态检查为 55 个文件），以本文件 §3.6 和 §6 为准。

---

## 7. 已知缺口与不要做的事

1. **不要用 `AUTH_MODE=pending` 上线活动。**  
   `pending` 只适合先让健康检查、配置和素材上线；登录、对局、榜单、奖励全部关闭。

2. **不要用开发游客模式对外。**  
   `ALLOW_DEV_GUESTS=true` + `authMode: "guest"` 只能用于本机或内网测试。

3. **不要直接发布当前 `miniapp/config.js`。**  
   它是 `http://127.0.0.1:4390` + `guest`，真机连不上，也不安全。

4. **不要覆盖生产数据库。**  
   迁移会自动执行；升级前必须备份 `ono.sqlite`。

5. **不要把榜单公开理解成「所有接口公开」。**  
   只有 `christmasLeaderboard` 匿名可读，其余仍要 Bearer。

6. **不要接真实库存做测试发奖。**  
   申领必须人工审核；测试环境不要配置真实礼盒。

7. **不要声称 Phiz 分享已联调。**  
   目前只有注入式适配器测试，真实聊天发送未验收。

---

## 8. 部署后验收清单

后端：

- [ ] `systemctl status ono-finclip` 为 active (running)
- [ ] `curl 127.0.0.1:4390/healthz` 返回 `ok: true`
- [ ] `curl https://ono.phizminiapp.com/healthz` 通过公网可达
- [ ] `/v1/config` 返回正确 App ID 和 `loginReady`
- [ ] `/v1/campaign` 返回正式活动时间
- [ ] 生产日志无迁移错误、无 401/503 异常刷屏
- [ ] 数据库文件在 `/var/lib/ono-finclip/`，权限属于 `ono-finclip`

鉴权（仅在 `AUTH_MODE=finclip` 且身份服务可用后）：

- [ ] 匿名 `christmasLeaderboard` 返回 200，`own = null`
- [ ] 不带 Bearer 的 `profile` 返回 401
- [ ] 登录后能看到自己的完成记录和申领状态

小程序：

- [ ] `config.js` 的 `apiBase` 是 HTTPS 正式域名
- [ ] `authMode` 是 `finclip`
- [ ] App ID 与后端、FinClip 后台一致
- [ ] request / downloadFile 合法域名已配置
- [ ] 大厅可见「查看本周榜单」「查看每周排行榜」
- [ ] 未登录可进周榜查看榜单和规则
- [ ] 周榜页在 320pt 宽下不挤、不截断
- [ ] 返回 / 活动规则 / 上一周 / 下一周 间距正常
- [ ] 页面不出现「Brasília」「测试中，不发实物」
- [ ] 规则条只显示「仅首次养满参榜，每人限领一次」
- [ ] PT-BR / EN / ZH 三语标题和按钮不溢出
- [ ] 点「去养火鸡」文字居中
- [ ] 未登录 / 未孵蛋 / 未养满 / 可领奖 / 已登记五种状态按钮正确

真机（发布前必须做）：

- [ ] iOS / Android 各一台设备冷启动
- [ ] 好友房完整对局积分到账
- [ ] 兑换饲料、喂养、养满记录
- [ ] 周榜匿名浏览、登录后本人状态
- [ ] 申领登记和人工审核
- [ ] Phiz 好友/群聊卡片发送与回跳

---

## 9. 回滚

```sh
# 切回上一个 release
sudo ln -sfn /opt/ono-finclip/releases/<上一个版本> /opt/ono-finclip/current
sudo systemctl restart ono-finclip

# 如数据库迁移需要回滚，停服务后恢复备份
sudo systemctl stop ono-finclip
sudo -u ono-finclip cp /var/lib/ono-finclip/ono.sqlite.bak-<时间> \
  /var/lib/ono-finclip/ono.sqlite
sudo systemctl start ono-finclip
```

回滚数据库前确认备份时间点和迁移版本；不要用旧库覆盖新库后继续让新版本写入。

---

## 10. 交接结论

这个包可以直接运行后端和导入 FinClip Studio，但不是「接上 Phiz 就能自动上线」的成品：

- 后端：可部署，`pending` 模式安全关闭业务；接入身份兑换后切 `finclip`。
- 小程序：可编译，生产配置模板已给出；当前 `config.js` 是本地联调值，发布前必须替换。
- 周榜：代码和界面已完成，匿名读取逻辑已通过自动测试和模拟器预览；真机与真实身份尚未验收。
- 奖励：人工审核，不要自动发货。
