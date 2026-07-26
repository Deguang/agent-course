import assert from "node:assert/strict";
import { test } from "node:test";
import type { HistoryEntry } from "../01/agent.ts";
import { type Entry, pathTo, recover, SessionLog } from "./session.ts";

const notStub = (e: unknown) => !/尚未实现/.test(String(e));
const msg = (text: string): HistoryEntry => ({ role: "user", text });
const entry = (id: string, parentId: string | null, text: string): Entry => ({
  id,
  parentId,
  message: msg(text),
});
const jsonl = (entries: Entry[]) => entries.map((e) => `${JSON.stringify(e)}\n`).join("");

// ── 4.1 recover ──
test("recover:正常 JSONL(每行都带换行)→ 全部恢复", () => {
  const entries = [entry("a", null, "1"), entry("b", "a", "2"), entry("c", "b", "3")];
  assert.deepEqual(recover(jsonl(entries)), entries);
});
test("recover:结尾一行没有换行(崩溃残留)→ 丢弃", () => {
  const good = jsonl([entry("a", null, "1"), entry("b", "a", "2")]);
  const crashed = `${good}${JSON.stringify(entry("c", "b", "half"))}`; // 最后一条没有 \n
  const out = recover(crashed);
  assert.deepEqual(
    out.map((e) => e.id),
    ["a", "b"],
    "没写完的最后一条不算已提交事实",
  );
});
test("recover:空日志 → 空数组", () => {
  assert.deepEqual(recover(""), []);
});

// ── 4.2 pathTo ──
test("pathTo:线性链 → 根到叶子的路径", () => {
  const entries = [entry("a", null, "1"), entry("b", "a", "2"), entry("c", "b", "3")];
  assert.deepEqual(
    pathTo(entries, "c").map((e) => e.id),
    ["a", "b", "c"],
  );
});
test("pathTo:分支树 → 只取目标那条分支", () => {
  // a → b → c ,以及 a → d(另一分支)
  const entries = [
    entry("a", null, "root"),
    entry("b", "a", "b"),
    entry("c", "b", "c"),
    entry("d", "a", "d"),
  ];
  assert.deepEqual(
    pathTo(entries, "c").map((e) => e.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    pathTo(entries, "d").map((e) => e.id),
    ["a", "d"],
  );
});
test("pathTo:未知叶子 id → 抛错", () => {
  assert.throws(() => pathTo([entry("a", null, "1")], "nope"), notStub);
});

// ── 4.3 SessionLog(fail-closed)──
test("SessionLog:正常 append → 写出一行 JSON + 换行", async () => {
  const lines: string[] = [];
  const log = new SessionLog(async (l) => {
    lines.push(l);
  });
  await log.append(entry("a", null, "1"));

  assert.equal(lines.length, 1);
  assert.ok(lines[0]?.endsWith("\n"), "行必须以换行结尾(提交标记)");
  assert.deepEqual(JSON.parse(lines[0] ?? ""), entry("a", null, "1"));
});
test("SessionLog:写失败 → 本次 append 失败,且从此 tainted、拒绝再写", async () => {
  let failNext = true;
  const lines: string[] = [];
  const log = new SessionLog(async (l) => {
    if (failNext) {
      failNext = false;
      throw new Error("disk full");
    }
    lines.push(l);
  });

  await assert.rejects(log.append(entry("a", null, "1")), notStub); // 第一次写失败
  assert.equal(log.tainted, true, "失败后应 tainted");
  await assert.rejects(log.append(entry("b", null, "2")), notStub); // 即使 write 现在能用,也拒绝
  assert.equal(lines.length, 0, "tainted 后绝不再写");
});
