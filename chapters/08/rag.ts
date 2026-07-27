// Chapter 08 — 知识层:RAG(检索增强生成)+ 长期记忆。
// 你要实现 3 样(文件底部):chunk / cosineSimilarity / VectorStore.search。
//
// 核心心智:
//   ★ 模型不知道你的私有知识(文档/数据库/它训练后的事)。RAG = 先**检索**出相关片段,塞进上下文,
//     再让模型基于它回答。检索靠**语义相似度**(把文本变成向量 embedding,找最近的)。
//   ★ agentic RAG:不是"每次都检索",而是把"检索"做成一个**工具**,让 agent **自己决定何时、检索什么**。
//   ★ 长期记忆 = 同一套机器:把过去的事实写进向量库,以后按相似度取回。

export type Vector = number[];

/**
 * Lab 8.1 — chunk:把长文档切成小片段(RAG 的第一步:文档太长,要切成可检索的单元)。
 *   按段落(以 "\n\n" 分隔)贪心打包:相邻段落合并进一个 chunk,只要**合并后字符串长度**(用 "\n\n" 连接、含分隔符)<= maxLen;超了就开新 chunk。
 *   (单个段落本身就超 maxLen 时,允许它单独成块并超出——真实里会再细切,见迁移题。)
 *   返回:非空片段数组,保持原顺序。
 */
export function chunk(text: string, maxLen: number): string[] {
  throw new Error("Lab 8.1 chunk 尚未实现");
}

/**
 * Lab 8.2 — cosineSimilarity:两个等长向量的余弦相似度 = 点积 / (模长a × 模长b)。
 *   相同方向→1,正交→0,相反→-1。这是"语义有多近"的度量。
 *   (长度不等或零向量→按你认为合理的方式处理,并在测试里体现。)
 */
export function cosineSimilarity(a: Vector, b: Vector): number {
  throw new Error("Lab 8.2 cosineSimilarity 尚未实现");
}

export type Doc = { text: string; embedding: Vector };
export type Hit = { text: string; score: number };

/**
 * 向量库:存"文本 + 它的 embedding",按相似度检索。
 * (真实里 embedding 由模型算——本章由调用者传入,保持 provider 中立、可确定性测试。)
 */
export class VectorStore {
  #docs: Doc[] = [];

  add(text: string, embedding: Vector): void {
    this.#docs.push({ text, embedding });
  }

  /**
   * Lab 8.3 — search:返回与 query 向量最相似的前 k 条(按 score 从高到低)。
   *   对每个 doc 算 cosineSimilarity(query, doc.embedding),排序,取前 k,返回 { text, score }。
   */
  search(_query: Vector, _k: number): Hit[] {
    throw new Error("Lab 8.3 VectorStore.search 尚未实现");
  }

  get size(): number {
    return this.#docs.length;
  }
}
