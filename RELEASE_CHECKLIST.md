# My McMenu 发布前检查清单

> 检查日期：2026-10-20（北京时间）  
> 状态：本地参赛包已验收；公开仓库、推送和报名 Issue 尚未执行。

## 官方必交文件

- [x] `README.md`
- [x] `CONTEST_DECLARATION.md`：官方原文，未修改
- [x] `MCP_INTEGRATION.md`
- [x] `mcp-config.example.json`：仅占位符
- [ ] `workbuddy.md`：当前不参加 WorkBuddy 专项，因此未创建

## 功能与证据

- [x] 真实 MCP `query-meals` 调用证据
- [x] 运行时工具 Schema 摘要
- [x] RealMcpAdapter / MockProductAdapter
- [x] 六页菜单册与响应式阅读器
- [x] 局部编辑、revision、撤销、localStorage
- [x] PNG / HTML 脱敏导出
- [x] 架构图与 90 秒 Demo 脚本

## 验证命令

- [x] `bun install --frozen-lockfile`
- [x] `bun node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
- [x] `bun test`：15 pass / 0 fail
- [x] `bun run build`
- [x] Playwright 黑盒验证：编辑、撤销、保存、HTML/PNG 下载、375px 无溢出

## 安全门禁

- [x] 源码和参赛文档无真实 Token、Bearer 凭据、内部 MCP 密钥
- [x] `mcp-config.example.json` 仅含 `YOUR_MCP_TOKEN`
- [x] `.env`、`node_modules`、`dist`、coverage 已加入 `.gitignore`
- [x] 导出不包含 Token、地址、订单、门店上下文和图片 URL
- [x] 未实现自动下单，未调用订单/地址/优惠券/账户工具
- [x] 未提交 `workbuddy.md`，未虚构 WorkBuddy 使用

## 公开发布前人工确认

- [ ] 创建符合官方时间窗口的 GitHub Public 仓库
- [ ] 只提交 `own/1024` 中需要公开的文件，不提交 `node_modules`、`dist`、`.env` 或本地缓存
- [ ] 重新检查 GitHub 仓库可公开访问
- [ ] 按官方格式创建报名 Issue
- [ ] 报名 Issue 的项目地址使用纯文本 URL
- [ ] 确认项目名称、简介、原创/授权和内容合规
- [ ] 确认是否需要参加 WorkBuddy 专项；若参加，再准备真实 `workbuddy.md`

## 官方来源

- 活动规则：<https://raw.githubusercontent.com/M-China/mcd-developer-innovation-challenge/main/activityGuidelines.md>
- 官方参赛声明：<https://raw.githubusercontent.com/M-China/mcd-developer-innovation-challenge/main/CONTEST_DECLARATION.md>
- 官方 MCP README：<https://raw.githubusercontent.com/M-China/mcd-mcp-server/main/README.md>
