// Chapter 09 — Guardrails & 人在环路:agent 会调工具、花钱、改世界,得有缰绳。
// 你要实现 2 样(文件底部):guardedExecute / BudgetGuard。
//
// 核心心智:
//   ★ agent guardrails ≠ LLM guardrails。2024 说 guardrails 指"过滤模型输入输出";2026 的 agent
//     会**执行动作**(删文件、发请求、花 token/钱),所以护栏要管的是**动作**:哪些工具能自动跑、
//     哪些要人批、花费/步数别失控。
//   ★ 拒绝/待批也要归一成"与原调用配对的结果",绝不静默绕过、绝不炸穿 loop(呼应 Day 1 异常当数据)。

import type { ToolCall } from "../01/agent.ts";

// 对一次工具调用的裁决:自动放行 / 需人工批 / 直接拒绝。
export type Decision = "allow" | "ask" | "deny";
// 权限策略:看这次调用(工具名/参数),给出裁决。真实里按"工具 + 可逆性 + 参数"综合判断。
export type PermissionPolicy = (call: ToolCall) => Decision;
// 人在环路:ask 时问人是否批准(真实里弹窗/Slack;测试里注入)。
export type ApproveFn = (call: ToolCall) => boolean | Promise<boolean>;

// 受护栏保护的执行结果(= Day 1 tool-result 的载荷,配对回原 call.id)。
export type GuardedResult = { id: string; name: string; text: string; isError: boolean };

/**
 * Lab 9.1 — guardedExecute:用权限策略 + 人工审批,包住一次工具执行。
 *   1. decision = policy(call)。
 *   2. deny  → **不执行**,返回一条 isError 结果:"被策略拒绝"(带 call.id/name)。
 *   3. ask   → 调 approve(call);批准才执行,否则**不执行**,返回 isError:"被用户拒绝"。
 *   4. allow(或批准)→ 执行 execute(call),把结果包成 GuardedResult(isError:false)。
 *   关键:任何路径都返回**与 call 配对**的 GuardedResult,绝不静默吞掉、绝不让 loop 拿不到结果。
 */
export async function guardedExecute(
  call: ToolCall,
  execute: (call: ToolCall) => Promise<string>,
  policy: PermissionPolicy,
  approve: ApproveFn,
): Promise<GuardedResult> {
  const decision = policy(call);
  if (decision === "deny") {
    return { id: call.id, name: call.name, text: "被策略拒绝", isError: true };
  }
  if (decision === "ask") {
    const ok = await approve(call);
    if (!ok) return { id: call.id, name: call.name, text: "被用户拒绝", isError: true };
  }
  try {
    const text = await execute(call);
    return { id: call.id, name: call.name, text, isError: false };
  } catch (e) {
    return {
      id: call.id,
      name: call.name,
      text: e instanceof Error ? e.message : String(e),
      isError: true,
    };
  }
}

/**
 * Lab 9.2 — BudgetGuard:花费/步数护栏,防 agent 失控烧钱、跑不停。
 *   · 记录累计步数与花费(spend,可理解为 token 或成本单位)。
 *   · charge(spend):累加;若**加上这次会超过任一上限**,抛错(别偷偷超支)。
 *   · 上限在构造时给(maxSteps / maxSpend,均可选,不给=不限)。
 */
export class BudgetGuard {
  #maxSteps: number;
  #maxSpend: number;
  #steps = 0;
  #spent = 0;

  constructor(limits: { maxSteps?: number; maxSpend?: number } = {}) {
    this.#maxSteps = limits.maxSteps ?? Number.POSITIVE_INFINITY;
    this.#maxSpend = limits.maxSpend ?? Number.POSITIVE_INFINITY;
  }

  charge(spend: number): void {
    if (this.#steps + 1 > this.#maxSteps) throw new Error("超过步数上限");
    if (this.#spent + spend > this.#maxSpend) throw new Error("超过花费上限");
    this.#steps += 1;
    this.#spent += spend;
  }

  get steps(): number {
    return this.#steps;
  }
  get spent(): number {
    return this.#spent;
  }
}
