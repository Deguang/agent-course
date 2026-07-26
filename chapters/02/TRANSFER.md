# Chapter 02 · 迁移题(超出本章)

做之前先预测,写进 [`LOG.md`](./LOG.md);想做就自己加测试驱动。

## 迁移 1 · 流式累积工具参数(真实里的硬骨头)

本章把 `tool-call` 简化成"整块给"。真实 provider 里,工具的**参数是逐段流式拼出来的**(一串 JSON 片段),而且**多个并发调用的片段会交错**。
- 预测:如果参数分片到达,你不能对每片 `JSON.parse`——为什么?该怎么按调用 index 分桶累积?
- 两个并发调用的参数片段交错时,用一个 buffer 会怎样?

## 迁移 2 · 换一个 provider

再写一个 transport(比如从 OpenAI 兼容换成另一家的格式)。
- 预测:你需要改 `historyToWire`/`accumulate` 吗?还是只改 transport?哪些是"通用的"、哪些是"provider 特定的"?

## 迁移 3 · 私有能力放哪个接缝

某家有独有能力(如 prompt caching、extended thinking)。
- 预测:怎么在**不污染 canonical 核心**的前提下用上它?(提示:接缝在 adapter/transport,通用路径降级、私有路径增强。)
- 这题让你体会 provider 中立的真义:不是"永远只用最小公分母",而是"默认可移植,按需、有意识地为某个私有能力破例"。
