import assert from "node:assert/strict";
import { test } from "node:test";
import type { HistoryEntry } from "../01/agent.ts";
import {
  accumulate,
  historyToWire,
  makeModel,
  type WireChunk,
  type WireRequest,
} from "./adapter.ts";

// 假 transport:不联网、确定性。给它一串预设 wire 块,它就照着流式吐出来。
// (真实世界这里是 Vercel AI SDK 去调 Ollama/OpenAI/Anthropic;测试里我们只验 adapter 的翻译对不对。)
function fakeTransport(chunks: WireChunk[]) {
  return async function* (_req: WireRequest): AsyncIterable<WireChunk> {
    for (const c of chunks) yield c;
  };
}

// ── 出站:canonical history → wire 请求 ──
test("historyToWire:每种 history 条目翻译成对的 wire 消息", () => {
  const history: HistoryEntry[] = [
    { role: "user", text: "读 README" },
    { role: "assistant-tools", calls: [{ id: "c1", name: "read", args: { path: "README" } }] },
    { role: "tool-result", id: "c1", name: "read", text: "文件内容" },
    { role: "assistant-final", text: "这是一门课" },
  ];

  const req = historyToWire(history, ["read", "web"]);

  assert.deepEqual(req.messages[0], { role: "user", content: "读 README" });
  assert.equal(req.messages[1]?.role, "assistant");
  assert.deepEqual(req.messages[1]?.tool_calls, [{ id: "c1", name: "read", args: { path: "README" } }]);
  assert.deepEqual(req.messages[2], { role: "tool", tool_call_id: "c1", content: "文件内容" });
  assert.deepEqual(req.messages[3], { role: "assistant", content: "这是一门课" });
  assert.deepEqual(req.tools, [{ name: "read" }, { name: "web" }]);
});

// ── 入站:流式块 → canonical Step(final) ──
test("accumulate:文本增量 + done(stop) → final", async () => {
  const step = await accumulate(
    fakeTransport([
      { type: "text-delta", text: "这是" },
      { type: "text-delta", text: "一门 agent 课" },
      { type: "done", finishReason: "stop" },
    ])({ messages: [], tools: [] }),
  );

  assert.deepEqual(step, { kind: "final", text: "这是一门 agent 课" });
});

// ── 入站:流式块 → canonical Step(tool-calls) ──
test("accumulate:tool-call + done(tool-calls) → tool-calls", async () => {
  const step = await accumulate(
    fakeTransport([
      { type: "tool-call", id: "c1", name: "read", args: { path: "README" } },
      { type: "done", finishReason: "tool-calls" },
    ])({ messages: [], tools: [] }),
  );

  assert.equal(step.kind, "tool-calls");
  if (step.kind === "tool-calls") {
    assert.deepEqual(step.calls, [{ id: "c1", name: "read", args: { path: "README" } }]);
  }
});

// ── 组装:makeModel 把 transport 包成 Model,step() 出站→transport→入站全串起来 ──
test("makeModel:step() 完成一次 出站→transport→入站 的完整翻译", async () => {
  const transport = fakeTransport([
    { type: "text-delta", text: "你好" },
    { type: "done", finishReason: "stop" },
  ]);
  const model = makeModel(transport, ["read"]);

  const step = await model.step([{ role: "user", text: "打招呼" }]);

  assert.deepEqual(step, { kind: "final", text: "你好" });
});
