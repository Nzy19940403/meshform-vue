---
title: 案例：双向纠缠 × DAG 混合联动
---

<script setup>
import EntangleDemo from '../.vitepress/components/EntangleDemo.vue'
import PortfolioDemo from '../.vitepress/components/PortfolioDemo.vue'
import PortfolioGraph from '../.vitepress/components/PortfolioGraph.vue'
</script>

# 双向纠缠 × DAG 混合联动

meshform-vue 支持两种联动模式，可以在同一表单里混用：

| 模式 | API | 适用场景 |
|---|---|---|
| 单向推导 | `engine.define / from()` | 绝大多数"上游变，下游跟"的联动 |
| 双向纠缠 | `engine.entangle` | 有环依赖、双向约束，纯 DAG 无法表达 |

## 基础示例：三向货币纠缠

最直观的案例——货币换算。修改任意一个金额，另外两个立刻收敛。
三个字段之间没有固定的"上游"和"下游"，因果关系是对称的，这是 DAG 无法表达的结构。

<ClientOnly>
  <EntangleDemo />
</ClientOnly>

## 进阶示例：DAG + Entangle 混合表单

真实业务中，两种联动经常**同时出现在一张表单里**。

以资产配置表单为例：

- **比例约束**：股票% + 债券% + 现金% = 100%，调整任意一个，另外两个自动重新分配 → `useEntangle`
- **金额推导**：资产金额 = 总资金 × 比例 → `from/define`（DAG，单向）
- **收益推导**：预期收益 = 金额 × 年化利率 → `from/define`（DAG，单向）
- **汇总推导**：总收益 = 股票收益 + 债券收益 + 现金收益 → `from/define`（DAG，单向）

<ClientOnly>
  <PortfolioDemo />
</ClientOnly>

### 联动关系图

图中紫色双向边为 `useEntangle` 注册（有环），蓝色单向边为 `from/define` 注册（DAG）：

<ClientOnly>
  <PortfolioGraph />
</ClientOnly>

### 对应代码

```typescript
// ── useEntangle：三比例相互约束（有环图）────────────────────────────
// 当 stock% 变化时，按 bond:cash 原比例重新分配剩余份额
engine.entangle({
  cause: 'stock.pct', impact: 'bond.pct', via: ['value'],
  emit: (stock, bond, { get }) => {
    const cashPct = get('cash.pct.value')
    const remaining = 100 - stock.value
    const sum = bond.value + cashPct
    if (sum === 0) return
    const target = Math.round(remaining * bond.value / sum)
    const diff = target - bond.value
    if (Math.abs(diff) < 0.5) return  // 已收敛
    return { key: 'value', delta: diff }
  },
})
// bond ↔ stock、cash ↔ stock、bond ↔ cash 同理，共 6 个 entangle 注册

// ── from/define：金额和收益单向推导（DAG）──────────────────────────
engine.define({
  'stockAmt.value': from(['total.value', 'stock.pct.value'],
    (total, pct) => Math.round(total * pct / 100)),

  'bondAmt.value': from(['total.value', 'bond.pct.value'],
    (total, pct) => Math.round(total * pct / 100)),

  'cashAmt.value': from(['total.value', 'cash.pct.value'],
    (total, pct) => Math.round(total * pct / 100)),

  'stockRet.value': from('stockAmt.value', amt => Math.round(amt * 0.12)),
  'bondRet.value':  from('bondAmt.value',  amt => Math.round(amt * 0.04)),
  'cashRet.value':  from('cashAmt.value',  amt => Math.round(amt * 0.02)),

  'totalRet.value': from(
    ['stockRet.value', 'bondRet.value', 'cashRet.value'],
    (s, b, c) => s + b + c
  ),
})
```

## 为什么需要两种模式共存

有环图（`useEntangle`）的目的不是"替代" DAG，而是补充它：

- 同一个表单里，90% 的联动是单向推导（DAG 足够）
- 只有少数字段之间存在真正的双向约束（才需要 entangle）
- meshflow 引擎保证两种注册可以在同一图上安全共存，互不干扰

| | DAG（from/define） | Entangle（useEntangle） |
|---|---|---|
| 因果方向 | 固定（A → B） | 对称（A ↔ B） |
| 是否允许成环 | ❌ | ✅ 差量收敛 |
| 典型场景 | 联动显示/隐藏、价格计算、选项过滤 | 货币换算、比例约束、互锁字段 |
| 注册方式 | `engine.define({ ... })` | `engine.entangle({ cause, impact, emit })` |
| 同一表单混用 | ✅ | ✅ |
