// Chapter 06 — 可扩展性:让 agent 的能力从"内置"变"可插拔生态"。
// 你要实现 3 样(文件底部):mcpToolRegistry / buildSkillContext / registerExtension。
//
// 三个主题:
//   ★ MCP:开放标准(不属于任何一家),把外部 server 暴露的工具接进你的 loop —— 跨 provider/客户端通用。
//   ★ skills 按需激活:只有激活的 skill 正文才进上下文(省 token);没激活的只留一句描述供发现。
//   ★ 扩展原子注册:第三方扩展注册工具时,要么全成功、要么什么都不留(注册到一半抛错不能留下半套)。

import type { Tool, ToolRegistry } from "../01/agent.ts";

// ── MCP(简化):一个 server 暴露一批工具,并能按名字执行 ──
export interface McpServer {
  listTools(): Promise<{ name: string; description: string }[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<string>;
}

/**
 * Lab 6.1 — mcpToolRegistry:把一个 MCP server 的工具,包成 Day 1 的 ToolRegistry。
 *   · 工具名要**加命名空间前缀** `${namespace}.${toolName}`(避免和别的工具/别的 server 撞名)。
 *   · 每个包出来的 Tool(args)→ 转发给 `server.callTool(原始工具名, args)`。
 *   这样 MCP server 的能力就能被 Day 1 的 loop 直接调用 —— loop 根本不知道它来自 MCP。
 */
export async function mcpToolRegistry(server: McpServer, namespace: string): Promise<ToolRegistry> {
  throw new Error("Lab 6.1 mcpToolRegistry 尚未实现");
}

// ── skills:带正文的能力包,但正文按需加载 ──
export type Skill = {
  name: string;
  description: string; // 便宜,始终可见(供模型"发现")
  loadBody: () => Promise<string>; // 贵,只有激活才加载(进上下文)
};

/**
 * Lab 6.2 — buildSkillContext:生成给模型的 skill 上下文。
 *   · 列出**所有** skill 的 name + description(发现:让模型知道有哪些 skill)。
 *   · 只对 `activated` 里的 skill,加载并附上正文(loadBody)。
 *   · **没激活的 skill,正文绝不进上下文**(省 token —— 这就是"渐进式披露")。
 *   返回一个字符串(拼给 system prompt)。
 */
export async function buildSkillContext(skills: Skill[], activated: string[]): Promise<string> {
  throw new Error("Lab 6.2 buildSkillContext 尚未实现");
}

// ── 扩展:第三方用一个 factory 往注册表里加工具 ──
export type ExtensionFactory = (register: (name: string, tool: Tool) => void) => void;

/**
 * Lab 6.3 — registerExtension:**原子**地把一个扩展注册进 target。
 *   · 先在一个**暂存**注册表里跑 factory(它会 register 若干工具)。
 *   · factory 全程无异常 → 一次性把暂存的工具提交进 target。
 *   · factory 中途抛错 → **target 保持不变**(已 register 的半套工具不能留下)。
 *   (为什么?坏扩展不能把系统污染成"注册了一半"的不一致状态。)
 */
export function registerExtension(target: ToolRegistry, factory: ExtensionFactory): void {
  throw new Error("Lab 6.3 registerExtension 尚未实现");
}
