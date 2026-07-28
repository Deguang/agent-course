# Chapter 10 · 迁移题(超出本章)

先预测，写进 [`JOURNAL.md`](../../JOURNAL.md);想做就自己加测试。

## 迁移 1 · 把 Tracer 接进 Day 1 loop
在 loop 每次 model.step / 工具执行处 record 一个 span。跑一次，看 trace 汇总。
- 预测:从 trace 里你最先想看什么?(轮数?哪个工具最贵?卡在哪?)

## 迁移 2 · LLM 当 judge
有些任务对错难用规则判(如"这段总结好不好")。用另一个模型调用当 judge(给 rubric，返回通过/不通过)。
- 预测:judge 用 LLM 有什么风险?怎么让它更可靠(结构化返回 Day 2、明确 rubric)?

## 迁移 3 · 给 coding agent 建回归套件
为你的 coding agent(Day 1+3)写 3~5 个 case(正常/边界/会失败)，用 runEvalSuite 得到通过率。
- 预测:改一句 system prompt 后重跑，通过率变化能告诉你什么?

## 迁移 4 · 每个 case 隔离 prepare
让每个 case 在**全新的临时环境**里跑(呼应 Day 3 临时目录)，跑完 cleanup。
- 预测:不隔离会怎样?(case 之间互相污染 → 假通过/假失败)
