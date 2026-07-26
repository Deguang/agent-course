// Chapter 01 — Agent Loop 完整版。你要写的是 runAgent(文件底部)。
// 别改上面的类型,它们是你的"零件"。
//
// 动手前:① `npm run demo:01` 看轨迹 ② 读下面的类型 ③ 读 README、按 runAgent 上方的问题自己推。
//
// 唯一要内化的一句(想通它,整个 loop 你能自己推出来):
//   ★ 模型只会看 history 说话、只会"提议";真去执行、把结果喂回、决定何时停,都是你(loop)的事。★

export type ToolCall = {
  id: string; // 模型为"这一次调用"生成的编号(真实 API 里就是 tool_use.id / tool_calls[].id)
  name: string; // 要调哪个工具(去 tools 里按名字找)
  args: Record<string, unknown>;
};

// 模型每次 step 只返回两种东西之一:
//   - tool-calls:它想调一个或多个工具(calls 可能不止一个 —— 这就是"并发调用")
//   - final:     它说完了,给出最终文本
export type Step =
  | { kind: "tool-calls"; calls: ToolCall[] }
  | { kind: "final"; text: string };

// history = 至今发生的一切(就是 demo 打印的那些行)。它会随 loop 越来越长。
export type HistoryEntry =
  | { role: "user"; text: string }
  | { role: "assistant-tools"; calls: ToolCall[] }
  // tool-result 带 isError:工具抛异常时,不是让 loop 崩,而是把"失败"也变成一条结果喂回给模型。
  | { role: "tool-result"; id: string; name: string; text: string; isError?: boolean }
  | { role: "assistant-final"; text: string };

// 模型:给它 history,它回"下一步做什么"。只会想,不会动手。
export interface Model {
  step(history: HistoryEntry[]): Step | Promise<Step>;
}

// 工具:真正会"动手"的函数。它**可能抛异常**(比如文件不存在)——你的 loop 要接住。
export type Tool = (args: Record<string, unknown>) => string | Promise<string>;
export type ToolRegistry = Record<string, Tool>;

export type AgentResult = {
  finalText: string; // 模型的最终答复(若因 maxSteps 停下,则为空串)
  history: HistoryEntry[];
  stoppedReason: "final" | "max-steps"; // 为什么停:正常收尾,还是撞上步数上限
};

/**
 * runAgent —— 你要写的 loop。本章要它能扛"完整"的循环,不只是 happy path。
 *
 * 手上有:userText、model(会 step,只会想)、tools(能执行、可能抛异常)、maxSteps(步数上限)。
 * 目标:自动跑出 demo 那条轨迹,并正确处理:连续调用、一步多个调用、工具异常、跑飞。
 *
 * ── 不给你算法。把上面那句(模型只提议、执行/终止是你的事)当支点,回答这几个问题,连起来就是 loop ──
 *
 *   Q1 控制流:拿到 tool-calls、处理完还没结束,你得再问模型。用**什么结构**"反复问到 final"?
 *   Q2 顺序:  想让模型下一轮看见工具结果——它只看 history。所以执行工具**之前**先往 history 放什么?谁先谁后?
 *   Q3 配对:  回填 tool-result 用哪个 id 才能让模型认出"这是哪次调用的结果"?(从 call 上拿,别自己编)
 *   Q4 一步多个:step.calls 可能不止一个。你要对**每个** call 都执行并配对结果 —— 用什么遍历?
 *   Q5 异常当数据:某个工具执行时 throw 了,该让整个 loop 崩,还是接住它、变成一条 isError 的 tool-result 喂回?
 *   Q6 防跑飞:万一模型永远只返 tool-calls、从不 final,你怎么保证 loop 会停?(maxSteps 怎么用、停时返回什么?)
 *
 * 推不动某步就去 agent.test.ts 看对应断言 —— 测试会告诉你"对"长什么样。
 * 下手法:先读测试,从最简单的"无工具"起,只写让它变绿的最少代码,再让红色一个个牵着你补。
 * 卡住:告诉 tutor「我试了 X、卡在 Y」,按 定位→签名→伪代码→局部 逐级要提示。
 */
export async function runAgent(
  model: Model,
  tools: ToolRegistry,
  userText: string,
  maxSteps = 10,
): Promise<AgentResult> {
  const history: HistoryEntry[] = [{ role: "user", text: userText }];

  throw new Error("Lab 1.1 runAgent 尚未实现");
}
