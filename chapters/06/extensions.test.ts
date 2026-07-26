import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tool, ToolRegistry } from "../01/agent.ts";
import {
  buildSkillContext,
  type McpServer,
  mcpToolRegistry,
  registerExtension,
  type Skill,
} from "./extensions.ts";

const notStub = (e: unknown) => !/尚未实现/.test(String(e));

// ── 6.1 MCP ──
test("mcpToolRegistry:把 MCP 工具包成带命名空间的 ToolRegistry,调用转发给 server", async () => {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const server: McpServer = {
    async listTools() {
      return [
        { name: "search", description: "搜索" },
        { name: "create_issue", description: "建 issue" },
      ];
    },
    async callTool(name, args) {
      calls.push({ name, args });
      return `${name} 的结果`;
    },
  };

  const reg = await mcpToolRegistry(server, "github");

  assert.deepEqual(Object.keys(reg).sort(), ["github.create_issue", "github.search"]);
  const out = await reg["github.search"]?.({ q: "x" });
  assert.equal(out, "search 的结果");
  assert.deepEqual(calls, [{ name: "search", args: { q: "x" } }], "转发时用原始工具名");
});

// ── 6.2 skills 按需激活 ──
test("buildSkillContext:所有 skill 露描述,但只有激活的才带正文", async () => {
  const skills: Skill[] = [
    { name: "pdf", description: "处理 PDF", loadBody: async () => "PDF-BODY-SECRET" },
    { name: "xlsx", description: "处理 Excel", loadBody: async () => "XLSX-BODY-SECRET" },
  ];

  const ctx = await buildSkillContext(skills, ["pdf"]); // 只激活 pdf

  assert.match(ctx, /处理 PDF/, "所有 skill 的描述都在(供发现)");
  assert.match(ctx, /处理 Excel/);
  assert.match(ctx, /PDF-BODY-SECRET/, "激活的 skill 正文要在");
  assert.doesNotMatch(ctx, /XLSX-BODY-SECRET/, "没激活的 skill 正文绝不进上下文");
});

// ── 6.3 扩展原子注册 ──
test("registerExtension:factory 成功 → 工具全部提交", () => {
  const target: ToolRegistry = {};
  const ok: Tool = () => "ok";
  registerExtension(target, (register) => {
    register("a", ok);
    register("b", ok);
  });
  assert.deepEqual(Object.keys(target).sort(), ["a", "b"]);
});

test("registerExtension:factory 中途抛错 → target 保持不变(不留半套)", () => {
  const target: ToolRegistry = { existing: () => "x" };
  const ok: Tool = () => "ok";
  assert.throws(
    () =>
      registerExtension(target, (register) => {
        register("a", ok); // 注册了一个
        throw new Error("扩展初始化失败"); // 然后崩
      }),
    notStub,
  );
  assert.deepEqual(Object.keys(target), ["existing"], "半套工具不能留下,target 原样");
});
