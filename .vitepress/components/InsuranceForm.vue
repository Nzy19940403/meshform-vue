<template>
  <div class="ins-wrap">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="ins-header">
      <span class="ins-badge">⧩ MeshForm</span>
      <span class="ins-title">人寿保险投保申请 — 22 条联动规则</span>
      <span class="ins-desc">投保人/被保险人分离、BMI 自动计算、职业风险附加费、险种联动保费、核保警告联动</span>
    </div>

    <!-- v-app 提供 Vuetify theme context，设为透明不干扰外层样式 -->
    <v-app theme="dark" class="ins-vapp">
      <!-- ── 表单主体 ─────────────────────────────────────────────────── -->
      <div class="ins-body">
        <MeshForm :schema="schema" :rules="rules" :uischema="uischema" :renderers="customRenderers" @change="onFormChange" @submit="onSubmit">
          <template #actions="{ submit }">
            <div class="ins-actions">
              <v-btn color="primary" variant="tonal" @click="submit">提交投保申请</v-btn>
            </div>
          </template>
        </MeshForm>
      </div>

      <!-- ── 提交结果 ─────────────────────────────────────────────────── -->
      <div v-if="submitted" class="ins-result">
        <div class="ins-result-hd">
          <span class="ins-dot ins-dot--green" />✓ 申请已提交
        </div>
        <pre class="ins-result-pre">{{ submittedStr }}</pre>
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
import WarningRenderer from './WarningRenderer.vue'

// tester 必须用 schemaMatches：第二个参数 s 是根 schema，
// schemaMatches 会按 uischema.scope 路径解析出具体字段的 schema 再传给谓词
const numberInputTester = rankWith(10, and(
  uiTypeIs('Control'),
  schemaMatches(s =>
    (s.type === 'number' || s.type === 'integer') &&
    s['x-widget'] !== 'select' &&
    !Array.isArray(s['x-options']) &&
    !Array.isArray(s.enum)
  )
))
const warningTester = rankWith(20, and(
  uiTypeIs('Control'),
  schemaMatches(s => s['x-widget'] === 'warning')
))
const customRenderers = [
  { tester: numberInputTester, renderer: markRaw(NumberInputRenderer) },
  { tester: warningTester,     renderer: markRaw(WarningRenderer) },
]

// ── 静态数据 ──────────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear()

// 投保人/被保险人出生年份范围：当前年 - 18 往前 65 年（18~82 岁）
const BIRTH_YEAR_OPTIONS = Array.from({ length: 65 }, (_, i) => {
  const y = CURRENT_YEAR - 18 - i
  return { label: `${y} 年`, value: y }
})

const OCCUPATION_OPTIONS = [
  { label: '行政管理',      value: 'admin',     surcharge: 0 },
  { label: '技术研发',      value: 'tech',      surcharge: 0 },
  { label: '销售内勤',      value: 'sales_in',  surcharge: 0 },
  { label: '销售外勤',      value: 'sales_out', surcharge: 0.3 },
  { label: '体力劳动工人',  value: 'labor',     surcharge: 0.3 },
  { label: '驾驶员',        value: 'driver',    surcharge: 0.8 },
  { label: '特殊工种/化工', value: 'special',   surcharge: 0.8 },
  { label: '高空/潜水作业', value: 'extreme',   surcharge: 1.0 },
]

const TERM_OPTIONS: Record<string, { label: string; value: string }[]> = {
  term:  [{ label: '10 年', value: '10' }, { label: '20 年', value: '20' }, { label: '30 年', value: '30' }],
  whole: [{ label: '终身',  value: 'lifetime' }],
  endow: [{ label: '10 年', value: '10' }, { label: '15 年', value: '15' }, { label: '20 年', value: '20' }, { label: '25 年', value: '25' }, { label: '30 年', value: '30' }],
  ci:    [{ label: '20 年', value: '20' }, { label: '30 年', value: '30' }, { label: '至 70 岁', value: '70' }, { label: '终身', value: 'lifetime' }],
}

const PAYMENT_PERIOD_OPTIONS: Record<string, { label: string; value: string }[]> = {
  term:  [{ label: '期缴（随保险期）', value: 'same' }, { label: '一次性缴清', value: 'single' }],
  whole: [{ label: '5 年缴清', value: '5' }, { label: '10 年缴清', value: '10' }, { label: '20 年缴清', value: '20' }, { label: '终身缴费', value: 'lifetime' }],
  endow: [{ label: '5 年缴清', value: '5' }, { label: '10 年缴清', value: '10' }, { label: '期满缴清', value: 'same' }],
  ci:    [{ label: '10 年缴清', value: '10' }, { label: '20 年缴清', value: '20' }, { label: '终身缴费', value: 'lifetime' }],
}

const RATE_TABLE: Record<string, number[]> = {
  term:  [0.40, 0.70, 1.20, 2.00, 3.50],
  whole: [8.00, 10.0, 14.0, 19.0, 27.0],
  endow: [14.0, 18.0, 24.0, 32.0, 42.0],
  ci:    [3.50, 5.50, 9.00, 15.0, 22.0],
}

const FREQ_FACTOR: Record<string, { factor: number; times: number }> = {
  annual:  { factor: 1.00, times: 1 },
  semi:    { factor: 1.02, times: 2 },
  quarter: { factor: 1.03, times: 4 },
  monthly: { factor: 1.04, times: 12 },
}

const MAX_COVERAGE: Record<string, number> = { term: 2000, whole: 5000, endow: 3000, ci: 1000 }
const MEDICAL_THRESHOLD = 500

function ageBracket(age: number) {
  if (age < 30) return 0; if (age < 40) return 1
  if (age < 50) return 2; if (age < 60) return 3; return 4
}

// ── Pre-computed initial values (schema defaults → flicker-free first render) ─
// insured defaults: birthYear = CURRENT_YEAR - 30 → age = 30, gender = 'M'
// product defaults: type='term', coverageAmount=100, paymentFreq='annual'
// occupation default: 'admin' (surcharge=0), smoke=false, no addons, bmi normal
const INIT_INS_AGE       = 30
const INIT_BASE_RATE     = Math.round(RATE_TABLE['term'][ageBracket(INIT_INS_AGE)] * 1.0 * 100) / 100
const INIT_BASE_PREMIUM  = Math.round(100 * INIT_BASE_RATE * 10)
const INIT_FINAL_PREMIUM = INIT_BASE_PREMIUM
const INIT_PER_PAYMENT   = Math.round(INIT_FINAL_PREMIUM * FREQ_FACTOR['annual'].factor / FREQ_FACTOR['annual'].times)

// ── Schema ────────────────────────────────────────────────────────────────────
const ID_TYPE_OPTIONS = [
  { label: '居民身份证',             value: 'id' },
  { label: '护照',                   value: 'passport' },
  { label: '军官证',                 value: 'military' },
  { label: '港澳居民来往内地通行证', value: 'hk' },
]

const schema: MeshFormSchema = {
  type: 'object',
  title: '人寿保险投保申请',
  properties: {

    // ── 第一板块：投保人信息 ─────────────────────────────────────────
    policyholder: {
      type: 'object',
      title: '投保人信息',
      'x-layout': 'horizontal',
      properties: {
        name:     { type: 'string',  title: '姓名',     default: '', 'x-placeholder': '请输入投保人姓名' },
        gender: {
          type: 'string', title: '性别', default: 'M', 'x-widget': 'select',
          'x-options': [{ label: '男', value: 'M' }, { label: '女', value: 'F' }],
        },
        birthYear: {
          type: 'integer', title: '出生年份', default: CURRENT_YEAR - 35,
          'x-widget': 'select', 'x-options': BIRTH_YEAR_OPTIONS,
        },
        age:      { type: 'integer', title: '年龄', default: 35, 'x-readonly': true, 'x-disabled': true },
        phone:    { type: 'string',  title: '联系电话', default: '', 'x-placeholder': '请输入手机号码' },
        idType:   { type: 'string',  title: '证件类型', default: 'id', 'x-widget': 'select', 'x-options': ID_TYPE_OPTIONS },
        idNumber: { type: 'string',  title: '证件号码', default: '' },
        relationship: {
          type: 'string', title: '与被保险人关系', default: 'self', 'x-widget': 'select',
          'x-options': [
            { label: '本人',   value: 'self' },
            { label: '配偶',   value: 'spouse' },
            { label: '子女',   value: 'child' },
            { label: '父母',   value: 'parent' },
            { label: '其他',   value: 'other' },
          ],
        },
      },
    },

    // ── 第二板块：被保险人信息 ──────────────────────────────────────
    insured: {
      type: 'object',
      title: '被保险人信息',
      'x-layout': 'horizontal',
      properties: {
        name:      { type: 'string',  title: '姓名',     default: '', 'x-placeholder': '请输入被保险人姓名' },
        gender: {
          type: 'string', title: '性别', default: 'M', 'x-widget': 'select',
          'x-options': [{ label: '男', value: 'M' }, { label: '女', value: 'F' }],
        },
        birthYear: {
          type: 'integer', title: '出生年份', default: CURRENT_YEAR - 30,
          'x-widget': 'select', 'x-options': BIRTH_YEAR_OPTIONS,
        },
        age:            { type: 'integer', title: '年龄',       default: 30, 'x-readonly': true, 'x-disabled': true },
        idType:         { type: 'string',  title: '证件类型',   default: 'id', 'x-widget': 'select', 'x-options': ID_TYPE_OPTIONS },
        idNumber:       { type: 'string',  title: '证件号码',   default: '' },
        occupation: {
          type: 'string', title: '职业类别', default: 'admin', 'x-widget': 'select',
          'x-options': OCCUPATION_OPTIONS.map(({ label, value }) => ({ label, value })),
        },
        occupationRisk: { type: 'string', title: '职业风险等级', default: '普通职业（标准费率）', 'x-readonly': true, 'x-disabled': true },
      },
    },

    // ── 第三板块：险种方案 ──────────────────────────────────────────
    product: {
      type: 'object',
      title: '险种方案',
      'x-layout': 'horizontal',
      properties: {
        type: {
          type: 'string', title: '险种', default: 'term', 'x-widget': 'select',
          'x-options': [
            { label: '定期寿险', value: 'term' },
            { label: '终身寿险', value: 'whole' },
            { label: '两全险',   value: 'endow' },
            { label: '重疾险',   value: 'ci' },
          ],
        },
        term:          { type: 'string', title: '保险期限', default: '20', 'x-widget': 'select', 'x-options': TERM_OPTIONS['term'] },
        paymentPeriod: { type: 'string', title: '缴费期限', default: 'same', 'x-widget': 'select', 'x-options': PAYMENT_PERIOD_OPTIONS['term'] },
        paymentFreq: {
          type: 'string', title: '缴费频率', default: 'annual', 'x-widget': 'select',
          'x-options': [
            { label: '年缴',   value: 'annual' },
            { label: '半年缴', value: 'semi' },
            { label: '季缴',   value: 'quarter' },
            { label: '月缴',   value: 'monthly' },
          ],
        },
        paymentMethod: {
          type: 'string', title: '缴费方式', default: 'bank', 'x-widget': 'select',
          'x-options': [
            { label: '银行卡自动划扣', value: 'bank' },
            { label: '支付宝',         value: 'alipay' },
            { label: '微信支付',       value: 'wechat' },
            { label: '信用卡',         value: 'credit' },
          ],
        },
        coverageAmount:  { type: 'number', title: '保额 (万)', default: 100, 'x-widget': 'number-input', 'x-min': 10, 'x-step': 10 },
        maxCoverageNote: { type: 'string', title: '最高可选保额', default: '最高 2000 万', 'x-readonly': true, 'x-disabled': true },
        addAccident:     { type: 'boolean', title: '附加意外险 (+5%)', default: false },
        addDisability:   { type: 'boolean', title: '附加残疾险 (+8%)', default: false },
      },
    },

    // ── 第四板块：健康告知 ──────────────────────────────────────────
    health: {
      type: 'object',
      title: '健康告知',
      'x-layout': 'horizontal',
      properties: {
        height:         { type: 'integer', title: '身高 (cm)', default: 170, 'x-widget': 'number-input', 'x-min': 100, 'x-max': 250 },
        weight:         { type: 'integer', title: '体重 (kg)', default: 65,  'x-widget': 'number-input', 'x-min': 30,  'x-max': 300 },
        bmi:            { type: 'number',  title: 'BMI',       default: 22.5, 'x-readonly': true, 'x-disabled': true },
        bmiStatus:      { type: 'string',  title: '体重状态',  default: '正常', 'x-readonly': true, 'x-disabled': true },
        smoke:          { type: 'boolean', title: '有吸烟史',   default: false },
        chronicDisease: { type: 'boolean', title: '患有慢性病', default: false },
        surgery:        { type: 'boolean', title: '两年内手术', default: false },
        familyHistory:  { type: 'boolean', title: '家族病史',   default: false },
      },
    },

    // ── 第五板块：受益人 ────────────────────────────────────────────
    beneficiary: {
      type: 'object',
      title: '受益人',
      'x-layout': 'horizontal',
      properties: {
        type: {
          type: 'string', title: '受益人类型', default: 'legal', 'x-widget': 'select',
          'x-options': [
            { label: '法定受益人', value: 'legal' },
            { label: '指定受益人', value: 'designated' },
          ],
        },
        name:       { type: 'string',  title: '受益人姓名',   default: '', 'x-hidden': true },
        rel: {
          type: 'string', title: '与被保人关系', default: 'spouse',
          'x-widget': 'select', 'x-hidden': true,
          'x-options': [
            { label: '配偶', value: 'spouse' },
            { label: '子女', value: 'child' },
            { label: '父母', value: 'parent' },
            { label: '其他', value: 'other' },
          ],
        },
        proportion: { type: 'integer', title: '受益比例 (%)', default: 100, 'x-hidden': true, 'x-widget': 'number-input', 'x-min': 1, 'x-max': 100 },
      },
    },

    // ── 第六板块：核保提示（条件触发） ─────────────────────────────
    warnings: {
      type: 'object',
      title: '核保提示',
      'x-layout': 'horizontal',
      properties: {
        highRiskNote: {
          type: 'string', title: '职业风险', 'x-widget': 'warning', 'x-hidden': true,
          default: '您选择的职业属于高风险职业，承保需经核保审查并收取额外保费，请提供职业证明材料。',
        },
        bmiNote: {
          type: 'string', title: '体重异常', 'x-widget': 'warning', 'x-hidden': true,
          default: 'BMI ≥ 28，属于超重/肥胖范围，将收取体重附加费并可能需要体检核实。',
        },
        diseaseNote: {
          type: 'string', title: '慢性病史', 'x-widget': 'warning', 'x-hidden': true,
          default: '申报有慢性病史，请在投保材料中附上近期病历及检查报告，承保条件由核保人员审定。',
        },
        ageNote: {
          type: 'string', title: '年龄超限', 'x-widget': 'warning', 'x-hidden': true,
          default: '被保险人年龄超过 60 岁，部分险种可能受限或需安排额外体检，请联系客服确认。',
        },
        surgeryNote: {
          type: 'string', title: '手术史', 'x-widget': 'warning', 'x-hidden': true,
          default: '两年内有手术史，请在核保资料中附上手术记录及出院小结，以便核保评估。',
        },
        familyNote: {
          type: 'string', title: '家族病史', 'x-widget': 'warning', 'x-hidden': true,
          default: '申报有家族遗传病史，核保时需说明具体病种，承保条件由核保人员审定，可能影响保费或保障范围。',
        },
      },
    },

    // ── 第七板块：保费汇总 ──────────────────────────────────────────
    premium: {
      type: 'object',
      title: '保费汇总',
      'x-layout': 'horizontal',
      properties: {
        baseRate:     { type: 'number', title: '基础费率 (‰)',   default: INIT_BASE_RATE,     'x-readonly': true, 'x-disabled': true },
        basePremium:  { type: 'number', title: '基础年保费 (¥)', default: INIT_BASE_PREMIUM,  'x-readonly': true, 'x-disabled': true },
        finalPremium: { type: 'number', title: '应缴年保费 (¥)', default: INIT_FINAL_PREMIUM, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
        perPayment:   { type: 'number', title: '每期金额 (¥)',   default: INIT_PER_PAYMENT,   'x-readonly': true, 'x-disabled': true, 'x-theme': 'info' },
        medicalNote:  { type: 'string', title: '体检要求',       default: '无需体检',           'x-readonly': true, 'x-disabled': true },
      },
    },
  },
}

// 统一的证件号码占位文本生成器
function idPlaceholder(t: string) {
  return ({
    id:       '请输入 18 位身份证号码',
    passport: '请输入护照号码',
    military: '请输入军官证号码',
    hk:       '请输入港澳通行证号码',
  } as Record<string, string>)[t] ?? '请输入证件号码'
}

// ── Rules ─────────────────────────────────────────────────────────────────────
const rules: Record<string, FromDescriptor> = {

  // ── 投保人联动 ────────────────────────────────────────────────────
  'policyholder.age.value': from('policyholder.birthYear', (y: number) => CURRENT_YEAR - y),
  'policyholder.idNumber.placeholder': from('policyholder.idType', idPlaceholder),

  // ── 被保险人联动 ──────────────────────────────────────────────────
  'insured.age.value': from('insured.birthYear', (y: number) => CURRENT_YEAR - y),
  'insured.idNumber.placeholder': from('insured.idType', idPlaceholder),

  // 职业风险描述
  'insured.occupationRisk.value': from('insured.occupation', (occ: string) => {
    const o = OCCUPATION_OPTIONS.find(x => x.value === occ)
    if (!o) return ''
    if (o.surcharge === 0)  return '普通职业（标准费率）'
    if (o.surcharge <= 0.3) return `体力职业（附加 ${Math.round(o.surcharge * 100)}%）`
    return `高危职业（附加 ${Math.round(o.surcharge * 100)}%）`
  }),

  // ── 健康告知联动 ──────────────────────────────────────────────────
  'health.bmi.value': from(['health.height', 'health.weight'], (h: number, w: number) => {
    if (!h || !w) return 0
    return Math.round(w / Math.pow(h / 100, 2) * 10) / 10
  }),

  'health.bmiStatus.value': from('health.bmi', (b: number) => {
    if (!b)        return '—'
    if (b < 18.5)  return '偏瘦'
    if (b < 24)    return '正常'
    if (b < 28)    return '超重'
    if (b < 32)    return '肥胖 I 级'
    return '肥胖 II 级'
  }),

  // ── 险种方案联动 ──────────────────────────────────────────────────
  'product.term.options': from('product.type', (t: string) => TERM_OPTIONS[t] ?? [], {
    effect: ({ options, value }: any) => {
      const valid = options.some((o: any) => o.value === value)
      return valid ? undefined : { value: options[0]?.value ?? '' }
    },
    effectArgs: ['options', 'value'],
  }),

  'product.paymentPeriod.options': from('product.type', (t: string) => PAYMENT_PERIOD_OPTIONS[t] ?? [], {
    effect: ({ options, value }: any) => {
      const valid = options.some((o: any) => o.value === value)
      return valid ? undefined : { value: options[0]?.value ?? '' }
    },
    effectArgs: ['options', 'value'],
  }),

  'product.maxCoverageNote.value': from('product.type', (t: string) =>
    `最高可选 ${MAX_COVERAGE[t] ?? 2000} 万`
  ),

  // ── 保费计算联动 ──────────────────────────────────────────────────
  'premium.baseRate.value': from(
    ['product.type', 'insured.age', 'insured.gender'],
    (t: string, age: number, g: string) => {
      const raw = RATE_TABLE[t]?.[ageBracket(age)] ?? 5
      return Math.round(raw * (g === 'F' ? 0.85 : 1.0) * 100) / 100
    }
  ),

  'premium.basePremium.value': from(
    ['product.coverageAmount', 'premium.baseRate'],
    (ca: number, rate: number) => Math.round(ca * rate * 10)
  ),

  'premium.perPayment.value': from(
    ['premium.finalPremium', 'product.paymentFreq'],
    (premium: number, freq: string) => {
      const cfg = FREQ_FACTOR[freq] ?? { factor: 1, times: 1 }
      return Math.round(premium * cfg.factor / cfg.times)
    }
  ),

  'premium.medicalNote.value': from('product.coverageAmount', (ca: number) =>
    ca >= MEDICAL_THRESHOLD ? `保额 ≥ ${MEDICAL_THRESHOLD} 万，需安排体检` : '无需体检'
  ),

  // ── 受益人字段显隐 ────────────────────────────────────────────────
  'beneficiary.name.hidden':       from('beneficiary.type', (t: string) => t === 'legal'),
  'beneficiary.rel.hidden':        from('beneficiary.type', (t: string) => t === 'legal'),
  'beneficiary.proportion.hidden': from('beneficiary.type', (t: string) => t === 'legal'),

  // ── 核保提示显隐（各条独立，整组由 MeshGroupRenderer 自动推断）────
  'warnings.highRiskNote.hidden': from('insured.occupation', (occ: string) => {
    const o = OCCUPATION_OPTIONS.find(x => x.value === occ)
    return !o || o.surcharge === 0
  }),
  'warnings.bmiNote.hidden':      from('health.bmi',            (b: number)  => b < 28),
  'warnings.diseaseNote.hidden':  from('health.chronicDisease', (v: boolean) => !v),
  'warnings.ageNote.hidden':      from('insured.age',           (a: number)  => a <= 60),
  'warnings.surgeryNote.hidden':  from('health.surgery',        (v: boolean) => !v),
  'warnings.familyNote.hidden':   from('health.familyHistory',  (v: boolean) => !v),

  // 警告文本动态化（带实际值）
  'warnings.highRiskNote.value': from('insured.occupation', (occ: string) => {
    const o = OCCUPATION_OPTIONS.find(x => x.value === occ)
    return `职业"${o?.label}"属于高风险职业（附加费率 +${Math.round((o?.surcharge ?? 0) * 100)}%），承保需经核保审查，请提供职业证明材料。`
  }),
  'warnings.bmiNote.value': from(['health.bmi', 'health.bmiStatus'], (b: number, status: string) =>
    `当前 BMI ${b}（${status}），超出正常范围，将收取体重附加费（+${b >= 32 ? 20 : 10}%）并可能需要体检核实。`
  ),
  'warnings.ageNote.value': from('insured.age', (a: number) =>
    `被保险人年龄 ${a} 岁，超过 60 岁上限，部分险种受限，请联系客服确认可投险种及体检安排。`
  ),

  // 家族病史影响保费
  'premium.finalPremium.value': from(
    ['premium.basePremium', 'insured.occupation', 'health.bmi', 'health.smoke', 'health.familyHistory', 'product.addAccident', 'product.addDisability'],
    (base: number, occ: string, bmi: number, smoke: boolean, familyHistory: boolean, accident: boolean, disability: boolean) => {
      const o             = OCCUPATION_OPTIONS.find(x => x.value === occ)
      const occAdd        = Math.round(base * (o?.surcharge ?? 0))
      const smokeAdd      = smoke         ? Math.round(base * 0.30) : 0
      const bmiAdd        = bmi >= 32     ? Math.round(base * 0.20) : bmi >= 28 ? Math.round(base * 0.10) : 0
      const familyAdd     = familyHistory ? Math.round(base * 0.15) : 0
      const accidentAdd   = accident      ? Math.round(base * 0.05) : 0
      const disabilityAdd = disability    ? Math.round(base * 0.08) : 0
      return base + occAdd + smokeAdd + bmiAdd + familyAdd + accidentAdd + disabilityAdd
    }
  ),
}

// ── 自定义 UISchema ──────────────────────────────────────────────────────────
function c(scope: string, span = 1) {
  return { type: 'Control', scope, ...(span !== 1 ? { options: { span } } : {}) } as any
}
function row(...els: any[]) { return { type: 'HorizontalLayout', elements: els } as any }
function group(label: string, ...elements: any[]) {
  return { type: 'Group', label, elements } as any
}

const warningsGroup = {
  type: 'Group',
  label: '核保提示',
  options: { nodePath: 'warnings' },
  elements: [
    row(c('#/properties/warnings/properties/highRiskNote')),
    row(c('#/properties/warnings/properties/bmiNote')),
    row(c('#/properties/warnings/properties/diseaseNote')),
    row(c('#/properties/warnings/properties/ageNote')),
    row(c('#/properties/warnings/properties/surgeryNote')),
    row(c('#/properties/warnings/properties/familyNote')),
  ],
}

const uischema = {
  type: 'VerticalLayout',
  elements: [
    group('投保人信息',
      row(c('#/properties/policyholder/properties/name', 2), c('#/properties/policyholder/properties/gender')),
      row(c('#/properties/policyholder/properties/birthYear'), c('#/properties/policyholder/properties/age')),
      row(c('#/properties/policyholder/properties/phone'), c('#/properties/policyholder/properties/idType'), c('#/properties/policyholder/properties/idNumber')),
      row(c('#/properties/policyholder/properties/relationship')),
    ),
    group('被保险人信息',
      row(c('#/properties/insured/properties/name'), c('#/properties/insured/properties/gender'), c('#/properties/insured/properties/birthYear')),
      row(c('#/properties/insured/properties/age'), c('#/properties/insured/properties/idType'), c('#/properties/insured/properties/idNumber')),
      row(c('#/properties/insured/properties/occupation'), c('#/properties/insured/properties/occupationRisk')),
    ),
    group('险种方案',
      row(c('#/properties/product/properties/type'), c('#/properties/product/properties/term'), c('#/properties/product/properties/paymentPeriod')),
      row(c('#/properties/product/properties/paymentFreq'), c('#/properties/product/properties/paymentMethod')),
      row(c('#/properties/product/properties/coverageAmount'), c('#/properties/product/properties/maxCoverageNote')),
      row(c('#/properties/product/properties/addAccident'), c('#/properties/product/properties/addDisability')),
    ),
    group('健康告知',
      row(c('#/properties/health/properties/height'), c('#/properties/health/properties/weight')),
      row(c('#/properties/health/properties/bmi'), c('#/properties/health/properties/bmiStatus')),
      row(c('#/properties/health/properties/smoke'), c('#/properties/health/properties/chronicDisease'), c('#/properties/health/properties/surgery'), c('#/properties/health/properties/familyHistory')),
    ),
    group('受益人',
      row(c('#/properties/beneficiary/properties/type'), c('#/properties/beneficiary/properties/name', 2), c('#/properties/beneficiary/properties/rel'), c('#/properties/beneficiary/properties/proportion')),
    ),
    warningsGroup,
    group('保费汇总',
      row(c('#/properties/premium/properties/baseRate'), c('#/properties/premium/properties/basePremium'), c('#/properties/premium/properties/finalPremium'), c('#/properties/premium/properties/perPayment')),
      row(c('#/properties/premium/properties/medicalNote')),
    ),
  ],
}

// ── 状态 ──────────────────────────────────────────────────────────────────────
const submitted = ref(false)
const submittedData = ref<Record<string, any>>({})
const submittedStr = computed(() => JSON.stringify(submittedData.value, null, 2))

function onFormChange(_data: Record<string, any>) {}
function onSubmit(data: Record<string, any>) {
  submittedData.value = data
  submitted.value = true
}
</script>

<style scoped>
/* ── 外层容器 — 与 EntangleDemo 同款 ───────────────────────────── */
.ins-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
  margin: 24px 0;
  font-size: 13px;
}

/* ── Header ─────────────────────────────────────────────────────── */
.ins-header {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 13px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.ins-badge {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff; font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  font-family: 'JetBrains Mono', monospace;
}
.ins-title { font-size: 14px; font-weight: 700; color: var(--vp-c-text-1); }
.ins-desc  { font-size: 11px; color: var(--vp-c-text-2); margin-left: auto; }

/* v-app 透明：只提供 Vuetify theme context，不影响外层样式 */
.ins-vapp {
  background: transparent !important;
  min-height: 0 !important;
  display: block !important;
}

/* ── 表单主体 ────────────────────────────────────────────────────── */
.ins-body {
  padding: 20px 24px;
}
.ins-body :deep(.v-input__details) {
  display: none !important;
}
.ins-body :deep(.v-checkbox) {
  align-items: center !important;
  padding-top: 4px;
}
.ins-body :deep(.v-checkbox .v-label) {
  font-size: 13px;
  opacity: 0.92;
}
.ins-body :deep(.v-input--density-comfortable) {
  --v-input-padding-top: 4px;
}
.ins-body :deep(.mesh-group__body--vertical) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ins-body :deep(.mesh-group__body--vertical:has(.warn-box)) {
  gap: 0;
}
.ins-body :deep(.mesh-layout--horizontal) {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px 16px !important;
  width: 100% !important;
}
.ins-body :deep(.mesh-layout__item),
.ins-body :deep(.mesh-layout--horizontal > *) {
  flex: 1 1 160px !important;
  min-width: 0 !important;
}
.ins-body :deep(.mesh-group) {
  margin-bottom: 12px;
}
.ins-actions { padding-top: 8px; }

/* ── 提交结果 ────────────────────────────────────────────────────── */
.ins-result {
  border-top: 1px solid var(--vp-c-border);
  overflow: hidden;
}
.ins-result-hd {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 20px;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: #4caf50;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.ins-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}
.ins-dot--green { background: #4caf50; box-shadow: 0 0 5px #4caf50; }
.ins-result-pre {
  margin: 0;
  padding: 14px 20px;
  font-size: 11px; line-height: 1.6;
  color: var(--vp-c-text-2);
  white-space: pre-wrap; word-break: break-all;
  max-height: 400px; overflow-y: auto;
  font-family: 'JetBrains Mono', monospace;
  background: var(--vp-c-bg-soft);
}
</style>
