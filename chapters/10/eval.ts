// Chapter 10 — Evals & 可观测:程序跑完 ≠ 任务做对。
// 你要实现 3 样(文件底部):Tracer / runEvalCase / runEvalSuite。
//
// 核心心智:
//   ★ agent 是非确定的、会走弯路。"没报错"不代表"做对了"。所以要**评测**(判定任务成没成)
//     和**可观测**(记录它到底走了哪几步,好 debug/分析成本)。这在 2026 是一等公民,不是事后补。
//   ★ trajectory eval:评的是**整条轨迹**(用了对的工具吗?走对路了吗?),不只看最终那句话。
//   ★ 判定与执行分离;一个 case 执行失败 = 这个 case 判**失败**,而不是让整个评测套件崩掉。

// ── 可观测:把每一步记下来 ──
export type Span = { type: "model" | "tool"; name: string; ms: number; tokens?: number };

/**
 * Lab 10.1 — Tracer:记录每一步 span,并汇总。
 *   record(span) 追加;summary() 返回 { count, totalTokens, totalMs }(tokens 缺省按 0 计)。
 *   (真实里 trace 还带父子关系/时间线;本章先掌握"结构化记录 + 汇总"这个可观测的内核。)
 */
export class Tracer {
  #spans: Span[] = [];

  record(_span: Span): void {
    throw new Error("Lab 10.1 Tracer.record 尚未实现");
  }

  spans(): Span[] {
    return this.#spans;
  }

  summary(): { count: number; totalTokens: number; totalMs: number } {
    throw new Error("Lab 10.1 Tracer.summary 尚未实现");
  }
}

// ── 评测:一个 case = 怎么跑 + 怎么判 ──
export type EvalCase<S> = {
  name: string;
  run: () => Promise<S>; // 执行 agent,产出结果(可以是最终答案,也可以是**整条轨迹/history**)
  check: (result: S) => boolean; // judge:任务做对了吗(可检查整条轨迹,而非只看最终文本)
};
export type CaseResult = { name: string; pass: boolean; error?: string };

/**
 * Lab 10.2 — runEvalCase:跑一个 case——执行、判定,捕获结果。
 *   · 正常:pass = check(await run())。
 *   · run() 或 check() 抛错 → 这个 case 记为 { pass:false, error }(**不要让它抛出去**,失败要隔离)。
 *   (判定与执行分离:run 负责"跑",check 负责"判",runEvalCase 负责"稳稳收集结果"。)
 */
export async function runEvalCase<S>(c: EvalCase<S>): Promise<CaseResult> {
  throw new Error("Lab 10.2 runEvalCase 尚未实现");
}

/**
 * Lab 10.3 — runEvalSuite:跑一批 case(回归套件),汇总通过率。
 *   逐个 runEvalCase(一个失败不影响其他),返回 { results, passRate }(passRate = 通过数/总数,空套件=1)。
 */
export async function runEvalSuite(cases: EvalCase<unknown>[]): Promise<{
  results: CaseResult[];
  passRate: number;
}> {
  throw new Error("Lab 10.3 runEvalSuite 尚未实现");
}
