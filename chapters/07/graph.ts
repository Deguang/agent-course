// Chapter 07 — 编排与多 agent:loop → graph。演进的最后一格。
// 你要实现 2 样(文件底部):runGraph / parallel。
//
// 心智模型(承接全课主线):
//   ★ loop 是"单 agent 反复想→做"的特例;graph 把工作组织成**节点(做什么)+ 边(接下来去哪)**,
//     从而表达:分支、并行、多 agent、可暂停恢复。
//   ★ 但别过度:能单 loop 就别上 graph(和"能一次调用就别 agent"同一种克制)。graph 的每个节点里,
//     往往还跑着一个 loop —— graph 不取代 loop,是在其上编排。

// 一个节点:接收状态,产出新状态(节点内部可以是一次 loop、一次模型调用、任意计算)。
export type NodeFn<S> = (state: S) => S | Promise<S>;
// 一条"边"是一个路由:看当前状态,决定下一个节点名(或 "END" 结束)。
export type RouterFn<S> = (state: S) => string;
export const END = "END" as const;

export type Graph<S> = {
  start: string;
  nodes: Record<string, NodeFn<S>>;
  routes: Record<string, RouterFn<S>>; // 从"节点名"→ 该节点跑完后的路由
};

/**
 * Lab 7.1 — runGraph:从 start 出发执行图,直到某个路由返回 END。
 *   每一步:跑当前节点(state = await node(state))→ 用该节点的 route(state) 决定下一个节点名 →
 *          若是 END 就返回最终 state;否则跳到那个节点继续。
 *   防跑飞:总步数超过 maxSteps 就抛错(路由可能成环 —— 呼应 Day 1 的 maxSteps)。
 *   (分支 = 路由根据 state 返回不同节点名;回环 = 路由指回之前的节点。都用同一套机制表达。)
 */
export async function runGraph<S>(graph: Graph<S>, initial: S, maxSteps = 100): Promise<S> {
  let state = initial;
  let current = graph.start;
  let steps = 0;
  while (true) {
    if (steps++ >= maxSteps) throw new Error(`graph 超过 maxSteps(${maxSteps})——路由可能成环`);
    const node = graph.nodes[current];
    if (!node) throw new Error(`未知节点: ${current}`);
    state = await node(state);
    const route = graph.routes[current];
    if (!route) throw new Error(`节点无路由: ${current}`);
    const next = route(state);
    if (next === END) return state;
    current = next;
  }
}

/**
 * Lab 7.2 — parallel:把多个分支节点组合成**一个**节点,并发跑、再合并。
 *   · 对同一个输入 state,**并发**(Promise.all)跑所有 branches,各产出一个 S。
 *   · 用 merge 把结果数组合并成一个 S,作为这个组合节点的输出。
 *   (这是"一步 fan-out 多个子任务/子 agent,再汇总"的编排原语。)
 */
export function parallel<S>(branches: NodeFn<S>[], merge: (results: S[]) => S): NodeFn<S> {
  return async (state) => merge(await Promise.all(branches.map((b) => b(state))));
}

/**
 * Lab 7.3 — reflect(evaluator-optimizer / 反思模式):生成 → 评审 → 按反馈修订,直到达标或用尽轮数。
 *   这是主流课(Andrew Ng)与 Anthropic《Building effective agents》都强调的核心 agentic 模式。
 *   · generate(feedback):产出草稿;第一次 feedback 为 null,之后带上一轮的评审反馈来修订。
 *   · critique(draft):评审,返回 { pass, feedback }。
 *   流程:draft = generate(null);最多 maxRounds 轮:critique → pass 就返回;否则 draft = generate(feedback)。
 *   返回 { result: 最后的草稿, rounds: 实际迭代轮数, passed }。
 *   (为什么强大?模型第一版常不够好;让它**看着评审意见自我改进**,质量显著提升——这就是"反思"。)
 */
export async function reflect<T>(
  generate: (feedback: string | null) => T | Promise<T>,
  critique: (
    draft: T,
  ) => { pass: boolean; feedback: string } | Promise<{ pass: boolean; feedback: string }>,
  maxRounds: number,
): Promise<{ result: T; rounds: number; passed: boolean }> {
  let draft = await generate(null);
  for (let round = 1; round <= maxRounds; round++) {
    const { pass, feedback } = await critique(draft);
    if (pass) return { result: draft, rounds: round, passed: true };
    if (round === maxRounds) return { result: draft, rounds: round, passed: false };
    draft = await generate(feedback);
  }
  return { result: draft, rounds: maxRounds, passed: false };
}
