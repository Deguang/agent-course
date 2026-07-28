# 进度 · 两周成为 Agent 专家(Day 0 定向 + Day 1–11 + Day 12 Capstone)

| 天/章 | 主题 | 状态 | 预测✓ | 测试绿✓ | 讲回来✓ | 迁移✓ |
|------|------|------|-------|---------|---------|-------|
| 00 | 基础全景(模型 / token / 思维链 / 消息 / 工具 / agent / 演进) | ✅ | ✅ | — | — | — |
| 01 | Agent Loop(loop + 工具 + 并发 + 异常 + maxSteps) | 进行中 | ☐ | ☐ | ☐ | ☐ |
| 02 | 接真实模型 & 可靠输出(adapter + 真流式 + 结构化返回 + 错误归一) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 03 | 常用工具集(read/write/edit/glob/grep/bash + 三不变量) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 04 | 有状态 & 持久化(session 树 + JSONL fail-closed) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 05 | 上下文管理(按语义组预算投影 + compaction / context editing) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 06 | 可扩展性(MCP + Skills + 扩展隔离) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 07 | 编排与多 agent(graph + 分支/回环/并行 + reflect + 命名模式) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 08 | 知识层:RAG 检索(chunk + 余弦相似度 + 向量库 + agentic RAG + 长期记忆) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 09 | Guardrails & 人在环路(权限 allow/ask/deny + HITL + 花费护栏 + 注入防御) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 10 | Evals & 可观测(Tracer + trajectory eval + 回归门禁) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 11 | 上生产 LLMOps(语义缓存 + suspend/resume + CI 门禁 + 服务化) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |
| 12 | Capstone 课程设计(独立做一个 agent 产品(含生产健壮性验证)) | 就绪待学 | ☐ | ☐ | ☐ | ☐ |

> tutor 跨会话读这里:知道学到哪、该回考什么。学员每完成一步自己打勾。
> 每章 ≈ 2~4 小时(一天一台阶)。一章 = 一个完整子系统 + 一个有分量的 lab。

## 待补 · 对标 hello-agents(datawhale)识别的内容缺口

2026-07-28,对比 [datawhalechina/hello-agents](https://datawhalechina.github.io/hello-agents/)(16 章教材)后记录。

**真缺口(值得补):**

- **领域史一段**:Day 0 只讲架构演进(raw→graph),缺"符号 AI → RL → LLM agent"的来路。可在 Day 0 加一段定向。
- **A2A(agent 间通信协议)**:已讲 MCP(Day 6),缺 agent-to-agent。可在 Day 7 加一个延伸小节。
- **更丰富的 capstone 案例菜单**:hello-agents 有 3 个成品大案例(旅行助理 / 深研 agent / 多 agent 小镇);我们只有一个开放 capstone。可在 Day 12 加一份"选题菜单 + 每个用哪几格 raw/harness/loop/graph"的参考。

**刻意不做(勿当缺口去"补"):** 低代码平台(Dify/Coze)、框架实践 / 造框架(LangChain/AutoGen)、Agentic-RL(训练)—— 均与本课"provider / 框架中立、只在现成模型上做应用、不训模型"的定位冲突,是有意的非目标。

> 反向优势(我们有、hello-agents 缺):Guardrails & 人在环路整层(Day 9)、上生产 LLMOps 深度(Day 11)、工程不变量硬细节(Day 2/3/4)。
