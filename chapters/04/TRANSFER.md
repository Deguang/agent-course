# Chapter 04 · 迁移题(超出本章)

先预测,写进 [`JOURNAL.md`](../../JOURNAL.md);想做就自己加测试。

## 迁移 1 · 落到真实文件系统

把 `SessionLog` 的注入式 `write` 换成真的 `fs.appendFile`,`recover` 从真文件读。
- 预测:进程崩在写一半,磁盘上真会留半行吗?你的 recover 扛得住吗?(手动造一个末行不带 \n 的文件试试)

## 迁移 2 · 有状态 agent:reducer + 订阅者引用隔离

在 Day 1 的 loop 外包一层"有状态 Agent":用 `AgentEvent → AgentState` 归约状态,支持订阅。
- 预测:订阅者拿到 state 后**改了它一个字段**,内核会不会被腐蚀?怎么防(副本/冻结)?
- 后注册的订阅者,应该先看到上一轮的 end 还是下一轮的 start?(重入 FIFO)

## 迁移 3 · abort / steering

给有状态 Agent 加"取消"和"运行中插话"。
- 预测:abort 该排在事件队列前还是后?已经产生的工具事实,abort 后该保留还是丢弃?

## 迁移 4 · 重复 id 的歧义

如果两条 entry 用了相同 id,`pathTo` 会怎样?
- 预测:这会在全库制造什么歧义?该在 append 时就拒绝重复 id 吗?
