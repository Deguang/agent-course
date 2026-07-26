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
 * ── 先想清"为什么"(细节见 chapters/01/README.md) ──
 *  · 为什么"执行工具"这件事落在这个函数(loop)里,而不是 model?
 *    因为 model.step() 只会"想和说"——它返回一个"我想调 read"的意图,但它没有手,
 *    读不了文件。真去调用工具、拿到结果的,只能是运行代码的这里(loop)。
 *  · 为什么要"反复"问,而不是问一次就完?
 *    因为 model 一次 step 只走一步:第一次它可能只说"先调工具",拿到结果后,
 *    它还得再被问一次才会给最终答复。要转到它说 "final" 为止。
 *
 * ── 一个可以照着想的思路(不是标准答案,是脚手架;每步都标了"为什么") ──
 *
 *   1. 历史从「用户那句话」开始(下面已放好)。history 是你和 model 之间唯一的"共享记忆"。
 *   2. 反复做:
 *        a. 问模型下一步:  const step = await model.step(history)
 *        b. 若 step 是 "final" —— 记进历史、把 text 作为结果返回,结束。
 *        c. 若 step 是 "tool-calls" ——
 *             · 先把模型这次的"提议"记进 history。
 *               (为什么先记?因为下一轮 model 要能看到"我刚才要求调了什么",
 *                结果才有对应的上下文;顺序也要对——提议在前、结果在后。)
 *             · 对每个 call:用 call.name 在 tools 里找到工具、执行(await),
 *               把返回值作为 "tool-result" 追加进 history,带上**原来的 call.id**。
 *               (为什么用原 id?这是"提议↔结果"的配对线;乱编 id 就配不上了。)
 *             · 回到 a,再问一次模型(它现在能在 history 里看到工具结果了)。
 *               (为什么是"继续"不是"返回"?因为工具结果只是中间步,model 还没给最终答复。)
 *
 * 建议:先只写 b 分支让"无工具"测试变绿,再写 c 分支。想清 demo 第②③④步各对应上面哪步。
 * 跑 `npm run test:01`。第一次会红在下面 —— 那是起点。
 * 卡住了,告诉 tutor「我试了 X、卡在 Y」,按 定位→签名→伪代码→局部 逐级要提示。
 */
export async function runAgent(
  model: Model,
  tools: ToolRegistry,
  userText: string,
): Promise<AgentResult> {
  const history: HistoryEntry[] = [{ role: "user", text: userText }];

  throw new Error("Lab 1.1 runAgent 尚未实现");
}
