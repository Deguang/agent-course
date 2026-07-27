import assert from "node:assert/strict";
import { test } from "node:test";
import { END, type Graph, parallel, reflect, runGraph } from "./graph.ts";

const notStub = (e: unknown) => !/尚未实现/.test(String(e));

type S = { trail: string[]; count: number };

// ── 7.1 runGraph:线性 ──
test("runGraph:线性 A→B→END,状态一路穿过", async () => {
  const graph: Graph<S> = {
    start: "A",
    nodes: {
      A: (s) => ({ ...s, trail: [...s.trail, "A"] }),
      B: (s) => ({ ...s, trail: [...s.trail, "B"] }),
    },
    routes: {
      A: () => "B",
      B: () => END,
    },
  };
  const out = await runGraph(graph, { trail: [], count: 0 });
  assert.deepEqual(out.trail, ["A", "B"]);
});

// ── 7.1 分支:路由按状态选路 ──
test("runGraph:分支——路由根据状态选不同节点", async () => {
  const graph: Graph<S> = {
    start: "check",
    nodes: {
      check: (s) => s,
      big: (s) => ({ ...s, trail: [...s.trail, "big"] }),
      small: (s) => ({ ...s, trail: [...s.trail, "small"] }),
    },
    routes: {
      check: (s) => (s.count > 10 ? "big" : "small"),
      big: () => END,
      small: () => END,
    },
  };
  assert.deepEqual((await runGraph(graph, { trail: [], count: 3 })).trail, ["small"]);
  assert.deepEqual((await runGraph(graph, { trail: [], count: 42 })).trail, ["big"]);
});

// ── 7.1 回环:路由指回自己,直到条件满足 ──
test("runGraph:回环——累加到 3 才 END", async () => {
  const graph: Graph<S> = {
    start: "inc",
    nodes: { inc: (s) => ({ ...s, count: s.count + 1 }) },
    routes: { inc: (s) => (s.count >= 3 ? END : "inc") },
  };
  const out = await runGraph(graph, { trail: [], count: 0 });
  assert.equal(out.count, 3);
});

// ── 7.1 防跑飞 ──
test("runGraph:路由成环不停 → 超 maxSteps 抛错", async () => {
  const graph: Graph<S> = {
    start: "spin",
    nodes: { spin: (s) => s },
    routes: { spin: () => "spin" }, // 永远转
  };
  await assert.rejects(runGraph(graph, { trail: [], count: 0 }, 5), notStub);
});

// ── 7.2 parallel ──
test("parallel:并发跑多个分支再合并", async () => {
  type P = { a?: string; b?: string };
  const node = parallel<P>(
    [async (s) => ({ ...s, a: "A" }), async (s) => ({ ...s, b: "B" })],
    (results) => Object.assign({}, ...results),
  );
  const out = await node({});
  assert.deepEqual(out, { a: "A", b: "B" }, "两个分支的结果都合并进来");
});

// ── 7.3 reflect(evaluator-optimizer / 反思)──
test("reflect:生成→评审→修订,第 3 版达标 → passed,rounds=3", async () => {
  let version = 0;
  const out = await reflect<string>(
    () => {
      version += 1;
      return `v${version}`;
    },
    (draft) => ({ pass: draft === "v3", feedback: "还不够好,继续" }),
    5,
  );
  assert.equal(out.passed, true);
  assert.equal(out.result, "v3");
  assert.equal(out.rounds, 3);
});

test("reflect:始终不达标 → 用尽 maxRounds 停下,passed=false", async () => {
  const out = await reflect<string>(
    (fb) => `draft(${fb ?? "init"})`,
    () => ({ pass: false, feedback: "永远不满意" }),
    3,
  );
  assert.equal(out.passed, false);
  assert.equal(out.rounds, 3);
});

test("reflect:第一版就达标 → rounds=1,不多迭代", async () => {
  let gens = 0;
  const out = await reflect<string>(
    () => {
      gens += 1;
      return "good";
    },
    () => ({ pass: true, feedback: "" }),
    5,
  );
  assert.equal(out.rounds, 1);
  assert.equal(gens, 1, "达标就停,不白生成");
});
