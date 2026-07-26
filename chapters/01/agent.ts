// Chapter 01 — 你要写 runAgent(文件底部)。别改上面的类型,它们是你的"零件"。
//
// 动手前:① `npm run demo:01` 看轨迹 ② 读下面的类型 ③ 按 runAgent 上方的问题自己推结构。
//
// 唯一要内化的一句(想通它,loop 的结构你能自己推出来):
//   ★ model 只会看 history 说话,它自己不会动手。执行永远是你(loop)的事。★
// (为什么这样、三个角色怎么分工:见 chapters/01/README.md,不在这里重复。)

export type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

// 模型每一步(step)只会返回两种东西之一:
//   - "我要调工具" (tool-calls) —— 它在提议,不是在执行
//   - "我说完了"   (final)      —— 给出最终文本,结束
export type Step = { kind: "tool-calls"; calls: ToolCall[] } | { kind: "final"; text: string };

// 历史 = 至今为止发生的一切,就是 demo 里打印的那四种行。
export type HistoryEntry =
  | { role: "user"; text: string }
  | { role: "assistant-tools"; calls: ToolCall[] }
  | { role: "tool-result"; id: string; name: string; text: string }
  | { role: "assistant-final"; text: string };

// 模型:给它当前历史,它回你"下一步做什么"。它只会想,不会动手。
export interface Model {
  step(history: HistoryEntry[]): Step | Promise<Step>;
}

// 工具:真正会"动手"的函数(读文件、算数……)。loop 负责调它们。
export type Tool = (args: Record<string, unknown>) => string | Promise<string>;
export type ToolRegistry = Record<string, Tool>;

export type AgentResult = {
  finalText: string;
  history: HistoryEntry[];
};

/**
 * runAgent —— 你要写的 loop。
 *
 * 手上有:userText(用户请求)、model(会 step,只会想)、tools(能执行的函数)。
 * 目标:让 demo 那条轨迹自动发生,直到 model 给出 final。
 *
 * ── 不给你算法。你自己推 ──
 * 把上面那句(model 只看 history 说话)当支点,回答这三个问题,答案连起来就是你的 loop:
 *
 *   Q1(控制流):你问一次 step,若拿到 final 就能返回。但若拿到的是 tool-calls,
 *               处理完之后任务结束了吗?——不结束,你还得再问。那你该用**什么结构**
 *               来"反复问,直到 final"?(一次 if?还是别的?)
 *
 *   Q2(顺序):你想让 model 下一轮"看见"工具结果。但 model 只看 history。
 *              所以在你真正执行工具**之前**,得先往 history 里放什么?这两条(提议、结果)
 *              谁先谁后?
 *
 *   Q3(配对):你执行完工具、往 history 追加 tool-result 时,要让 model 认出
 *              "这是哪一次调用的结果"。这个标识你从**哪里**拿?自己编一个行不行?
 *
 * 推不动某一步,就去 agent.test.ts 看那一步对应的断言——测试会告诉你"对"长什么样。
 *
 * 下手法(别一次写完):先读 agent.test.ts,从最简单的"无工具"测试起,
 * 只写让它变绿的最少代码;再让红色牵你写 tool 分支。
 * 卡住:告诉 tutor「我试了 X、卡在 Y」,按 定位→签名→伪代码→局部 逐级要提示。
 */
export async function runAgent(
  model: Model,
  tools: ToolRegistry,
  userText: string,
): Promise<AgentResult> {
  const history: HistoryEntry[] = [{ role: "user", text: userText }];

  throw new Error("Lab 1.1 runAgent 尚未实现");
}
