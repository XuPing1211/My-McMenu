# My McMenu｜麦门私人菜单册

> 真实麦当劳 MCP 商品 × 粉丝个人表达 × 可翻阅数字菜单册

My McMenu 是麦当劳程序员创意开发大赛参赛 MVP。每个人都有一份只属于自己的麦门记忆：加班后的第一口、和朋友分享的一餐，或是低落时悄悄奖励自己的小小快乐。My McMenu 把麦当劳官方 MCP 的真实餐品数据，变成一本可翻阅、可编辑、可导出的私人菜单册：你可以为本命餐品起昵称，用 MBTI 生成快乐搭配，用星座写一页今日特刊，让“我喜欢吃什么”变成“这就是我的故事”。它不是推荐一个答案，而是帮每个人把属于自己的那一口，保存成值得分享的故事。官方商品事实与用户创作内容严格分层，商品编码和官方名称不会被昵称覆盖。

**粉丝创作 / 非麦当劳官方产品 / 非官方商品命名**

## 功能概览

- **实时 MCP 数据闭环**：开发服务器通过本地受控代理调用麦当劳官方 `query-meals`，浏览器只接收脱敏后的真实餐品字段。
- **Mock 降级模式**：没有本地 Token 或官方 MCP 暂时不可用时，用户可以主动切换演示数据；Mock 明确标记 `source: "mock"`，不会伪装真实 MCP。
- **创作工坊**：选择商品、风格、书名候选、封面署名和个人描述。
- **六页阅读器**：封面、目录、本命餐品、快乐搭配、今日特刊、封底；三张内页会根据个人 profile 变化。
- **本命餐品**：用户主动授权读取历史订单后，按真实商品编码匹配当前 MCP 菜单；未授权或无匹配时明确降级。
- **MBTI 快乐搭配**：选择 MBTI 后按本地可解释关键词规则从真实商品中挑选搭配，并展示搭配理由。
- **星座今日特刊**：选择星座后生成娱乐性今日运势文案，并从真实商品中选择对应特刊餐品。
- **翻阅交互**：目录跳页、上一页/下一页、键盘左右键、移动端左右滑动。
- **局部编辑**：书名、宣言、章节标题、商品昵称、故事、标签、隐藏/恢复。
- **保存与撤销**：localStorage 草稿、revision 快照、撤销最近一次修改。
- **语气驱动主题**：在个人描述中写入“复古/怀旧/报纸”“可爱/治愈/手账”“极简/克制/酷感”等语气，书籍主题会同步切换；用户也可以手动选择。
- **防溢出版式**：长标题、中文正文和商品名称使用强制换行、平衡换行和可伸缩纸张布局，避免文字覆盖或溢出。
- **风格图形与商品视觉**：四种主题有对应图形素材；真实 MCP 返回的商品图片只在本地阅读器视觉卡片使用，不进入公开导出。
当前版本不实现自动下单、账号系统、公共分享链接、长期用户画像或外部权威星座/MBTI 测试；历史订单只在用户主动点击“读取我的常点餐品”后调用，只提取用于匹配的商品编码。

## 快速开始

### 环境要求

- Node.js `>=20.11.0` + npm，或
- Bun `1.3+`（本项目已使用 Bun 验证）

### 安装与验证

在项目根目录 `own/1024` 执行：

```powershell
bun install
bun node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
bun test
bun run build
```

使用 npm 时：

```powershell
npm install
npm run typecheck
npm test
npm run build
```

### 启动 Web Demo

推荐在 Windows 中双击 `OPEN_DEMO.bat`，它会启动 Vite 并打开浏览器。

也可以在项目根目录打开 PowerShell：

```powershell
bun run dev
```

然后打开 <http://127.0.0.1:4173>。不要直接双击 `index.html`；`file://` 会阻止 React/Vite 的 ES Module 加载。详细说明见 [VIEW_DEMO.md](VIEW_DEMO.md)。

也可以使用：

```powershell
npm run dev
```

### Mock 模式

打开 Demo 后默认调用门店 `1450398` 的官方 MCP 实时餐品接口；只有用户主动切换“演示数据”时才使用 Mock。若实时查询失败，页面会显示失败原因和“重试实时查询”，不会静默把 Mock 当成真实商品。

### 真实 MCP 本地代理

`OPEN_DEMO.bat` 会从本地 Kiro MCP 配置读取授权到 Vite 子进程环境，Token 只留在本地服务端，不进入浏览器。浏览器请求 `/api/mcd/menu`，本地代理再调用 `https://mcp.mcd.cn`。

### MCP 实时查询

启动 Demo 后默认请求官方 MCP 实时餐品。页面会显示“正在调用官方 MCP”或“已读取 N 个真实餐品”；查询失败时提供重试，不会自动伪装为 Mock。

### 真实 MCP 只读冒烟

Node/npm 环境：

```powershell
$env:MCD_MCP_TOKEN = '<local-token>'
$env:MCD_MCP_URL = 'https://mcp.mcd.cn'
$env:MCD_MCP_STORE_CODE = '1450398'
$env:MCD_MCP_ORDER_TYPE = '1'
$env:MCD_MCP_BE_TYPE = '1'
npm run smoke:real
```

Bun 环境：

```powershell
$env:MCD_MCP_TOKEN = '<local-token>'
$env:MCD_MCP_URL = 'https://mcp.mcd.cn'
$env:MCD_MCP_STORE_CODE = '1450398'
$env:MCD_MCP_ORDER_TYPE = '1'
$env:MCD_MCP_BE_TYPE = '1'
bun run smoke:real:bun
```

该冒烟入口只调用只读 `query-meals`，不会调用价格、订单、领券、地址或下单工具。真实 Token 只存在于当前进程环境，不会写入输出。

## MCP 接入

官方 Server：<https://mcp.mcd.cn>  
协议：Streamable HTTP  
认证：`Authorization: Bearer YOUR_MCP_TOKEN`

本项目当前实际使用：

- `query-meals`：真实门店餐品列表，是 P0 主链路。
- `query-meal-detail`：按真实商品编码读取详情，Adapter 已实现，按需调用。
- `order-list`：只有用户主动点击读取常点餐品时调用；只提取可匹配商品编码，不把订单详情展示或保存到作品。
- `calculate-price`：Schema 已核验，但当前 MVP 不调用，不承诺最终订单价。

详细流程、真实参数、运行时 Schema、脱敏证据和安全边界见 [MCP_INTEGRATION.md](MCP_INTEGRATION.md)。

## 安全与事实边界

- `productId`、官方名称、来源和价格事实来自 MCP 或明确标注的 Mock 数据。
- 用户昵称、故事、宣言和标签属于创作层，不修改官方事实层。
- Token 只放在本地 MCP 配置或运行时环境变量，不进入浏览器 bundle、Git、日志或导出。
- 调用日志只记录工具名、成功/失败、耗时和错误类型。
- 真实工具失败时不会静默伪装成 Mock 成功。
- 当前不调用 `create-order`、地址、优惠券、账户和抽奖工具；`order-list` 仅在用户主动授权按钮后调用，并只保留商品编码匹配结果。
- 导出内容剔除 Token、门店上下文、地址、订单和图片 URL。

## 项目结构

```text
own/1024/
├─ src/
│  ├─ adapters/
│  │  ├─ mcp-client.ts             # MCP Streamable HTTP / JSON-RPC 客户端
│  │  ├─ real-mcp-adapter.ts       # 官方 MCP 商品 Adapter
│  │  ├─ mock-product-adapter.ts   # 明确标识的演示 Adapter
│  │  ├─ mcd-order-response.ts     # 历史订单商品编码脱敏提取
│  │  └─ mcd-response.ts            # 官方响应规范化
│  ├─ domain/
│  │  ├─ types.ts                  # ProductRef / MenuBook 类型
│  │  ├─ schema.ts                 # Zod Schema
│  │  ├─ personalization.ts        # MBTI/星座可解释搭配规则
│  │  ├─ menu-book.ts              # 六页菜单册生成
│  │  ├─ menu-book-editor.ts       # 不可变局部编辑与 revision
│  │  └─ creative-copy.ts           # 三候选本地文案生成
│  ├─ export/book-export.ts         # HTML / PNG 脱敏导出
│  ├─ storage/menu-book-storage.ts  # localStorage 保存恢复
│  ├─ telemetry/tool-call-log.ts    # 非敏感调用日志
│  ├─ smoke/real-mcp-smoke.ts       # 真实只读冒烟
│  └─ web/                          # React/Vite 创作工坊与阅读器
├─ tests/                           # Phase 1–3 单元测试
├─ index.html
├─ package.json
├─ mcp-config.example.json
├─ .env.example
├─ ARCHITECTURE.md
├─ MCP_INTEGRATION.md
├─ DEMO_SCRIPT.md
└─ CONTEST_DECLARATION.md
```

## 验证结果

截至 Phase 3：

- 严格 TypeScript 类型检查：通过。
- 单元测试：15 pass / 0 fail / 44 assertions。
- Vite 生产构建：通过。
- 真实 `query-meals` 冒烟：门店 `1450398`、到店自取，返回 108 个商品候选。
- Playwright 黑盒验证：局部编辑、官方名称保留、撤销、localStorage、HTML/PNG 下载、375px 无横向溢出均通过。

证据文档：

- [PHASE0_VERIFICATION.md](PHASE0_VERIFICATION.md)
- [MCP_SCHEMA_PROBE.md](MCP_SCHEMA_PROBE.md)
- [MCP_QUERY_MEALS_EVIDENCE.md](MCP_QUERY_MEALS_EVIDENCE.md)
- [PHASE1_IMPLEMENTATION_REPORT.md](PHASE1_IMPLEMENTATION_REPORT.md)
- [PHASE2_IMPLEMENTATION_REPORT.md](PHASE2_IMPLEMENTATION_REPORT.md)
- [PHASE3_IMPLEMENTATION_REPORT.md](PHASE3_IMPLEMENTATION_REPORT.md)

## 比赛提交文件

官方规则要求项目公开发布并包含以下标准文件：

- `README.md`：本文件。
- `CONTEST_DECLARATION.md`：官方原文，未改写。
- `MCP_INTEGRATION.md`：实际 MCP Server、工具、参数、流程和业务价值。
- `mcp-config.example.json`：脱敏配置，只含占位符。
- `workbuddy.md`：仅参加 WorkBuddy 专项奖励时需要；本项目当前未声称参加该专项。

比赛报名 Issue 格式：

```text
【参赛申请】
项目名称：My McMenu｜麦门私人菜单册
项目地址：https://github.com/<your-account>/<your-public-repository>
项目简介：每个人都有一份只属于自己的麦门记忆：加班后的第一口、和朋友分享的一餐，或是低落时悄悄奖励自己的小小快乐。My McMenu 把麦当劳官方 MCP 的真实餐品数据，变成一本可翻阅、可编辑、可导出的私人菜单册：你可以为本命餐品起昵称，用 MBTI 生成快乐搭配，用星座写一页今日特刊，让“我喜欢吃什么”变成“这就是我的故事”。它不是推荐一个答案，而是帮每个人把属于自己的那一口，保存成值得分享的故事。
```

项目地址提交时使用公开仓库的纯文本 URL，按官方活动仓库的校验要求操作。公开仓库创建、推送和报名 Issue 提交不由本地 Demo 自动执行。

## 官方来源

- [比赛活动规则](https://raw.githubusercontent.com/M-China/mcd-developer-innovation-challenge/main/activityGuidelines.md)
- [官方参赛声明](https://raw.githubusercontent.com/M-China/mcd-developer-innovation-challenge/main/CONTEST_DECLARATION.md)
- [官方 MCP Server README](https://raw.githubusercontent.com/M-China/mcd-mcp-server/main/README.md)
- [官方 MCP Server 仓库](https://github.com/M-China/mcd-mcp-server)
- [MCP 开放平台](https://open.mcd.cn/mcp)
