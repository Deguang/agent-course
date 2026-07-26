// Chapter 01 — 你的任务:写出那个 loop(runAgent)。
//
// 先跑过 `npm run demo:01` 看懂那条四步轨迹,再回来。
// 下面这些类型 = 你写 runAgent 会用到的全部"零件"(别改它们,你只写文件底部的 runAgent)。
// 读预测题之前,先把这几个类型看一遍——它们就是 demo 那条轨迹在代码里的样子:
//   · HistoryEntry[] = history:一个会越来越长的数组,记录至今发生的一切
//   · role           = 每条 history 的"谁产生的"标记,共四种(见下)
//   · model.step()   = 你每问模型一次"下一步做什么",就调一次;调一次只走一步

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
 * 你手上有:一句 userText、一个会 step 的 model、一堆能执行的 tools。
 * 你要做的:把它们循环接起来,自动跑出 demo 里那条轨迹,直到模型说完为止。
 *
 * 一个可以照着想的思路(不是标准答案,只是脚手架):
 *
 *   1. 历史从「用户那句话」开始(下面已经帮你放好了)。
 *   2. 反复做下面这件事:
 *        a. 问模型下一步:  const step = await model.step(history)
 *        b. 如果 step 是 "final" —— 把它记进历史,把 text 作为结果返回,结束。
 *        c. 如果 step 是 "tool-calls" ——
 *             · 先把模型这次的"提议"记进历史;
 *             · 对每一个 call:用 call.name 在 tools 里找到对应工具,执行它(await),
 *               把返回值作为一条 "tool-result" 追加进历史(记得带上 call.id、call.name);
 *             · 然后回到 a,再问一次模型(它现在能看到工具结果了)。
 *
 * 想清楚 demo 第②③④步分别对应上面哪一步,再动手。
 * 跑 `npm run test:01` 看测试(测试就是精确的规格)。第一次会红在下面这行 —— 那是起点。
 * 卡住了,回来告诉 tutor「我试了 X、卡在 Y」,按 定位→签名→伪代码→局部 逐级要提示。
 */
export async function runAgent(
  model: Model,
  tools: ToolRegistry,
  userText: string,
): Promise<AgentResult> {
  const history: HistoryEntry[] = [{ role: "user", text: userText }];

  throw new Error("Lab 1.1 runAgent 尚未实现");
}
