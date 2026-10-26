---
title: CPU飘高排查-深浅拷贝篇
published: 2026-10-26
description: '从"某个版本之后 CPU 变高"开始, 用 /proc 切片、gdb 抓栈, 最后只改 4 行 const&'
tags: ["性能排查", "perf", "gdb"]
category: '工业开发'
draft: true
---

一台工业设备上的控制器进程, 静止状态下 CPU 就有 64.5%, 单核的六成多. 同型号但没挂外设的那台, 同样程序同样配置, 只有 6%~10%.

手上只有一句话: 某个版本之后变高的. 没有源码权限, 没有火焰图, 出问题的那个线程连名字都没有.

# 1. 当时手上有什么

只有一个 pid.

`top` 一看就知道进程整体高, 但那是总和. 要往下走, 得先回答三件事, 顺序还不能反:

1. 是一个线程在算, 还是一堆线程各算一点
2. 是在算, 还是在等(等锁、等 IO、等调度)
3. 如果是在算, 算在哪个函数里

前两个问题不用装任何东西, `/proc` 就够了. 第三个才需要采样.

整条路大概是这样, 后面一节一节走:

![定位路径](/images/cpu-locate-flow.svg)

# 2. 不用装工具, 先把系统的切片读出来

按线程排名这件事, `top -H` 的瞬时值不太可信, 它看运气. 稳妥的做法是读 `/proc/<pid>/task/*/stat` 里的 `utime+stime`, 隔几秒采两次做差.

```bash
snap() { for t in /proc/$1/task/*; do
  read -r _ _ _ _ _ _ _ _ _ _ _ _ _ u s _ < $t/stat 2>/dev/null || continue
  echo "${t##*/} $((u+s))"
done; }
snap $PID > /tmp/a; sleep 5; snap $PID > /tmp/b
join /tmp/a /tmp/b | awk '{d=$3-$2; if(d>0) printf "%8d %6.1f%%\n", $1, d*100/500}' | sort -k2 -rn | head
```

结果很干脆: 整个 64.5% 全压在一个线程上, 其余线程(包括周期性任务 `cyclicTask`)都在 0~2%. 而且这个线程的 `comm` 字段就是主进程名 —— 说明建它的时候没调 `pthread_setname_np`, 它在系统里是匿名的.

![线程 CPU 占比](/images/cpu-thread-share.svg)

接下来判断"在算"还是"在等". 四个数放在一起看就够了:

- `%sys` 只有 3% —— 不是系统调用、驱动或 IO 路径
- `wchan` 是 0, 状态一直是 `R` —— 没卡在 read/write/futex
- schedstat 五秒增量: runtime 2.711 秒, wait 6.46 毫秒 —— 等待只占 0.13%
- `VmRSS` 平稳 —— 没有反复缺页

第三条最有说服力. 它不是在排队等 CPU, 是自己在算.

顺手排掉两个很诱人的方向: 所有 `NetSocket_*`、`FileSocket_*` 线程都是 0%, 如果热点是个 `recvfrom` 死循环, `%sys` 不可能是 3%, 所以不是网络轮询; 写日志走 `%sys` 或 `%iowait`, 两个都不高, 所以也不是日志写盘卡住.

到这里, 问题已经从"进程 CPU 高"缩成"一个匿名线程在用户态持续计算".

> [!NOTE]
> 这一步一分钱没花, 但把后面一大半猜测都排掉了. 没有工具的时候, 先读系统.

# 3. 为什么要 perf, 没有 perf 怎么办

`/proc` 能定量, 不能归因. 想知道算在哪个函数里, 只有插桩和采样两条路. 插桩要改代码(闭源构建, 没戏), 那就只能采样.

`perf record -g -p <tid>` 是标准答案, 一条命令的事. 但现场经常没有它: 实时内核和发行版自带的 perf 版本对不上、机器不联网装不了、或者 `record` 时直接报一堆 PMU 和符号缺失.

我退到最土的办法: gdb 循环抓栈. 原理和 perf 一样, 只是把采样器换成了人 —— 每抓一次栈, 就是一个样本.

```bash
for i in $(seq 200); do
  gdb -p $PID -batch \
      -ex 'set pagination off' \
      -ex 'thread apply all bt 12' \
      2>/dev/null
  sleep 0.15
done > /tmp/samples.txt
```

然后纯按出现频率聚合, 不看单条:

```bash
grep -oE 'in [A-Za-z_][A-Za-z0-9_:<>~]* \(' /tmp/samples.txt \
  | sort | uniq -c | sort -rn | head -20
```

这个办法有四个坑, 前三个我都踩到了.

一是 gdb 自己会污染样本. attach 时进程被停下, 栈顶常常是 `pthread_kill`、`ptrace_stop` 这类帧 —— 它们是采样器造成的, 统计时必须剔掉, 不然会得出"热点在信号处理"这种很滑稽的结论.

二是每次 attach 会把整个进程停住. 对 1 kHz 的实时线程来说, 停几百毫秒足以触发看门狗, 所以只在设备静止、确认能短暂停顿时采.

三是采样率很低. 一次 `thread apply all bt` 在几十个线程上要几百毫秒, 实际只有 1~5 Hz. 这次真正能用的样本只有十几个, 好在形态高度一致, 足够定性 —— 但样本量这个数不能拿去算百分比.

四是必须有符号. 这次运气好, 二进制虽然闭源构建但没 strip, `nm`、`objdump` 能看到完整符号表, 后面才能反查源码.

# 4. 堆栈把话说明白了

十几个可用样本里, 4 个落在 JSON 解析, 其余全是同一条链, 几乎逐帧相同:

```text
#0  std::__cxx11::basic_string::basic_string(basic_string const&)
#1  IoPoint::IoPoint(IoPoint const&)                  ← io_bind.h:44
#2  std::_Construct<IoPoint, IoPoint const&>
#3  std::__uninit_copy<... std::vector<IoPoint> ...>
#4  std::vector<IoPoint>::vector(this=..., __x=...)   ← 整向量拷贝
#5  io_bind::refresh_io()                            ← io_bind.cpp:1486
#6  ...
```

看到 `std::vector<IoPoint>::vector(__x=...)` 这一帧, 基本就定了: 有人在按值返回一个 vector, 而它被放在一个按 bit 跑的循环里.

对着符号反查源码, 根因干净得有点无趣:

```cpp
// io_bind.h
std::vector<IoPoint> get_input_points();      // ← 按值返回
std::vector<IoPoint> get_out_points();

struct IoPoint {
    std::string device, module, note;         // ← 每个元素三个 string
    // ...
};
```

而这个 getter 在内层循环里被调了四次, 每个 bit 一次:

```cpp
// io_bind.cpp, refresh_io() 内的两个 bit 循环
read_bit(get_input_points()[j + k]);        // 每个 bit 把整个 vector 拷一遍
write_bit(get_out_points()[k + n], value);  // 栈里抓到的就是这一行
```

量级一算就明白了. 向量 152 个元素(栈里 `deallocate(__n=152)` 直接给了答案), 每个元素三个 string —— 每次调用就是 152 次元素拷贝加 456 次 string 拷贝, 再乘设备数、每设备 bit 数和 25 轮/秒, 每秒百万级的字符串构造.

每轮刷新实测 22 ms, 去处就在这里. 不是复杂度问题, `vector` 下标是 O(1), 问题在于每次取一个元素, 都先复制整个容器.

# 5. 为什么这算用户态, 不算内核态

这一节我一开始没想清楚.

直觉是"分配内存要进内核", 那 `malloc` 走 `brk`/`mmap`, 不就该算 `%sys` 吗.

错在把"分配"当成了"系统调用". glibc 的分配路径分三层, 绝大多数请求在用户态就结束了: 每个线程一个 tcache, 无锁, 最近释放的同类大小块直接复用, 命中即返回; 命中不了才去 fastbin/smallbin 这些 bin 里找, 仍在用户态; 只有这些都空了才 `brk` 或 `mmap` —— 这一步才进内核, 而且一次拿一大块(默认 mmap 阈值 128 KB), 之后反复从这块里切.

再叠一个因素: `std::string` 有 SSO, 15 字节以内的内容根本不分配堆内存, 直接存在对象里. 所以一次短字符串拷贝的成本, 是栈上 memcpy 加几个指针字段赋值, 连 `malloc` 都没有.

那些百万级的拷贝摊开来看就是这样: memcpy 是用户态指令, 拷贝长度容量指针是用户态指令, tcache 命中的 malloc/free 也是用户态指令; 只有 arena 扩展那一次 `brk`/`mmap`, 和首次触碰新页的缺页, 才进内核. 而这两件事在这条路径上极少发生.

三条实测旁证也对得上: `%sys` 只有 3%, 且与静止/操作无关, 属于基线; `wchan` 是 0、状态 `R`, 采样瞬间它不在任何系统调用里; `VmRSS` 平稳, 分配即释放, tcache 反复复用同一批块, 堆根本没长.

反过来也能说清楚什么情况才会真的吃内核态: 大块 `mmap`/`munmap` 反复触发、堆持续增长带来的频繁 `brk` 和缺页、或者跨线程分配把自己送进 futex. 这三样在这条路径上都不存在 —— 它是单线程里"分配→拷贝→立刻释放"的原地循环.

这一步的意义不只是解释 `%sys` 为什么低, 而是把整条内核侧的怀疑链关掉了: 驱动、EtherCAT 协议栈、调度器、磁盘, 都可以先放下.

# 6. 为什么没选那几个看起来更高级的方案

定位到这一步, 能想到的方案有一大把. 下面这些我都认真过了一遍, 最后都没用. 理由不是不好, 是不对症.

换 `std::unordered_map`: 树只有 2~5 个节点, `log n` 也就 1~2, 复杂度根本不是瓶颈, 真正的代价是同一条路径被重复下降几百次. 换掉还会带来 rehash 后引用失效、迭代顺序变化、跨模块 ABI 冲突.

上内存池: 池只能省下 `malloc` 那一小段, 拷贝构造、字符串复制、vector 分配一分不少. 而我们抓到的栈正好全在拷贝构造上 —— 池正好绕开了病灶.

布隆过滤器: 它只能回答"一定不存在 / 可能存在", 取不到值, 而我要的是值.

缓存 `Json::Value&` 或节点指针: 只在当前这一轮有效, 跨解析就全废了(`clear()` 或重新 parse 会让引用作废). 收益有, 但很小, 还要额外引一条失效路径, 不划算.

把 16 ms 的周期拉长到 100 ms: 立刻能降, 但这是把问题藏起来, 不是解决.

重写这段 IO 映射逻辑: 调用点遍布工艺包和设备绑定, 改动面比问题本身大得多.

判断依据其实只有一条: 先削掉"重复做的同一件事", 最后才考虑换数据结构.

这里的"同一件事"是 —— 每秒几十万次地把同一个容器完整复制一遍又丢掉. 容器没问题, 数据结构没问题, `vector` 也没问题, 有问题的是"不需要拷贝的地方发生了拷贝".

# 7. 改动只有 4 行

```diff
 // io_bind.h
-    std::vector<IoPoint> get_input_points();
-    std::vector<IoPoint> get_out_points();
+    const std::vector<IoPoint>& get_input_points();
+    const std::vector<IoPoint>& get_out_points();

 // io_bind.cpp
- std::vector<IoPoint> io_bind::get_input_points() { return input_points; }
+ const std::vector<IoPoint>& io_bind::get_input_points() { return input_points; }

- std::vector<IoPoint> io_bind::get_out_points() { return out_points; }
+ const std::vector<IoPoint>& io_bind::get_out_points() { return out_points; }
```

调用点一个字都不用改. 因为 `read_bit`/`write_bit` 的形参本来就是 `const IoPoint&`, 按值返回的临时 vector 会活到整个表达式结束 —— 原来能编译, 现在照样能编译, 只是从"复制 152 个对象"变成"传一个引用".

改之前确认了两条会出事的路径, 两条都不成立. 一是返回的引用会不会悬垂: 所有调用点都在同一个函数体内、同一轮刷新里使用, 不会跨到下一次 `refresh_io()`; 容器只在解析阶段被整体赋值, 而那发生在刷新的上游. 二是有没有人依赖"拿到的是副本": 全仓只有四处调用, 全部只读, 没有一处修改返回值.

# 8. 结果

同一台机器, 同一工况, 改前改后各采一次:

| | 改前 | 改后 |
|---|---|---|
| 进程 CPU(静止态) | 64.5% | 39.5%~42% |
| `%sys` | 3% | 3%(本来就不在内核) |

为什么不是降到接近 0: 这条路径只是其中一项开销. 剩下那四成来自另一件独立的事(每轮把整份 IO 描述重新解析一遍), 它有自己的定位链, 写在[下一篇](/posts/io-parse-cache/)里. 一次优化只应该声称它解决的那部分, 把剩余占用归因成"没优化干净"是很容易犯的误判.

# 最后

这类问题的答案往往不在高深的地方. `std::map` 不快、内存池、布隆过滤器, 这些词都很像答案, 但真正的问题经常只是一次不该发生的拷贝, 被放在了每秒几万次的循环里.

顺一句可以照做的顺序: 先按线程做差, 再看 `wchan` 和 schedstat 判断"算还是等", 最后才上采样. 这三步不用装任何东西, 却能把大半猜测先排掉.
