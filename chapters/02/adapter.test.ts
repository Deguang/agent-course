import assert from "node:assert/strict";
import { test } from "node:test";
import type { HistoryEntry } from "../01/agent.ts";
import {
  accumulate,
  generateObject,
  historyToWire,
  makeModel,
  type WireChunk,
  type WireRequest,
} from "./adapter.ts";

// 假 transport:不联网、确定性。给它一串预设 wire 块,照着流式吐。
// (真实世界这里是 Vercel AI SDK 去调 Ollama/OpenAI/Anthropic;测试只验 adapter 的翻译/累积对不对。)
function fakeTransport(chunks: WireChunk[]) {
  return async function* (_req: WireRequest): AsyncIterable<WireChunk> {
    for (const c of chunks) yield c;
  };
}
const feed = (chunks: WireChunk[]) => fakeTransport(chunks)({ messages: [], tools: [] });

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
  assert.deepEqual(req.messages[1]?.tool_calls, [
    { id: "c1", name: "read", args: { path: "README" } },
  ]);
  assert.deepEqual(req.messages[2], { role: "tool", tool_call_id: "c1", content: "文件内容" });
  assert.deepEqual(req.messages[3], { role: "assistant", content: "这是一门课" });
  assert.deepEqual(req.tools, [{ name: "read" }, { name: "web" }]);
});

// ── 入站:文本流 → final ──
test("accumulate:文本增量 + done(stop) → final", async () => {
  const step = await accumulate(
    feed([
      { type: "text-delta", text: "这是" },
      { type: "text-delta", text: "一门课" },
      { type: "done", finishReason: "stop" },
    ]),
  );
  assert.deepEqual(step, { kind: "final", text: "这是一门课" });
});

// ── 入站硬骨头 ①:工具参数是 JSON 碎片拼出来的,攒齐才 parse ──
test("accumulate:单个工具的参数以 JSON 碎片流入,攒齐后正确解析", async () => {
  const step = await accumulate(
    feed([
      { type: "tool-call-start", index: 0, id: "c1", name: "read" },
      { type: "tool-call-arg-delta", index: 0, argsDelta: '{"pa' },
      { type: "tool-call-arg-delta", index: 0, argsDelta: 'th":"REA' },
      { type: "tool-call-arg-delta", index: 0, argsDelta: 'DME"}' },
      { type: "done", finishReason: "tool-calls" },
    ]),
  );
  assert.equal(step.kind, "tool-calls");
  if (step.kind === "tool-calls") {
    assert.deepEqual(step.calls, [{ id: "c1", name: "read", args: { path: "README" } }]);
  }
});

// ── 入站硬骨头 ②:两个并发调用的碎片交错到达,必须按 index 分桶,不能串台 ──
test("accumulate:两个并发调用的参数碎片交错,按 index 分桶正确组装", async () => {
  const step = await accumulate(
    feed([
      { type: "tool-call-start", index: 0, id: "c1", name: "read" },
      { type: "tool-call-start", index: 1, id: "c2", name: "grep" },
      { type: "tool-call-arg-delta", index: 0, argsDelta: '{"path":' },
      { type: "tool-call-arg-delta", index: 1, argsDelta: '{"q":' },
      { type: "tool-call-arg-delta", index: 0, argsDelta: '"A"}' },
      { type: "tool-call-arg-delta", index: 1, argsDelta: '"x"}' },
      { type: "done", finishReason: "tool-calls" },
    ]),
  );
  assert.equal(step.kind, "tool-calls");
  if (step.kind === "tool-calls") {
    assert.deepEqual(step.calls, [
      { id: "c1", name: "read", args: { path: "A" } },
      { id: "c2", name: "grep", args: { q: "x" } },
    ]);
  }
});

// ── 入站:无参数工具 → args 为 {} ──
test("accumulate:没有参数碎片的工具调用,args 视为 {}", async () => {
  const step = await accumulate(
    feed([
      { type: "tool-call-start", index: 0, id: "c1", name: "now" },
      { type: "done", finishReason: "tool-calls" },
    ]),
  );
  assert.equal(step.kind, "tool-calls");
  if (step.kind === "tool-calls") {
    assert.deepEqual(step.calls, [{ id: "c1", name: "now", args: {} }]);
  }
});

// ── 入站:provider 报错 → 归一成干净错误抛出,不当正常结果 ──
test("accumulate:遇到 error 块,抛出干净错误(不泄 provider 细节)", async () => {
  await assert.rejects(
    accumulate(feed([{ type: "error", message: "rate_limited" }])),
    /rate_limited/,
  );
});

// ── 组装:makeModel 把 transport 包成 Model ──
test("makeModel:step() 完成一次 出站→transport→入站 的翻译", async () => {
  const model = makeModel(
    fakeTransport([
      { type: "text-delta", text: "你好" },
      { type: "done", finishReason: "stop" },
    ]),
    ["read"],
  );
  const step = await model.step([{ role: "user", text: "打招呼" }]);
  assert.deepEqual(step, { kind: "final", text: "你好" });
});

// ── 结构化返回:合法 JSON → 校验成类型化数据 ──
test("generateObject:模型返回合法 JSON → 校验通过、拿到类型化对象", async () => {
  type Person = { name: string; age: number };
  const validate = (raw: unknown): Person => {
    if (
      typeof raw === "object" &&
      raw !== null &&
      "name" in raw &&
      typeof (raw as Person).name === "string" &&
      "age" in raw &&
      typeof (raw as Person).age === "number"
    ) {
      return raw as Person;
    }
    throw new Error("不符合 Person schema");
  };
  const transport = fakeTransport([
    { type: "text-delta", text: '{"name":"Ada",' },
    { type: "text-delta", text: '"age":36}' },
    { type: "done", finishReason: "stop" },
  ]);

  const person = await generateObject(transport, "抽取人物信息", validate);
  assert.deepEqual(person, { name: "Ada", age: 36 });
});

// ── 结构化返回:不符合 schema → 抛清晰错误(不把脏数据往下传) ──
test("generateObject:返回不符合 schema → 抛清晰错误", async () => {
  const validate = (raw: unknown) => {
    if (typeof raw === "object" && raw !== null && "name" in raw) return raw;
    throw new Error("缺少 name");
  };
  const transport = fakeTransport([
    { type: "text-delta", text: '{"wrong":1}' },
    { type: "done", finishReason: "stop" },
  ]);

  await assert.rejects(generateObject(transport, "抽取", validate), /缺少 name/);
});
