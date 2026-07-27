# Chapter 07 · 编排与多 agent(loop → graph)

> 目标:走到演进的最后一格。单个 loop 装不下复杂场景时,用**图(节点 + 边)**做分支、并行、多 agent 编排——同时练就"什么时候**不**该上 graph"的判断。

回顾主线:**raw → harness → loop → graph**。前六天你把 loop 建全了(它是"单 agent 反复想→做")。今天看它的边界,以及超过边界该怎么办。

---

## 一、单 loop 的边界

Day 1 的 loop 很强,但它是**线性、单 agent** 的:问模型→执行工具→再问,一条道走到黑。有些场景它表达起来别扭:

- **显式分支**:根据中间结果走完全不同的流程(分类=A 走审批链,=B 走自动处理)。
- **并行 fan-out**:同时派多个独立子任务/子 agent,再汇总。
- **多 agent 协作**:一个协调者委派给若干专职 agent。
- **可暂停 / 可恢复 / 可回溯**:中途卡人工审批,过后接着跑。

这些是**编排(orchestration)问题**。graph 就是为它们生的。

## 二、graph:节点 + 边

把工作组织成一张图:

- **节点(node)**:做一件事,`state → 新 state`。**节点内部可以就是一个 Day 1 的 loop**、一次模型调用、任意计算。
- **边(route)**:看当前 state,决定**下一个去哪个节点**(或 `END`)。

于是:
- **分支** = 路由根据 state 返回不同节点名;
- **回环** = 路由指回之前的节点(配 maxSteps 防跑飞——呼应 Day 1);
- **并行** = 一个节点内部 fan-out 多个分支并发再合并(`parallel`);
- **多 agent** = 某个节点里跑另一个 agent(子 agent)。

`runGraph`(Lab 7.1)就是执行这张图的引擎;`parallel`(Lab 7.2)是"一步并发多分支再汇总"的原语。这其实就是 LangGraph 这类框架的内核——**你亲手写一遍,就知道 graph 框架底下是什么。**

## 三、关键判断:别过度上 graph

> ★ 不是越靠右(越接近 graph)越好。能单 loop 就别上 graph —— 和"能一次调用就别 agent"同一种克制。★

- 任务是线性的、单 agent 能完成 → **就用 Day 1 的 loop**,别套 graph。
- 只有真出现"显式分支 / 并行 fan-out / 多 agent / 可暂停恢复"时,graph 才**减少**复杂度而不是增加。
- 记住:**graph 不取代 loop**,graph 的节点里往往还跑着 loop。graph 是 loop 之上的**编排层**。

判断"该用哪一格"(raw/harness/loop/graph),是这门课给你的核心能力——比会用任何一个框架都值钱。

## 四、行业命名模式:你建的机制,就是这些模式

主流课(Andrew Ng《Agentic AI》)和 Anthropic《Building effective agents》反复讲几个**命名模式**。好消息:**它们全是你已有机制(loop / graph / parallel / eval)的组合**。认得出名字 + 知道底下是什么,你才算"行话流利":

| 模式 | 是什么 | 用你的什么建 |
|---|---|---|
| **prompt chaining** | 串行几步,前一步喂后一步 | runGraph 线性 |
| **routing** | 按输入分流到不同处理 | runGraph 分支(路由按 state 选节点) |
| **parallelization** | 并发多子任务再汇总 | `parallel` |
| **orchestrator-workers** | 协调者派活给若干 worker | graph:协调节点 + 多 worker 节点(多 agent) |
| **evaluator-optimizer(反思 reflection)** | 生成→评审→按反馈修订,迭代改进 | **`reflect`(Lab 7.3)** |
| **planning** | 先出计划,再逐步执行 | graph:plan 节点产出步骤 → 执行节点依次跑 |

**反思(reflect)** 尤其重要:模型第一版常不够好,让它**看着评审意见自我改进**,质量显著提升。这是你这章第三个要建的。

**判断力照旧:别硬套模式。** 能 prompt chaining 就别 orchestrator-workers;反思很强但每轮都费 token,值不值要看任务。

---

## 五、你要建的(练习)

打开 `graph.ts`:

| Lab | | 关键 |
|-----|--|------|
| 7.1 | `runGraph` | 节点→路由→下一节点,直到 END;分支/回环/**maxSteps 防跑飞** |
| 7.2 | `parallel` | 并发跑多分支、合并成一个节点 |
| 7.3 | `reflect` | **反思模式**:生成→评审→修订,直到达标或用尽轮数 |

```bash
npm run test:07   # 8 个:线性 / 分支 / 回环 / 防跑飞 / 并行 / reflect×3
```

卡住按 `定位→签名→伪代码→局部` 找 tutor。

---

## 六、收尾

- **讲回来**([`JOURNAL.md`](../../JOURNAL.md)):loop 和 graph 是取代关系还是包含关系?什么信号出现时才值得上 graph?为什么分支和回环能用"同一套路由机制"表达?
- **也讲讲**:reflect(反思)为什么能提升质量?它每轮的代价是什么、什么时候不值得?
- **迁移题**:见 [`TRANSFER.md`](./TRANSFER.md)——把节点做成"跑一个 Day 1 loop 的子 agent"(真多 agent)、可暂停恢复(把 state 存进 Day 4 session)、对照 LangGraph.js。
- **真检验**:用一个节点包住 Day 1 的 `runAgent`,再用 `runGraph` 编排两个这样的子 agent(一个搜集、一个总结),确认协调逻辑清晰、且每个子 agent 内部仍是普通 loop。
