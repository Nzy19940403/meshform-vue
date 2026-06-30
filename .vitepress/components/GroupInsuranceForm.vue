<template>
  <div class="gi-wrap">
    <div class="gi-header">
      <span class="gi-badge">⧩ MeshForm</span>
      <span class="gi-title">企业团体险组合定价 — 43 条联动规则</span>
      <span class="gi-desc">规模×行业×地区×赔付四维系数 · 6 险种联动折扣 · 税前列支自动核算</span>
    </div>

    <v-app theme="dark" class="gi-vapp">
      <div class="gi-body">
        <MeshForm
          :schema="schema"
          :rules="rules"
          :uischema="uischema"
          :renderers="customRenderers"
          @change="onFormChange"
          @submit="onSubmit"
        >
          <template #actions="{ submit }">
            <div class="gi-actions">
              <v-btn color="primary" variant="tonal" @click="submit">生成报价方案</v-btn>
            </div>
          </template>
        </MeshForm>
      </div>

      <div v-if="submitted" class="gi-result">
        <div class="gi-result-hd">
          <span class="gi-dot gi-dot--green" />✓ 报价方案已生成
        </div>
        <pre class="gi-result-pre">{{ submittedStr }}</pre>
      </div>
    </v-app>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { MeshForm, from } from '@meshflow/form-vue'
import type { MeshFormSchema, FromDescriptor } from '@meshflow/form-vue'
import { rankWith, and, uiTypeIs, schemaMatches } from '@jsonforms/core'
import NumberInputRenderer from './NumberInputRenderer.vue'

const numberInputTester = rankWith(10, and(
  uiTypeIs('Control'),
  schemaMatches(s =>
    (s.type === 'number' || s.type === 'integer') &&
    s['x-widget'] !== 'select' &&
    !Array.isArray(s['x-options']) &&
    !Array.isArray(s.enum)
  )
))
const customRenderers = [{ tester: numberInputTester, renderer: markRaw(NumberInputRenderer) }]

// ── 静态费率表 ────────────────────────────────────────────────────────────────
/** 规模系数：员工越多，单人费率越低 */
function scaleFactor(n: number) {
  if (n < 20)   return 1.20
  if (n < 50)   return 1.10
  if (n < 100)  return 1.00
  if (n < 300)  return 0.95
  if (n < 500)  return 0.90
  return 0.85
}

const INDUSTRY_FACTOR: Record<string, number> = {
  finance: 0.90, tech: 0.95, manufacturing: 1.10,
  construction: 1.30, healthcare: 1.00, retail: 1.05, logistics: 1.20,
}
const REGION_FACTOR: Record<string, number> = {
  tier1: 1.20, 'tier1_5': 1.10, tier2: 1.00, tier3: 0.90,
}

/** 赔付系数：连续无赔付年越长折扣越大 */
function claimFactor(years: number) {
  return Math.round(Math.max(0.75, 1.0 - years * 0.05) * 100) / 100
}

/** 组合折扣率（%）：险种越多折扣越大 */
function bundleDiscount(count: number) {
  if (count >= 5) return 20
  if (count >= 4) return 15
  if (count >= 3) return 10
  if (count >= 2) return 5
  return 0
}

/**
 * 人均年保费计算（各险种统一格式）
 * @param enabled  是否投保
 * @param baseAmt  基础金额（万元保额 或 日额元 或 年限额元）
 * @param rate     基础费率（元/基础单位/人/年）
 * @param insured  参保人数
 * @param factor   综合系数
 * @param discount 组合折扣率(%)
 */
function calcPremium(enabled: boolean, baseAmt: number, rate: number,
                     insured: number, factor: number, discount: number) {
  if (!enabled || insured <= 0) return 0
  return Math.round(baseAmt * rate * insured * factor * (1 - discount / 100))
}

// ── Pre-computed initial values (schema defaults → flicker-free first render) ─
// company defaults: employeeCount=200, industry='tech', region='tier1', claimFreeYears=0, monthlyWage=8000
// enabled defaults: medical=true, life=true, accident=true, ci=false, hospital=false, outpatient=false
const INIT_SCALE    = scaleFactor(200)               // 0.95
const INIT_INDUSTRY = INDUSTRY_FACTOR['tech']        // 0.95
const INIT_REGION   = REGION_FACTOR['tier1']         // 1.20
const INIT_CLAIM    = claimFactor(0)                 // 1.00
const INIT_COMBINED = Math.round(INIT_SCALE * INIT_INDUSTRY * INIT_REGION * INIT_CLAIM * 100) / 100 // 1.08

const INIT_BUNDLE_COUNT = 3  // medical + life + accident
const INIT_BUNDLE_DISC  = bundleDiscount(INIT_BUNDLE_COUNT)  // 10
const INIT_BUNDLE_NOTE  = `已选 ${INIT_BUNDLE_COUNT} 种险种，享 ${INIT_BUNDLE_DISC}% 组合优惠`

const INIT_MED_INS  = Math.round(200 * 90  / 100)   // 180
const INIT_LIFE_INS = Math.round(200 * 100 / 100)   // 200
const INIT_ACC_INS  = Math.round(200 * 100 / 100)   // 200
const INIT_CI_INS   = Math.round(200 * 80  / 100)   // 160 (ci disabled, still computed)
const INIT_HOSP_INS = Math.round(200 * 70  / 100)   // 140 (disabled)
const INIT_OUT_INS  = Math.round(200 * 80  / 100)   // 160 (disabled)

const INIT_MED_PREM  = calcPremium(true,  100, 5,   INIT_MED_INS,  INIT_COMBINED, INIT_BUNDLE_DISC)
const INIT_LIFE_PREM = calcPremium(true,   50, 4,   INIT_LIFE_INS, INIT_COMBINED, INIT_BUNDLE_DISC)
const INIT_ACC_PREM  = calcPremium(true,   30, 3,   INIT_ACC_INS,  INIT_COMBINED, INIT_BUNDLE_DISC)

const INIT_TOTAL     = INIT_MED_PREM + INIT_LIFE_PREM + INIT_ACC_PREM
const INIT_PER_MO    = Math.round(INIT_TOTAL / 200 / 12)
const INIT_SAVED     = Math.round(INIT_TOTAL * INIT_BUNDLE_DISC / (100 - INIT_BUNDLE_DISC))
const INIT_TAX_LIM   = Math.round(200 * 8000 * 12 * 0.05)  // 96000
const INIT_TAX_ACT   = Math.min(INIT_TOTAL, INIT_TAX_LIM)
const INIT_TAX_NOTE  = INIT_TOTAL > INIT_TAX_LIM
  ? `年保费超出税前抵扣上限 ¥${(INIT_TOTAL - INIT_TAX_LIM).toLocaleString()}，超出部分需税后列支`
  : `年保费在税前抵扣范围内，可全额税前列支（员工年工资总额 5% 以内）`

const INIT_CI_HINT = `不超过寿险保额 80%（最高 ${Math.round(50 * 0.8)} 万）`  // life.coverage default=50

// ── Schema ────────────────────────────────────────────────────────────────────
const schema: MeshFormSchema = {
  type: 'object',
  title: '企业团体险组合定价',
  properties: {

    // ① 企业基本信息
    company: {
      type: 'object', title: '企业基本信息',
      properties: {
        employeeCount: {
          type: 'integer', title: '员工总数', default: 200,
          'x-widget': 'number-input', 'x-min': 5, 'x-step': 10,
        },
        industry: {
          type: 'string', title: '行业类别', default: 'tech', 'x-widget': 'select',
          'x-options': [
            { label: '金融/保险',   value: 'finance'       },
            { label: '科技/互联网', value: 'tech'          },
            { label: '制造业',     value: 'manufacturing'  },
            { label: '建筑/工程',  value: 'construction'   },
            { label: '医疗/健康',  value: 'healthcare'     },
            { label: '零售/贸易',  value: 'retail'         },
            { label: '运输/物流',  value: 'logistics'      },
          ],
        },
        region: {
          type: 'string', title: '所在地区', default: 'tier1', 'x-widget': 'select',
          'x-options': [
            { label: '一线城市（北上广深）', value: 'tier1'   },
            { label: '新一线城市',          value: 'tier1_5' },
            { label: '二线城市',            value: 'tier2'   },
            { label: '三线及以下',          value: 'tier3'   },
          ],
        },
        claimFreeYears: {
          type: 'integer', title: '连续无赔付年数', default: 0,
          'x-widget': 'number-input', 'x-min': 0, 'x-max': 5,
        },
        monthlyWage: {
          type: 'number', title: '人均月工资 (元)', default: 8000,
          'x-widget': 'number-input', 'x-min': 3000, 'x-step': 500,
        },
      },
    },

    // ② 费率调整系数（全部自动）
    factors: {
      type: 'object', title: '费率调整系数',
      properties: {
        scale:    { type: 'number', title: '规模系数',   default: 0.95, 'x-readonly': true, 'x-disabled': true },
        industry: { type: 'number', title: '行业系数',   default: 0.95, 'x-readonly': true, 'x-disabled': true },
        region:   { type: 'number', title: '地区系数',   default: 1.20, 'x-readonly': true, 'x-disabled': true },
        claim:    { type: 'number', title: '赔付系数',   default: 1.00, 'x-readonly': true, 'x-disabled': true },
        combined: { type: 'number', title: '综合系数 ×', default: 1.08, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'warning' },
      },
    },

    // ③ 险种配置
    medical: {
      type: 'object', title: '医疗险',
      properties: {
        enabled:    { type: 'boolean', title: '投保医疗险',    default: true  },
        coverage:   { type: 'number',  title: '保额上限 (万)', default: 100,
                      'x-widget': 'number-input', 'x-min': 10, 'x-step': 10 },
        enrollRate: { type: 'integer', title: '参保率 (%)',    default: 90,
                      'x-widget': 'number-input', 'x-min': 1, 'x-max': 100  },
      },
    },
    life: {
      type: 'object', title: '团体寿险',
      properties: {
        enabled:    { type: 'boolean', title: '投保团体寿险',  default: true  },
        coverage:   { type: 'number',  title: '保额 (万)',     default: 50,
                      'x-widget': 'number-input', 'x-min': 5, 'x-step': 5   },
        enrollRate: { type: 'integer', title: '参保率 (%)',    default: 100,
                      'x-widget': 'number-input', 'x-min': 1, 'x-max': 100  },
      },
    },
    accident: {
      type: 'object', title: '团体意外险',
      properties: {
        enabled:    { type: 'boolean', title: '投保意外险',    default: true  },
        coverage:   { type: 'number',  title: '保额 (万)',     default: 30,
                      'x-widget': 'number-input', 'x-min': 5, 'x-step': 5   },
        enrollRate: { type: 'integer', title: '参保率 (%)',    default: 100,
                      'x-widget': 'number-input', 'x-min': 1, 'x-max': 100  },
      },
    },
    ci: {
      type: 'object', title: '重疾险',
      properties: {
        enabled:     { type: 'boolean', title: '投保重疾险',   default: false },
        coverage:    { type: 'number',  title: '保额 (万)',    default: 20,
                       'x-widget': 'number-input', 'x-min': 5, 'x-step': 5  },
        enrollRate:  { type: 'integer', title: '参保率 (%)',   default: 80,
                       'x-widget': 'number-input', 'x-min': 1, 'x-max': 100 },
        coverageHint:{ type: 'string',  title: '保额上限提示', default: INIT_CI_HINT,
                       'x-readonly': true, 'x-disabled': true               },
      },
    },
    hospital: {
      type: 'object', title: '住院津贴险 ★需医疗险',
      properties: {
        enabled:      { type: 'boolean', title: '投保住院津贴险', default: false },
        dailyBenefit: { type: 'integer', title: '日额津贴 (元)',  default: 200,
                        'x-widget': 'number-input', 'x-min': 50, 'x-step': 50 },
        enrollRate:   { type: 'integer', title: '参保率 (%)',     default: 70,
                        'x-widget': 'number-input', 'x-min': 1, 'x-max': 100 },
      },
    },
    outpatient: {
      type: 'object', title: '门诊险 ★需医疗险',
      properties: {
        enabled:    { type: 'boolean', title: '投保门诊险',      default: false },
        coverage:   { type: 'integer', title: '年度限额 (元)',   default: 3000,
                      'x-widget': 'number-input', 'x-min': 500, 'x-step': 500 },
        enrollRate: { type: 'integer', title: '参保率 (%)',      default: 80,
                      'x-widget': 'number-input', 'x-min': 1, 'x-max': 100   },
      },
    },

    // ④ 组合折扣（自动）
    bundle: {
      type: 'object', title: '组合折扣',
      properties: {
        count:    { type: 'integer', title: '已选险种数',    default: INIT_BUNDLE_COUNT, 'x-readonly': true, 'x-disabled': true },
        discount: { type: 'number',  title: '组合折扣率 (%)', default: INIT_BUNDLE_DISC, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
        note:     { type: 'string',  title: '折扣说明',     default: INIT_BUNDLE_NOTE,  'x-readonly': true, 'x-disabled': true },
      },
    },

    // ⑤ 各险种费用明细（自动）
    detail: {
      type: 'object', title: '险种费用明细',
      properties: {
        medInsured:  { type: 'integer', title: '医疗险参保人数',       default: INIT_MED_INS,   'x-readonly': true, 'x-disabled': true },
        medPremium:  { type: 'number',  title: '医疗险年保费 (¥)',     default: INIT_MED_PREM,  'x-readonly': true, 'x-disabled': true },
        lifeInsured: { type: 'integer', title: '寿险参保人数',         default: INIT_LIFE_INS,  'x-readonly': true, 'x-disabled': true },
        lifePremium: { type: 'number',  title: '寿险年保费 (¥)',       default: INIT_LIFE_PREM, 'x-readonly': true, 'x-disabled': true },
        accInsured:  { type: 'integer', title: '意外险参保人数',       default: INIT_ACC_INS,   'x-readonly': true, 'x-disabled': true },
        accPremium:  { type: 'number',  title: '意外险年保费 (¥)',     default: INIT_ACC_PREM,  'x-readonly': true, 'x-disabled': true },
        ciInsured:   { type: 'integer', title: '重疾险参保人数',       default: INIT_CI_INS,    'x-readonly': true, 'x-disabled': true },
        ciPremium:   { type: 'number',  title: '重疾险年保费 (¥)',     default: 0,              'x-readonly': true, 'x-disabled': true },
        hospInsured: { type: 'integer', title: '住院津贴险参保人数',   default: INIT_HOSP_INS,  'x-readonly': true, 'x-disabled': true },
        hospPremium: { type: 'number',  title: '住院津贴险年保费 (¥)', default: 0,              'x-readonly': true, 'x-disabled': true },
        outInsured:  { type: 'integer', title: '门诊险参保人数',       default: INIT_OUT_INS,   'x-readonly': true, 'x-disabled': true },
        outPremium:  { type: 'number',  title: '门诊险年保费 (¥)',     default: 0,              'x-readonly': true, 'x-disabled': true },
      },
    },

    // ⑥ 费用汇总（自动）
    summary: {
      type: 'object', title: '费用汇总',
      properties: {
        total:    { type: 'number', title: '企业总年保费 (¥)', default: INIT_TOTAL,    'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
        perMonth: { type: 'number', title: '人均月均保费 (¥)', default: INIT_PER_MO,   'x-readonly': true, 'x-disabled': true },
        saved:    { type: 'number', title: '折扣节省金额 (¥)', default: INIT_SAVED,    'x-readonly': true, 'x-disabled': true, 'x-theme': 'info'    },
        taxLimit: { type: 'number', title: '税前抵扣上限 (¥)', default: INIT_TAX_LIM,  'x-readonly': true, 'x-disabled': true },
        taxActual:{ type: 'number', title: '实际可抵扣 (¥)',   default: INIT_TAX_ACT,  'x-readonly': true, 'x-disabled': true },
        taxNote:  { type: 'string', title: '税务说明',         default: INIT_TAX_NOTE, 'x-readonly': true, 'x-disabled': true },
      },
    },
  },
}

// ── Rules（43 条）─────────────────────────────────────────────────────────────
const rules: Record<string, FromDescriptor> = {

  // ── ① 四维费率系数（5 条）──────────────────────────────────────────────────
  'factors.scale.value':    from('company.employeeCount',  (n: number) => scaleFactor(n)),
  'factors.industry.value': from('company.industry',       (v: string) => INDUSTRY_FACTOR[v] ?? 1.0),
  'factors.region.value':   from('company.region',         (v: string) => REGION_FACTOR[v]   ?? 1.0),
  'factors.claim.value':    from('company.claimFreeYears', (y: number) => claimFactor(y)),
  'factors.combined.value': from(
    ['factors.scale', 'factors.industry', 'factors.region', 'factors.claim'],
    (s: number, i: number, r: number, c: number) => Math.round(s * i * r * c * 100) / 100
  ),

  // ── ② 险种字段启用/禁用（14 条）────────────────────────────────────────────
  // 医疗险关闭 → 住院津贴险和门诊险 enabled 不可选
  'hospital.enabled.disabled':  from('medical.enabled', (v: boolean) => !v),
  'outpatient.enabled.disabled':from('medical.enabled', (v: boolean) => !v),
  // 各险种关闭 → 保额/参保率 变灰
  'medical.coverage.disabled':    from('medical.enabled',    (v: boolean) => !v),
  'medical.enrollRate.disabled':  from('medical.enabled',    (v: boolean) => !v),
  'life.coverage.disabled':       from('life.enabled',       (v: boolean) => !v),
  'life.enrollRate.disabled':     from('life.enabled',       (v: boolean) => !v),
  'accident.coverage.disabled':   from('accident.enabled',   (v: boolean) => !v),
  'accident.enrollRate.disabled': from('accident.enabled',   (v: boolean) => !v),
  'ci.coverage.disabled':         from('ci.enabled',         (v: boolean) => !v),
  'ci.enrollRate.disabled':       from('ci.enabled',         (v: boolean) => !v),
  'hospital.dailyBenefit.disabled': from('hospital.enabled', (v: boolean) => !v),
  'hospital.enrollRate.disabled':   from('hospital.enabled', (v: boolean) => !v),
  'outpatient.coverage.disabled':   from('outpatient.enabled',(v: boolean) => !v),
  'outpatient.enrollRate.disabled': from('outpatient.enabled',(v: boolean) => !v),

  // ── ③ 重疾险保额上限提示（1 条）────────────────────────────────────────────
  'ci.coverageHint.value': from('life.coverage', (c: number) =>
    c > 0 ? `不超过寿险保额 80%（最高 ${Math.round(c * 0.8)} 万）` : '需先配置寿险'
  ),

  // ── ④ 组合折扣（3 条）──────────────────────────────────────────────────────
  // 已选险种数：住院津贴/门诊险依赖医疗险，医疗险关闭时不计入
  'bundle.count.value': from(
    ['medical.enabled', 'life.enabled', 'accident.enabled',
     'ci.enabled', 'hospital.enabled', 'outpatient.enabled'],
    (med: boolean, life: boolean, acc: boolean, ci: boolean, hosp: boolean, out: boolean) =>
      [med, life, acc, ci, hosp && med, out && med].filter(Boolean).length
  ),
  'bundle.discount.value': from('bundle.count', (n: number) => bundleDiscount(n)),
  'bundle.note.value': from(['bundle.count', 'bundle.discount'],
    (n: number, d: number) => d > 0
      ? `已选 ${n} 种险种，享 ${d}% 组合优惠`
      : `已选 ${n} 种险种，2 种起享组合优惠`
  ),

  // ── ⑤ 各险种参保人数（6 条）────────────────────────────────────────────────
  'detail.medInsured.value':  from(['company.employeeCount', 'medical.enrollRate'],
    (n: number, r: number) => Math.round(n * r / 100)),
  'detail.lifeInsured.value': from(['company.employeeCount', 'life.enrollRate'],
    (n: number, r: number) => Math.round(n * r / 100)),
  'detail.accInsured.value':  from(['company.employeeCount', 'accident.enrollRate'],
    (n: number, r: number) => Math.round(n * r / 100)),
  'detail.ciInsured.value':   from(['company.employeeCount', 'ci.enrollRate'],
    (n: number, r: number) => Math.round(n * r / 100)),
  'detail.hospInsured.value': from(['company.employeeCount', 'hospital.enrollRate'],
    (n: number, r: number) => Math.round(n * r / 100)),
  'detail.outInsured.value':  from(['company.employeeCount', 'outpatient.enrollRate'],
    (n: number, r: number) => Math.round(n * r / 100)),

  // ── ⑥ 各险种年保费（6 条）──────────────────────────────────────────────────
  // 基础费率说明：
  //   医疗险  ≈ 5 元/万保额/人/年
  //   团体寿险 ≈ 4 元/万保额/人/年
  //   意外险  ≈ 3 元/万保额/人/年
  //   重疾险  ≈ 6 元/万保额/人/年
  //   住院津贴 ≈ 日额 × 1.8 元/人/年
  //   门诊险  ≈ 年限额 × 50% 元/人/年
  'detail.medPremium.value': from(
    ['medical.enabled', 'medical.coverage', 'detail.medInsured', 'factors.combined', 'bundle.discount'],
    (en: boolean, cov: number, ins: number, fac: number, disc: number) =>
      calcPremium(en, cov, 5, ins, fac, disc)
  ),
  'detail.lifePremium.value': from(
    ['life.enabled', 'life.coverage', 'detail.lifeInsured', 'factors.combined', 'bundle.discount'],
    (en: boolean, cov: number, ins: number, fac: number, disc: number) =>
      calcPremium(en, cov, 4, ins, fac, disc)
  ),
  'detail.accPremium.value': from(
    ['accident.enabled', 'accident.coverage', 'detail.accInsured', 'factors.combined', 'bundle.discount'],
    (en: boolean, cov: number, ins: number, fac: number, disc: number) =>
      calcPremium(en, cov, 3, ins, fac, disc)
  ),
  'detail.ciPremium.value': from(
    ['ci.enabled', 'ci.coverage', 'detail.ciInsured', 'factors.combined', 'bundle.discount'],
    (en: boolean, cov: number, ins: number, fac: number, disc: number) =>
      calcPremium(en, cov, 6, ins, fac, disc)
  ),
  'detail.hospPremium.value': from(
    ['hospital.enabled', 'medical.enabled', 'hospital.dailyBenefit',
     'detail.hospInsured', 'factors.combined', 'bundle.discount'],
    (en: boolean, med: boolean, daily: number, ins: number, fac: number, disc: number) =>
      calcPremium(en && med, daily, 1.8, ins, fac, disc)
  ),
  'detail.outPremium.value': from(
    ['outpatient.enabled', 'medical.enabled', 'outpatient.coverage',
     'detail.outInsured', 'factors.combined', 'bundle.discount'],
    (en: boolean, med: boolean, cov: number, ins: number, fac: number, disc: number) =>
      calcPremium(en && med, cov, 0.5, ins, fac, disc)
  ),

  // ── ⑦ 费用汇总（6 条）──────────────────────────────────────────────────────
  'summary.total.value': from(
    ['detail.medPremium', 'detail.lifePremium', 'detail.accPremium',
     'detail.ciPremium', 'detail.hospPremium', 'detail.outPremium'],
    (...ps: number[]) => ps.reduce((a, b) => a + b, 0)
  ),
  'summary.perMonth.value': from(
    ['summary.total', 'company.employeeCount'],
    (total: number, n: number) => n > 0 ? Math.round(total / n / 12) : 0
  ),
  'summary.saved.value': from(
    ['summary.total', 'bundle.discount'],
    (total: number, disc: number) =>
      disc > 0 ? Math.round(total * disc / (100 - disc)) : 0
  ),
  'summary.taxLimit.value': from(
    ['company.employeeCount', 'company.monthlyWage'],
    (n: number, wage: number) => Math.round(n * wage * 12 * 0.05)
  ),
  'summary.taxActual.value': from(
    ['summary.total', 'summary.taxLimit'],
    (total: number, limit: number) => Math.min(total, limit)
  ),
  'summary.taxNote.value': from(
    ['summary.total', 'summary.taxLimit'],
    (total: number, limit: number) => total > limit
      ? `年保费超出税前抵扣上限 ¥${(total - limit).toLocaleString()}，超出部分需税后列支`
      : `年保费在税前抵扣范围内，可全额税前列支（员工年工资总额 5% 以内）`
  ),

  // ── ⑧ 警告条件（2 条）──────────────────────────────────────────────────────
  // （暂无独立 warning 字段，tax note 已承载该信息；此处预留扩展结构）
}

// ── UISchema ─────────────────────────────────────────────────────────────────
function c(scope: string, span = 1) {
  return { type: 'Control', scope, ...(span !== 1 ? { options: { span } } : {}) } as any
}
function row(...els: any[]) { return { type: 'HorizontalLayout', elements: els } as any }
function group(label: string, ...elements: any[]) {
  return { type: 'Group', label, elements } as any
}

const P = '#/properties'
const uischema = {
  type: 'VerticalLayout',
  elements: [

    // ① 企业基本信息
    group('企业基本信息',
      row(
        c(`${P}/company/properties/employeeCount`),
        c(`${P}/company/properties/industry`, 2),
        c(`${P}/company/properties/region`, 2),
      ),
      row(
        c(`${P}/company/properties/claimFreeYears`),
        c(`${P}/company/properties/monthlyWage`, 2),
      ),
    ),

    // ② 费率调整系数
    group('费率调整系数（自动计算）',
      row(
        c(`${P}/factors/properties/scale`),
        c(`${P}/factors/properties/industry`),
        c(`${P}/factors/properties/region`),
      ),
      row(
        c(`${P}/factors/properties/claim`),
        c(`${P}/factors/properties/combined`),
      ),
    ),

    // ③ 险种配置（6 险种，每行一种）
    group('险种配置',
      row(
        c(`${P}/medical/properties/enabled`),
        c(`${P}/medical/properties/coverage`, 2),
        c(`${P}/medical/properties/enrollRate`),
      ),
      row(
        c(`${P}/life/properties/enabled`),
        c(`${P}/life/properties/coverage`, 2),
        c(`${P}/life/properties/enrollRate`),
      ),
      row(
        c(`${P}/accident/properties/enabled`),
        c(`${P}/accident/properties/coverage`, 2),
        c(`${P}/accident/properties/enrollRate`),
      ),
      row(
        c(`${P}/ci/properties/enabled`),
        c(`${P}/ci/properties/coverage`),
        c(`${P}/ci/properties/enrollRate`),
      ),
      row(
        c(`${P}/ci/properties/coverageHint`),
      ),
      row(
        c(`${P}/hospital/properties/enabled`),
        c(`${P}/hospital/properties/dailyBenefit`, 2),
        c(`${P}/hospital/properties/enrollRate`),
      ),
      row(
        c(`${P}/outpatient/properties/enabled`),
        c(`${P}/outpatient/properties/coverage`, 2),
        c(`${P}/outpatient/properties/enrollRate`),
      ),
    ),

    // ④ 组合折扣
    group('组合折扣',
      row(
        c(`${P}/bundle/properties/count`),
        c(`${P}/bundle/properties/discount`),
        c(`${P}/bundle/properties/note`, 3),
      ),
    ),

    // ⑤ 险种费用明细（6 行，每行 1 险种）
    group('险种费用明细（自动计算）',
      row(
        c(`${P}/detail/properties/medInsured`),
        c(`${P}/detail/properties/medPremium`),
      ),
      row(
        c(`${P}/detail/properties/lifeInsured`),
        c(`${P}/detail/properties/lifePremium`),
      ),
      row(
        c(`${P}/detail/properties/accInsured`),
        c(`${P}/detail/properties/accPremium`),
      ),
      row(
        c(`${P}/detail/properties/ciInsured`),
        c(`${P}/detail/properties/ciPremium`),
      ),
      row(
        c(`${P}/detail/properties/hospInsured`),
        c(`${P}/detail/properties/hospPremium`),
      ),
      row(
        c(`${P}/detail/properties/outInsured`),
        c(`${P}/detail/properties/outPremium`),
      ),
    ),

    // ⑥ 费用汇总
    group('费用汇总',
      row(
        c(`${P}/summary/properties/total`),
        c(`${P}/summary/properties/perMonth`),
        c(`${P}/summary/properties/saved`),
      ),
      row(
        c(`${P}/summary/properties/taxLimit`),
        c(`${P}/summary/properties/taxActual`),
        c(`${P}/summary/properties/taxNote`, 3),
      ),
    ),
  ],
}

// ── 状态 ──────────────────────────────────────────────────────────────────────
const submitted    = ref(false)
const submittedData = ref<Record<string, any>>({})
const submittedStr  = computed(() => JSON.stringify(submittedData.value, null, 2))

function onFormChange(_data: Record<string, any>) {}
function onSubmit(data: Record<string, any>) {
  submittedData.value = data
  submitted.value     = true
}
</script>

<style scoped>
.gi-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
  margin: 24px 0;
  font-size: 13px;
}
.gi-header {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 13px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.gi-badge {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: #fff; font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  font-family: 'JetBrains Mono', monospace;
}
.gi-title { font-size: 14px; font-weight: 700; color: var(--vp-c-text-1); }
.gi-desc  { font-size: 11px; color: var(--vp-c-text-2); margin-left: auto; }
.gi-vapp  { background: transparent !important; min-height: 0 !important; display: block !important; }
.gi-body  { padding: 20px 24px; }
.gi-body :deep(.v-input__details) { display: none !important; }
.gi-body :deep(.v-checkbox) { align-items: center !important; padding-top: 4px; }
.gi-body :deep(.v-checkbox .v-label) { font-size: 13px; opacity: 0.92; }
.gi-body :deep(.v-input--density-comfortable) { --v-input-padding-top: 4px; }
.gi-body :deep(.mesh-group__body--vertical) { display: flex; flex-direction: column; gap: 16px; }
.gi-body :deep(.mesh-layout--horizontal) {
  display: flex !important; flex-wrap: wrap !important;
  gap: 8px 16px !important; width: 100% !important;
}
.gi-body :deep(.mesh-layout__item),
.gi-body :deep(.mesh-layout--horizontal > *) { flex: 1 1 150px !important; min-width: 0 !important; }
.gi-body :deep(.mesh-group) { margin-bottom: 12px; }
.gi-actions { padding-top: 8px; }
.gi-result { border-top: 1px solid var(--vp-c-border); overflow: hidden; }
.gi-result-hd {
  display: flex; align-items: center; gap: 7px; padding: 8px 20px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  color: #4caf50; border-bottom: 1px solid var(--vp-c-border); background: var(--vp-c-bg);
}
.gi-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.gi-dot--green { background: #4caf50; box-shadow: 0 0 5px #4caf50; }
.gi-result-pre {
  margin: 0; padding: 14px 20px; font-size: 11px; line-height: 1.6;
  color: var(--vp-c-text-2); white-space: pre-wrap; word-break: break-all;
  max-height: 400px; overflow-y: auto;
  font-family: 'JetBrains Mono', monospace; background: var(--vp-c-bg-soft);
}
</style>
