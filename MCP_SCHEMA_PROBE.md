# My McMenu 运行时 MCP Schema 探测记录

> 探测日期：2026-10-19（北京时间）  
> Server：`https://mcp.mcd.cn`  
> 探测方式：本地已授权 MCP 配置，`initialize` → `notifications/initialized` → `tools/list`  
> 安全边界：只读取工具能力定义；未发送门店、订单、地址或用户数据；未调用任何业务副作用工具；未记录 Token。

## 1. 连接结果

| 项目 | 结果 |
|---|---|
| `initialize` | HTTP 200 |
| `notifications/initialized` | HTTP 202 |
| `tools/list` | HTTP 200 |
| 工具数量 | 35 |
| My McMenu 目标工具 | `query-meals`、`query-meal-detail`、`calculate-price` 可见 |
| 订单历史工具 | `order-list` 可见，输入对象无必填字段 |

## 2. 真实 inputSchema 摘要

以下内容来自本次运行时 `tools/list` 返回的 `inputSchema`，不是根据经验补写的字段。这里记录与 My McMenu P0/P1 相关的摘要；完整运行时 Schema 仍应以每次服务端返回为准。

### 2.1 `query-meals`

根类型为 object。

**必填字段：**

| 字段 | 类型 | 约束 |
|---|---|---|
| `storeCode` | string | 门店编码，不能为空 |
| `orderType` | integer | 枚举：`1` 到店，`2` 外送 |
| `beType` | integer | 枚举：`1` 到店取餐、`2` 麦乐送、`5` 得来速、`6` 企业团餐 |

**可选字段：**

| 字段 | 类型 | 约束 |
|---|---|---|
| `beCode` | string | 得来速/外送/团餐场景按上游门店查询结果传入；到店自取不传 |
| `reservationDate` | string | 预约场景传入，格式 `yyyy-MM-dd HH:mm`；非预约不传 |

### 2.2 `query-meal-detail`

根类型为 object。

**必填字段：**

| 字段 | 类型 | 约束 |
|---|---|---|
| `storeCode` | string | 门店编码，不能为空 |
| `orderType` | integer | 枚举：`1` 到店，`2` 外送 |
| `beType` | integer | 枚举：`1`、`2`、`5`、`6` |
| `code` | string | 餐品唯一编码，由 `query-meals` 真实返回 |

**可选字段：**

| 字段 | 类型 | 约束 |
|---|---|---|
| `beCode` | string | 得来速/外送/团餐按上游结果传入；到店自取不传 |
| `reservationDate` | string | 预约场景传入，格式 `yyyy-MM-dd HH:mm` |

工具描述还明确了：详情结果中的 `supportModify`、`choice.supportModify` 和默认选择等字段需要按官方输出规则展示；具体响应结构须以实际餐品详情响应为准。

### 2.3 `calculate-price`（P1，可选）

根类型为 object，必填字段为：

- `storeCode`: string
- `orderType`: integer，枚举 `1`/`2`
- `beType`: integer，枚举 `1`/`2`/`5`/`6`

运行时 Schema 还返回了以下可选能力：

- `beCode`、`reservationDate`
- `items`: 商品数组，包含 `productCode`、`quantity`、可选优惠券、特制项、套餐子项等结构
- `gmServiceCode`: 企业团餐助餐服务码
- `needTableware`: boolean
- `withOrder`: 随单购对象

价格字段单位和完整返回结构仍应以实际调用结果为准。P0 不依赖价格计算，也不自行计算价格。

### 2.4 `order-list`（不纳入 P0）

运行时 Schema 为无必填字段的 object。虽然工具可见，但 My McMenu P0 不调用历史订单，不保存订单数据；除非未来取得用户明确授权并完成单独的隐私设计。

## 3. `query-meals` 调用前置条件

My McMenu 当前已经具备：

- 官方 MCP Server 鉴权和连接成功。
- `query-meals` 的真实工具名和 inputSchema。
- `query-meal-detail` 的真实工具名和 inputSchema。

当前仍缺少用户明确的门店上下文：

- `storeCode`
- `beType`：用户选择 `1` 到店自取、`2` 麦乐送、`5` 得来速或 `6` 企业团餐
- `orderType` 可由 `beType` 推导：`beType=1/5` 时为 `1`，`beType=2/6` 时为 `2`
- 当 `beType=2/5/6` 时，还需要通过对应上游门店查询获得真实 `beCode`；不得自行生成
- 如需预约，还需要用户明确的 `reservationDate`

在用户提供或选择门店上下文前，不发起 `query-meals`，不猜测门店编码，不调用地址、订单或下单工具。

## 4. 下一步

用户提供以下信息后，才执行一次只读 `query-meals`：

```text
门店编码：<真实 storeCode>
就餐方式：到店自取 / 麦乐送 / 得来速 / 企业团餐
预约时间：非预约可不填
```

若用户尚未有 `storeCode`，应先根据用户主动提供的城市/位置和就餐方式调用对应的门店查询工具；该调用仍需遵循最小数据原则，不自行读取用户地址或订单历史。

## 5. 相关文件与来源

- Phase 0 核验报告：`PHASE0_VERIFICATION.md`
- Token/权限与用户确认流程：`MCP_ACCESS_AND_CONFIRMATION.md`
- 官方 MCP Server README：<https://raw.githubusercontent.com/M-China/mcd-mcp-server/main/README.md>
- 官方 MCP Server：<https://github.com/M-China/mcd-mcp-server>
