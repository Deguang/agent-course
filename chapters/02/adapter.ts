// Chapter 02 — 接真实模型:raw → harness → provider adapter。
// 你要写 3 个函数(文件底部):historyToWire / accumulate / makeModel。
// 目标:造一个"翻译层",让 Day 1 的 runAgent 一行不改,就能驱动一个真实形态的 provider。
//
// 唯一要内化的一句:
//   ★ 核心(loop、canonical 类型)永远不认识任何 provider;provider 的脏细节全部止步于 adapter。★
//   换一家 provider,只换 adapter/transport,loop 与 canonical 类型不动。这就是 provider 中立。

import type { HistoryEntry, Model, Step } from "../01/agent.ts";

// ── canonical(Day 1 的规范类型)是"内部真相";下面是 provider 的"线上格式(wire)" ──
// 这里用 OpenAI 兼容的简化形态(各家大同小异;真实差异由 adapter 吸收)。

export type WireMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { id: string; name: string; args: Record<string, unknown> }[]; // assistant 发起调用时
  tool_call_id?: string; // tool 角色回结果时,指回是哪次调用
};

export type WireToolSchema = { name: string }; // 真实里还有 description/参数 schema,这里简化

export type WireRequest = { messages: WireMessage[]; tools: WireToolSchema[] };

// 入站:provider **流式**吐回的增量块。真实 API 是逐 token 流的——
// 文本逐段(text-delta)累积;本章把工具调用简化成"整块给"(真实里参数也是流式拼的,见 TRANSFER)。
export type WireChunk =
  | { type: "text-delta"; text: string }
  | { type: "tool-call"; id: string; name: string; args: Record<string, unknown> }
  | { type: "done"; finishReason: "stop" | "tool-calls" };

// transport:发一个 wire 请求,流式返回 wire 块。
// 测试里是"假 transport"(确定性、不联网);真实世界由 Vercel AI SDK 实现(见 README「跑真的」)。
export type Transport = (req: WireRequest) => AsyncIterable<WireChunk>;

/**
 * Lab 2.1 — 出站映射:把 canonical history + 可用工具名,翻译成一个 wire 请求。
 *
 * 想清每种 HistoryEntry 该变成哪种 WireMessage(这是"内部真相 → provider 格式"的翻译):
 *   · user           → { role:"user", content }
 *   · assistant-tools → { role:"assistant", content:"", tool_calls:[...] }
 *   · tool-result    → { role:"tool", tool_call_id, content }
 *   · assistant-final → { role:"assistant", content }
 * tools:把 toolNames 变成 schema 列表(本章每个只需 { name })。
 */
export function historyToWire(history: HistoryEntry[], toolNames: string[]): WireRequest {
  throw new Error("Lab 2.1 historyToWire 尚未实现");
}

/**
 * Lab 2.2 — 入站累积:把一串流式 wire 块,折叠成一个 canonical Step。
 *
 * 边读边攒:text-delta 拼进文本缓冲;tool-call 收进数组;
 * 读到 done:finishReason==="stop" → { kind:"final", text: 缓冲 };
 *           finishReason==="tool-calls" → { kind:"tool-calls", calls: 收集到的 }。
 * (这就是"流式的碎片 → 一个完整语义事件"的还原,和 Day 1 loop 只认识 Step 对接。)
 */
export async function accumulate(chunks: AsyncIterable<WireChunk>): Promise<Step> {
  throw new Error("Lab 2.2 accumulate 尚未实现");
}

/**
 * Lab 2.3 — 把 transport 包装成 Day 1 的 Model。
 *
 * 返回一个实现了 `step(history)` 的对象:出站(historyToWire)→ transport → 入站(accumulate)。
 * 一旦它是个 Model,Day 1 的 runAgent 就能直接驱动它——**loop 一行不用改**。这就是 adapter 的意义。
 */
export function makeModel(transport: Transport, toolNames: string[]): Model {
  throw new Error("Lab 2.3 makeModel 尚未实现");
}
