# Chapter 02 · 接真实模型(raw → harness)

> 第 2 天 · 目标:造一个"翻译层"(provider adapter),让 Day 1 的 `runAgent` **一行不改**,就能驱动一个真实形态的模型。走完 agent 演进的前两格:**raw 裸调用 → harness 脚手架**。

Day 1 你用**假模型**验证了 loop。今天把它接到真实模型——但要接得"干净":核心永远不认识某一家 provider。

---

## 一、raw:最原始的一格

最原始的用法,就一句:把文字发给模型,拿回文字。

```ts
const answer = await generateText({ model, prompt: "用一句话解释 agent" });
```

一问一答,没工具、没记忆、没循环——这就是 **raw**。它的局限你在 Day 0 已经知道:不知新事、不能行动、一步定生死。真实产品几乎不会停在这。

## 二、harness:在模型外面包一层

要让 raw 变得可用,你得在模型外面包一层代码——**harness(脚手架)**:

- 把"对话"整理成结构化的**消息**(system/user/assistant/tool),每轮整发(Day 0 §四)。
- 把模型的原始输出**解析**成程序能用的东西(是最终文本?还是一个工具调用?)。
- 处理流式(真实模型逐 token 吐)、错误、重试……

Day 1 的 `runAgent` 其实已经是一种 harness(它编排 loop)。今天补的是 harness 里**最靠近 provider 的那块:adapter**——负责把"内部真相"翻译成"某家 provider 的线上格式",再把回来的翻译回去。

## 三、核心概念:provider adapter 与"内部真相"

> ★ 核心(loop、canonical 类型)永远不认识任何 provider;provider 的脏细节全部止步于 adapter。★

三层,记清楚(这就是"provider 中立"的机制):

| 层 | 是什么 | 谁易变 |
|----|--------|--------|
| **canonical**(Day 1 的 Step/HistoryEntry) | 内部真相,你所有代码都用它 | 稳定,你定 |
| **adapter** | 翻译:canonical ⇄ 某家 wire 格式 | 每家一个 |
| **wire / transport** | provider 的线上格式 + 真正发请求 | 各家不同 |

换 provider = **只换 adapter/transport**,loop 和 canonical 类型**一行不动**。这就是你"不想被锁定"的落地:通用路径走 canonical,某家私有能力(如 Anthropic 的 prompt caching)藏在 adapter 接缝后按需用。

关键翻译动作两件:

- **出站**:把 canonical `history` + 工具,映射成 wire 请求(消息 + 工具说明书)。
- **入站(流式累积)**:provider 逐段吐回增量(文本片段、工具调用),你要把这些碎片**累积**回一个完整的 canonical `Step`——这样 Day 1 的 loop 依旧只认识 `Step`,根本不知道下面接了谁。

---

## 四、你要建的:adapter(练习)

打开 `adapter.ts`,实现 3 个函数(canonical↔wire 类型和假 transport 已备好):

1. `historyToWire(history, toolNames)` — 出站映射。
2. `accumulate(chunks)` — 入站:流式块累积成一个 `Step`。
3. `makeModel(transport, toolNames)` — 把 transport 包成 Day 1 的 `Model`(出站→transport→入站)。

做完,`makeModel(anyTransport)` 产出的就是个标准 `Model`,Day 1 的 `runAgent` 能直接驱动它。

```bash
npm run test:02   # 4 个测试:出站映射 / 入站(final) / 入站(tool-calls) / makeModel 串起来
```

老规矩:从最简单的测试起,让红色牵着走。卡住按 `定位→签名→伪代码→局部` 找 tutor。

---

## 五、跑真的(provider 中立的收尾)

上面的 adapter 用假 transport 测过了。要接**真实模型**,你只需要**写一个真的 transport**——用 Vercel AI SDK(`ai` + `@ai-sdk/openai-compatible` 等),把 `WireRequest` 发出去、把它的流式返回转成 `WireChunk`。核心不变:

- **本地免费**:装 [Ollama](https://ollama.com/) 跑个开源模型,用 OpenAI 兼容端点接入——零成本、最 provider 中立。
- **BYOK**:填你自己的 key,换成任意 provider。

> ⚠️ 真实 SDK 的确切调用(函数名/参数)请**现查官方文档**再写(见 `CONTENT.md`:API 现查实跑、不凭记忆)。tutor 会陪你把真 transport 接通并**实跑验证**。

这一节做完,你就亲手走完了 **raw → harness → (Day 1 的)loop**:同一个 loop,换假模型、换 Ollama、换云端 provider,核心都不用改。

---

## 六、收尾

- **讲回来**(写进 [`LOG.md`](./LOG.md)):为什么把 provider 隔离在 adapter 后面?如果 loop 里直接出现某家的字段,会带来什么问题?
- **迁移题**:见 [`TRANSFER.md`](./TRANSFER.md)——流式工具参数累积、多 provider 切换、私有能力接缝。
- **真检验**:换一个 provider(Ollama ↔ BYOK),确认 loop 与 canonical 类型一行没改。
