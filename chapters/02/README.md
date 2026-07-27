# Chapter 02 · 接真实模型 & 可靠输出(raw → harness)

> 目标:造一个"翻译层"(provider adapter),让 Day 1 的 `runAgent` **一行不改**就能驱动真实模型;并掌握工程上从模型"可靠拿到东西"的三件必备:**真流式累积、结构化返回、错误归一**。走完演进前两格:**raw 裸调用 → harness 脚手架**。

Day 1 用假模型验证了 loop。今天接真实模型——而且要接得"干净、可靠":核心永不认识某一家 provider,且能扛住真实模型的流式、脏数据、报错。

---

## 一、raw → harness

最原始一格是 **raw**:`prompt → 文本`,一问一答,没工具/记忆/循环——局限你在 Day 0 已知(不知新事、不能行动、一步定生死)。

要让它可用,得在模型外包一层 **harness(脚手架)**:结构化消息、解析输出、处理流式/错误/结构化返回。Day 1 的 `runAgent` 已是一种 harness(编排 loop);今天补它**最靠近 provider 的那块:adapter**。

## 二、核心:provider adapter 与"内部真相"

> ★ 核心(loop、canonical 类型)永远不认识任何 provider;provider 的脏细节全部止步于 adapter。★

| 层 | 是什么 | 谁易变 |
|----|--------|--------|
| **canonical**(Day 1 的 Step/HistoryEntry) | 内部真相,你所有代码都用它 | 稳定,你定 |
| **adapter** | 翻译:canonical ⇄ 某家 wire 格式 | 每家一个 |
| **wire / transport** | provider 的线上格式 + 真正发请求 | 各家不同 |

换 provider = **只换 adapter/transport**,loop 与 canonical 类型**一行不动**。私有能力(如 prompt caching)藏在 adapter 接缝后按需用——这就是"不锁定"的落地。

**出站**:`historyToWire` 把 canonical history + 工具映射成 wire 请求(Lab 2.1)。

## 三、真流式:参数是碎片拼出来的(本章硬骨头)

玩具教程里模型"整块"返回;**真实 provider 是逐段流式**吐回的,尤其:

- 工具调用的**参数是一串 JSON 碎片**(`{"pa` → `th":"REA` → `DME"}`),要**攒齐才 `JSON.parse`**——对半截碎片 parse 必炸。
- 模型**一次并发多个调用**时,各调用的碎片**按 index 交错**到达,必须**按 index 分桶**累积,用一个 buffer 会串台。

`accumulate`(Lab 2.2)就是把这些碎片,还原成 Day 1 loop 只认识的一个 `Step`。写对它,你就掌握了"流式的碎片 → 完整语义事件"这个真实世界天天用的还原。`makeModel`(Lab 2.3)再把 transport 包成 Day 1 的 `Model`,loop 直接驱动。

## 四、结构化返回(工程必备)

agent 应用天天要**让模型返回符合 schema 的数据**(抽字段、分类、可靠解析),而不是吐自由文本你再瞎 parse。

`generateObject`(Lab 2.4):发一个要 JSON 的 prompt → 累积文本 → `JSON.parse` → 用调用者给的 `validate` 校验成类型化 `T`;**解析/校验失败就抛清晰错误**(工程上宁可显式失败,绝不把脏数据往下传)。

> 结构化返回和 tool calling 是一回事的两面:都是"把模型输出约束成结构"。tool call 是结构化的**动作**,structured output 是结构化的**最终数据**。真实项目里 `validate` 通常用 Zod;本章用一个纯函数,保持 provider 中立。

## 五、错误归一

真实 provider 会中途报错(限流、内容拦截、坏数据)。`accumulate` 遇到 `error` 块要**归一成一个干净的 canonical 错误抛出**——不泄露 provider 细节、不把它当成正常结果混进 history。核心的鲁棒性,就靠这种边界处的归一。

---

## 六、你要建的(练习)

打开 `adapter.ts`,实现 4 个函数(类型、假 transport 已备好):

| Lab | 函数 | 关键 |
|-----|------|------|
| 2.1 | `historyToWire` | 出站映射 |
| 2.2 | `accumulate` | **真流式**:碎片按 index 分桶、攒齐才 parse、错误归一 |
| 2.3 | `makeModel` | 包成 Day 1 的 Model |
| 2.4 | `generateObject` | **结构化返回** + 校验失败抛错 |

```bash
npm run test:02   # 9 个测试:出站 / 文本流 / 碎片累积 / 交错分桶 / 空参数 / 错误 / makeModel / 结构化×2
```

从最简单的测试起,让红色牵着走。卡住按 `定位→签名→伪代码→局部` 找 tutor。

## 七、跑真的(provider 中立收尾)

adapter 用假 transport 测过后,接**真实模型**只需写一个**真 transport**——用 Vercel AI SDK(`ai` + `@ai-sdk/openai-compatible` 等)把 `WireRequest` 发出去、把流式返回转成 `WireChunk`。核心不变:

- **本地免费**:[Ollama](https://ollama.com/) 跑开源模型,OpenAI 兼容端点接入——零成本、最 provider 中立。
- **BYOK**:填自己的 key,换任意 provider。

> ⚠️ 真实 SDK 的确切调用(函数名/参数)请**现查官方文档**再写(见 `AGENT.md`:API 现查实跑、不凭记忆)。tutor 会陪你接通真 transport 并**实跑验证**。

做完这节,你就走完 **raw → harness → (Day 1)loop**:同一 loop,换假模型/Ollama/云端,核心都不改。

---

## 八、收尾

- **讲回来**([`LOG.md`](./LOG.md)):为什么工具参数碎片"攒齐才 parse、按 index 分桶"?为什么把 provider 隔离在 adapter 后面?
- **迁移题**:见 [`TRANSFER.md`](./TRANSFER.md)——多 provider 切换、私有能力接缝、usage/成本统计。
- **真检验**:换一个 provider(Ollama ↔ BYOK),确认 loop 与 canonical 类型一行没改。
