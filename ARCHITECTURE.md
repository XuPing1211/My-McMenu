# My McMenu Architecture

```mermaid
flowchart LR
  U[用户\n选择商品与风格] --> W[React 创作工坊]
  W --> S{数据来源}
  S -->|MCP 快照| C[MCP Product Snapshot\n脱敏商品事实]
  S -->|演示数据| M[MockProductAdapter\nsource=mock]
  C --> N[ProductRef\n官方 ID/名称/价格事实]
  M --> N
  R[RealMcpAdapter\n本地受控运行] --> H[MCP Streamable HTTP\nhttps://mcp.mcd.cn]
  H --> T[query-meals\nquery-meal-detail]
  T --> R
  N --> B[MenuBook Schema\nZod 校验]
  B --> V[六页阅读器]
  V --> E[局部编辑抽屉]
  E --> P[创作字段\n昵称/故事/标签/隐藏]
  P --> B
  B --> L[localStorage\nrevision 快照]
  B --> X[脱敏导出\nPNG / HTML]

  F[官方事实层\nproductId/officialName/price] -.不可被编辑覆盖.- P
  K[Token\n仅本地配置/环境变量] -.不进入.- W
```

## 层次说明

| 层 | 职责 | 安全边界 |
|---|---|---|
| MCP Client | 初始化 MCP、调用只读工具、处理超时和 HTTP 错误 | Token 只在本地/受控运行时 |
| RealMcpAdapter | 把官方返回映射为 `ProductRef` | 不生成商品 ID，不猜字段 |
| MockProductAdapter | 无 Token 时提供可运行演示数据 | `source=mock`，不得伪装真实 MCP |
| Domain / Schema | 校验 `MenuBook` 六页、引用和版本 | 官方字段与创作字段分离 |
| React UI | 创作工坊、阅读器、编辑抽屉和来源标识 | 浏览器不持有 MCP Token |
| Storage | 保存经过 Schema 校验的本地草稿 | 不保存 MCP 配置、地址或订单 |
| Export | 生成当前页 PNG 和整本 HTML | 导出模型剔除图片 URL、Token、门店上下文和订单 |
