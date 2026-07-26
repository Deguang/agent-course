// Chapter 03 — 常用工具集:给 agent 长出真实手脚。
// 你要实现 7 个工具(文件底部)。它们最终会包成 Day 1 的 ToolRegistry,插进 loop。
//
// 三条贯穿本章的安全/可靠不变量(比"能读能写"重要得多):
//   ★ 1. workspace 边界:所有路径必须落在 root 内(guardrail,不是 OS sandbox)——挡住 ../ 逃逸。
//   ★ 2. 原子写:写文件要么全成功、要么磁盘不变——绝不留半个文件(temp + rename)。
//   ★ 3. 精确 edit:按精确字符串替换,且必须**恰好命中一次**(0 次或多次都报错)——防止改错地方。

import { promises as fs } from "node:fs";
import path from "node:path";

export type GrepHit = { file: string; line: number; text: string };
export type BashResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  truncated: boolean;
  timedOut: boolean;
};

/**
 * Lab 3.1 — workspace 边界(本章安全基石,别的工具都要先过它)。
 * 把 relPath 解析成绝对路径,并**确保它落在 root 内**;越界(../ 逃逸、root 外的绝对路径)就抛错。
 * 提示:`path.resolve(root, relPath)` 后,检查它是否以 `path.resolve(root)` 为前缀。
 */
export function resolveInWorkspace(root: string, relPath: string): string {
  throw new Error("Lab 3.1 resolveInWorkspace 尚未实现");
}

/** Lab 3.2 — 读文件(先过边界)。可选:支持大文件按行范围读(offset/limit)。 */
export async function read(root: string, relPath: string): Promise<string> {
  throw new Error("Lab 3.2 read 尚未实现");
}

/**
 * Lab 3.3 — 原子写。先过边界、建好父目录;**写到临时文件再 rename**,保证不留半个文件。
 * (为什么?进程可能在写一半时崩;rename 在同一文件系统上是原子的,读者永远看到"旧的完整"或"新的完整"。)
 */
export async function write(root: string, relPath: string, content: string): Promise<void> {
  throw new Error("Lab 3.3 write 尚未实现");
}

/**
 * Lab 3.4 — 精确 edit。读出文件,把 oldStr 替换成 newStr,但:
 *   命中 0 次 → 抛错(没这段,改错文件了?);命中 >1 次 → 抛错(有歧义,会改错地方)。
 *   只有**恰好 1 次**才替换,并用原子写落盘。
 * (这是"模型看着旧内容提议改动"时防止改错/过期改动的关键防线。)
 */
export async function edit(root: string, relPath: string, oldStr: string, newStr: string): Promise<void> {
  throw new Error("Lab 3.4 edit 尚未实现");
}

/**
 * Lab 3.5 — glob(简化版):递归返回 root 下所有以 `suffix` 结尾的相对路径(如 ".ts")。
 * (真正的 glob 语法 `**​/*.{a,b}` 是迁移题;本章先掌握"递归遍历 + 过滤 + 返回相对路径"。)
 */
export async function glob(root: string, suffix: string): Promise<string[]> {
  throw new Error("Lab 3.5 glob 尚未实现");
}

/**
 * Lab 3.6 — grep:递归遍历 root 下的文本文件,逐行匹配正则,返回命中(相对路径 + 1 起的行号 + 该行)。
 */
export async function grep(root: string, pattern: string): Promise<GrepHit[]> {
  throw new Error("Lab 3.6 grep 尚未实现");
}

/**
 * Lab 3.7 — bash:跑一条命令,但要**可控**(工程必备,别让工具跑飞):
 *   · timeoutMs:超时要**杀掉进程**并标 timedOut。
 *   · maxOutputBytes:输出**截断**并标 truncated(别让海量输出撑爆上下文)。
 *   返回 { stdout, stderr, exitCode, truncated, timedOut }。
 * (bash 给模型极大的杠杆,但也最危险——超时/截断/在受控 cwd 里跑,是最起码的缰绳。)
 */
export function bash(
  command: string,
  opts?: { cwd?: string; timeoutMs?: number; maxOutputBytes?: number },
): Promise<BashResult> {
  throw new Error("Lab 3.7 bash 尚未实现");
}

// 说明:read/write/edit/glob/grep/bash 各是一个"真实工具"。把它们包成 Day 1 的 Tool
// (args → 字符串结果)放进 ToolRegistry,loop 就能驱动一个能真正读写代码、跑命令的 agent。
// 这层"包装成 ToolRegistry"见 README §五 与迁移题。
export { fs, path };
