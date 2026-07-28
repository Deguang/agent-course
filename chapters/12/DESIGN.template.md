# Capstone 设计文档(模板)

> 复制成 `DESIGN.local.md` 再填(`*.local.md` git 忽略)。动手写代码前先填完这份——这一步就是"独立设计"能力本身。一页足矣，写清楚比写多重要。

## 1. 要解决什么(One-liner)
- 用户是谁、痛点是什么、这个 agent 帮他做成什么:

## 2. 成功长什么样(可检验的标准)
- 不要写"效果好";写**能验证**的:比如"给定 X 输入，产出的 CSV 有 price 列且每个 SKU 一行"。
-

## 3. 用哪一格?为什么(raw / harness / loop / graph)
- 我选:____
- 为什么这一格够、且更重的那格不必要:

## 4. 需要哪些能力
- 工具(Day 3):read / write / edit / glob / grep / bash / …
- MCP / skills(Day 6):
- 模型 & provider(Day 2):本地 Ollama / BYOK / 云端 ____
- 要结构化返回吗(Day 2):
- 要持久化 / 可恢复吗(Day 4):
- 要上下文管理吗(Day 5，任务会不会很长):
- 要私有知识 / RAG 检索吗(Day 8):
- 要 guardrails / 人工审批 / 花费上限吗(Day 9):
- 要编排 / 多 agent 吗(Day 7):

## 5. 最小闭环(先做这个)
- 我第一步只做到"能跑通"的最小版本是:

## 5b. 生产考量(Day 11)
- 部署形态:Serverless/Edge / 长运行容器?为什么:
- 有状态吗?state 怎么外置(session/DB):
- 要服务边界(SSE 流式)吗?要 suspend/resume(HITL)吗:
- 要语义缓存降本降延迟吗:
- CI 门禁:回归套件怎么接、卡什么线:

## 6. 边界与风险(诚实)
- 安全边界(workspace 是 guardrail 不是 sandbox;哪些操作要确认):
- 会在哪失败、怎么处理(工具异常、模型跑飞、上下文溢出):
- 我**没做**、留给以后的:
