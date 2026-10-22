# MCP_INTEGRATION.md

## 1. 项目与 MCP 业务价值

My McMenu｜麦门私人菜单册是一款把真实可查询餐品和用户个人表达结合起来的数字菜单册。麦当劳 MCP 提供可核验的门店餐品编码、官方名称、分类、标签和查询时价格；My McMenu 只把这些字段作为事实底稿，再叠加用户自己的书名、昵称、故事和标签。

项目不是商品推荐商城，不把个性化昵称伪装成官方名称，也不在 Phase 1–3 自动下单。

## 2. 使用的官方 MCP Server

| 项目 | 值 |
|---|---|
| Server | `https://mcp.mcd.cn` |
| 协议 | MCP Streamable HTTP |
| 认证 | `Authorization: Bearer YOUR_MCP_TOKEN` |
| Token 存储 | 本地 Kiro MCP 配置或运行时环境变量；不进入仓库、前端 bundle、日志或导出 |
| 限流 | 官方文档说明每个 Token 每分钟最多 600 次请求 |
| 项目模式 | 开发服务器通过 `/api/mcd/menu` 本地受控代理调用官方 MCP；浏览器只接收脱敏 `ProductRef`，Token 只留在 Vite 子进程 |

本地开发链路为：`OPEN_DEMO.bat` → `OPEN_DEMO.ps1` 从本地 Kiro MCP 配置读取授权 → Vite 子进程环境变量 → `/api/mcd/menu` 代理 → 官方 MCP。浏览器永远不读取 Token。

## 3. 实际使用的工具

### 3.1 `query-meals`：P0 核心工具

用途：查询指定门店在指定就餐场景下的当前可售餐品列表。

本项目根据运行时 `tools/list` 确认的 inputSchema 使用：

```json
{
  "storeCode": "1450398",
  "orderType": 1,
  "beType": 1
}
```

参数含义：

- `storeCode`：真实门店编码，必填。
- `orderType=1`：到店场景。
- `beType=1`：到店自取。
- 到店自取不传 `beCode`。
- 预约场景才传 `reservationDate`，格式为 `yyyy-MM-dd HH:mm`。

运行时 Schema 的必填字段为 `storeCode`、`orderType`、`beType`；`beType` 枚举为 `1/2/5/6`，`orderType` 枚举为 `1/2`。外送、得来速和团餐场景还需要从上游门店工具获得真实 `beCode`，不得自行生成。

本次真实只读调用返回的业务结构包括：

- `data.categories[]`：分类名称、餐品 `code`、餐品标签。
- `data.meals[code]`：官方名称、图片字段、`currentPrice`、`originalPrice`、优惠类型和随单购能力。
- `data.frequent`：部分响应中的常点餐品信息。

本地受控代理获取真实响应后，浏览器实时展示 MCP 商品列表；页面显示读取数量和来源状态。代理失败时 UI 显示重试，不自动切换为 Mock。


用途：用户选择具体餐品后，按真实餐品编码读取套餐组成、默认选择和特调能力。

运行时必填字段：

```json
{
  "storeCode": "1450398",
  "orderType": 1,
  "beType": 1,
  "code": "<query-meals 返回的真实餐品编码>"
}
```

`code` 只能来自 `query-meals` 返回，不能由模型生成。Phase 1 已实现 Adapter 映射，公开演示主链路暂以 `query-meals` 为主；未对未选择的具体套餐声称详情事实。

### 3.4 `order-list`：用户主动授权的常点来源

工具运行时 inputSchema 无必填参数。My McMenu 不在启动时自动读取历史订单，而是在用户点击“读取我的常点餐品”后通过本地受控代理调用。

代理只递归提取订单响应中的商品编码，与当前 `query-meals` 商品列表做匹配；不会把订单号、下单时间、金额、地址或完整订单传给浏览器，也不会写入 `MenuBook`。匹配成功的商品编码写入 `BookProfile.frequentProductIds`，本命餐品页显示“来自你的麦当劳历史订单”；未授权、空历史或无匹配时显示降级来源。

### 3.5 `calculate-price`：P1 可选，不在当前演示主链路调用

官方工具和运行时 Schema 可见，支持门店场景、商品数组、特制选项、优惠券、助餐服务和餐具选项。真实价格必须由该工具返回，且展示查询时间；AI 不得计算或改写价格。

本项目当前不调用该工具，不承诺最终订单价，不展示虚构到手价。

### 3.6 明确未使用的工具

当前 MVP 不调用 `create-order`、地址、优惠券、账户、取消订单或抽奖工具。`order-list` 仅由用户主动按钮触发。原因是这些工具涉及用户隐私或业务副作用，超出“个人菜单册创作”的 P0 范围。

## 4. 调用流程

```text
用户/演示选择门店和就餐方式
        |
        v
OPEN_DEMO.ps1 从本地配置注入 Token（不进入浏览器）
        |
        v
Vite /api/mcd/menu 本地代理
        |
        v
initialize -> notifications/initialized -> tools/call(query-meals)
        |
        v
提取 data.categories + data.meals
        |
        v
ProductRef(source="mcd-mcp", productId=真实 code, officialName=真实 name)
        |
        +--> MockProductAdapter（无 Token 的明确演示模式）
        |
        v
MenuBook 六页渲染 / 用户创作 / localStorage / 脱敏导出
```

## 5. 真实调用证据

本项目已在门店 `1450398`、到店自取场景完成真实只读调用：

- MCP `initialize`：HTTP 200。
- MCP `tools/call`：HTTP 200。
- 工具：`query-meals`。
- 参数：`storeCode=1450398`、`orderType=1`、`beType=1`，未传 `beCode`。
- `isError=false`。
- RealMcpAdapter 冒烟查询返回 108 个商品候选。
- 调用日志只记录 `query-meals`、`success`、耗时和时间。
- 没有调用订单、价格、地址、优惠券或其他副作用工具。

脱敏证据文件：

- `MCP_SCHEMA_PROBE.md`：运行时工具清单和 inputSchema 摘要。
- `MCP_QUERY_MEALS_EVIDENCE.md`：真实商品响应结构和少量样本。
- `PHASE1_IMPLEMENTATION_REPORT.md`：Adapter、Mock、测试和冒烟验收。

## 6. 数据规范化与事实边界

`RealMcpAdapter` 将官方响应映射为：

```ts
{
  source: "mcd-mcp",
  productId: data.categories[].meals[].code,
  officialName: data.meals[productId].name,
  category: category.name,
  tags: data.categories[].meals[].tags,
  price: {
    amount: Number(data.meals[productId].currentPrice),
    currency: "CNY",
    checkedAt: queryTime,
    sourceField: "currentPrice"
  }
}
```

映射约束：

- `productId` 和 `officialName` 只来自 MCP 真实响应。
- `BookProfile` 保存常点来源、MBTI、星座、娱乐性运势和搭配理由；这些是作品上下文，不是官方商品事实。
- MBTI 搭配和星座餐品选择是本地可解释规则，输入商品仍来自实时 MCP。
- 自定义昵称、故事、标签存储在 `CustomProduct` 的创作层。
- 价格属于查询时事实，带来源和时间，不作为长期固定承诺。
- 图片字段由 MCP 真实响应返回时，阅读器商品卡片使用该图片作为本地实时视觉；图片加载失败会回落到风格图形卡片。
- 当前公开 HTML/PNG 导出仍不嵌入图片 URL，避免未确认授权和跨域问题。
- 缺少官方字段时显示“未核验”，不由模型补猜。

## 7. 失败、限流和 Mock 策略

- MCP 401/403：显示连接或鉴权失败，不伪装成真实成功。
- MCP 429：提示降低频率并允许重试。
- 超时/空商品/字段缺失：记录脱敏错误类型，保留用户输入，不生成虚构商品事实。
- Mock 模式：`ProductRef.source="mock"`，商品名称明确包含“非官方商品数据”；UI 显示“演示数据 · Mock”。
- Mock 不作为参赛真实 MCP 证据；真实 MCP 证据已单独保存在本仓库文档中。

## 8. 安全与用户确认

- Token 只在本地 MCP Client 或受控 Adapter 中存在。
- 调用日志不记录 Token、请求正文、完整订单、地址或个人账户数据。
- P0–P3 不自动下单。
- 若未来启用 `calculate-price`，先展示商品、规格、价格来源和查询时间。
- 若未来启用 `create-order`，先展示最终订单摘要并等待用户明确确认，未确认不得调用。
- 分享和导出剔除 Token、门店上下文、地址和订单信息。

## 9. 可复现命令

```powershell
bun install
bun run typecheck
bun test
bun run build
```

本地真实只读冒烟（Token 只从本地环境变量读取）：

```powershell
$env:MCD_MCP_TOKEN = '<local-token>'
$env:MCD_MCP_URL = 'https://mcp.mcd.cn'
$env:MCD_MCP_STORE_CODE = '1450398'
$env:MCD_MCP_ORDER_TYPE = '1'
$env:MCD_MCP_BE_TYPE = '1'
bun run smoke:real:bun
```

## 10. 官方来源

- 比赛活动规则：<https://raw.githubusercontent.com/M-China/mcd-developer-innovation-challenge/main/activityGuidelines.md>
- 官方参赛声明：<https://raw.githubusercontent.com/M-China/mcd-developer-innovation-challenge/main/CONTEST_DECLARATION.md>
- 官方 MCP Server README：<https://raw.githubusercontent.com/M-China/mcd-mcp-server/main/README.md>
- 官方 MCP Server：<https://github.com/M-China/mcd-mcp-server>
- MCP 开放平台：<https://open.mcd.cn/mcp>
