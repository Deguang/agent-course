// Chapter 04 — 有状态 & 持久化:agent 如何跨轮、跨崩溃可靠地"记住"。
// 你要实现 3 样(文件底部):recover / pathTo / SessionLog。
//
// 三条不变量(把"可靠的记忆"和"内存里的数组"区分开):
//   ★ 1. 只追加、可分支:历史是一棵树(每条记 parent),从某点重跑 = 长出新分支;旧事实不改不删。
//   ★ 2. 换行 = 提交标记:一条 JSONL 记录只有以 \n 结尾才算"已提交事实";结尾那条没换行的
//        是崩溃残留,恢复时当它不存在(fail-closed:宁可丢半条,不认损坏数据)。
//   ★ 3. tainted writer:一次写到一半失败后,这个 writer 永久拒绝再写——绝不往损坏的日志后面续写。

import type { HistoryEntry } from "../01/agent.ts";

// 一条 session 记录:树上的一个节点。message 复用 Day 1 的 HistoryEntry。
export type Entry = {
  id: string;
  parentId: string | null; // null = 根
  message: HistoryEntry;
};

/**
 * Lab 4.1 — recover:把 JSONL 文本恢复成 Entry[]。
 *   每行一个 JSON。**结尾若有一行没有换行符,丢弃它**(崩溃时写了一半的残留,不是已提交事实)。
 *   提示:按 \n 切;真正"提交"的行都后跟 \n,所以最后一个元素若非空,就是没写完的残留。
 */
export function recover(jsonl: string): Entry[] {
  throw new Error("Lab 4.1 recover 尚未实现");
}

/**
 * Lab 4.2 — pathTo:给定所有 entries 和一个叶子 id,返回从根到该叶子的路径(顺序:根 → … → 叶子)。
 *   顺着 parentId 往上走,再反转。遇到未知 id、或链条断裂(parent 找不到)→ 抛错。
 *   (这是"从一棵可分支的历史里,取出当前这条活动对话"的方式。)
 */
export function pathTo(entries: Entry[], leafId: string): Entry[] {
  throw new Error("Lab 4.2 pathTo 尚未实现");
}

/**
 * Lab 4.3 — SessionLog:只追加、fail-closed 的写入器。
 *   · append(entry):把 entry 序列化成一行 JSON + \n,交给 write 写出。
 *   · write 抛错(磁盘满/中断)→ 把自己标记为 **tainted**,并让本次 append 失败。
 *   · 一旦 tainted,之后任何 append 都直接失败(**即使 write 又能用了也不写**)——绝不续写到损坏日志后面。
 *   write 由构造时注入(真实里是 fs.appendFile;测试里可注入一个会失败的假 write)。
 */
export class SessionLog {
  #write: (line: string) => Promise<void>;
  #tainted = false;

  constructor(write: (line: string) => Promise<void>) {
    this.#write = write;
  }

  async append(_entry: Entry): Promise<void> {
    throw new Error("Lab 4.3 SessionLog.append 尚未实现");
  }

  get tainted(): boolean {
    return this.#tainted;
  }
}
