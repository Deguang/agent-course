# 课程总设计 · 两周成为 Agent 专家

完整、可靠、day-by-day 的 agent 课程。**终点:第 12 天(capstone),你能独立设计并开发一个 agent 功能产品。**
每天 = 一个完整子系统 + 一个有分量、可运行的 lab(约 2~4 小时)。全程 provider 中立(Vercel AI SDK + MCP + 本地模型),动手全在终端。

## 贯穿主线:agent 架构的演进(raw → harness → loop → graph)

这门课不是零散知识点,而是**沿着真实 agent 架构的进化史一路建上去**。理解你每天在演进的哪一格,是最重要的地图:

| 阶段 | 是什么 | 局限 → 催生下一阶段 | 对应本课 |
|------|--------|---------------------|----------|
| **raw** 裸调用 | 直接 `prompt → completion`,一问一答,无工具、无记忆 | 不知新事、不能行动、一步定生死 | Day 0 概念 + Day 2 起点 |
| **harness** 脚手架 | 在模型外面包一层代码:结构化消息、输出解析/校验、把工具调用手工接一次 | 步骤写死、不能自主决定"下一步" | Day 2(消息 IR / adapter / 脚手架) |
| **loop** 循环 | 模型自主"想→做→看→再想",反复调工具直到完成 —— **agent 的诞生** | 单 agent、线性;复杂协作/分支/可恢复难表达 | **Day 1(核心)**→ Day 3-6 给它长出手脚/状态/上下文/扩展 |
| **graph** 编排 | 把多步/多 agent 组织成显式的图(节点+边):分支、并行、可暂停恢复、多 agent 协作 | (当前前沿;按需使用,别过度) | Day 7 |

> 关键判断力:**不是越靠右越好。** 能 raw 就别 harness,能单 loop 就别 graph——和"能一次调用就别上 agent"同一种克制。每天都会强化这个"该用哪一格"的判断。

## Day-by-day

### Day 0 · 基础(不写码)
- **学到**:LLM 是什么/不是什么、token 与上下文窗口、思维链/推理、消息列表、function calling、agent=模型+工具+循环、何时别用 agent、**演进全景**。
- **交付**:一张完整心智地图 + 第一个预测。
- **演进**:全景(raw→graph)。

### Day 1 · Agent Loop(loop 阶段核心)
- **学到**:model→工具→model 的循环;单次/连续/并发调用;工具异常当数据;maxSteps 防跑飞。
- **交付**:`runAgent`——能扛完整 loop 的 5 种情况(可运行,5 个测试)。
- **演进**:loop 诞生。

### Day 2 · 接真实模型(raw → harness)
- **学到**:先做一次 raw 裸调用感受局限;再建 harness——canonical 消息 IR、流式、provider adapter,用 Vercel AI SDK 接**真/本地模型**,让 Day 1 的 loop 驱动真实模型。provider 中立:换 provider 只动 adapter。
- **交付**:把 `runAgent` 接到真实模型(Ollama 本地 / BYOK),同一 loop 换模型不改核心。
- **演进**:raw 的局限 → harness → 喂给 loop。

### Day 3 · 常用工具集(给 agent 长出手脚)
- **学到**:一套真实、可复用的工具:`read`/`write`/`edit`/`glob`/`grep`/`bash`/`web_fetch`;原子写、超时/取消/截断、workspace 边界(guardrail 不是 OS sandbox);工具设计原则(何时该做成专用工具 vs bash)。
- **交付**:一个能真正读写文件、跑命令的工具集 + 接进 loop 的 coding agent 雏形。
- **演进**:loop + 真实工具 = 能干活的 agent。

### Day 4 · 有状态 & 持久化
- **学到**:跨轮状态、订阅、引用隔离、abort/steering;可分支可恢复的会话(session 树 + JSONL fail-closed);"已发生的事实不可抹除"。
- **交付**:有状态 Agent + 可恢复的会话日志。
- **演进**:loop 从"一次性"变"长期运行"。

### Day 5 · 上下文管理
- **学到**:上下文窗口有限;compaction(压缩历史为摘要,追加不删)、context editing(清理旧工具结果)、有预算的投影;按语义组切分。
- **交付**:在窗口预算内自动压缩历史、可恢复再压缩。
- **演进**:让长时运行的 agent 不撑爆上下文。

### Day 6 · 可扩展性(MCP + skills)
- **学到**:**MCP(重点,开放标准、跨 provider/客户端通用)**——接一个 MCP server 给 agent 加能力;skills 按需激活;扩展的信任边界与故障隔离。
- **交付**:给 agent 接一个 MCP server + 一个按需 skill。
- **演进**:agent 的能力从"内置"变"可插拔生态"。

### Day 7 · 编排与多 agent(loop → graph)
- **学到**:单 loop 的局限;把工作组织成 graph(节点+边)——分支、并行、可暂停恢复;多 agent 协作/委派;何时才需要 graph(别过度)。用 provider 中立方式(概念 + 轻量实现,可对照 LangGraph.js)。
- **交付**:把一个复杂任务用 graph/多 agent 编排跑通。
- **演进**:loop → graph,课程演进主线收尾。

### Day 8 · 知识层:RAG / 检索(+ 长期记忆)
- **学到**:模型不知道你的私有知识 → RAG(检索相关片段再生成);embedding + 余弦相似度 + 向量库;chunking;**agentic RAG**(把检索做成工具,让 agent 自己决定何时检索);长期记忆 = 同一套检索机器。
- **交付**:chunk / cosineSimilarity / 向量库检索;把检索接进 loop 的思路。
- **对标 2026**:补齐"知识层"(独立成层的主流能力)。

### Day 9 · Guardrails & 人在环路(Rail B:治理 & 安全)
- **学到**:agent guardrails ≠ LLM guardrails——agent 会调工具、花钱、改世界。工具调用**审批/权限策略**(allow/ask/deny)、**花费与循环上限**、破坏性操作确认、**prompt injection**基本防御、把审批做成人在环路(human-in-the-loop)。
- **交付**:一个权限/审批网关 + 花费·步数护栏,包住工具执行。
- **对标 2026**:补齐"治理&安全"竖轨。

### Day 10 · Evals & 可观测(Rail A:观测 & 评测)
- **学到**:"程序跑完 ≠ 任务做对"。**trajectory eval**(评的是整条轨迹,不只最终答案)、**回归套件**、判定与执行分离、**tracing**(结构化记录每步 model/tool 调用与用量)、离线/在线评测。
- **交付**:一个评测 runner(独立 prepare/执行/取证/判定)+ 一个 trace 记录器。
- **对标 2026**:补齐"观测&评测"竖轨(2026 已是一等公民)。

### Day 11 · 上生产(LLMOps & 服务化)
- **学到**:服务化(Serverless/Edge/容器 的生命周期与部署考量、有状态 vs 无状态)、流式响应与 Generative UI(概念,前端消费 Day 2 事件流)、**suspend/resume 跨线可恢复**(HITL 端到端)、**CI 评测门禁**(回归/通过率红线,把 Day 10 用起来)、**语义缓存**(主动降本降延迟,复用 Day 8)、并发写冲突约束(补 Day 7)。
- **交付**:SemanticCache / suspend-resume 令牌 / evalGate;把 loop 服务化的思路。
- **对标 2026**:补齐"部署工程化(LLMOps)"这最后一层。

### Day 12 · Capstone · 课程设计(独立做一个 agent 产品)
- **目标**:综合前 11 天,**独立设计并实现一个 agent 功能产品**。
- **流程**:① 选题 ② 写一页设计(解决什么、用哪一格 raw/harness/loop/graph、要哪些工具/MCP/RAG、guardrails、成功标准)③ 实现 ④ 用 Day 10 的评测思路自评;⑤ **生产健壮性验证**(服务边界 / suspend-resume / CI 门禁,Day 11)。
- **交付**:能跑的 agent 产品 + 一页设计文档 + 自评报告。
- **验收判断力**:能说清"为什么这样设计、为什么用/不用 graph、边界与风险在哪"——而不只是"它能跑"。

## 质量护栏
全部收在 [`AGENT.md`](./AGENT.md) 一份文件里:tutor 不替你写答案(练判断力)· 概念对齐主流 + API 现查实跑(准确可靠)· 章节完整不留洞 + 高密度 + 循序渐进(够干货)。
