---
title: 案例：企业团险组合定价
---

<script setup>
import GroupInsuranceForm from '../.vitepress/components/GroupInsuranceForm.vue'
import GroupInsuranceLinkageGraph from '../.vitepress/components/GroupInsuranceLinkageGraph.vue'
</script>

# 案例：企业团险组合定价

企业团体保险是保险行业中规则最为密集的场景之一：**多险种交叉定价、费率系数四维联乘、捆绑折扣动态叠加、税务抵扣联动计算**。

这个案例包含 **9 大板块、43 条联动规则**，完整模拟真实团险报价流程：

| 板块 | 内容 | 主要联动 |
|---|---|---|
| **企业信息** | 员工人数、月均工资 | 人数+工资 → 税前扣除限额 |
| **费率系数** | 规模/行业/区域/赔付经验 | 四系数相乘 → 综合费率系数 |
| **医疗险** | 启用/计划/保额 | plan → 不同档位保额禁用；单项保费 |
| **寿险** | 启用/计划/保额 | 同上 |
| **意外险** | 启用/计划/保额 | 同上 |
| **重疾险** | 启用/计划/保额/提示 | 保额 ≥ 50万 触发承保提示 |
| **住院津贴险** | 启用/计划/天费 | 依赖医疗险是否启用；独立保费 |
| **门诊险** | 启用/计划/保额 | 依赖医疗险；独立保费 |
| **捆绑优惠与汇总** | 捆绑计划数/折扣/明细/合计/税务 | 动态折扣；税优上限提示 |

## 实时演示

<ClientOnly>
  <GroupInsuranceForm />
</ClientOnly>

## 依赖关系图

<ClientOnly>
  <GroupInsuranceLinkageGraph />
</ClientOnly>

## 核心规则说明

### 费率系数四维联乘（5 条）

```typescript
// 规模系数：员工越多，费率越低
'factors.scaleFactor.value': from('company.employeeCount',
  (n: number) => n < 50 ? 1.20 : n < 200 ? 1.10 : n < 500 ? 1.00 : n < 1000 ? 0.95 : 0.85
),

// 行业系数：高危行业费率更高
'factors.industryFactor.value': from('company.industry', (ind: string) => ({
  finance: 0.90, tech: 0.92, edu: 0.90, medical: 1.00,
  mfg: 1.15, construction: 1.30, logistics: 1.20, retail: 1.00,
}[ind] ?? 1.00)),

// 综合系数 = 规模 × 行业 × 区域 × 赔付经验（最终乘数）
'factors.combined.value': from(
  ['factors.scaleFactor', 'factors.industryFactor', 'factors.regionFactor', 'factors.claimFactor'],
  (a, b, c, d) => +((a * b * c * d).toFixed(4))
),
```

### 保费计算链（6 条）

每条险种保费均依赖：**启用状态 × 基础保额 × 综合费率 × 参保人数 × 综合系数**

```typescript
// 以医疗险为例
'summary.medPremium.value': from(
  ['medical.enabled', 'medical.baseAmount', 'company.employeeCount', 'factors.combined'],
  (enabled, amount, count, factor) =>
    enabled ? Math.round(amount * 5 / 1000 * count * factor) : 0
),
```

### 捆绑折扣动态计算（3 条）

```typescript
// 统计生效险种数（住院/门诊依赖医疗险启用）
'bundle.count.value': from(
  ['medical.enabled', 'life.enabled', 'accident.enabled', 'ci.enabled',
   'hospital.enabled', 'outpatient.enabled'],
  (med, life, acc, ci, hosp, out) =>
    [med, life, acc, ci, hosp && med, out && med].filter(Boolean).length
),

// 险种数 → 折扣
'bundle.discount.value': from('bundle.count',
  (n: number) => n >= 5 ? 0.20 : n === 4 ? 0.15 : n === 3 ? 0.10 : n === 2 ? 0.05 : 0
),
```

### 税务抵扣提示（2 条）

```typescript
// 税前扣除上限 = 员工数 × 月均工资 × 12 × 5%
'summary.taxDeductionLimit.value': from(
  ['company.employeeCount', 'company.avgMonthlyWage'],
  (count, wage) => Math.round(count * wage * 12 * 0.05)
),

// 超限时显示警告
'summary.taxNote.hidden': from(
  ['summary.totalPremium', 'summary.taxDeductionLimit'],
  (total, limit) => total <= limit
),
```

## 为什么需要 MeshForm

这个表单中存在典型的 **多源汇聚 + 条件激活** 模式：

```
employeeCount ─┐
industry      ──→ factors.* ─┐
region        ──→            ├──→ medPremium ──┐
claimRate     ──→            │   lifePremium   ├──→ totalPremium → taxNote
                ─┘           │   accPremium    │
medical.enabled ─────────────┤   ciPremium     │
life.enabled    ─────────────┤   hospPremium ──┘
...             ─────────────┘   outPremium
```

6 个险种的保费节点各自有 4–6 个上游，`totalPremium` 再汇聚全部险种，DAG 拓扑排序确保每次输入变化时整张计算图只完整走一遍，中间不出现脏值。
