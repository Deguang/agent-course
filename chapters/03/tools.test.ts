import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { bash, edit, glob, grep, read, resolveInWorkspace, write } from "./tools.ts";

// "应该抛错"的断言要排除未实现 stub 的错误,否则 stub 也会让 throws/rejects 假绿。
const notStub = (e: unknown) => !/尚未实现/.test(String(e));

// 每个测试用一个真实临时 workspace(不污染仓库),测完删掉。
let root: string;
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "agent-course-03-"));
});
afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

// ── 3.1 workspace 边界 ──
test("resolveInWorkspace:root 内的路径解析成绝对路径", () => {
  const abs = resolveInWorkspace(root, "src/a.ts");
  assert.equal(abs, path.join(root, "src/a.ts"));
});
test("resolveInWorkspace:../ 逃逸要抛错", () => {
  assert.throws(() => resolveInWorkspace(root, "../../etc/passwd"), notStub);
});

// ── 3.2 read ──
test("read:读到文件内容,且过边界", async () => {
  await fs.writeFile(path.join(root, "a.txt"), "hello");
  assert.equal(await read(root, "a.txt"), "hello");
  await assert.rejects(read(root, "../secret"));
});

// ── 3.3 原子写 ──
test("write:写入并可读回(内容正确)", async () => {
  await write(root, "dir/b.txt", "content");
  assert.equal(await fs.readFile(path.join(root, "dir/b.txt"), "utf8"), "content");
});
test("write:过程中不留 .tmp 残留(原子写完成后临时文件应已 rename)", async () => {
  await write(root, "c.txt", "x");
  const files = await fs.readdir(root);
  assert.ok(!files.some((f) => f.endsWith(".tmp")), "不应残留临时文件");
});

// ── 3.4 精确 edit ──
test("edit:恰好命中一次 → 替换成功", async () => {
  await fs.writeFile(path.join(root, "d.txt"), "foo bar baz");
  await edit(root, "d.txt", "bar", "QUX");
  assert.equal(await fs.readFile(path.join(root, "d.txt"), "utf8"), "foo QUX baz");
});
test("edit:命中 0 次 → 抛错", async () => {
  await fs.writeFile(path.join(root, "e.txt"), "foo");
  await assert.rejects(edit(root, "e.txt", "nope", "x"), notStub);
});
test("edit:命中多次 → 抛错(有歧义,防改错地方)", async () => {
  await fs.writeFile(path.join(root, "f.txt"), "a a a");
  await assert.rejects(edit(root, "f.txt", "a", "b"), notStub);
});

// ── 3.5 glob ──
test("glob:递归返回所有指定后缀的相对路径", async () => {
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src/a.ts"), "");
  await fs.writeFile(path.join(root, "src/b.ts"), "");
  await fs.writeFile(path.join(root, "readme.md"), "");
  const hits = (await glob(root, ".ts")).sort();
  assert.deepEqual(hits, ["src/a.ts", "src/b.ts"]);
});

// ── 3.6 grep ──
test("grep:递归逐行匹配正则,返回相对路径+行号+行", async () => {
  await fs.writeFile(path.join(root, "g.txt"), "alpha\nbeta TODO\ngamma");
  const hits = await grep(root, "TODO");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.file, "g.txt");
  assert.equal(hits[0]?.line, 2);
  assert.match(hits[0]?.text ?? "", /TODO/);
});

// ── 3.7 bash ──
test("bash:跑命令拿到 stdout", async () => {
  const r = await bash("echo hi", { cwd: root });
  assert.match(r.stdout, /hi/);
  assert.equal(r.exitCode, 0);
});
test("bash:输出超过上限 → 截断并标 truncated", async () => {
  const r = await bash("printf 'x%.0s' {1..1000}", { cwd: root, maxOutputBytes: 100 });
  assert.ok(r.truncated, "应标记截断");
  assert.ok(r.stdout.length <= 100, "输出应被截到上限内");
});
