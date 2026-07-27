# Chapter 08 · 迁移题(超出本章)

先预测,写进 [`LOG.md`](./LOG.md);想做就自己加测试。

## 迁移 1 · agentic RAG:把检索做成工具接进 loop

把 `VectorStore.search` 包成一个 `search_knowledge` 工具(Day 1 的 `Tool`),放进 ToolRegistry,让 Day 1 的 `runAgent` 自己决定何时检索。
- 预测:简单问题模型会不会不检索?复杂问题会不会多轮检索、逐步聚焦?这比"每次都检索"省在哪?

## 迁移 2 · 接真实 embedding 模型

把 fake 向量换成真实 embedding(用 Day 2 的 provider 思路,或 Ollama 的 embedding 端点)。
- ⚠️ 现查官方文档再写(见 `AGENT.md`)。
- 预测:embedding 也要 chunk 后逐块算——批量算 vs 逐个算,成本/延迟差别?

## 迁移 3 · 超长段落的二次细切

`chunk` 里"单段超 maxLen 就整块超出"是简化。实现:超长段落按句子/固定窗口再细切,并加**重叠**(overlap)。
- 预测:为什么切片间留一点重叠能提升检索质量?

## 迁移 4 · 混合检索(hybrid)

只用语义相似度会漏掉"精确关键词/ID"这类查询。结合语义检索 + 关键词(grep,Day 3)。
- 预测:什么查询语义检索强、什么查询关键词强?怎么融合两者的排名?
