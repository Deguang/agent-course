// Chapter 02 — 接真实模型 & 可靠输出:raw → harness → provider adapter。
// 你要写 4 个函数(文件底部):historyToWire / accumulate / makeModel / generateObject。
//
// 唯一要内化的一句:
//   ★ 核心(loop、canonical 类型)永远不认识任何 provider;provider 的脏细节全部止步于 adapter。★
//   换一家 provider,只换 adapter/transport,loop 与 canonical 类型不动 —— 这就是 provider 中立。

import type { HistoryEntry, Model, Step, ToolCall } from "../01/agent.ts";

// ── canonical(Day 1)是"内部真相";下面是 provider 的"线上格式(wire)",用 OpenAI 兼容的简化形态 ──
export type WireMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { id: string; name: string; args: Record<string, unknown> }[];
  tool_call_id?: string;
};
export type WireToolSchema = { name: string };
export type WireRequest = { messages: WireMessage[]; tools: WireToolSchema[] };

// ── 入站:真实 provider 是**逐段流式**吐回的。注意工具调用的参数是**一串 JSON 碎片**,
//    而且多个并发调用的碎片会**按 index 交错**到达。这就是本章的硬骨头。──
export type WireChunk =
  | { type: "text-delta"; text: string } // 文本逐段
  | { type: "tool-call-start"; index: number; id: string; name: string } // 第 index 个调用开始
  | { type: "tool-call-arg-delta"; index: number; argsDelta: string } // 第 index 个调用的参数 JSON 碎片
  | { type: "error"; message: string } // provider 端出错(限流/内容问题…)
  | { type: "done"; finishReason: "stop" | "tool-calls" };

// transport:发一个 wire 请求,流式返回 wire 块。测试里是假的;真实世界由 Vercel AI SDK 实现(见 README「跑真的」)。
export type Transport = (req: WireRequest) => AsyncIterable<WireChunk>;

/**
 * Lab 2.1 — 出站映射:canonical history + 工具名 → wire 请求。
 *   user→{role:"user"} · assistant-tools→{role:"assistant",tool_calls} ·
 *   tool-result→{role:"tool",tool_call_id} · assistant-final→{role:"assistant"};tools←toolNames。
 */
export function historyToWire(history: HistoryEntry[], toolNames: string[]): WireRequest {
  const messages: WireMessage[] = history.map((e) => {
    switch (e.role) {
      case "user":
        return { role: "user", content: e.text };
      case "assistant-tools":
        return { role: "assistant", content: "", tool_calls: e.calls };
      case "tool-result":
        return { role: "tool", content: e.text, tool_call_id: e.id };
      case "assistant-final":
        return { role: "assistant", content: e.text };
      default:
        throw new Error(`未知的 history role: ${JSON.stringify(e)}`);
    }
  });
  return { messages, tools: toolNames.map((name) => ({ name })) };
}

/**
 * Lab 2.2 — 入站累积(硬骨头):把一串流式 wire 块,折叠成一个 canonical Step。
 *
 * 关键不变量(想清楚再写,这几条就是"真流式"和"玩具"的区别):
 *   · 工具参数是碎片(argsDelta)拼出来的 —— **绝不能对碎片 JSON.parse**,只能攒进 buffer,
 *     到 done 时才对完整 buffer 解析一次。
 *   · 多个并发调用的碎片按 index **交错**到达 —— 必须**按 index 分桶**累积,别用一个 buffer(会串台)。
 *   · 空参数 buffer 视为 `{}`。
 *   · 收到 error 块:归一成一个干净的错误抛出(**别泄露 provider 细节、别让它当成正常结果**)。
 *   · done:stop → {kind:"final", text: 文本buffer};tool-calls → 把各 index 桶按**首次出现顺序**
 *     组装成 ToolCall[](每个的 args = JSON.parse(该桶buffer 或 "{}"))。
 */
export async function accumulate(chunks: AsyncIterable<WireChunk>): Promise<Step> {
  let text = "";
  const buckets = new Map<number, { id: string; name: string; argsBuf: string }>();
  const order: number[] = [];

  for await (const c of chunks) {
    switch (c.type) {
      case "text-delta":
        text += c.text;
        break;
      case "tool-call-start":
        buckets.set(c.index, { id: c.id, name: c.name, argsBuf: "" });
        order.push(c.index);
        break;
      case "tool-call-arg-delta": {
        const b = buckets.get(c.index);
        if (b) b.argsBuf += c.argsDelta;
        break;
      }
      case "error":
        throw new Error(c.message);
      case "done":
        if (c.finishReason === "stop") return { kind: "final", text };
        return {
          kind: "tool-calls",
          calls: order.map((i) => {
            const b = buckets.get(i);
            if (!b) throw new Error(`丢失的工具桶: ${i}`);
            return { id: b.id, name: b.name, args: JSON.parse(b.argsBuf || "{}") };
          }),
        };
    }
  }
  // 流意外结束(没有 done)——按已累积文本收尾。
  return { kind: "final", text };
}

/**
 * Lab 2.3 — 把 transport 包成 Day 1 的 Model(出站→transport→入站),这样 runAgent 一行不改就能驱动它。
 */
export function makeModel(transport: Transport, toolNames: string[]): Model {
  return {
    step: (history) => accumulate(transport(historyToWire(history, toolNames))),
  };
}

/**
 * Lab 2.4 — 结构化返回(工程必备):让模型返回**符合 schema 的数据**,而不是自由文本你再瞎解析。
 *
 * 契约:发一个要求返回 JSON 的 prompt,累积出文本,`JSON.parse` 后交给 `validate` 校验成类型化 T。
 * 关键:**解析失败或校验失败,要抛清晰的错误**(工程上宁可显式失败,也不要把脏数据往下传)。
 *   `validate` 由调用者给(真实项目里通常是 Zod 之类);它接受 unknown、返回 T 或抛错。
 *
 * (结构化返回和 tool calling 是一回事的两面:都是"把模型输出约束成结构"。tool call 是结构化的**动作**,
 *  这里是结构化的**最终数据**。)
 */
export async function generateObject<T>(
  transport: Transport,
  prompt: string,
  validate: (raw: unknown) => T,
): Promise<T> {
  const req: WireRequest = { messages: [{ role: "user", content: prompt }], tools: [] };
  const step = await accumulate(transport(req));
  const text = step.kind === "final" ? step.text : "";
  return validate(JSON.parse(text));
}

// 给 lab 用的小类型别名(仅为可读性)
export type { ToolCall };
