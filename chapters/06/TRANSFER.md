# Chapter 06 · 迁移题(超出本章)

先预测，写进 [`JOURNAL.md`](../../JOURNAL.md);想做就自己加测试。

## 迁移 1 · 接真实 MCP server

用官方 MCP SDK 接一个真实 MCP server(如 GitHub / 文件系统)，把它的工具接进 Day 1 loop。
- ⚠️ 现查官方 MCP 文档/SDK 再写(见 `AGENT.md`:API 现查实跑)。
- 预测:真实 MCP 的工具 schema 比本章的 `{name, description}` 多了参数定义，你的 `mcpToolRegistry` 要怎么改?

## 迁移 2 · hook 故障隔离

给工具执行加一个 `beforeToolCall` hook(扩展提供)。
- 预测:hook 拒绝/抛错/超时时，该怎样?(归一成一个**与原 call 配对**的错误结果，不炸 loop——呼应 Day 1 的 error 结果)
- `afterToolResult` 失败，能改写已经发生的工具结果吗?(不能——呼应 Day 4"事实不可抹除")

## 迁移 3 · 软链接逃逸(realpath)

skill/资源从多个目录加载。一个目录里放软链接指向外部呢?
- 预测:字符串路径检查够吗?该在哪加 `realpath` 检查最终落点?(呼应 Day 3 迁移题)

## 迁移 4 · 多 root 同名 skill 谁胜出

两个 root 都提供名为 `pdf` 的 skill，谁生效?
- 预测:应由路径字母序决定，还是由调用者给的 root 顺序决定?为什么后者更可控?
