import assert from "node:assert/strict";
import { test } from "node:test";
import type { ToolCall } from "../01/agent.ts";
import { BudgetGuard, guardedExecute, type PermissionPolicy } from "./guardrails.ts";

const notStub = (e: unknown) => !/尚未实现/.test(String(e));
const call: ToolCall = { id: "c1", name: "delete_file", args: { path: "x" } };

// ── 9.1 权限网关 + 人在环路 ──
test("allow:自动放行 → 执行,拿到正常结果", async () => {
  let ran = false;
  const r = await guardedExecute(
    call,
    async () => {
      ran = true;
      return "已执行";
    },
    () => "allow",
    () => true,
  );
  assert.ok(ran);
  assert.deepEqual(r, { id: "c1", name: "delete_file", text: "已执行", isError: false });
});

test("deny:直接拒绝 → 不执行,返回配对的 isError 结果", async () => {
  let ran = false;
  const r = await guardedExecute(
    call,
    async () => {
      ran = true;
      return "不该被执行";
    },
    () => "deny",
    () => true,
  );
  assert.equal(ran, false, "deny 绝不执行");
  assert.equal(r.isError, true);
  assert.equal(r.id, "c1", "结果仍配对回原 call");
});

test("ask + 用户批准 → 执行", async () => {
  let ran = false;
  const r = await guardedExecute(
    call,
    async () => {
      ran = true;
      return "批准后执行";
    },
    () => "ask",
    () => true, // 人批准
  );
  assert.ok(ran);
  assert.equal(r.isError, false);
  assert.equal(r.text, "批准后执行");
});

test("ask + 用户拒绝 → 不执行,返回 isError", async () => {
  let ran = false;
  let asked = false;
  const r = await guardedExecute(
    call,
    async () => {
      ran = true;
      return "x";
    },
    () => "ask",
    () => {
      asked = true;
      return false; // 人拒绝
    },
  );
  assert.ok(asked, "ask 时应征询人");
  assert.equal(ran, false, "被拒就不执行");
  assert.equal(r.isError, true);
  assert.equal(r.id, "c1");
});

test("allow 时不应征询人(approve 不被调用)", async () => {
  let asked = false;
  const policy: PermissionPolicy = () => "allow";
  await guardedExecute(
    call,
    async () => "ok",
    policy,
    () => {
      asked = true;
      return true;
    },
  );
  assert.equal(asked, false, "allow 直接执行,不打扰人");
});

// ── 9.2 花费/步数护栏 ──
test("BudgetGuard:未超上限 → 正常累加", () => {
  const g = new BudgetGuard({ maxSteps: 3, maxSpend: 100 });
  g.charge(30);
  g.charge(30);
  assert.equal(g.steps, 2);
  assert.equal(g.spent, 60);
});

test("BudgetGuard:超花费上限 → 抛错", () => {
  const g = new BudgetGuard({ maxSpend: 50 });
  g.charge(40);
  assert.throws(() => g.charge(20), notStub, "40+20>50 应拒绝");
});

test("BudgetGuard:超步数上限 → 抛错", () => {
  const g = new BudgetGuard({ maxSteps: 2 });
  g.charge(1);
  g.charge(1);
  assert.throws(() => g.charge(1), notStub, "第 3 步超上限");
});
