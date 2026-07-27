# Chapter 07 · 迁移题(超出本章)

先预测,写进 [`JOURNAL.md`](../../JOURNAL.md);想做就自己加测试。

## 迁移 1 · 真·多 agent(节点里跑子 agent)

把一个 graph 节点做成"跑一个 Day 1 `runAgent` 的子 agent"。用 `runGraph` 编排两个:一个负责搜集、一个负责总结。
- 预测:子 agent 内部还是普通 loop 吗?graph 只是决定"先跑谁、结果给谁"?
- 这题让你亲身体会:graph 编排 loop,不取代 loop。

## 迁移 2 · 可暂停 / 可恢复

让 `runGraph` 在某个节点"暂停"(等待外部输入),把当前 state + 位置存进 Day 4 的 session,之后能恢复继续。
- 预测:要恢复,你至少得存哪些东西?(state + 当前节点名)
- 这就是 LangGraph 的 checkpoint/durable execution 的雏形。

## 迁移 3 · 并行的错误处理

`parallel` 里某个分支抛错,该怎样?
- 预测:一个分支失败要不要拖垮全部?还是收集成"部分成功 + 部分失败"?对照 Day 1"工具异常当数据"。

## 迁移 4 · 对照真框架

读一眼 LangGraph.js 的 StateGraph API,和你的 `runGraph` 对比。
- 预测:它的 node/edge/conditional-edge 分别对应你的什么?你少了哪些工程能力(持久化、并发调度、可视化)?

## 迁移 5 · 并发写共享状态的冲突(生产必答)
`parallel` 并发多分支后 merge。若两个分支都改共享状态的**同一个键**呢?
- 预测:就地改共享对象 vs 各分支产出增量再由 merge 合并——哪个能避免数据竞争?
- 冲突键该"最后写赢"还是"显式合并策略"?这在复杂 State Graph 里是必答题(见 Day 11)。
