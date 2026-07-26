# 动手学 Agent(provider 中立 · TS)

> AI 已经能替你把代码写完。真正稀缺的,是**判断它对不对**的能力——
> 而你只判断得了自己也能做出来的东西。
> **这门课练的就是这个:先预测、再亲手做,从而看得懂、也纠得动 AI 的产出。**

一门为**习得**设计的 provider 中立 agent 应用课程 —— 目标是"会 + 懂",不是"照着抄跑出结果"。
独立于任何 provider(Vercel AI SDK + MCP + 本地模型),动手全在终端。

**状态:** 🚧 building in public,一章一章造(当前 chapters 00–01)。

---

## 快速开始

**1. 拉取项目**

```bash
git clone <本仓库地址> agent-course
cd agent-course
```

**2. 准备环境**(二选一)

- **本地**:装 [Node 24+](https://nodejs.org/),然后 `npm install`。就绪。
  (本课用 Node 原生 type stripping 直接跑 `.ts`,无需编译步骤。)
- **不想装环境**:推到你自己的 GitHub 后,点 **Code → Codespaces → Create**,
  浏览器里直接得到一个预装好的终端(iPad / Chromebook 也能做,个人账号有免费额度)。

**3. 从第 0 章开始**

```bash
# 读定向(5 分钟,不写代码)
open chapters/00/README.md      # 或用你的编辑器打开

# 进第 1 章:先观察,再动手
npm run demo:01                 # 看一次完整 agent 运行长什么样
npm run test:01                 # 跑测试(第一次是红的 —— 那是你的起点)
```

然后打开 `chapters/01/README.md`,跟着 ①→⑤ 走。

---

## 怎么学:要不要 AI 陪学,都行

这门课**设计成没有 AI 也能独立学完**——README 讲概念、`demo` 给你观察、**失败的测试给你反馈**、`TRANSFER.md` 出迁移题。AI 陪学是**加速器,不是必需品**(一门教你别当 AI 吉祥物的课,不该逼你必须有 AI 陪着)。

| 方式 | 怎么做 | 体验 |
|---|---|---|
| **纯自学(无 AI)** | 靠 README + demo + 测试 + 迁移题,自己走通 | 完全可行,是底线保证 |
| **聊天 LLM 陪学** | 把 [`AGENT.md`](./AGENT.md) 和本章内容贴给任意 LLM(claude.ai / ChatGPT…),让它按协议当 tutor | 能问、能要提示;测试自己跑 |
| **coding agent 陪学** | 用 Claude Code 等 CLI 指向本仓库,它会自动读 `AGENT.md` 守协议、帮你跑测试读文件 | 最顺滑 |

关键:[`AGENT.md`](./AGENT.md) 就是**陪学协议**——任何 LLM 读了它都会变成守规矩的 tutor(**不替你写答案**、卡住时逐级给提示)。所以不绑任何一家工具,和"provider 中立"一脉相承。

---

## 学习契约(重要,先读)

跟着照做能跑出结果 ≠ 学会。本课强制主动生成:

1. **先预测**:每章开头先答"我预测会怎样",写进本章 `LOG.md`,再往下。
2. **空白构建**:我给你规格 + 一个**失败的测试**,你写实现。测试变绿 = 反馈。
   下手方法:**先读测试 → 从最简单的断言起步 → 一次让一个变绿,让红色牵着你走**(别想着一次写完)。
3. **卡住分级提示**:找 tutor 时按 `定位文件 → 指出签名 → 给伪代码 → 给局部代码` 逐级要,别直接要完整答案。
4. **讲回来**:每章末用自己的话讲清那条不变量(写进 `LOG.md`)。讲不清 = 没懂。
5. **迁移题**:做 `TRANSFER.md` 里"教程没演示过的变体"—— 这才是"懂"的检验。
6. **learn in public**:`LOG.md` 里的预测/踩坑/讲回来就是你的公开帖草稿(发过程,别只发成品)。

> 陪学 AI(tutor)的行为约束见 [`AGENT.md`](./AGENT.md)——它禁止 tutor 过度接管、替你把活干了。
> 目标是练出你自己的**判断力**,而不是又一个只会点"接受"的人。
>
> 内容准确性公约见 [`CONTENT.md`](./CONTENT.md)——通用概念对齐主流课程(Anthropic / HuggingFace 等),
> 具体 API 现查官方源 + 实跑验证,不凭记忆。
>
> 课程设计公约见 [`AUTHORING.md`](./AUTHORING.md)——章节无前置缺口、注释教而非复述、
> 预测题真需推理不可抄、每题测一维。写/改章节前必读,写完过自检清单。

## 命令一览

```bash
npm run demo:01     # 第 1 章观察 demo(先看懂,再动手)
npm run test:01     # 第 1 章测试(= 本章规格,变绿即过)
npm test            # 跑全部章节测试
npm run check       # 类型检查 + lint(脚手架健康检查)
```

> 第 1 章**零依赖、不要 API key**(测试用确定性脚本模型)。真调模型的章节才引入 SDK / 本地模型 / BYOK。

## 章节

- `chapters/00` — 什么是 agent(定向,不写代码,~5 分钟)👈 从这里开始
- `chapters/01` — agent 的心脏:model → tool → result → model 的 loop

进度见 `PROGRESS.md`。内容以各章 `README.md` 为准(`index.html` 只是站点雏形预览)。
