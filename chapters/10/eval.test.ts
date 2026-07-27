import assert from "node:assert/strict";
import { test } from "node:test";
import { type EvalCase, runEvalCase, runEvalSuite, Tracer } from "./eval.ts";

// ── 10.1 Tracer ──
test("Tracer:记录 span 并汇总 count/tokens/ms", () => {
  const t = new Tracer();
  t.record({ type: "model", name: "step", ms: 100, tokens: 50 });
  t.record({ type: "tool", name: "read", ms: 20 }); // 无 tokens → 按 0
  assert.equal(t.spans().length, 2);
  assert.deepEqual(t.summary(), { count: 2, totalTokens: 50, totalMs: 120 });
});

// ── 10.2 runEvalCase ──
test("runEvalCase:任务做对 → pass", async () => {
  const c: EvalCase<number> = {
    name: "加法",
    run: async () => 4,
    check: (r) => r === 4,
  };
  assert.deepEqual(await runEvalCase(c), { name: "加法", pass: true });
});

test("runEvalCase:结果不对 → fail(check 返回 false)", async () => {
  const c: EvalCase<number> = { name: "加法", run: async () => 5, check: (r) => r === 4 };
  const res = await runEvalCase(c);
  assert.equal(res.pass, false);
});

test("runEvalCase:执行抛错 → 记为 fail 且带 error,不抛出", async () => {
  const c: EvalCase<number> = {
    name: "会崩的",
    run: async () => {
      throw new Error("agent 崩了");
    },
    check: () => true,
  };
  const res = await runEvalCase(c); // 不该 throw
  assert.equal(res.pass, false);
  assert.match(res.error ?? "", /agent 崩了/);
});

// ── trajectory eval:check 检查整条轨迹,而非只看最终答案 ──
test("runEvalCase:trajectory——check 断言'用了正确的工具',而非只看结果", async () => {
  type Run = { finalText: string; toolsUsed: string[] };
  const c: EvalCase<Run> = {
    name: "必须先查再答",
    run: async () => ({ finalText: "答案", toolsUsed: ["search", "read"] }),
    // 光看 finalText="答案" 会以为对了;但要求它**必须用过 search**才算真做对
    check: (r) => r.finalText === "答案" && r.toolsUsed.includes("search"),
  };
  assert.equal((await runEvalCase(c)).pass, true);
});

// ── 10.3 runEvalSuite ──
test("runEvalSuite:汇总通过率,一个失败不影响其他", async () => {
  const cases: EvalCase<unknown>[] = [
    { name: "a", run: async () => 1, check: (r) => r === 1 }, // pass
    { name: "b", run: async () => 2, check: (r) => r === 999 }, // fail
    {
      name: "c",
      run: async () => {
        throw new Error("boom");
      },
      check: () => true,
    }, // fail(执行崩)
  ];
  const out = await runEvalSuite(cases);
  assert.equal(out.results.length, 3, "所有 case 都跑到了(失败被隔离)");
  assert.ok(Math.abs(out.passRate - 1 / 3) < 1e-9, "3 个里 1 个过");
});
