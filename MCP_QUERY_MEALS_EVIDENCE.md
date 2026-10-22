# My McMenu 真实 MCP 商品查询证据

> 查询日期：2026-10-19（北京时间）  
> 数据来源：麦当劳官方 MCP Server  只读工具 `query-meals`  
> 证据用途：证明 Phase 1 已完成一次真实“官方商品 → 规范化商品候选”探测。  
> 安全说明：未记录 Token、Authorization 头、用户地址、订单信息或完整原始响应；服务端 `traceId` 和图片 URL 已省略。

## 1. 调用状态

| 项目 | 值 |
|---|---|
| MCP Server | `https://mcp.mcd.cn` |
| 工具 | `query-meals` |
| initialize | HTTP 200 |
| tools/call | HTTP 200 |
| `isError` | `false` |
| 服务端响应时间 | `2026-10-19 19:00:10` |
| 业务副作用 | 无，只读查询 |

## 2. 实际调用参数

```json
{
  "storeCode": "1450398",
  "orderType": 1,
  "beType": 1
}
```

参数含义：

- `storeCode=1450398`：用户提供的门店编码。
- `orderType=1`：到店场景。
- `beType=1`：到店自取。
- 到店自取场景未传 `beCode`，符合运行时 `inputSchema`。

## 3. 实际响应结构

本次响应的业务结果包含：

```text
data.categories[]
  - name
  - meals[].code
  - meals[].tags[]

data.meals[productCode]
  - name
  - image
  - currentPrice
  - originalPrice
  - discountType（部分商品返回）
  - canWithOrder

data.frequent（部分响应能力）
message
traceId
```

`data.categories` 适合生成菜单分类和候选顺序；`data.meals` 是以官方商品编码为键的详情映射。项目中的 `productId` 必须来自这些真实编码，不能由模型生成。

## 4. 官方商品样本

以下为本次真实响应中抽取的少量样本。价格是本次门店菜单响应的事实字段，仅代表查询时结果；不得由 AI 改写，也不应被当作长期固定价格。

| productId / code | 官方名称 | 查询时现价 | 原价 | 返回标签/分类摘要 |
|---|---|---:|---:|---|
| `9900016076` | “我就喜欢”鸡薯双全盒 | 15.9 | 29 | 人气热卖；心形薯饼同款比心 |
| `9900016075` | 龙焰芝士棒鸡腿堡三件套 | 29.9 | 51 | 鸡肉汉堡/卷；上新；浓郁奶香拉丝芝士 |
| `9900016073` | 龙焰鸡腿堡三件套 | 26.9 | 48 | 鸡肉汉堡/卷；上新；韩式辣椒黄油风味 |
| `9900005456` | 麦辣鸡腿汉堡三件套 | 33.5 | 46.5 | 鸡肉汉堡/卷；套餐；立省10.5元起 |
| `511781` | 培根安格斯厚牛堡 | 34.5 | 34.5 | 安格斯 MAX 厚牛堡；单品；100%安格斯牛肉 |
| `6352` | 阳光橙麦炫酷 | 13 | 13 | 饮品；冷饮 |

本表只保留演示所需的官方编码、名称、分类/标签和价格字段，没有复制官方图片 URL。正式产品实现应将图片字段视为“已返回但授权边界待确认”，优先使用有权素材或可替换占位图。

## 5. Phase 1 映射结论

真实数据已经可以映射为：

```text
ProductRef {
  source: "mcd-mcp",
  productId: data.categories[].meals[].code,
  officialName: data.meals[productId].name,
  price: data.meals[productId].currentPrice/originalPrice,
  imageUrl: data.meals[productId].image（当前不直接用于公开导出）
}
```

需要保持的边界：

- `officialName`、`productId` 和实时事实字段属于官方数据层。
- 菜单册中的昵称、故事、标签属于用户创作层，两者不得混淆。
- `currentPrice` 只在标明查询时间和来源时展示。
- 本次查询没有调用 `query-meal-detail`，所以未对套餐组成、特调选项或 `supportModify` 做事实判断。
- 本次查询没有调用 `calculate-price`，没有产生最终订单价格或优惠承诺。
- 本次查询没有调用 `create-order`、`order-list`、地址或优惠券工具。

## 6. 下一步建议

Phase 1 的真实只读查询证据已具备。后续编码可以在 `own/1024` 内实现：

1. `McdProductAdapter` 的运行时字段映射。
2. `MockProductAdapter`，并在界面明确显示“演示数据”。
3. `MenuBook` Schema 校验和 `ProductRef.source` 分层。
4. 选定单个商品后，再按真实 `code` 调用 `query-meal-detail` 验证详情映射。

相关文件：

- `PHASE0_VERIFICATION.md`
- `MCP_ACCESS_AND_CONFIRMATION.md`
- `MCP_SCHEMA_PROBE.md`
