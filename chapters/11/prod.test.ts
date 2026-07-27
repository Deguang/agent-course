import assert from "node:assert/strict";
import { test } from "node:test";
import type { CaseResult } from "../10/eval.ts";
import { evalGate, resume, SemanticCache, type SuspendedRun, serializeResumable } from "./prod.ts";

const notStub = (e: unknown) => !/尚未实现/.test(String(e));
// 简化相似度:1D 向量按"越近越相似"(1 - 归一化距离),够测缓存逻辑。
const sim = (a: number[], b: number[]) => 1 - Math.min(1, Math.abs((a[0] ?? 0) - (b[0] ?? 0)));

// ── 11.1 语义缓存 ──
test("SemanticCache:相似度 ≥ 阈值 → 命中,返回缓存值", () => {
  const c = new SemanticCache<string>(sim);
  c.set([0.5], "cached-answer");
  assert.equal(c.get([0.55], 0.9), "cached-answer", "0.55 与 0.5 很近,应命中");
});
test("SemanticCache:相似度 < 阈值 → miss(undefined)", () => {
  const c = new SemanticCache<string>(sim);
  c.set([0.1], "x");
  assert.equal(c.get([0.9], 0.9), undefined, "差太远,不该命中");
});
test("SemanticCache:多条时返回最相似那条的值", () => {
  const c = new SemanticCache<string>(sim);
  c.set([0.1], "near-0.1");
  c.set([0.8], "near-0.8");
  assert.equal(c.get([0.79], 0.8), "near-0.8");
});

// ── 11.2 suspend / resume ──
test("serializeResumable + resume:挂起态过令牌往返不丢", () => {
  const run: SuspendedRun = {
    history: [{ role: "user", text: "删这个文件" }],
    pending: { callId: "c1", toolName: "delete_file" },
  };
  const token = serializeResumable(run);
  assert.equal(typeof token, "string");
  const back = resume(token);
  assert.deepEqual(back, run, "从令牌重入,状态与挂起时一致");
});
test("resume:令牌损坏 → 抛清晰错误(不拿半个状态继续)", () => {
  assert.throws(() => resume("{不是合法json"), notStub);
});

// ── 11.3 CI 门禁 ──
const R = (name: string, pass: boolean): CaseResult => ({ name, pass });
test("evalGate:无回归且通过率达标 → 放行", () => {
  const cur = [R("a", true), R("b", true), R("c", true)];
  const g = evalGate(cur, ["a", "b"], 0.9);
  assert.equal(g.pass, true);
});
test("evalGate:基线通过的 case 这次挂了(回归)→ 挡下,并指出是谁", () => {
  const cur = [R("a", true), R("b", false)]; // b 曾通过,现在挂
  const g = evalGate(cur, ["a", "b"], 0.5);
  assert.equal(g.pass, false);
  assert.ok(
    g.reasons.some((r) => r.includes("b")),
    "reasons 要点名回归的 case b",
  );
});
test("evalGate:通过率低于下限 → 挡下", () => {
  const cur = [R("a", true), R("b", false), R("c", false)]; // 1/3
  const g = evalGate(cur, [], 0.9);
  assert.equal(g.pass, false);
});
