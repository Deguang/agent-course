import assert from "node:assert/strict";
import { test } from "node:test";
import type { HistoryEntry } from "../01/agent.ts";
import { groupInteractions, projectWithinBudget } from "./context.ts";

// 每条固定 10 token,方便算预算。
const estimate = (_e: HistoryEntry) => 10;
const user = (t: string): HistoryEntry => ({ role: "user", text: t });
const final = (t: string): HistoryEntry => ({ role: "assistant-final", text: t });
const toolsMsg = (id: string): HistoryEntry => ({
  role: "assistant-tools",
  calls: [{ id, name: "read", args: {} }],
});
const result = (id: string): HistoryEntry => ({ role: "tool-result", id, name: "read", text: "r" });

// ── 5.1 分组 ──
test("groupInteractions:user 开新组,工具往返归入当前组", () => {
  const history = [
    user("Q1"),
    toolsMsg("c1"),
    result("c1"),
    final("A1"), // 组 1:4 条
    user("Q2"),
    final("A2"), // 组 2:2 条
  ];
  const groups = groupInteractions(history);
  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups[0]?.map((e) => e.role),
    ["user", "assistant-tools", "tool-result", "assistant-final"],
  );
  assert.deepEqual(
    groups[1]?.map((e) => e.role),
    ["user", "assistant-final"],
  );
});

// ── 5.2 预算投影 ──
test("projectWithinBudget:预算够 → 全部保留", () => {
  const groups = [
    [user("Q1"), final("A1")], // 20 tok
    [user("Q2"), final("A2")], // 20 tok
  ];
  const p = projectWithinBudget(groups, 100, estimate);
  assert.equal(p.kept.length, 4);
  assert.equal(p.droppedGroups, 0);
  assert.equal(p.overflow, false);
});

test("projectWithinBudget:预算只够最新组 → 丢弃更早的组", () => {
  const groups = [
    [user("Q1"), final("A1")], // 20 tok(旧)
    [user("Q2"), final("A2")], // 20 tok(新)
  ];
  const p = projectWithinBudget(groups, 25, estimate); // 只装得下一组
  assert.equal(p.droppedGroups, 1);
  assert.deepEqual(
    p.kept.map((e) => (e.role === "user" ? e.text : "")),
    ["Q2", ""],
    "应保留最新那组 Q2",
  );
  assert.equal(p.overflow, false);
});

test("projectWithinBudget:绝不切半组(要么整组,要么不要)", () => {
  const groups = [
    [user("Q1"), toolsMsg("c1"), result("c1"), final("A1")], // 40 tok(旧,4 条)
    [user("Q2"), final("A2")], // 20 tok(新)
  ];
  // 预算 50:装下新组(20)后,再加旧组(40)= 60 超了 → 旧组整组丢弃,不能只留旧组的一部分
  const p = projectWithinBudget(groups, 50, estimate);
  assert.equal(p.droppedGroups, 1);
  assert.equal(p.kept.length, 2, "只保留完整的最新组,不掺旧组的半截");
});

test("projectWithinBudget:最新组自己就超预算 → 保留整组 + overflow=true", () => {
  const groups = [
    [user("Q1"), toolsMsg("c1"), result("c1"), final("A1")], // 40 tok
  ];
  const p = projectWithinBudget(groups, 25, estimate); // 预算 < 40
  assert.equal(p.kept.length, 4, "宁可整组超预算,也不切出半组(半组=有调用没结果,更糟)");
  assert.equal(p.overflow, true);
});
