# CONTENT.md — 内容准确性公约

**约束任何为本课编写/修改教学内容的人(含 AI tutor)。** 教错比教浅更糟——一门课的信誉全在准确性上。

## 两层内容,两套标准

### 1. 通用概念层(provider 无关的原理)

例:agent loop、model 只提议不执行、tool call/result 靠 id 配对、并发/异常/终止语义、context 管理、消息 IR、评测原则。

- **对齐主流课程的心智模型,不自创歪概念。** 讲法要能在下列权威材料里找到印证:
  - Anthropic — "Building effective agents"、agent 设计文档、tool use 概念
  - Hugging Face — Agents Course(概念框架、术语)
  - 主流框架文档(Vercel AI SDK、LangChain/LangGraph、MCP 规范)的概念章节
- 用词跟随主流(如 tool call / tool result / agent loop / context window),不生造术语。
- 若某概念各家讲法有分歧,**如实说明分歧**,不假装唯一正解。

### 2. 具体 API 层(真实 SDK / 协议代码)

例:Vercel AI SDK 的 `generateText`/`streamText`/`tool`、Anthropic Messages API 的 `tool_use` block、MCP 的消息形状、各家 provider 的参数。

- **凡写真实 API 代码,必须现查官方源,严禁凭记忆。** 记忆里的方法名/参数很可能过时或错误。
  - 查:官方文档、SDK 仓库源码、类型定义(`.d.ts`)。手段:WebFetch 官方文档;`npm install` 后读 SDK 类型;写完**编译 + 实跑**。
  - 对 Anthropic 相关内容,优先用最新官方 SDK 文档核对模型 ID、参数、beta header——这些变动频繁。
- **每个 API 章标注核对时间**:章节 README 末尾写 `> API 核对于 YYYY-MM(SDK vX.Y)`。
- **provider 私有能力**(如 prompt caching、extended thinking)要标明"这是某家私有,换 provider 会怎样",守 provider 中立原则:通用路径用抽象层,私有增强放接缝并注明。

## 术语首次出现即解释

学员是"有基础但不系统"的人——最怕术语被反复用却从没定义。规矩:

- **任何术语(provider / tool / context / MCP / IR / SSE …)在学员路径里第一次出现时,就地给一句定义**(用 `> **名词** · ...` 的短块),别等他自己猜。
- 定义放在**学员会最先读到**的位置(学员路径从 `chapters/00` 起,不是根 README)。
- 只在**首次**解释,后续默认已知,不重复啰嗦。
- 定义要短、要用大白话 + 一个具体例子,不堆术语解释术语。

## 硬规矩:代码能跑 = 最硬的准确性保证

- **概念章**:用 `node --test` 测试兜底(测试即规格,绿了才算对)。
- **API 章**:必须"真能跑起来"——本地/CI 用真实或本地模型验证过,不留"看起来对但没跑过"的代码。
- **绝不发未验证的 API 代码。** 写完没跑过的,标 `⚠️ 未验证` 或不发。

## 出错了怎么办

- 发现讲错:开 issue/PR 修正,并在该章加一行勘误(不静默改历史——勘误本身是学习材料)。
- 不确定就说不确定,给出"去哪查证",不编造确定性。

## 一句话

**通用概念:对齐主流、不自创。具体 API:现查官方、必实跑、标日期。不确定:如实说。**
