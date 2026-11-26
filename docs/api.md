# 身份与 API 契约

## 身份

当前已配置用户提供的 App ID：`6af733830efc7c0001051c6a`。开发与生产环境变量示例均已预填 `FINCLIP_APP_ID`，不要把身份交换服务密钥写入小程序。

正式模式下，小程序启动时静默登录。已有有效服务端会话先调用 `POST /v1/game {"op":"profile"}`，以后端返回的 `name` 为准；没有有效会话时才调用 `pz.login`，并把 `{code,name}` 发至 `POST /v1/auth/finclip`。首次建号时，`name` 优先使用 `pz.getPhizUserInfo` 返回的 `username`；同一 `openId` 后续登录由后端找回原账号，请求里的 `name` 不会覆盖用户已修改的昵称。后端支持两种服务端身份提供方，按配置选择：

**A. Phiz OpenId（推荐，使用 Developer AppSecret）**

```http
GET https://admin.phiz.chat/api/3.0/token/getOpenId?appId=FINCLIP_APP_ID&appSecret=PHIZ_APP_SECRET&code=FINCLIP_LOGIN_CODE

```

小程序端调用原生 `pz.login`，成功返回形如 `{"name":"login","type":"success","result":{"code":"...","errMsg":"login:ok"}}`。后端将 `result.code` 作为一次性 code 调用上述 GET 接口，并从服务端响应的 `openId`（兼容 `data.openId`、`result.openId`）读取稳定身份。`appSecret` 只放服务器环境变量，绝不下发小程序，也不提交仓库。

**B. 自定义身份交换服务（兼容旧部署）**

```http
POST AUTH_EXCHANGE_URL
Authorization: Bearer AUTH_EXCHANGE_TOKEN
Content-Type: application/json

{"code":"FINCLIP_LOGIN_CODE","appId":"FINCLIP_APP_ID"}
```

该可信服务须校验 code 的真实性、有效期、所属 AppID 和一次性使用，成功返回 `200 {"subject":"稳定的 Phiz 用户唯一标识"}`。不要返回客户端自报的用户 ID。`subject` 仅保留在服务端身份映射表，不出现在公开邀请里。其他状态或无效 subject 均视为登录失败。

后端还会对 code 的摘要做一天防重放记录。登录成功返回 `{session:{id,name,token,expires}}`；token 为 32 字节随机值，数据库只存摘要，默认 30 天有效。同一 subject 再登录会找回同一玩家的积分、宠物与房间归属。昵称保存在 `sessions.name`；`{op:"rename"}` 会更新该字段，并同步活跃房间 JSON 里的玩家名。改昵称不会生成新身份。身份校验密钥只在后端配置，不放小程序包。

开发端 `POST /v1/auth/guest {name}` 只有非 production 且 `ALLOW_DEV_GUESTS=true` 才启用。游客依赖本地缓存保存身份，清除缓存后的新游客不会恢复旧钱包。正式活动必须使用 Phiz 稳定身份。

## 路由

| 方法 / 路径 | 身份 | 返回 / 用途 |
| --- | --- | --- |
| GET `/healthz` | 无 | 服务和数据库状态 |
| GET `/v1/config` | 无 | AppID、API 地址、原生框架与登录是否就绪（不含密钥） |
| GET `/v1/campaign` | 无 | 公开活动快照，不含玩家隐私 |
| POST `/v1/auth/guest` | 开发开关 | 开发游客登录 |
| POST `/v1/auth/finclip` | code | 正式身份交换 |
| POST `/v1/auth/logout` | Bearer | 吊销当前 token |
| POST `/v1/game` | Bearer | 游戏、钱包、宠物、任务、申领 |
| POST `/v1/invitations` | Bearer | `{roomId,lang}` 创建房间邀请 |
| GET `/v1/invitations/:token` | 无 | 安全房间预览 |
| POST `/v1/invitations/:token/join` | Bearer | 按邀请绑定的 UUID 入房 |
| GET `/assets/invites/:token.png` | 邀请值 | 800×640 动态卡片封面 |

鉴权头为 `Authorization: Bearer TOKEN`。JSON 请求体最大 1 MiB。错误返回 `{error:'translatedKey'}`；401 身份过期、403 无权限、409 跨房/邀请条件冲突、410 邀请到期、429 速率限制。旧判牌领域逻辑的用户操作错误使用 400。小程序提示对应语言的可读文案。

## 游戏操作

向 `/v1/game` 发送：

```js
{op:'profile'}
{op:'rename',name:'Ana'}
{op:'create',capacity:4,rounds:3} // 免费好友房
{op:'join',code:'123456'}
{op:'match',capacity:2} // 默认 2；可为 2/3/4
{op:'state',room:'ROOM_UUID'}
{op:'start',room:'ROOM_UUID'} // 房主
{op:'next',room:'ROOM_UUID'}  // 房主，roundOver
{op:'action',room:'ROOM_UUID',rev:7,action:{type:'play',cardIds:[12,35],color:'yellow',uno:true}}
{op:'action',room:'ROOM_UUID',rev:8,action:{type:'draw'}}
{op:'action',room:'ROOM_UUID',rev:9,action:{type:'pass'}}
{op:'leave',room:'ROOM_UUID'}
```

对局操作返回 `{room,christmas}`。room.game 仅本人带 hand，其他人只带 count。公开牌堆只有顶部，deck 不下发。rev 防止旧轮次出牌。匹配和牌桌使用短轮询：可见时约 1 秒，页面隐藏时停止。机器人和超时推进由收到状态请求的服务器处理，无人观看的牌桌在重新请求时恢复推进。

## 活动操作

```js
{op:'christmas'}
{op:'christmasEgg'}
{op:'christmasHatch'}
{op:'christmasExchange',amount:3,requestId:'UNIQUE_16_TO_80_CHAR_ID'}
{op:'christmasFeed',amount:3,requestId:'ANOTHER_UNIQUE_REQUEST_ID'}
{op:'christmasTaskSubmit',mission:'phiz_group',phizId:'YOUR_PHIZ_ID',details:'完成日期与说明，至少10字符',proofs:['data:image/png;base64,...'],consent:true}
{op:'christmasTaskEvidence',submission:'SUBMISSION_ID'}
{op:'christmasTaskClaim',submission:'SUBMISSION_ID'}
{op:'christmasClaim',name:'Ana',contact:'+5511999999999',consent:true}
```

这些操作返回 `{christmas}`。前端 `utils/client.js` 的 game 方法会解包活动操作，普通游戏操作保持原结构。`/v1/campaign` 直接返回快照。

任务 mission 可为 `phiz_friends / phiz_group / phiz_moment / anjun_tracking`。1–3 张 JPEG/PNG，每张解码不超过 200000 字节；前端尝试压缩大图并允许查看、移除，后端复验图片头和尺寸。凭证仅本人持 Bearer 或可信本地操作员可读取，不提供公开图片 URL。客户端不提供“自己审核通过”的接口。

兑换/喂养使用 requestId 幂等防重复扣款。重复奖励由唯一账本 ID、数据库事务和版本保护；人数与胜负均来自服务器记录，不接受客户端自报积分。房间状态仅允许成员读取/操作，创建邀请仅开放给等待中的好友房成员。


`AUTH_MODE=pending` 用于身份接口接入前的独立服务部署：登录、对局、邀请变更及奖励均返回 503 `authNotConfigured`，开发游客同样不开放。`/healthz` 的 authentication.ready 和 `/v1/config` 的 loginReady 如实报告不可登录状态。


## 周榜接口（2026-11-23）

`POST /v1/game`，鉴权请求 `{"op":"christmasLeaderboard"}`，可选 `week` 为目标周一日期。该操作对未登录访客同样开放：不带 `Authorization` 时返回公开榜单，`own` 为 `null`，`entries[].isMe` 全部为 false；其余业务操作仍需 Bearer。响应为 `{ "leaderboard": { ... } }`。完整字段、时间边界与错误码见 [每周达成榜](weekly-leaderboard.md)。养成快照新增 `weekly`，领奖服务端校验首次达成当周前 100 名。
