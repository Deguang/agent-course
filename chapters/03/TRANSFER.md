# Chapter 03 · 迁移题(超出本章)

先预测,写进 [`LOG.md`](./LOG.md);想做就自己加测试。

## 迁移 1 · 把工具集接进 loop(强烈建议做)

把 read/write/edit/glob/grep/bash 各包成 Day 1 的 `Tool`(`args → string`),组成 `ToolRegistry`,喂给 Day 1 的 `runAgent`。
- 预测:工具抛异常(文件不存在)时,按 Day 1 约定该怎样?(归一成 error 结果喂回,不炸 loop)
- 做出来:一个(用假模型脚本驱动的)coding agent,真的读文件→改一行→跑测试。这是前三天的合体。

## 迁移 2 · 软链接逃逸(realpath)

`resolveInWorkspace` 用字符串前缀挡了 `../`。但 workspace 里放一个**软链接**指向外部呢?字符串检查挡得住吗?
- 预测:该在哪一步加 `realpath`(解析软链接最终落点)再判边界?
- 这题让你看清"字符串路径检查"和"真实落点检查"的差别。

## 迁移 3 · bash 取消(AbortSignal)

给 `bash` 加一个 `AbortSignal`:外部一取消就杀掉子进程。
- 预测:预先就已 abort 的调用,该不该 spawn 进程?
- 注意 timeout 和 abort 的关系:两者都要能杀进程。

## 迁移 4 · 完整 glob

本章 glob 只按后缀。实现支持 `**`(任意层目录)和 `*`(单层任意字符)的真 glob。
- 预测:递归遍历时,`**` 和 `*` 的匹配边界(遇到 `/` 要不要停)怎么处理?
