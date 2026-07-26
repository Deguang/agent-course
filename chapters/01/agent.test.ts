import assert from "node:assert/strict";
import { test } from "node:test";
import { type HistoryEntry, type Model, runAgent, type Step, type ToolRegistry } from "./agent.ts";

// 确定性"脚本模型":不联网、不要 key。按预设序列一步步返回,并记录被调用次数。
function scriptedModel(script: Step[]): Model & { calls: number } {
  let i = 0;
  const m = {
    calls: 0,
    step(_history: HistoryEntry[]): Step {
      m.calls++;
      const next = script[i++];
      if (next === undefined) {
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
