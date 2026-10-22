# My McMenu Phase 1 实施与验收报告

> 阶段：Phase 1｜可运行数据闭环  
> 项目根目录：`own/1024`  
> 完成日期：2026-10-20（北京时间）  
> 状态：**完成，等待确认进入 Phase 2**

## 1. 阶段目标

完成“真实麦当劳 MCP 商品 → 规范化 `ProductRef` → `MenuBook` JSON”的数据闭环，同时提供无 Token 的 Mock 降级能力。Phase 1 不包含 UI、下单、公开分享后端和自动推荐。

## 2. 已交付

### 领域层

- `ProductRef`：区分 `source: mcd-mcp | mock`、官方 `productId`、官方名称、价格事实、图片和标签。
- `CustomProduct`：独立保存用户昵称、故事、描述、标签和隐藏状态，不覆盖官方字段。
- `MenuBook`：固定六页结构、版本号、修订号和更新时间。
- Zod Schema：校验商品 ID 唯一、页面 ID 唯一、页面商品引用存在、六页顺序固定。
- `StoreContext`：校验门店编码、就餐方式、订单类型、`beCode` 和预约时间规则。

### Adapter 与 MCP

- `McpStreamableHttpClient`：实现 MCP `initialize`、`notifications/initialized`、`tools/call`，支持 JSON/SSE 响应、会话头、超时和 HTTP 错误分类。
- `RealMcpAdapter`：按真实运行时 Schema 调用 `query-meals` 和 `query-meal-detail`。
- `MockProductAdapter`：返回明确标注为演示数据的 Mock 商品，不伪装成官方数据。
- 官方响应规范化：从 `data.categories` 和 `data.meals` 映射官方商品编码、名称、分类、标签、价格和图片字段。
- 调用日志：只记录工具名称、状态、耗时、时间和错误类型，不记录 Token、请求正文、完整订单或隐私响应。

### 验证入口

- `src/smoke/real-mcp-smoke.ts`：只读真实 MCP `query-meals` 冒烟入口。
- `bun run smoke:real:bun`：当前 Windows/Bun 环境可执行的冒烟命令。
- `npm run smoke:real`：为标准 Node/npm 环境保留的入口；当前环境未安装 npm，且 Bun 执行 `tsx` preload 存在兼容问题，因此未用该入口验证。

## 3. 验收结果

| 验收项 | 结果 | 证据 |
|---|---|---|
| 固定版本依赖安装 | 通过 | `bun install`，Bun 1.3.13，生成 `bun.lock` |
| 单元测试 | 通过 | `bun test`：10 pass，0 fail，24 assertions |
| TypeScript 类型检查 | 通过 | `bun run typecheck` |
| 生产构建 | 通过 | `bun run build` |
| RealMcpAdapter 真实冒烟 | 通过 | `bun run smoke:real:bun`，只读 `query-meals` 返回 108 个商品 |
| MCP 日志脱敏 | 通过 | 冒烟输出仅含 `query-meals`、success、耗时和时间 |
| Mock 降级可识别 | 已实现 | Mock 商品统一 `source: "mock"`，名称含“非官方商品数据” |
| 真实 MCP 证据 | 已保留 | `MCP_QUERY_MEALS_EVIDENCE.md` |
| 运行时 Schema 证据 | 已保留 | `MCP_SCHEMA_PROBE.md` |

真实冒烟使用的门店上下文为：`storeCode=1450398`、`orderType=1`、`beType=1`，未传 `beCode`。没有调用价格计算、订单、优惠券、地址或下单工具。

## 4. 安全边界

- Token 只从运行时环境变量/本地 MCP 配置读取，不进入源码、Git、日志或前端 bundle。
- `mcp-config.example.json` 只包含 `YOUR_MCP_TOKEN` 占位符。
- `.env`、`node_modules`、`dist` 和 coverage 已加入忽略规则。
- 官方商品字段和用户创作字段分离；AI/创作层不能改写 `productId`、官方名称和价格事实。
- 当前没有实现自动 fallback：真实 MCP 失败不能静默伪装为 Mock 成功；调用方必须显式选择或提示演示模式。
- 当前没有实现 `create-order`、`order-list`、地址、优惠券和价格计算业务。

## 5. 已知风险

1. 当前 `ProductRef.currency` 使用 `CNY` 作为中国门店适配层约定；官方 `query-meals` 返回的价格字段没有单独返回币种，正式价格展示仍需保留来源和检查时间。
2. 官方返回了图片字段，但图片使用授权边界尚未确认；Phase 2 默认使用占位图或有权素材，不直接把官方图片 URL 放入公开导出。
3. `query-meal-detail` 的真实调用代码已实现，但本阶段只做了 `query-meals` 真实冒烟，套餐组成和特调字段仍需选择具体商品后单独核验。
4. 当前环境使用 Bun 完成验证，Node/npm 标准命令尚未在本机执行；项目保留 Node `>=20.11.0` 和 npm 脚本配置。
5. `MCP_INTEGRATION.md`、官方原文 `CONTEST_DECLARATION.md` 和最终参赛包装仍属于 Phase 4，不在本阶段提前声称完成。

## 6. Phase 2 边界

进入 Phase 2 后只扩展以下内容：

- React/Vite 响应式创作工坊和六页阅读器。
- 商品选择、风格选择和一句话创作输入。
- MenuBook JSON 渲染为封面、目录、单品故事、组合、今日特刊、封底。
- 375px 移动端优先、键盘/触摸翻页和目录跳转。
- UI 明确区分官方商品事实、用户创作内容和 Mock 演示数据。
- 不把 MCP Token 放到浏览器；前端通过本地/服务端 Adapter 获取已规范化数据。

Phase 2 不自动加入下单、账号系统、社交关系、自由画布和长期画像。

## 7. 修改文件范围

新增或修改的实现文件集中在 `own/1024`：

- 配置：`package.json`、`bun.lock`、`tsconfig.json`、`vitest.config.ts`、`.env.example`、`.gitignore`、`mcp-config.example.json`
- 领域：`src/domain/*`
- Adapter：`src/adapters/*`
- 日志：`src/telemetry/tool-call-log.ts`
- 冒烟：`src/smoke/real-mcp-smoke.ts`
- 测试：`tests/*`
- 文档：`README.md`、本报告

没有修改工作区其他项目，没有修改 MCP 配置文件，没有创建公开仓库或提交报名 Issue。
