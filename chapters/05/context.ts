// Chapter 05 — 上下文管理:长历史塞不进有限的上下文窗口,怎么办。
// 你要实现 2 个函数(文件底部):groupInteractions / projectWithinBudget。
//
// 两条不变量(把"聪明地省上下文"和"乱切一刀"区分开):
//   ★ 1. 按语义组切,不按数组下标切:一次交互(user + 它引发的工具调用/结果 + 最终答复)是一个
//        原子组。绝不能切出"有调用没结果"的半组——那比超预算更危险。
//   ★ 2. 从最新往回留:预算优先给最近的交互;system prompt、输出预留、安全余量由调用者先扣掉。

import type { HistoryEntry } from "../01/agent.ts";

// 一个交互组 = 属于同一次 user 交互的连续条目。
export type Group = HistoryEntry[];

/**
 * Lab 5.1 — groupInteractions:把线性 history 切成交互组。
 *   规则:遇到 role==="user" 就开一个新组;后续条目(assistant-tools / tool-result / assistant-final)
 *   都归入当前组,直到下一个 user。
 *   (为什么按 user 分?因为一次交互从用户开口开始,它引发的工具调用/结果/答复是一个不可分的整体。)
 */
export function groupInteractions(history: HistoryEntry[]): Group[] {
  const groups: Group[] = [];
  let cur: Group | null = null;
  for (const e of history) {
    if (e.role === "user" || cur === null) {
      cur = [e];
      groups.push(cur);
    } else {
      cur.push(e);
    }
  }
  return groups;
}

export type Projection = {
  kept: HistoryEntry[]; // 投影后要塞进上下文的条目(保持原顺序)
  droppedGroups: number; // 丢掉了几个较早的组
  overflow: boolean; // 最新一组自己就超预算(保留整组,但如实报告溢出)
};

/**
 * Lab 5.2 — projectWithinBudget:在预算内,从最新往回保留尽量多的**整组**。
 *   · budgetTokens:留给 history 的预算(system/输出/余量已由调用者扣除)。
 *   · estimate(entry):估算一条的 token 数(确定性纯函数,调用者提供)。
 *   规则:从最新的组往前累加,只要加上下一组不超预算就保留;超了就停,更早的组算 dropped。
 *   边界:如果**最新那一组自己就超预算**——**仍保留整组**(别切半组!),并把 overflow 置 true。
 *   返回的 kept 要保持原始先后顺序(根→叶)。
 */
export function projectWithinBudget(
  groups: Group[],
  budgetTokens: number,
  estimate: (entry: HistoryEntry) => number,
): Projection {
  const groupTokens = groups.map((g) => g.reduce((sum, e) => sum + estimate(e), 0));

  const keptGroups: Group[] = [];
  let used = 0;
  let droppedGroups = 0;
  let overflow = false;

  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    const t = groupTokens[i] ?? 0;
    if (g === undefined) continue;
    if (used + t <= budgetTokens) {
      keptGroups.unshift(g);
      used += t;
    } else {
      droppedGroups = i + 1; // groups[0..i] 都丢
      break;
    }
  }

  // 边界:最新一组自己就超预算 —— 仍保留整组,标 overflow。
  if (keptGroups.length === 0 && groups.length > 0) {
    const last = groups[groups.length - 1];
    if (last) keptGroups.push(last);
    overflow = true;
    droppedGroups = groups.length - 1;
  }

  return { kept: keptGroups.flat(), droppedGroups, overflow };
}
