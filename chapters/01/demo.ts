// Chapter 01 · 观察 demo —— 先看懂,再动手。
//
// 跑一下:  npm run demo:01
//
// 这个文件不是你要实现的东西,也不含 loop 的逻辑。
// 它只做一件事:把「一次完整的 agent 运行结束后,历史长什么样」打印给你看。
// 你要先看懂这条轨迹里"每一行是谁产生的、为什么",
// 之后再去 agent.ts 里写出"能产生这条轨迹"的那个 loop。

import type { HistoryEntry } from "./agent.ts";

// 场景:用户说"读 README 并概括"。
// 一次跑完之后,历史会长成这样(这就是你未来要让 runAgent 产出的东西):
const finishedRun: HistoryEntry[] = [
  // ① 用户开口。这是输入,由用户产生。
  { role: "user", text: "读 README 并概括" },

  // ② 模型看了历史,说:"我还答不了,得先读文件。请调用 read 工具。"
  //    注意:模型只是"提议"要调工具 —— 它自己读不了任何文件。
  { role: "assistant-tools", calls: [{ id: "c1", name: "read", args: { path: "README" } }] },

  // ③ 于是 loop(不是模型!)真的去执行了 read 工具,把结果放回历史。
  //    id 必须对回 c1 —— 这样系统才知道"这是刚才那次调用的结果"。
  { role: "tool-result", id: "c1", name: "read", text: "本项目是一门 agent 课程..." },

  // ④ 模型再看一遍历史(现在里面有文件内容了),给出最终答复。结束。
  { role: "assistant-final", text: "这是一门教你从零构建 agent 的课程。" },
];

// —— 下面只是把它打印得好看一点,方便你观察 ——
console.log("\n一次完整 agent 运行的轨迹:\n");
for (const [i, e] of finishedRun.entries()) {
  const n = String(i + 1).padStart(2, "0");
  if (e.role === "user") console.log(`${n} [用户]      ${e.text}`);
  else if (e.role === "assistant-tools")
    console.log(
      `${n} [模型·提议] 我要调用工具: ${e.calls.map((c) => `${c.name}(${JSON.stringify(c.args)}) #${c.id}`).join(", ")}`,
    );
  else if (e.role === "tool-result")
    console.log(`${n} [loop·执行] 工具 ${e.name} 返回(配对 #${e.id}): ${e.text}`);
  else console.log(`${n} [模型·最终] ${e.text}`);
}

console.log(`
看懂这四步,你就抓住了 agent 的核心:
  · 模型只会"提议"(第②步),它读不了文件、跑不了命令。
  · 真正去"执行"工具、把结果塞回历史、再叫模型的,是 loop(第③步)。
  · 提议(#c1)和结果(#c1)靠 id 配对,配上了才能进入下一轮。
  · 模型拿到结果后再想一次,给出最终答复,结束。

你在 agent.ts 里要写的 runAgent,就是那个"能自动跑出这条轨迹"的 loop。
现在你只有:一句用户输入 + 一个会 step 的模型 + 一堆能执行的工具。
你的任务:把它们循环地接起来,直到模型给出最终答复。
`);
