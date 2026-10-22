# My McMenu MCP Token、权限与用户确认流程

> 本文说明如何为 My McMenu 准备官方 MCP 访问权限，以及项目如何区分“账户授权”“工具调用授权”和“敏感操作确认”。不包含真实 Token、账号凭据或个人信息。

## 1. 官方资料是否写明 Token 从哪里获得

**写明了。**详细步骤不在活动规则正文中，而在官方比赛仓库的“参与方式 / 申请 MCP Token”说明和官方 `mcd-mcp-server` README 的“申请 MCP Token”章节中。

官方流程是：

1. 打开麦当劳 MCP 开放平台：<https://open.mcd.cn/mcp>。
2. 点击“登录”，使用手机号完成验证登录。
3. 登录后进入“控制台”。
4. 点击“激活”，申请 MCP Token。
5. 阅读并同意麦当劳 MCP 服务协议。
6. Token 申请成功后，在控制台复制 Token，并只保存在本地安全配置中。

官方比赛规则本身没有另设一个“参赛项目 MCP 权限审批”流程；项目使用官方 MCP、符合服务规则并在公开仓库中真实运行即可。Token 是访问 MCP Server 的技术凭据，不应提交到 GitHub、聊天、Issue、截图、日志或前端 bundle。

## 2. 官方 MCP 接入信息

| 项目 | 官方确认内容 |
|---|---|
| Server 地址 | `https://mcp.mcd.cn` |
| 传输协议 | Streamable HTTP |
| 请求认证 | `Authorization: Bearer YOUR_MCP_TOKEN` |
| 限流 | 每个 Token 每分钟最多 600 次请求 |
| 无效/缺失凭据 | 官方文档列出 HTTP 401 |
| 超过限流 | 官方文档列出 HTTP 429 |

官方配置示例使用 `YOUR_MCP_TOKEN` 占位符。项目仓库中的配置只能保留占位符或环境变量引用，不得写入实际 Token。

## 3. 在本地 Kiro 中的执行方式

### 3.1 安全准备

1. 用户在官方平台自行申请 Token；不要把 Token 粘贴到聊天窗口。
2. 在 Kiro 的 MCP 配置界面或本地未追踪配置中新增名为 `mcd-mcp` 的 Server。
3. 使用官方地址和 Bearer 认证头。
4. 确认该配置文件不会被 Git 跟踪、不会进入 `own/1024` 公共项目目录，也不会被打包到浏览器。
5. 通过 Kiro 的 MCP Server 面板重新连接或刷新 Server。

官方配置结构如下；`YOUR_MCP_TOKEN` 只能作为本地占位符，不能直接提交：

```json
{
  "mcpServers": {
    "mcd-mcp": {
      "type": "streamablehttp",
      "url": "https://mcp.mcd.cn",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_TOKEN"
      }
    }
  }
}
```

说明：官方公开文档只保证上述配置结构和 Token 头格式，没有在比赛规则中规定 Kiro 的具体存储位置或环境变量插值语法。因此不要未经验证就把 `${MCD_MCP_TOKEN}` 当作 Kiro 一定支持的配置语法；实际使用时以 Kiro MCP 配置界面/当前版本文档为准，并保持配置文件不公开。

### 3.2 连接后的验证顺序

接入后按以下顺序验证，不直接执行下单或其他有副作用工具：

1. Kiro MCP Server 面板显示 `mcd-mcp` 已连接。
2. 先调用 MCP 的工具发现能力 `tools/list`，确认当前 Token 可用。
3. 确认至少存在 `query-meals` 和 `query-meal-detail`，并读取真实请求 Schema。
4. 根据真实 Schema 准备门店上下文；字段名和必填项以运行时 Schema 为准，不凭经验猜测。
5. 只执行一次只读的 `query-meals`，保存脱敏的工具名、状态、耗时和字段样本。
6. 再按真实返回的官方餐品编码执行 `query-meal-detail`，验证 `productId`/官方名称映射。
7. 真实调用成功后，才把字段映射固化到 `RealMcpAdapter` 和 `MCP_INTEGRATION.md`。

当前 Phase 0 已做过一次**无凭据** `tools/list` 探测，返回 HTTP 403；这不是成功接入证据，也没有产生商品数据。

## 4. “用户确认”到底指什么

需要区分三种不同的确认：

### A. 麦当劳账户/服务协议确认

这是申请 Token 时用户在官方平台完成的登录、激活和服务协议同意。它授予 Token 的使用资格，但不等于允许应用自动执行所有业务操作。

### B. 项目接入确认

这是项目开发者在本地启用 `mcd-mcp` 并明确允许 My McMenu 使用只读商品查询。当前项目进入 Phase 1 前，需要用户确认“已完成本地配置并允许进行真实只读查询”。用户无需在聊天中提供 Token。

### C. 业务动作确认

比赛规则和 MCP README 没有规定一个统一的 Agent UI 确认协议；但 My McMenu PRD 已明确：

- P0 只读查询商品，不实现自动下单。
- 价格、优惠、配送费等事实只能来自真实工具，不能由 AI 编造或改写。
- 如果未来实现 `calculate-price`，先展示商品、规格、价格来源和查询时间，再等待用户确认。
- 如果未来实现 `create-order`，必须在展示真实商品、规格、价格、门店和就餐方式后取得用户明确确认；没有确认不得调用。
- 订单历史、地址、优惠券和账户数据属于敏感数据，除非用户明确授权，不调用、不保存。

因此，My McMenu 的执行门禁应是：

```text
只读商品查询：用户完成 MCP 接入确认后可执行
价格计算：用户发起价格查看，并在结果中显示来源/时间
创建订单：展示最终订单摘要 -> 用户明确点击确认 -> 才允许调用
账户/地址/订单历史：单独请求授权 -> 最小化调用 -> 脱敏记录
```

## 5. 本项目当前需要用户做的操作

用户只需要在本地完成以下步骤：

- [ ] 在 <https://open.mcd.cn/mcp> 登录并完成 Token 激活及服务协议确认。
- [ ] 在 Kiro 本地启用 `mcd-mcp`，地址为 `https://mcp.mcd.cn`。
- [ ] 将 Token 放入本地安全配置，不发送到聊天，不写入 `own/1024`。
- [ ] 在 Kiro MCP 面板确认 Server 已连接。
- [ ] 回复“已配置，可以进行 Phase 1 只读查询”，无需提供 Token。

收到该确认后，下一步只做 `tools/list`、真实 Schema 读取和只读 `query-meals` 探测；不会调用下单、领券、取消订单或其他有副作用工具。

## 6. 官方来源

- 比赛仓库参与说明：<https://github.com/M-China/mcd-developer-innovation-challenge>
- 比赛活动规则：<https://raw.githubusercontent.com/M-China/mcd-developer-innovation-challenge/main/activityGuidelines.md>
- 官方 MCP Server README：<https://raw.githubusercontent.com/M-China/mcd-mcp-server/main/README.md>
- 官方 MCP Server 仓库：<https://github.com/M-China/mcd-mcp-server>
- 官方 MCP 服务规则（活动规则引用）：<https://cdn.mcd.cn/cms/pages/MCPServerRules.html>

本文件对官方资料进行了结构化转述；具体服务条款和规则以官方页面当前内容为准。
