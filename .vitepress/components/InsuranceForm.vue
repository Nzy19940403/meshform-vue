<template>
  <div class="ins-wrap">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="ins-header">
      <span class="ins-badge">⧩ MeshForm</span>
      <span class="ins-title">人寿保险投保申请 — 14 条联动规则</span>
      <span class="ins-desc">BMI 自动计算、职业风险附加费、险种联动保费</span>
    </div>

    <!-- v-app 提供 Vuetify theme context，设为透明不干扰外层样式 -->
    <v-app theme="dark" class="ins-vapp">
      <!-- ── 表单主体 ─────────────────────────────────────────────────── -->
      <div class="ins-body">
        <MeshForm :schema="schema" :rules="rules" :uischema="uischema" @change="onFormChange" @submit="onSubmit">
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
import { ref, computed } from 'vue'
import { MeshForm, from } from '@meshflow/form-vue'
import type { MeshFormSchema, FromDescriptor } from '@meshflow/form-vue'

// ── 静态数据 ──────────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear()

const BIRTH_YEAR_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const y = 2008 - i
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

// ── Schema ────────────────────────────────────────────────────────────────────
const schema: MeshFormSchema = {
  type: 'object',
  title: '人寿保险投保申请',
  properties: {
    insured: {
      type: 'object',
      title: '被保险人信息',
      'x-layout': 'horizontal',
      properties: {
        name:      { type: 'string',  title: '姓名',     default: '', 'x-placeholder': '请输入姓名' },
        gender: {
          type: 'string', title: '性别', default: 'M', 'x-widget': 'select',
          'x-options': [{ label: '男', value: 'M' }, { label: '女', value: 'F' }],
        },
        birthYear: {
          type: 'integer', title: '出生年份', default: 1990,
          'x-widget': 'select', 'x-options': BIRTH_YEAR_OPTIONS,
        },
        age:            { type: 'integer', title: '年龄',     default: 35, 'x-readonly': true, 'x-disabled': true },
        idType: {
          type: 'string', title: '证件类型', default: 'id', 'x-widget': 'select',
          'x-options': [
            { label: '居民身份证',             value: 'id' },
            { label: '护照',                   value: 'passport' },
            { label: '军官证',                 value: 'military' },
            { label: '港澳居民来往内地通行证', value: 'hk' },
          ],
        },
        idNumber:       { type: 'string',  title: '证件号码',   default: '' },
        occupation: {
          type: 'string', title: '职业类别', default: 'admin', 'x-widget': 'select',
          'x-options': OCCUPATION_OPTIONS.map(({ label, value }) => ({ label, value })),
        },
        occupationRisk: { type: 'string', title: '职业风险等级', default: '普通职业（标准费率）', 'x-readonly': true, 'x-disabled': true },
      },
    },
    health: {
      type: 'object',
      title: '健康告知',
      'x-layout': 'horizontal',
      properties: {
        height:          { type: 'integer', title: '身高 (cm)', default: 170, 'x-min': 100 },
        weight:          { type: 'integer', title: '体重 (kg)', default: 65,  'x-min': 30 },
        bmi:             { type: 'number',  title: 'BMI',       default: 22.5, 'x-readonly': true, 'x-disabled': true },
        bmiStatus:       { type: 'string',  title: '体重状态',  default: '正常', 'x-readonly': true, 'x-disabled': true },
        smoke:           { type: 'boolean', title: '有吸烟史',  default: false },
        chronicDisease:  { type: 'boolean', title: '患有慢性病', default: false },
        surgery:         { type: 'boolean', title: '两年内手术', default: false },
        familyHistory:   { type: 'boolean', title: '家族病史',  default: false },
      },
    },
    product: {
      type: 'object',
      title: '险种选择',
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
        term:          { type: 'string', title: '保险期限', default: '20', 'x-widget': 'select', 'x-options': [] },
        paymentPeriod: { type: 'string', title: '缴费期限', default: 'same', 'x-widget': 'select', 'x-options': [] },
        paymentFreq: {
          type: 'string', title: '缴费频率', default: 'annual', 'x-widget': 'select',
          'x-options': [
            { label: '年缴',   value: 'annual' },
            { label: '半年缴', value: 'semi' },
            { label: '季缴',   value: 'quarter' },
            { label: '月缴',   value: 'monthly' },
          ],
        },
        coverageAmount:  { type: 'number', title: '保额 (万)', default: 100, 'x-min': 10 },
        maxCoverageNote: { type: 'string', title: '最高可选保额', default: '最高 2000 万', 'x-readonly': true, 'x-disabled': true },
        addAccident:     { type: 'boolean', title: '附加意外险 (+5%)', default: false },
        addDisability:   { type: 'boolean', title: '附加残疾险 (+8%)', default: false },
      },
    },
    premium: {
      type: 'object',
      title: '保费汇总',
      'x-layout': 'horizontal',
      properties: {
        baseRate:      { type: 'number', title: '基础费率 (‰)',  default: 0, 'x-readonly': true, 'x-disabled': true },
        basePremium:   { type: 'number', title: '基础年保费 (¥)', default: 0, 'x-readonly': true, 'x-disabled': true },
        finalPremium:  { type: 'number', title: '应缴年保费 (¥)', default: 0, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
        perPayment:    { type: 'number', title: '每期金额 (¥)',   default: 0, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'info' },
        medicalNote:   { type: 'string', title: '体检要求',       default: '无需体检', 'x-readonly': true, 'x-disabled': true },
      },
    },
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
        name:        { type: 'string',  title: '受益人姓名',     default: '', 'x-hidden': true },
        rel: {
          type: 'string', title: '与被保人关系', default: 'spouse',
          'x-widget': 'select', 'x-hidden': true,
          'x-options': [
            { label: '配偶',   value: 'spouse' },
            { label: '子女',   value: 'child' },
            { label: '父母',   value: 'parent' },
            { label: '其他',   value: 'other' },
          ],
        },
        proportion:  { type: 'integer', title: '受益比例 (%)',   default: 100, 'x-hidden': true },
      },
    },
  },
}

// ── Rules ─────────────────────────────────────────────────────────────────────
const rules: Record<string, FromDescriptor> = {
  // 年龄自动计算
  'insured.age.value': from('insured.birthYear', (y: number) => CURRENT_YEAR - y),

  // 证件号码占位文本
  'insured.idNumber.placeholder': from('insured.idType', (t: string) => ({
    id: '请输入 18 位身份证号码',
    passport: '请输入护照号码',
    military: '请输入军官证号码',
    hk: '请输入港澳通行证号码',
  }[t] ?? '请输入证件号码')),

  // 职业风险描述
  'insured.occupationRisk.value': from('insured.occupation', (occ: string) => {
    const o = OCCUPATION_OPTIONS.find(x => x.value === occ)
    if (!o) return ''
    if (o.surcharge === 0)   return '普通职业（标准费率）'
    if (o.surcharge <= 0.3)  return `体力职业（附加 ${Math.round(o.surcharge * 100)}%）`
    return `高危职业（附加 ${Math.round(o.surcharge * 100)}%）`
  }),

  // BMI 计算
  'health.bmi.value': from(['health.height', 'health.weight'], (h: number, w: number) => {
    if (!h || !w) return 0
    return Math.round(w / Math.pow(h / 100, 2) * 10) / 10
  }),

  // BMI 状态描述
  'health.bmiStatus.value': from('health.bmi', (b: number) => {
    if (!b)    return '—'
    if (b < 18.5) return '偏瘦'
    if (b < 24)   return '正常'
    if (b < 28)   return '超重'
    if (b < 32)   return '肥胖 I 级'
    return '肥胖 II 级'
  }),

  // 险种 → 保险期限选项（选项变更时自动重置值）
  'product.term.options': from('product.type', (t: string) => TERM_OPTIONS[t] ?? [], {
    effect: ({ options, value }: any) => {
      const valid = options.some((o: any) => o.value === value)
      return valid ? undefined : { value: options[0]?.value ?? '' }
    },
    effectArgs: ['options', 'value'],
  }),

  // 险种 → 缴费期限选项
  'product.paymentPeriod.options': from('product.type', (t: string) => PAYMENT_PERIOD_OPTIONS[t] ?? [], {
    effect: ({ options, value }: any) => {
      const valid = options.some((o: any) => o.value === value)
      return valid ? undefined : { value: options[0]?.value ?? '' }
    },
    effectArgs: ['options', 'value'],
  }),

  // 险种 → 最高保额提示
  'product.maxCoverageNote.value': from('product.type', (t: string) =>
    `最高可选 ${MAX_COVERAGE[t] ?? 2000} 万`
  ),

  // 基础费率（险种 + 年龄 + 性别）
  'premium.baseRate.value': from(
    ['product.type', 'insured.age', 'insured.gender'],
    (t: string, age: number, g: string) => {
      const raw = RATE_TABLE[t]?.[ageBracket(age)] ?? 5
      return Math.round(raw * (g === 'F' ? 0.85 : 1.0) * 100) / 100
    }
  ),

  // 基础年保费
  'premium.basePremium.value': from(
    ['product.coverageAmount', 'premium.baseRate'],
    (ca: number, rate: number) => Math.round(ca * rate * 10)
  ),

  // 最终年保费（含职业/BMI/吸烟/附加险附加费）
  'premium.finalPremium.value': from(
    ['premium.basePremium', 'insured.occupation', 'health.bmi', 'health.smoke', 'product.addAccident', 'product.addDisability'],
    (base: number, occ: string, bmi: number, smoke: boolean, accident: boolean, disability: boolean) => {
      const o = OCCUPATION_OPTIONS.find(x => x.value === occ)
      const occAdd      = Math.round(base * (o?.surcharge ?? 0))
      const smokeAdd    = smoke      ? Math.round(base * 0.30) : 0
      const bmiAdd      = bmi >= 32  ? Math.round(base * 0.20) : bmi >= 28 ? Math.round(base * 0.10) : 0
      const accidentAdd = accident   ? Math.round(base * 0.05) : 0
      const disabilityAdd = disability ? Math.round(base * 0.08) : 0
      return base + occAdd + smokeAdd + bmiAdd + accidentAdd + disabilityAdd
    }
  ),

  // 每期缴费金额
  'premium.perPayment.value': from(
    ['premium.finalPremium', 'product.paymentFreq'],
    (premium: number, freq: string) => {
      const cfg = FREQ_FACTOR[freq] ?? { factor: 1, times: 1 }
      return Math.round(premium * cfg.factor / cfg.times)
    }
  ),

  // 体检要求
  'premium.medicalNote.value': from('product.coverageAmount', (ca: number) =>
    ca >= MEDICAL_THRESHOLD ? `保额 ≥ ${MEDICAL_THRESHOLD} 万，需安排体检` : '无需体检'
  ),

  // 受益人字段显隐（指定受益人时才显示）
  'beneficiary.name.hidden':       from('beneficiary.type', (t: string) => t === 'legal'),
  'beneficiary.rel.hidden':        from('beneficiary.type', (t: string) => t === 'legal'),
  'beneficiary.proportion.hidden': from('beneficiary.type', (t: string) => t === 'legal'),
}

// ── 自定义 UISchema ──────────────────────────────────────────────────────────
// 2-3 列布局，避免一行太长，checkbox 拆成两行两列
function ctrl(scope: string) {
  return { type: 'Control', scope } as any
}
function hbox(...scopes: string[]) {
  return { type: 'HorizontalLayout', elements: scopes.map(ctrl) } as any
}
function group(label: string, ...elements: any[]) {
  return { type: 'Group', label, elements } as any
}

const uischema = {
  type: 'VerticalLayout',
  elements: [
    group('被保险人信息',
      hbox(
        '#/properties/insured/properties/name',
        '#/properties/insured/properties/gender',
        '#/properties/insured/properties/birthYear',
      ),
      hbox(
        '#/properties/insured/properties/age',
        '#/properties/insured/properties/idType',
        '#/properties/insured/properties/idNumber',
      ),
      hbox(
        '#/properties/insured/properties/occupation',
        '#/properties/insured/properties/occupationRisk',
      ),
    ),
    group('健康告知',
      hbox(
        '#/properties/health/properties/height',
        '#/properties/health/properties/weight',
        '#/properties/health/properties/bmi',
        '#/properties/health/properties/bmiStatus',
      ),
      hbox(
        '#/properties/health/properties/smoke',
        '#/properties/health/properties/chronicDisease',
      ),
      hbox(
        '#/properties/health/properties/surgery',
        '#/properties/health/properties/familyHistory',
      ),
    ),
    group('险种选择',
      hbox(
        '#/properties/product/properties/type',
        '#/properties/product/properties/term',
        '#/properties/product/properties/paymentPeriod',
      ),
      hbox(
        '#/properties/product/properties/paymentFreq',
        '#/properties/product/properties/coverageAmount',
        '#/properties/product/properties/maxCoverageNote',
      ),
      hbox(
        '#/properties/product/properties/addAccident',
        '#/properties/product/properties/addDisability',
      ),
    ),
    group('保费汇总',
      hbox(
        '#/properties/premium/properties/baseRate',
        '#/properties/premium/properties/basePremium',
        '#/properties/premium/properties/finalPremium',
      ),
      hbox(
        '#/properties/premium/properties/perPayment',
        '#/properties/premium/properties/medicalNote',
      ),
    ),
    group('受益人',
      hbox(
        '#/properties/beneficiary/properties/type',
        '#/properties/beneficiary/properties/name',
      ),
      hbox(
        '#/properties/beneficiary/properties/rel',
        '#/properties/beneficiary/properties/proportion',
      ),
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
/* 组内行间距减小 */
.ins-body :deep(.mesh-group__body--vertical > .mesh-layout__item) {
  margin-bottom: 0;
}
.ins-body :deep(.mesh-layout--horizontal) {
  gap: 8px;
}
.ins-body :deep(.mesh-group) {
  margin-bottom: 6px;
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
