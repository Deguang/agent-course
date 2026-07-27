import assert from "node:assert/strict";
import { test } from "node:test";
import { chunk, cosineSimilarity, VectorStore } from "./rag.ts";

// ── 8.1 chunk ──
test("chunk:短文档 → 单块", () => {
  assert.deepEqual(chunk("hello world", 100), ["hello world"]);
});
test("chunk:按段落贪心打包,不超 maxLen", () => {
  // "aaa"(3) + "\n\n" + "bbb"(3) = 8 > 5 → 分开;各 3 <= 5
  assert.deepEqual(chunk("aaa\n\nbbb\n\nccc", 5), ["aaa", "bbb", "ccc"]);
});
test("chunk:装得下的相邻段落合并进一个 chunk", () => {
  // "aa"(2)+"\n\n"+"bb"(2)=6 <= 10 → 合并;再加 "cc" = 10... "aa\n\nbb\n\ncc"=10 <=10 → 一整块
  assert.deepEqual(chunk("aa\n\nbb\n\ncc", 10), ["aa\n\nbb\n\ncc"]);
});

// ── 8.2 余弦相似度 ──
test("cosineSimilarity:同向 → 1,正交 → 0,反向 → -1", () => {
  assert.ok(Math.abs(cosineSimilarity([1, 0], [2, 0]) - 1) < 1e-9); // 同向(长度无关)
  assert.ok(Math.abs(cosineSimilarity([1, 0], [0, 1]) - 0) < 1e-9); // 正交
  assert.ok(Math.abs(cosineSimilarity([1, 0], [-1, 0]) - -1) < 1e-9); // 反向
});

// ── 8.3 向量库检索 ──
test("VectorStore.search:返回与 query 最相似的前 k 条,按分降序", () => {
  const store = new VectorStore();
  store.add("猫", [1, 0, 0]);
  store.add("狗", [0.9, 0.1, 0]); // 与"猫"接近
  store.add("汽车", [0, 0, 1]); // 无关

  const hits = store.search([1, 0, 0], 2);
  assert.equal(hits.length, 2, "取前 2 条");
  assert.deepEqual(
    hits.map((h) => h.text),
    ["猫", "狗"],
    "最相似的在前,不相关的被排除",
  );
  assert.ok((hits[0]?.score ?? 0) >= (hits[1]?.score ?? 0), "score 降序");
});
test("VectorStore.search:k 大于库存 → 返回全部(不报错)", () => {
  const store = new VectorStore();
  store.add("a", [1, 0]);
  assert.equal(store.search([1, 0], 5).length, 1);
});
