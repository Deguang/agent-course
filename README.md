# 动手学 Agent(provider 中立 · TS)

> AI 已经能替你把代码写完。真正稀缺的,是**判断它对不对**的能力——
> 而你只判断得了自己也能做出来的东西。
> **这门课练的就是这个:先预测、再亲手做,从而看得懂、也纠得动 AI 的产出。**

一门为**习得**设计的 provider 中立 agent 应用课程 —— 目标是"会 + 懂",不是"照着抄跑出结果"。
独立于任何 provider(Vercel AI SDK + MCP + 本地模型),动手全在终端。

**状态:** 🚧 building in public,一章一章造(当前 1/15)。

## 学习契约(重要,先读)

跟着照做能跑出结果 ≠ 学会。本课强制主动生成:

1. **先预测**:每章开头先答"我预测会怎样",写进本章 `LOG.md`,再往下。
2. **空白构建**:我给你规格 + 一个**失败的测试**,你写实现。测试变绿 = 反馈。
3. **卡住分级提示**:找 tutor 时按 `定位文件 → 指出签名 → 给伪代码 → 给局部代码` 逐级要,别直接要完整答案。
4. **讲回来**:每章末用自己的话讲清那条不变量(写进 `LOG.md`)。讲不清 = 没懂。
5. **迁移题**:做 `TRANSFER.md` 里"教程没演示过的变体"—— 这才是"懂"的检验。
6. **learn in public**:`LOG.md` 里的预测/踩坑/讲回来就是你的公开帖草稿(发过程,别只发成品)。

> 陪学 AI(tutor)的行为约束见 [`AGENT.md`](./AGENT.md)——它禁止 tutor 过度接管、替你把活干了。
> 目标是练出你自己的**判断力**,而不是又一个只会点"接受"的人。
>
> 内容准确性公约见 [`CONTENT.md`](./CONTENT.md)——通用概念对齐主流课程(Anthropic / HuggingFace 等),
> 具体 API 现查官方源 + 实跑验证,不凭记忆。

## 环境

- Node 24+(用原生 type stripping 直接跑 `.ts`,无需构建)。
- 第 1 章**零依赖、不要 API key**(测试用确定性脚本模型)。真调模型的章节才引入 SDK / 本地模型 / BYOK。

### 不用本地电脑也能做(GitHub Codespaces)

本仓库带 `.devcontainer`。推到 GitHub 后点 **Code → Codespaces → Create**,即可在浏览器里获得一个预装 Node 24 的终端,**零本地安装**(iPad / Chromebook 也能做)。个人账号每月有免费额度。

## 跑测试

```bash
npm run test:01     # 第 1 章
npm test            # 全部
```

## 章节

- `chapters/00` — 什么是 agent(定向,不写代码,~5 分钟)👈 从这里开始
- `chapters/01` — agent 的心脏:model → tool → result → model 的 loop

进度见 `PROGRESS.md`。内容以各章 `README.md` 为准(`index.html` 只是站点雏形预览)。
