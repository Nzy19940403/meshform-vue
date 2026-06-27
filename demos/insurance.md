---
title: 案例：人寿保险投保申请
---

<script setup>
import InsuranceForm from '../.vitepress/components/InsuranceForm.vue'
import InsuranceLinkageGraph from '../.vitepress/components/InsuranceLinkageGraph.vue'
</script>

# 案例：人寿保险投保申请

金融保险行业是表单联动复杂度最高的场景之一：**费率随多个字段联动、风险等级动态计算、附加费多源叠加、字段显隐取决于多重条件**。

这个案例包含 **6 大板块、40+ 个字段、20+ 条联动规则**：

| 板块 | 内容 | 主要联动 |
|---|---|---|
| **被保险人** | 姓名/性别/出生年份/职业 | 出生年份 → 年龄；职业 → 风险等级 |
| **健康告知** | 身高/体重/吸烟/慢性病/手术史 | 身高+体重 → BMI → BMI状态 |
| **险种方案** | 险种/期限/缴费方式/保额/附加险 | 险种 → 期限选项 + 缴费期选项；保额 → 是否需要体检 |
| **受益人** | 受益人类型 | 类型 → 三个字段显隐联动 |
| **核保提示** | 条件警告 | 5 个独立警告，各由不同条件触发 |
| **保费估算** | 完整保费分解 | 7 个输入 → 基础费率 → 各项附加 → 年保费 → 每期金额 |

## 实时演示

<ClientOnly>
  <InsuranceForm />
</ClientOnly>

## 依赖关系图

<ClientOnly>
  <InsuranceLinkageGraph />
</ClientOnly>

## 联动规则清单

用 `engine.define` 实现时，核心规则如下：

```typescript
engine.define({
  // ── 被保险人 ──────────────────────────────────────────────────────────
  // 出生年份 → 年龄
  'insured.age.value': from('insured.birthYear',
    (y: number) => new Date().getFullYear() - y
  ),

  // 证件类型 → 证件号码占位文字
  'insured.idNumber.placeholder': from('insured.idType', (t: string) => ({
    id: '请输入 18 位身份证号码',
    passport: '请输入护照号码',
    military: '请输入军官证号码',
    hk: '请输入港澳通行证号码',
  }[t] ?? '')),

  // 职业类别 → 职业风险等级
  'insured.occupationRisk.value': from('insured.occupation',
    (occ: string) => OCCUPATION_MAP[occ]?.risk ?? 'normal'
  ),

  // ── 健康告知 ──────────────────────────────────────────────────────────
  // 身高+体重 → BMI
  'health.bmi.value': from(
    ['health.height', 'health.weight'],
    (h: number, w: number) => h > 0 ? +(w / (h / 100) ** 2).toFixed(1) : 0
  ),

  // BMI → 状态文字
  'health.bmiStatus.value': from('health.bmi', (bmi: number) => {
    if (bmi < 18.5) return '偏瘦'
    if (bmi < 24)   return '正常'
    if (bmi < 28)   return '超重'
    return bmi < 32 ? '肥胖 I 级' : '肥胖 II 级'
  }),

  // ── 险种 → 期限/缴费期选项联动 ────────────────────────────────────────
  'product.term.options': from('product.productType',
    (type: string) => TERM_OPTIONS[type] ?? [],
    {
      effect: ({ options, value }: any) => ({
        value: options.some((o: any) => o.value === value)
          ? undefined
          : options[0]?.value
      }),
      effectArgs: ['options', 'value'],
    }
  ),

  'product.paymentPeriod.options': from('product.productType',
    (type: string) => PAYMENT_PERIOD_OPTIONS[type] ?? [],
    { effect: ({ options }: any) => ({ value: options[0]?.value }), effectArgs: ['options'] }
  ),

  // 保额 → 是否需要体检
  'product.needMedical.value': from('product.coverageAmount',
    (amount: number) => amount >= 500
  ),

  // 保额 → 最高可选保额（受险种限制）
  'product.maxCoverage.value': from('product.productType',
    (type: string) => MAX_COVERAGE[type] ?? 2000
  ),

  // ── 受益人 ──────────────────────────────────────────────────────────
  // 受益人类型 → 3 个字段显隐
  'beneficiary.name.hidden':         from('beneficiary.type', (t: string) => t !== 'designated'),
  'beneficiary.relationship.hidden': from('beneficiary.type', (t: string) => t !== 'designated'),
  'beneficiary.proportion.hidden':   from('beneficiary.type', (t: string) => t !== 'designated'),

  // ── 核保提示（5 条独立警告）─────────────────────────────────────────
  'warnings.highRisk.hidden':   from('insured.occupationRisk', (r: string) => r !== 'high'),
  'warnings.bmi.hidden':        from('health.bmi',             (b: number) => b < 28),
  'warnings.disease.hidden':    from('health.chronicDisease',  (v: boolean) => !v),
  'warnings.age.hidden':        from('insured.age',            (a: number) => a <= 60),
  'warnings.surgery.hidden':    from('health.surgery',         (v: boolean) => !v),

  // ── 保费计算（7 个输入 → 层层推导）────────────────────────────────────
  // 基础费率（依赖：险种 + 年龄段 + 性别）
  'premium.baseRate.value': from(
    ['product.productType', 'insured.age', 'insured.gender'],
    (type: string, age: number, gender: string) => {
      const raw = RATE_TABLE[type]?.[ageBracket(age)] ?? 5
      return +(raw * (gender === 'F' ? 0.85 : 1.0)).toFixed(2)
    }
  ),

  // 基础年保费 = 保额(万) × 费率(‰) × 10
  'premium.basePremium.value': from(
    ['premium.baseRate', 'product.coverageAmount'],
    (rate: number, amount: number) => Math.round(amount * rate * 10)
  ),

  // 各项附加费
  'premium.smokerSurcharge.value':     from(['premium.basePremium', 'health.smoke'],
    (base: number, smoke: boolean) => smoke ? Math.round(base * 0.30) : 0),

  'premium.occupationSurcharge.value': from(['premium.basePremium', 'insured.occupationRisk'],
    (base: number, risk: string) => Math.round(base * (OCCUPATION_SURCHARGE[risk] ?? 0))),

  'premium.bmiSurcharge.value':        from(['premium.basePremium', 'health.bmi'],
    (base: number, bmi: number) => {
      if (bmi >= 32) return Math.round(base * 0.20)
      if (bmi >= 28) return Math.round(base * 0.10)
      return 0
    }),

  'premium.diseaseSurcharge.value':    from(['premium.basePremium', 'health.chronicDisease'],
    (base: number, chronic: boolean) => chronic ? Math.round(base * 0.25) : 0),

  // 调整后年保费（汇聚 6 个来源）
  'premium.adjustedAnnual.value': from(
    ['premium.basePremium', 'premium.smokerSurcharge', 'premium.occupationSurcharge',
     'premium.bmiSurcharge', 'premium.diseaseSurcharge',
     'product.addAccidentPremium', 'product.addDisabilityPremium'],
    (...args: number[]) => args.reduce((a, b) => a + b, 0)
  ),

  // 缴费频率系数
  'premium.freqFactor.value': from('product.paymentFreq',
    (f: string) => FREQ_CONFIG[f]?.factor ?? 1
  ),

  // 最终年保费
  'premium.annualPremium.value': from(
    ['premium.adjustedAnnual', 'premium.freqFactor'],
    (adj: number, factor: number) => Math.round(adj * factor)
  ),

  // 每次缴费
  'premium.perPayment.value': from(
    ['premium.annualPremium', 'product.paymentFreq'],
    (annual: number, freq: string) => Math.round(annual / (FREQ_CONFIG[freq]?.times ?? 1))
  ),
})
```

## 为什么用 meshflow 合适

这个表单有一条从 `insured.birthYear` 到 `premium.perPayment` 的 **8 层计算链**：

```
birthYear → age → baseRate → basePremium → smokerSurcharge
                                          → occupationSurcharge → adjustedAnnual → annualPremium → perPayment
                                          → bmiSurcharge ↗
                                          → diseaseSurcharge ↗
```

其中 `adjustedAnnual` 同时依赖 6 个上游字段，`annualPremium` 还要乘以频率系数。

用 `watch` 手写这条链：执行顺序无法保证，`basePremium` 更新时 4 个附加费字段会各自触发一次 `adjustedAnnual` 的 watch，导致 `annualPremium` 被中间状态多次错误计算。

用 `engine.define`：引擎将整个依赖图拓扑排序，确保每个字段只在所有上游稳定后执行一次，从根节点变化到叶节点只有一次完整传播。
