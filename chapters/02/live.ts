// Chapter 02 —「跑真的」:一个真实的 OpenAI-兼容 Transport(把 Day 2 的假 transport 换成真模型)。
//
// 这层就是 provider adapter 的"下半身":发一个 OpenAI-兼容的流式请求,把 SSE 拆成 Day 2 的 WireChunk。
// 关键:它只产 WireChunk —— 上面的 accumulate / makeModel / runAgent 一行不改就能驱动真模型。
//   这就是"provider 中立"的兑现:换 provider 只换这一个文件里的 baseURL/model。
//
// 免费额度示例(BYOK,任选其一,设对应环境变量即可 —— 详见 README「跑真的」):
//   GLM(智谱): export GLM_API_KEY=...         (open.bigmodel.cn,glm-4-flash 免费、国内直连、工具支持好 —— 首选)
//   Groq:       export GROQ_API_KEY=...        (console.groq.com/keys,极快;部分区域 403)
//   Gemini:     export GEMINI_API_KEY=...      (aistudio.google.com/apikey,额度大)
//   OpenRouter: export OPENROUTER_API_KEY=...  (openrouter.ai,有 :free 模型)
//   Ollama 本地: export OLLAMA_MODEL=qwen2.5   (零 key、完全离线;需先装 ollama 并 pull 模型)
//
// ⚠️ 安全:key 只走环境变量,**绝不写进代码、绝不 commit**。密钥泄露先轮换,再排查。
// 跑:  GLM_API_KEY=... node chapters/02/live.ts

import { runAgent, type ToolRegistry } from "../01/agent.ts";
import type { Transport, WireChunk, WireRequest } from "./adapter.ts";
import { makeModel } from "./adapter.ts";

// OpenAI 兼容流式响应里我们关心的字段(SSE 每块的形状)。
type SSEDeltaToolCall = {
  index?: number;
  id?: string;
  function?: { name?: string; arguments?: string };
};
type SSEChunk = {
  choices?: {
    delta?: { content?: string; tool_calls?: SSEDeltaToolCall[] };
    finish_reason?: string;
  }[];
};

// ── 真 transport:WireRequest → OpenAI 兼容流式 → WireChunk ──
export function openaiCompatTransport(cfg: {
  baseURL: string;
  apiKey: string;
  model: string;
  toolSchemas?: Record<string, object>; // 工具名 → JSON Schema(Day 2 的 wire 只带工具名,真实 schema 放这)
}): Transport {
  return async function* (req: WireRequest): AsyncIterable<WireChunk> {
    const messages = req.messages.map((m) => {
      if (m.role === "tool")
        return { role: "tool", tool_call_id: m.tool_call_id, content: m.content };
      if (m.tool_calls) {
        return {
          role: "assistant",
          content: m.content || null,
          tool_calls: m.tool_calls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: { name: tc.name, arguments: JSON.stringify(tc.args) },
          })),
        };
      }
      return { role: m.role, content: m.content };
    });

    const tools = req.tools.length
      ? req.tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            parameters: cfg.toolSchemas?.[t.name] ?? { type: "object", properties: {} },
          },
        }))
      : undefined;

    const res = await fetch(`${cfg.baseURL}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model: cfg.model, messages, tools, stream: true }),
    });

    if (!res.ok || !res.body) {
      yield { type: "error", message: `HTTP ${res.status}: ${await res.text()}` };
      return;
    }

    // 拆 SSE:每行 "data: {json}",[DONE] 结束。把 delta 折成 WireChunk。
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    const started = new Set<number>();
    let finish: "stop" | "tool-calls" = "stop";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith("data:")) continue;
        const data = s.slice(5).trim();
        if (data === "[DONE]") continue;
        let json: SSEChunk;
        try {
          json = JSON.parse(data) as SSEChunk;
        } catch {
          continue;
        }
        const choice = json.choices?.[0];
        const delta = choice?.delta;
        if (delta?.content) yield { type: "text-delta", text: delta.content };
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx: number = tc.index ?? 0;
            if (!started.has(idx) && (tc.id || tc.function?.name)) {
              started.add(idx);
              yield {
                type: "tool-call-start",
                index: idx,
                id: tc.id ?? `call_${idx}`,
                name: tc.function?.name ?? "",
              };
            }
            if (tc.function?.arguments) {
              yield { type: "tool-call-arg-delta", index: idx, argsDelta: tc.function.arguments };
            }
          }
        }
        if (choice?.finish_reason === "tool_calls") finish = "tool-calls";
        else if (choice?.finish_reason) finish = "stop";
      }
    }
    yield { type: "done", finishReason: finish };
  };
}

// ── provider 预设:哪个 key 在环境里,就用哪个 ──
function pickProvider(): { baseURL: string; apiKey: string; model: string } {
  // GLM(智谱):glm-4-flash 免费、国内直连、OpenAI 兼容、支持工具调用。key: open.bigmodel.cn
  const glm = process.env.GLM_API_KEY ?? process.env.ZHIPU_API_KEY;
  if (glm)
    return { baseURL: "https://open.bigmodel.cn/api/paas/v4", apiKey: glm, model: "glm-4-flash" };
  const g = process.env.GROQ_API_KEY;
  if (g)
    return {
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: g,
      model: "llama-3.3-70b-versatile",
    };
  const gem = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (gem)
    return {
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: gem,
      model: "gemini-2.0-flash",
    };
  const or = process.env.OPENROUTER_API_KEY;
  if (or)
    return {
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: or,
      model: "meta-llama/llama-3.3-70b-instruct",
    };
  // Ollama 本地:零 key、完全离线。装 ollama + `ollama pull qwen2.5`,设 OLLAMA_MODEL 即用。
  if (process.env.OLLAMA_MODEL)
    return {
      baseURL: "http://localhost:11434/v1",
      apiKey: "ollama",
      model: process.env.OLLAMA_MODEL,
    };
  throw new Error(
    "没找到 key。设置其一:GLM_API_KEY(智谱,国内免费首选)/ GROQ_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY / OLLAMA_MODEL(本地零 key)",
  );
}

async function main() {
  const p = pickProvider();
  console.log(`\n[provider] ${p.baseURL}  model=${p.model}\n`);

  // 一个真工具:确定性、好验证模型是否真用了工具结果。
  const tools: ToolRegistry = {
    add: (args) => String(Number(args.a) + Number(args.b)),
  };
  const toolSchemas = {
    add: {
      type: "object",
      properties: { a: { type: "number" }, b: { type: "number" } },
      required: ["a", "b"],
    },
  };

  const transport = openaiCompatTransport({ ...p, toolSchemas });
  const model = makeModel(transport, Object.keys(tools));

  const result = await runAgent(
    model,
    tools,
    "用 add 工具算 23 加 19,只能用工具算,然后告诉我结果。",
  );

  // 打印真实轨迹(和 demo:01 一个形状,但这次是真模型驱动的)
  console.log("=== 真实轨迹 ===");
  for (const e of result.history) {
    if (e.role === "user") console.log(`[用户]      ${e.text}`);
    else if (e.role === "assistant-tools")
      for (const c of e.calls)
        console.log(`[模型·提议] ${c.name}(${JSON.stringify(c.args)}) #${c.id}`);
    else if (e.role === "tool-result")
      console.log(`[loop·执行] ${e.name} → ${e.text} (配 #${e.id})${e.isError ? " ⚠️" : ""}`);
    else if (e.role === "assistant-final") console.log(`[模型·最终] ${e.text}`);
  }
  console.log(`\n停止原因: ${result.stoppedReason}`);
  console.log(
    result.finalText.includes("42")
      ? "✅ 模型正确用了工具结果(42)"
      : "⚠️ 最终答复里没看到 42,检查一下",
  );
}

main().catch((e) => {
  console.error("跑挂了:", e instanceof Error ? e.message : e);
  process.exit(1);
});
