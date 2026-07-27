// Chapter 11 — 上生产 (LLMOps & 服务化):把 agent 从"本地能跑"推到"生产站得住"。
// 你要实现 3 样(文件底部):SemanticCache / serializeResumable+resume / evalGate。
//
// 三个生产必备:
//   ★ 主动优化:语义缓存——高频复用时,语义相近的请求直接命中缓存,省延迟省钱(复用 Day 8 的相似度)。
//   ★ 服务化/可恢复:agent 要暴露成服务;HITL/暂停时,后端状态必须能**序列化跨线**、人介入后**准确重入**。
//   ★ 上线门禁:把 Day 10 的回归套件接成 CI gate,劣化配置/破坏性工具更新**进不了生产**。
//
// (部署基座 Serverless/Edge/容器、前端 Generative UI(streamUI)、跨服务 A2A 协议——见 README 概念/迁移。)

import type { CaseResult } from "../10/eval.ts";

// ── 1. 语义缓存 ──
export type Vector = number[];

/**
 * Lab 11.1 — SemanticCache:按"查询语义"缓存结果。
 *   · set(embedding, value):存一条(查询向量 → 结果)。
 *   · get(queryEmbedding, threshold):找与 query 相似度最高的一条;**若最高相似度 ≥ threshold 就命中**,返回其 value;否则 undefined(miss)。
 *   相似度函数由构造时注入(通常是 Day 8 的 cosineSimilarity)——保持解耦、可确定性测试。
 *   (为什么"语义"缓存而非精确 key?自然语言问法千变万化,精确匹配几乎不命中;语义近似才有复用价值。)
 */
export class SemanticCache<V> {
  #sim: (a: Vector, b: Vector) => number;
  #entries: { embedding: Vector; value: V }[] = [];

  constructor(similarity: (a: Vector, b: Vector) => number) {
    this.#sim = similarity;
  }

  set(_embedding: Vector, _value: V): void {
    throw new Error("Lab 11.1 SemanticCache.set 尚未实现");
  }

  get(_queryEmbedding: Vector, _threshold: number): V | undefined {
    throw new Error("Lab 11.1 SemanticCache.get 尚未实现");
  }

  get size(): number {
    return this.#entries.length;
  }
}

// ── 2. 服务化:suspend / resume(跨线可恢复)──
// 一个被挂起的 run:当前状态 + 卡在哪个待人工决定的动作。要能序列化成字符串(过网络/存库),再从字符串重入。
export type SuspendedRun = {
  history: unknown[]; // 至今的对话/事实(canonical,可 JSON 化)
  pending: { callId: string; toolName: string } | null; // 卡在等哪个工具的审批;null=没卡
};

/**
 * Lab 11.2 — serializeResumable / resume:把挂起态序列化成"恢复令牌",再从令牌准确重入。
 *   · serializeResumable(run):返回一个字符串令牌(JSON),能过网络/存库。
 *   · resume(token):把令牌解析回 SuspendedRun;**令牌损坏/结构不对 → 抛清晰错误**(别拿半个状态继续跑)。
 *   (这就是 HITL/暂停能"端到端"的前提:后端状态机能挂起、暴露给前端、人介入后从同一状态继续。)
 */
export function serializeResumable(run: SuspendedRun): string {
  throw new Error("Lab 11.2 serializeResumable 尚未实现");
}
export function resume(token: string): SuspendedRun {
  throw new Error("Lab 11.2 resume 尚未实现");
}

// ── 3. 上线门禁:把回归套件接成 CI gate ──
export type GateResult = { pass: boolean; reasons: string[] };

/**
 * Lab 11.3 — evalGate:根据本次评测结果 + 基线,决定能不能上生产(CI 门禁)。
 *   规则(任一不满足即挡下,pass=false,reasons 说明为什么):
 *     · **回归**:baseline(上次通过的 case 名单)里的任何 case,这次 fail → 挡下(reasons 列出回归的 case 名)。
 *     · **通过率**:本次 passRate < minPassRate → 挡下。
 *   全过则 pass=true。(这就是"防劣质配置/破坏性工具更新进生产"的工程实践。)
 */
export function evalGate(
  current: CaseResult[],
  baselinePassed: string[],
  minPassRate: number,
): GateResult {
  throw new Error("Lab 11.3 evalGate 尚未实现");
}
