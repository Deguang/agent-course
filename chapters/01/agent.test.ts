import assert from "node:assert/strict";
import { test } from "node:test";
import { type HistoryEntry, type Model, runAgent, type Step, type ToolRegistry } from "./agent.ts";

// ─────────────────────────────────────────────────────────────────────────
// scriptedModel = 假模型 / 测试替身。它没有智能:每次 step() 只是从 `script`
// 数组里按顺序吐下一个 Step(照台词本念)。所以"为什么会走到 final"不是它想通了,
// 是台词本里写了 final。用假模型是为了确定性(不联网、不要 key),让测试考的是
// **你的 loop**,而不是模型聪不聪明。它顺便记 `calls`(被问了几轮)。
// (真实世界里模型要先被"告知有哪些工具"才会生成调用+id;这里跳过那层,由脚本占位,
//  留到后面 provider 章节真正建 —— 见 README「本章简化了什么」。)
// ─────────────────────────────────────────────────────────────────────────
function scriptedModel(script: Step[]): Model & { calls: number } {
  let i = 0;
  const m = {
    calls: 0,
    step(_history: HistoryEntry[]): Step {
      m.calls++;
      const next = script[i++];
      if (next === undefined) throw new Error("脚本已耗尽:loop 比预期多问了一次模型");
      return next;
    },
  };
  return m;
}

type ToolResult = Extract<HistoryEntry, { role: "tool-result" }>;
const isToolResult = (e: HistoryEntry): e is ToolResult => e.role === "tool-result";

// ── 1. 最简单:无工具,模型第一步就 final(根本不进循环)──
test("无工具:模型直接给最终答案", async () => {
  const model = scriptedModel([{ kind: "final", text: "你好" }]);
  const r = await runAgent(model, {}, "打个招呼");

  assert.equal(r.finalText, "你好");
  assert.equal(r.stoppedReason, "final");
  assert.equal(model.calls, 1);
  assert.deepEqual(
    r.history.map((e) => e.role),
    ["user", "assistant-final"],
  );
});

// ── 2. 单工具往返:model → tool → model ──
test("单工具往返:执行工具、按 id 配对、再问模型", async () => {
  const model = scriptedModel([
    { kind: "tool-calls", calls: [{ id: "c1", name: "read", args: { path: "README" } }] },
    { kind: "final", text: "项目是一门 agent 课程" },
  ]);
  const tools: ToolRegistry = { read: (a) => `文件 ${String(a.path)} 的内容` };

  const r = await runAgent(model, tools, "读 README 并概括");

  assert.equal(r.finalText, "项目是一门 agent 课程");
  assert.equal(model.calls, 2, "下单一次、拿到结果后一次");
  assert.deepEqual(
    r.history.map((e) => e.role),
    ["user", "assistant-tools", "tool-result", "assistant-final"],
  );
  const tr = r.history.find(isToolResult);
  assert.equal(tr?.id, "c1", "tool-result 必须配对回原 call 的 id");
  assert.equal(tr?.text, "文件 README 的内容", "loop 必须真的执行了工具");
});

// ── 3. 并发:一步返回多个调用,每个都要执行并配对 ──
test("并发:一步两个调用,两个都执行、各自按 id 配对", async () => {
  const model = scriptedModel([
    {
      kind: "tool-calls",
      calls: [
        { id: "c1", name: "read", args: { path: "A" } },
        { id: "c2", name: "read", args: { path: "B" } },
      ],
    },
    { kind: "final", text: "两个都读完了" },
  ]);
  const tools: ToolRegistry = { read: (a) => `内容:${String(a.path)}` };

  const r = await runAgent(model, tools, "同时读 A 和 B");

  assert.equal(model.calls, 2, "两个调用在同一步,模型仍只被问 2 次");
  const results = r.history.filter(isToolResult);
  assert.equal(results.length, 2, "两个调用要有两条配对结果");
  assert.deepEqual(
    results.map((e) => e.id).sort(),
    ["c1", "c2"],
    "两条结果分别配 c1、c2",
  );
});

// ── 4. 工具异常当数据:工具 throw 不该炸 loop,而是变成 isError 结果喂回 ──
test("工具抛异常:接住它、变成 isError 的 tool-result,loop 不崩", async () => {
  const model = scriptedModel([
    { kind: "tool-calls", calls: [{ id: "c1", name: "read", args: { path: "missing" } }] },
    { kind: "final", text: "那我换个方式" },
  ]);
  const tools: ToolRegistry = {
    read: () => {
      throw new Error("文件不存在");
    },
  };

  // 整个调用不该 throw —— 异常是"模型可观察的环境事实",不是程序崩溃
  const r = await runAgent(model, tools, "读一个不存在的文件");

  assert.equal(r.finalText, "那我换个方式");
  const tr = r.history.find(isToolResult);
  assert.equal(tr?.isError, true, "失败要标记成 isError");
  assert.match(tr?.text ?? "", /文件不存在/, "错误信息要进结果、喂回给模型");
});

// ── 5. 防跑飞:模型永远只返 tool-calls,loop 必须在 maxSteps 停下 ──
test("maxSteps:模型永不 final 时,loop 在步数上限安全停下", async () => {
  const model: Model & { calls: number } = {
    calls: 0,
    step() {
      model.calls++;
      return { kind: "tool-calls", calls: [{ id: `c${model.calls}`, name: "read", args: {} }] };
    },
  };
  const tools: ToolRegistry = { read: () => "x" };

  const r = await runAgent(model, tools, "会无限循环的任务", 3);

  assert.equal(r.stoppedReason, "max-steps", "撞上限要如实报告停止原因");
  assert.equal(model.calls, 3, "模型恰好被问 maxSteps 次,不多问");
});
