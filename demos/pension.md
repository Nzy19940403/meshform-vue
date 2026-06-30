---
title: 案例：养老年金规划
---

<script setup>
import PensionForm from '../.vitepress/components/PensionForm.vue'
import PensionLinkageGraph from '../.vitepress/components/PensionLinkageGraph.vue'
</script>

# 案例：养老年金规划

养老金规划是典型的**双向计算**场景：既可以设定缴费方案、预估退休后能领多少；也可以设定目标替代率、反推每月还差多少缺口。两个方向共享同一套计算参数，任意输入变化都会同步传播到正向和反向两条计算链。

这个案例包含 **6 大板块、30 条联动规则**，以及 3 个条件显隐的规划提示：

| 板块 | 内容 | 主要联动 |
|---|---|---|
| **个人信息** | 当前年龄/退休年龄/收入/增长率 | 年龄差 → 积累年限（自动） |
| **投资策略** | 投资风格/预期收益/通胀假设 | 风格选择 → 年化收益率（自动） |
| **缴费方案** | 个人月缴/企业配比 | 联动计算月缴合计/年缴合计/税优上限 |
| **正向推算** | 按当前方案预估退休金 | FV 公式推积累金额 → PMT 公式算月退休金 → 替代率评级 |
| **反向推算** | 设定目标看缺口 | 目标替代率 → 目标月退休金 → PV 反推所需积累 → 每月缺口 |
| **规划提示** | 条件警告 | 替代率不足 / 超税优上限 / 积累年限过短 |

## 实时演示

<ClientOnly>
  <PensionForm />
</ClientOnly>

## 依赖关系图

<ClientOnly>
  <PensionLinkageGraph />
</ClientOnly>

## 核心公式与规则

### 正向推算（8 条规则）

**积累期终值 FV**：按月缴入、复利积累至退休时的总资产

$$FV = PMT \times \frac{(1+r)^n - 1}{r}$$

其中 $r$ 为月化收益率（年化 ÷ 12），$n$ 为总月数（积累年限 × 12）。

```typescript
'forward.accumulatedFv.value': from(
  ['contribution.totalMonthly', 'strategy.annualReturn', 'personal.accumYears'],
  (pmt, annualReturn, years) => {
    const r = annualReturn / 100 / 12
    return Math.round(fv(r, years * 12, pmt))
  }
),
```

**月退休金 PMT**：将积累金额按领取期摊平

$$PMT = PV \times \frac{r}{1 - (1+r)^{-n}}$$

```typescript
'forward.monthlyPension.value': from(
  ['forward.accumulatedFv', 'strategy.annualReturn', 'personal.withdrawYears'],
  (accumFv, annualReturn, withdrawYears) => {
    const r = (annualReturn * 0.5) / 100 / 12  // 领取期收益率更保守
    return Math.round(annuityPmt(r, withdrawYears * 12, accumFv))
  }
),
```

### 反向推算（6 条规则）

**反推所需积累金额**：年金现值公式

$$PV = PMT \times \frac{1 - (1+r)^{-n}}{r}$$

```typescript
'reverse.requiredAccumulation.value': from(
  ['reverse.targetMonthlyPension', 'strategy.annualReturn', 'personal.withdrawYears'],
  (targetPension, annualReturn, withdrawYears) => {
    const r = (annualReturn * 0.5) / 100 / 12
    return Math.round(annuityPv(r, withdrawYears * 12, targetPension))
  }
),
```

**反推月缴金额**：再用 FV 逆向推导

$$PMT_{required} = FV_{required} \times \frac{r}{(1+r)^n - 1}$$

### 警告显隐（3 条）

```typescript
// 实际替代率 < 目标替代率 → 显示"替代率不足"警告
'warnings.shortfall.hidden': from(
  ['forward.replacementRate', 'reverse.targetRate'],
  (actual, target) => actual >= target
),

// 个人年缴 > 税优上限 → 显示"超税优上限"警告
'warnings.taxOver.hidden': from(
  ['contribution.personalMonthly', 'contribution.taxBenefitLimit'],
  (monthly, limit) => monthly * 12 <= limit
),

// 积累年限 < 10 年 → 显示"积累年限过短"警告
'warnings.tooShort.hidden': from(
  'personal.accumYears',
  (years) => years >= 10
),
```

## 双向计算的依赖结构

```
personal.* ────────────────────────────────────────────────────┐
                                                                ↓
strategy.annualReturn ←── strategy.style              forward.retirementWage
strategy.inflationRate                                         │
        │                                                      ↓
        │                                   ┌── forward.accumulatedFv
        │                                   │          │
contribution.totalMonthly ─────────────────►│          ↓
(= personal + company match)               │   forward.monthlyPension
                                            │          │
                                            │          ↓
                                            │   forward.replacementRate
                                            │          │
                                            │          ▼
                                            │   forward.replacementStatus
                                            │
                                            └────────────────────────────────┐
reverse.targetRate ──→ reverse.targetMonthlyPension                          │
                             │                                                │
                             ↓                                                │
                  reverse.requiredAccumulation ←── (strategy.annualReturn) ──┘
                             │
                             ↓
                  reverse.requiredMonthly
                             │
                             ↓
                  reverse.personalGap ←── contribution.*
                             │
                             ↓
                  reverse.gapNote
```

正向链（蓝色）和反向链（橙色）共享 `strategy.*`、`personal.*`、`contribution.*` 三类上游节点。任意输入变化，MeshForm 引擎通过拓扑排序确保正向链和反向链各只完整计算一次，不产生中间脏值。
