# My McMenu Phase 0 核验报告

> 项目：My McMenu｜麦门私人菜单册  
> 核验阶段：Phase 0｜规则与接口核验  
> 核验日期：2026-10-19（北京时间）  
> 状态：**规则已核验；官方 MCP 接入待凭据/权限后再做真实工具探测；暂不进入 Phase 1**

## 1. 核验结论

1. 参赛项目必须真实使用麦当劳官方 MCP，并以公开 GitHub 仓库提交。
2. My McMenu 的最小真实 MCP 闭环应优先采用 `query-meals` 获取门店当前可售餐品，再按返回的官方餐品编码调用 `query-meal-detail`；`calculate-price` 只作为价格事实层的可选能力，不在 MVP 中自行推算价格。
3. 官方文档确认了 MCP Server 地址、传输方式、认证头、工具名称和工具用途，但没有公开各工具的请求/响应 JSON Schema。
4. 当前工作区的 MCP 配置没有官方 `mcd-mcp-server`；对 `https://mcp.mcd.cn` 进行不带凭据的 MCP `tools/list` 探测返回 HTTP 403。因此目前不能声称已经完成真实商品查询，也不能把任何未核验字段写成实现契约。
5. Mock 模式可以先用于后续 UI 和交互开发，但必须在界面、导出和演示文档中明确标记“演示数据”，不能替代参赛要求中的真实 MCP 证据。

## 2. 官方比赛规则核对

| 检查项 | 官方要求 | 当前结论 | 实施约束 |
|---|---|---|---|
| 活动时间 | 2026-10-09 10:30 至 2026-10-25 23:59（北京时间） | 已确认 | 公开仓库和报名 Issue 必须在截止时间前完成 |
| 最终榜单 | 以 2026-10-26 00:00（北京时间）采集的公开 Star 为依据 | 已确认 | 不把开发完成当作报名完成；需预留公开仓库和 Issue 校验时间 |
| 仓库创建时间 | 2025-12-25 00:00 至 2026-10-25 23:59（北京时间） | 已确认 | 目标 GitHub 仓库不能早于窗口创建；本地目录创建时间不等于 GitHub 仓库创建时间 |
| 仓库可见性 | GitHub Public，持续公开可访问 | 已确认 | 参赛前不得使用私有仓库或仅本地演示 |
| 必交文件 | `README.md`、`CONTEST_DECLARATION.md`、`MCP_INTEGRATION.md`、`mcp-config.example.json` | 已确认 | 文件名不可改；`CONTEST_DECLARATION.md` 使用官方原文，不自行改写 |
| WorkBuddy 文件 | 参加 WorkBuddy 专项奖励时提交 `workbuddy.md` | 已确认 | 是否参加专项奖励待后续决定；不影响 MCP 参赛主流程 |
| 真实 MCP | 项目必须真实使用麦当劳 MCP | 已确认 | 至少保留一次成功的真实商品查询证据；Mock 不能作为替代 |
| 报名方式 | 在官方活动仓库按标准格式提交 Issue，包含项目名称、项目地址、项目简介 | 已确认 | 项目地址按纯文本 URL 组织，避免校验器对 Markdown 链接解析失败 |
| 账号与资格 | 中国大陆地区合法居民；18 周岁以上，或已取得监护人同意 | 已确认 | 由参赛者自行确认，项目不收集或保存此类信息 |
| 内容与原创 | 不得违法、侵权、误导官方背书、贬低品牌、对比其他品牌、植入恶意代码/链接；项目须原创或有合法授权 | 已确认 | 视觉与文案使用原创内容或有权素材；声明“粉丝创作/非官方商品命名” |
| 排名约束 | 公开 Star 排名；同一 GitHub 账号多个项目按规则只保留一个 | 已确认 | 不做刷 Star、机器人或其他影响公平的操作 |

### 官方提交文件状态

| 文件 | Phase 0 状态 | 后续动作 |
|---|---|---|
| `README.md` | 尚未创建 | Phase 4 按实际可运行命令和截图补齐 |
| `CONTEST_DECLARATION.md` | 尚未复制 | Phase 4 从官方仓库原样复制，复制后做哈希/逐字校验 |
| `MCP_INTEGRATION.md` | 尚未创建 | 真实调用成功后记录实际工具、字段、流程和脱敏证据 |
| `mcp-config.example.json` | 尚未创建 | 仅保留 `YOUR_MCP_TOKEN` 环境变量/占位符，不写入真实 Token |
| `workbuddy.md` | 尚未决定 | 只有参加 WorkBuddy 专项奖励时才提交 |

## 3. 官方 MCP 能力核验

### 3.1 接入事实

| 项目 | 已核验内容 |
|---|---|
| 官方仓库 | `M-China/mcd-mcp-server` |
| 服务地址 | `https://mcp.mcd.cn` |
| 协议 | MCP Streamable HTTP |
| 认证 | `Authorization: Bearer YOUR_MCP_TOKEN`；Token 不能进入仓库、浏览器 bundle、日志或导出文件 |
| 限流 | 官方文档说明每个 Token 每分钟最多 600 次请求 |
| 错误码 | 401 通常表示 Token 无效/过期/缺失；429 表示触发限流 |
| 官方仓库文件 | 当前公开内容为 `README.md` 与 `README_EN.md`，没有独立的工具 Schema 文件 |
| 文档完整度 | 有工具名称和用途列表；未公开每个工具的完整请求/响应 JSON Schema |

### 3.2 已确认的工具清单

以下名称来自官方 `mcd-mcp-server` README。工具用途按官方描述做了摘要，不代表已经在当前环境中成功调用。

**My McMenu 直接相关：**

- `query-meals`：查询指定门店当前可售餐品列表。
- `query-meal-detail`：按餐品编码查询详情、套餐组成和可替换项。
- `calculate-price`：按选购商品和可选优惠券计算商品金额、配送费、优惠及应付金额。
- `list-nutrition-foods`：查询常见餐品营养信息；不纳入 MVP 的健康建议功能。

**门店与配送：**

- `query-nearby-stores`
- `delivery-query-addresses`
- `delivery-create-address`
- `delivery-query-stores`
- `query-meal-assistance`

**优惠券与账户：**

- `query-store-coupons`
- `available-coupons`
- `auto-bind-coupons`
- `query-my-coupons`
- `query-my-account`

**订单：**

- `create-order`
- `cancel-order`
- `query-order`
- `order-list`

**活动、商城、抽奖与其他：**

- `campaign-calendar`
- `mall-points-products`
- `mall-product-detail`
- `mall-create-order`
- `now-time-info`
- `query-lottery-info`
- `draw-lottery`
- `query-my-prizes`
- `mall-order-list`
- `mall-order-detail`
- `query-party-city`
- `query-party-store`
- `query-partystore-date`
- `query-partystore-session`
- `party-order-create`

### 3.3 My McMenu 最小调用链

```text
用户选择偏好/输入门店上下文
        |
        v
query-meals  -- 只取官方返回的餐品编码、名称及其他实际字段
        |
        v
用户从真实候选中选择 3–8 个商品
        |
        v
query-meal-detail（按官方餐品编码补详情，可按需调用）
        |
        v
ProductRef(source = "mcd-mcp", productId = 官方返回编码, officialName = 官方返回名称)
        |
        v
固定六页模板 + 用户自定义昵称/故事/标签
```

价格链路暂不进入 P0。若实现 P1 价格展示，必须先确认真实 `calculate-price` 参数和返回字段，并在 UI 显示价格来源与检查时间；AI 不得改写价格事实。

## 4. 字段核验矩阵

官方公开 README 没有参数 Schema，以下矩阵区分“已证实”和“待真实调用确认”，避免把常见命名当成官方字段。

| 业务字段/概念 | 当前状态 | 允许的实现方式 |
|---|---|---|
| 官方工具名 | 已确认 | 以 README 中的工具名作为候选，不自行改名 |
| 门店上下文/门店标识 | 工具用途暗示需要，但字段名、类型、是否必填未确认 | Phase 1 真实 `tools/list` 后按 Schema 适配；Mock 使用内部类型，不宣称官方字段 |
| 餐品官方编码 | 工具用途确认“餐品编码”概念，具体字段名/类型未确认 | 仅使用真实返回值作为 `productId`；禁止 LLM 生成 |
| 官方餐品名称 | 餐品信息概念已确认，具体字段名/嵌套位置未确认 | 由 Adapter 从真实返回映射；未匹配时显示数据不可用，不猜名称 |
| 图片 URL | README 工具列表未确认 | 不依赖图片 URL；默认使用有权素材或可替换占位图 |
| 可售/下架状态 | “当前可售卖列表”语义已确认，具体字段未确认 | 使用真实返回或查询时间作为依据；缺失时显示“状态未核验” |
| 价格、币种、检查时间 | `calculate-price` 能力已确认，具体返回字段未确认 | 未完成真实调用前不展示“实际价格”；不由 AI 计算或改写 |
| 套餐组成/替换项 | `query-meal-detail` 用途已确认，字段结构未确认 | Phase 1 先保留原始脱敏响应，再写规范化映射 |
| 订单历史 | `order-list` 工具已确认，但不是 MVP 必需 | 不调用、不存储；除非未来取得用户明确授权并单独设计脱敏策略 |

## 5. 本地环境与真实探测证据

### 5.1 当前工作区 MCP 配置

已检查 `.kiro/settings/mcp.json`。当前配置包含若干内部业务 MCP 服务，但没有官方 `mcd-mcp-server` 的 `https://mcp.mcd.cn` 配置，也没有可确认属于本项目的官方 MCP Token。配置中存在其他服务的认证信息，本报告不记录、不回显、不复制任何凭据。

### 5.2 官方 endpoint 探测

已对官方 endpoint 发起最小化、无业务数据的 MCP `tools/list` 请求：

- 请求：JSON-RPC `tools/list`，无 `Authorization`，不携带项目数据或用户数据。
- 返回：HTTP **403 Forbidden**。
- 结论：当前环境无法完成官方工具发现或真实商品查询；该结果不是成功调用证据。

因此，以下内容目前均为**阻塞项**，不得在代码或参赛文档中伪造：

- 实际请求参数 Schema。
- 实际响应字段名与嵌套结构。
- 真实 `productId`、官方商品名称、图片 URL、库存/可售状态。
- 真实价格、币种、优惠、配送费。
- “已成功调用官方 MCP”的截图或日志。

## 6. 风险与处理方案

| 风险 | 等级 | 处理方案 |
|---|---:|---|
| 无官方 MCP Token/权限，无法做真实探测 | 阻塞 | 参赛者在官方控制台申请 Token，并在本地 Kiro MCP 配置中启用官方 server；Token 只通过本地安全配置注入 |
| 官方 README 未公开工具 Schema | 高 | 先在已授权环境执行 `tools/list`，保存脱敏 Schema；实现 Adapter 时以运行时返回为准 |
| 商品图片授权不明确 | 高 | P0 不依赖官方图片 URL；用原创/有权素材或占位图；若返回图片，记录来源和授权边界 |
| 价格随门店、渠道、优惠变化 | 高 | P0 不展示价格；P1 只展示 `calculate-price` 实时结果并标记查询时间 |
| 用户误以为自定义昵称是官方商品名 | 中 | 官方字段与创作字段分区展示；固定显示“粉丝创作 / 非官方商品命名” |
| 真实调用日志泄露凭据或个人信息 | 高 | 只记录工具名、成功/失败、耗时、错误类型；不记录 Token、地址、完整订单或原始隐私响应 |
| 直接实现下单带来不可逆副作用 | 高 | P0 不实现下单；P1 若做，必须单独确认商品、规格、价格并取得用户明确确认 |
| 报名窗口临近截止 | 中 | 真实 MCP 验证、公开仓库创建和报名 Issue 不要拖到最后一天；创建时间需落在官方窗口内 |

## 7. Phase 1 进入条件与执行边界

### 必须先满足

- [ ] 在本地启用官方 `mcd-mcp` MCP server，地址为 `https://mcp.mcd.cn`。
- [ ] 以本地安全方式提供有效官方 MCP Token；不写入仓库，不进入聊天、日志或前端 bundle。
- [ ] `tools/list` 成功返回，确认至少 `query-meals` 与 `query-meal-detail` 的真实 Schema。
- [ ] 在用户指定或明确授权的门店上下文执行一次真实 `query-meals`，保留脱敏响应样本。
- [ ] 确认真实商品编码和名称映射后，再固化 `McdProductAdapter` 的规范化类型。

### Phase 1 只做

- TypeScript 项目骨架、领域类型和 Schema 校验。
- `RealMcpAdapter` 的最小查询接口，严格按真实 Schema 映射。
- `MockProductAdapter` 与醒目的演示数据标识。
- 真实商品 → 规范化 `ProductRef` → 菜单册 JSON 的数据闭环。
- 单元测试和脱敏调用记录。

### Phase 1 不做

- 六页精美 UI、动画和自由画布。
- 自动下单、自动领券、订单历史读取。
- 未经核验的价格、图片、营养或库存字段。
- 公开 GitHub 仓库创建、推送、报名 Issue 或任何公开发布操作；这些动作必须在最终确认后执行。

## 8. 官方来源

- 比赛仓库：https://github.com/M-China/mcd-developer-innovation-challenge
- 活动规则：https://raw.githubusercontent.com/M-China/mcd-developer-innovation-challenge/main/activityGuidelines.md
- 官方参赛声明：https://raw.githubusercontent.com/M-China/mcd-developer-innovation-challenge/main/CONTEST_DECLARATION.md
- 官方 MCP 仓库：https://github.com/M-China/mcd-mcp-server
- 官方 MCP README：https://raw.githubusercontent.com/M-China/mcd-mcp-server/main/README.md
- 官方 MCP 仓库文件列表：https://api.github.com/repos/M-China/mcd-mcp-server/contents
- MCP 服务规则（官方规则引用）：https://cdn.mcd.cn/cms/pages/MCPServerRules.html

本报告对官方资料进行了摘要和结构化转述；具体规则、声明原文和服务条款以官方链接当前内容为准。

## 9. Phase 0 验收结果

| 验收项 | 结果 | 证据/备注 |
|---|---|---|
| 读取官方比赛规则 | 通过 | 活动规则、文件要求、报名和排名条件已记录 |
| 读取官方 MCP 文档 | 通过 | 接入地址、协议、认证、工具清单和限流已记录 |
| 检查本地 MCP 能力 | 通过 | 当前配置无官方 `mcd-mcp` server |
| 发起真实 endpoint 探测 | 已执行但受阻 | 无凭据请求返回 HTTP 403 |
| 获取真实工具 Schema | 未通过/阻塞 | 官方公开仓库未提供，当前环境无权限 |
| 获取真实商品响应 | 未执行 | 没有有效官方 Token，不伪造 |
| 写入 Phase 0 报告 | 通过 | 本文件 |
| 进入 Phase 1 | 暂不满足 | 等待官方 Token/权限和用户确认 |
