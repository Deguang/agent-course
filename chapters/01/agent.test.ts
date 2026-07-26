import assert from "node:assert/strict";
import { test } from "node:test";
import { type HistoryEntry, type Model, runAgent, type Step, type ToolRegistry } from "./agent.ts";

// ─────────────────────────────────────────────────────────────────────────
// scriptedModel = 一个"假模型"(测试替身 / stub)。读测试前先看懂它:
//
//   · 它没有任何智能、没有推理。每次 step() 被调用,只是从 `script` 这个
//     预先写好的数组里,按顺序吐出下一个 Step —— 就像照着台词本念,念到哪算哪。
//   · 所以"为什么模型会返回 final"?不是它想通了,而是**测试作者**在 script
//     末尾放了个 { kind: "final" }。每个测试自己决定这个假模型会怎么走。
//   · 为什么用假模型?为了**确定性**:不联网、不要 API key、每次结果都一样。
//     这样测试考的是**你的 loop 写对没有**,而不是真实模型聪不聪明。
//   · 它还顺便记 `calls`(step 被调了几次),好让测试断言"loop 问了几轮模型"。
//
// (真实模型怎么接进来,是后面章节的事;Ch01 只用这个替身来锁定 loop 的行为。)
// ─────────────────────────────────────────────────────────────────────────
function scriptedModel(script: Step[]): Model & { calls: number } {
  let i = 0;
  const m = {
    calls: 0,
    step(_history: HistoryEntry[]): Step {
      m.calls++;
      const next = script[i++];
      if (next === undefined) {
        // 脚本念完了却还被调 —— 说明你的 loop 多问了一轮模型(该停没停)。
        throw new Error("脚本已耗尽:loop 比预期多调了一次模型");
      }
      return next;
    },
  };
  return m;
}

// ── 从这个最简单的开始:模型第一次 step 就 final,根本不进循环 ──
test("无工具:模型直接给最终答案", async () => {
  const model = scriptedModel([{ kind: "final", text: "你好" }]);

  const result = await runAgent(model, {}, "打个招呼");

  assert.equal(result.finalText, "你好");
  assert.equal(model.calls, 1);
  assert.deepEqual(
    result.history.map((e) => e.role),
    ["user", "assistant-final"],
  );
});

// ── 上面绿了再做这个:要执行工具、把结果配对喂回、再问模型 ──
test("单工具往返:model → tool → model", async () => {
  const model = scriptedModel([
    { kind: "tool-calls", calls: [{ id: "c1", name: "read", args: { path: "README" } }] },
    { kind: "final", text: "项目是一个 agent 课程" },
  ]);
  const tools: ToolRegistry = {
    read: (args) => `文件 ${String(args.path)} 的内容`,
  };

  const result = await runAgent(model, tools, "读 README 并概括");

  assert.equal(result.finalText, "项目是一个 agent 课程");
  assert.equal(model.calls, 2, "模型应被调用恰好 2 次(下单一次、拿到结果后一次)");
  assert.deepEqual(
    result.history.map((e) => e.role),
    ["user", "assistant-tools", "tool-result", "assistant-final"],
    "历史顺序:user → assistant-tools → tool-result → assistant-final",
  );

  const toolResult = result.history.find((e) => e.role === "tool-result") as
    | Extract<HistoryEntry, { role: "tool-result" }>
    | undefined;
  assert.equal(toolResult?.id, "c1", "tool-result 必须配对回原 call 的 id");
  assert.equal(toolResult?.text, "文件 README 的内容", "loop 必须真的执行了工具");
});
