<template>
  <div class="pf-wrap">
    <div class="pf-header">
      <span class="pf-badge">⧩ MeshForm</span>
      <span class="pf-title">养老年金规划 — 30 条联动规则 · 双向计算</span>
      <span class="pf-desc">设定缴费 → 看能领多少 · 设定目标 → 看还差多少</span>
    </div>

    <v-app theme="dark" class="pf-vapp">
      <div class="pf-body">
        <MeshForm
          :schema="schema"
          :rules="rules"
          :uischema="uischema"
          :renderers="customRenderers"
          @change="onFormChange"
          @submit="onSubmit"
        >
          <template #actions="{ submit }">
            <div class="pf-actions">
              <v-btn color="primary" variant="tonal" @click="submit">保存规划方案</v-btn>
            </div>
          </template>
        </MeshForm>
      </div>

      <div v-if="submitted" class="pf-result">
        <div class="pf-result-hd">
          <span class="pf-dot pf-dot--green" />✓ 规划方案已保存
        </div>
        <pre class="pf-result-pre">{{ submittedStr }}</pre>
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

// ── 投资风格 → 预期年化收益率 ────────────────────────────────────────────────
const STYLE_RETURN: Record<string, number> = {
  conservative: 3.5,   // 保守：债券为主
  balanced:     5.5,   // 平衡：股债均衡
  aggressive:   8.0,   // 积极：权益为主
}

/**
 * 终值（Future Value）
 * FV = pmt × [(1+r)^n - 1] / r
 */
function fv(monthlyRate: number, periods: number, pmt: number): number {
  if (monthlyRate <= 0 || periods <= 0) return pmt * periods
  return pmt * ((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate)
}

/**
 * 年金现值反推每期金额（用于计算月退休金）
 * PMT = PV × r / [1 - (1+r)^(-n)]
 */
function annuityPmt(monthlyRate: number, periods: number, pv: number): number {
  if (monthlyRate <= 0 || periods <= 0) return pv / Math.max(1, periods)
  return pv * monthlyRate / (1 - Math.pow(1 + monthlyRate, -periods))
}

/**
 * 年金现值（用于反推所需积累金额）
 * PV = pmt × [1 - (1+r)^(-n)] / r
 */
function annuityPv(monthlyRate: number, periods: number, pmt: number): number {
  if (monthlyRate <= 0 || periods <= 0) return pmt * periods
  return pmt * (1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate
}

// ── Pre-computed initial values (schema defaults → flicker-free first render) ─
// Defaults: currentAge=30, retirementAge=60, withdrawYears=20, currentWage=10000
//           wageGrowthRate=3, style='balanced'→annualReturn=5.5, inflationRate=2.5
//           personalMonthly=2000, companyMatchRate=50, targetRate=70
const INIT_ACCUM_YEARS     = Math.max(1, 60 - 30)                         // 30
const INIT_ANNUAL_RETURN   = STYLE_RETURN['balanced']                      // 5.5
const INIT_TOTAL_MONTHLY   = Math.round(2000 * (1 + 50 / 100))            // 3000
const INIT_ANNUAL_TOTAL    = INIT_TOTAL_MONTHLY * 12                       // 36000
const INIT_TAX_BEN_LIMIT   = Math.round(10000 * 12 * 0.06)                // 7200

const INIT_RET_WAGE        = Math.round(10000 * Math.pow(1 + 3 / 100, INIT_ACCUM_YEARS))
const INIT_ACCUM_FV        = Math.round(fv(INIT_ANNUAL_RETURN / 100 / 12, INIT_ACCUM_YEARS * 12, INIT_TOTAL_MONTHLY))
const INIT_REAL_POWER      = Math.round(INIT_ACCUM_FV / Math.pow(1 + 2.5 / 100, INIT_ACCUM_YEARS))
const INIT_MONTHLY_PENSION = Math.round(annuityPmt(INIT_ANNUAL_RETURN * 0.5 / 100 / 12, 20 * 12, INIT_ACCUM_FV))
const INIT_REPLACE_RATE    = INIT_RET_WAGE > 0
  ? Math.round(INIT_MONTHLY_PENSION / INIT_RET_WAGE * 100 * 10) / 10 : 0
const INIT_REPLACE_STATUS  = INIT_REPLACE_RATE >= 80 ? `🟢 优秀（${INIT_REPLACE_RATE}%）`
  : INIT_REPLACE_RATE >= 60 ? `🟡 良好（${INIT_REPLACE_RATE}%）`
  : INIT_REPLACE_RATE >= 40 ? `🟠 一般（${INIT_REPLACE_RATE}%）`
  : `🔴 不足（${INIT_REPLACE_RATE}%）`

const INIT_TARGET_PENSION  = Math.round(INIT_RET_WAGE * 70 / 100)
const INIT_REQ_ACCUM       = Math.round(annuityPv(INIT_ANNUAL_RETURN * 0.5 / 100 / 12, 20 * 12, INIT_TARGET_PENSION))
const _rr = INIT_ANNUAL_RETURN / 100 / 12
const _rp = INIT_ACCUM_YEARS * 12
const INIT_REQ_MONTHLY     = _rr <= 0 || _rp <= 0
  ? Math.round(INIT_REQ_ACCUM / Math.max(1, _rp))
  : Math.round(INIT_REQ_ACCUM * _rr / (Math.pow(1 + _rr, _rp) - 1))
const INIT_PERS_GAP        = Math.round(INIT_REQ_MONTHLY / (1 + 50 / 100) - 2000)
const INIT_GAP_NOTE        = INIT_PERS_GAP <= 0
  ? `✅ 当前方案可达成目标，月缴还有余裕 ¥${Math.abs(INIT_PERS_GAP).toLocaleString()}`
  : `每月还需追加个人缴费 ¥${INIT_PERS_GAP.toLocaleString()}（或增加企业配比）`

// ── Schema ────────────────────────────────────────────────────────────────────
const schema: MeshFormSchema = {
  type: 'object',
  title: '养老年金规划',
  properties: {

    // ① 个人基本信息
    personal: {
      type: 'object', title: '个人信息',
      properties: {
        currentAge:     { type: 'integer', title: '当前年龄',     default: 30,
                          'x-widget': 'number-input', 'x-min': 18, 'x-max': 59 },
        retirementAge:  { type: 'integer', title: '计划退休年龄', default: 60,
                          'x-widget': 'number-input', 'x-min': 45, 'x-max': 70 },
        accumYears:     { type: 'integer', title: '积累年限（年）',default: 30,
                          'x-readonly': true, 'x-disabled': true              },
        withdrawYears:  { type: 'integer', title: '计划领取年限', default: 20,
                          'x-widget': 'number-input', 'x-min': 5, 'x-max': 40 },
        currentWage:    { type: 'number',  title: '当前月收入 (元)', default: 10000,
                          'x-widget': 'number-input', 'x-min': 2000, 'x-step': 500 },
        wageGrowthRate: {
          type: 'number', title: '年收入增长率', default: 3, 'x-widget': 'select',
          'x-options': [
            { label: '1%（保守）',  value: 1 },
            { label: '2%',          value: 2 },
            { label: '3%（基准）',  value: 3 },
            { label: '4%',          value: 4 },
            { label: '5%（乐观）',  value: 5 },
          ],
        },
      },
    },

    // ② 投资策略
    strategy: {
      type: 'object', title: '投资策略',
      properties: {
        style: {
          type: 'string', title: '投资风格', default: 'balanced', 'x-widget': 'select',
          'x-options': [
            { label: '保守型（债券为主，预期 3.5%）',   value: 'conservative' },
            { label: '平衡型（股债均衡，预期 5.5%）',   value: 'balanced'     },
            { label: '积极型（权益为主，预期 8.0%）',   value: 'aggressive'   },
          ],
        },
        annualReturn:  { type: 'number', title: '年化收益率 (%)', default: 5.5,
                         'x-readonly': true, 'x-disabled': true },
        inflationRate: {
          type: 'number', title: '通胀假设 (%)', default: 2.5, 'x-widget': 'select',
          'x-options': [
            { label: '2%（低通胀）',  value: 2   },
            { label: '2.5%（基准）',  value: 2.5 },
            { label: '3%（高通胀）',  value: 3   },
          ],
        },
      },
    },

    // ③ 缴费方案（正向输入）
    contribution: {
      type: 'object', title: '缴费方案',
      properties: {
        personalMonthly: { type: 'number',  title: '个人月缴额 (元)', default: 2000,
                            'x-widget': 'number-input', 'x-min': 0, 'x-step': 100  },
        companyMatchRate: { type: 'integer', title: '企业配比 (%)',    default: 50,
                            'x-widget': 'number-input', 'x-min': 0, 'x-max': 200   },
        totalMonthly:     { type: 'number',  title: '月缴合计 (元)',   default: INIT_TOTAL_MONTHLY,
                            'x-readonly': true, 'x-disabled': true, 'x-theme': 'info' },
        annualTotal:      { type: 'number',  title: '年缴合计 (元)',   default: INIT_ANNUAL_TOTAL,
                            'x-readonly': true, 'x-disabled': true                   },
        taxBenefitLimit:  { type: 'number',  title: '税优上限 (元/年)', default: INIT_TAX_BEN_LIMIT,
                            'x-readonly': true, 'x-disabled': true                   },
      },
    },

    // ④ 正向计算：预估退休金
    forward: {
      type: 'object', title: '正向推算 · 我能领多少',
      properties: {
        accumulatedFv:        { type: 'number', title: '退休时积累金额 (元)',  default: INIT_ACCUM_FV,        'x-readonly': true, 'x-disabled': true },
        realPurchasingPower:  { type: 'number', title: '通胀折现购买力 (元)', default: INIT_REAL_POWER,       'x-readonly': true, 'x-disabled': true },
        retirementWage:       { type: 'number', title: '退休时月工资 (元)',   default: INIT_RET_WAGE,         'x-readonly': true, 'x-disabled': true },
        monthlyPension:       { type: 'number', title: '预估月退休金 (元)',   default: INIT_MONTHLY_PENSION,  'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
        replacementRate:      { type: 'number', title: '养老替代率 (%)',      default: INIT_REPLACE_RATE,     'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
        replacementStatus:    { type: 'string', title: '替代率评级',          default: INIT_REPLACE_STATUS,   'x-readonly': true, 'x-disabled': true },
      },
    },

    // ⑤ 反向推算：达到目标需要缴多少
    reverse: {
      type: 'object', title: '反向推算 · 达到目标还差多少',
      properties: {
        targetRate:          { type: 'integer', title: '目标替代率 (%)',    default: 70,
                               'x-widget': 'number-input', 'x-min': 10, 'x-max': 100 },
        targetMonthlyPension:{ type: 'number',  title: '对应目标月退休金 (元)', default: INIT_TARGET_PENSION,
                               'x-readonly': true, 'x-disabled': true },
        requiredAccumulation:{ type: 'number',  title: '需积累总金额 (元)', default: INIT_REQ_ACCUM,
                               'x-readonly': true, 'x-disabled': true },
        requiredMonthly:     { type: 'number',  title: '建议月缴合计 (元)', default: INIT_REQ_MONTHLY,
                               'x-readonly': true, 'x-disabled': true, 'x-theme': 'warning' },
        personalGap:         { type: 'number',  title: '个人月缴缺口 (元)', default: INIT_PERS_GAP,
                               'x-readonly': true, 'x-disabled': true, 'x-theme': 'error'   },
        gapNote:             { type: 'string',  title: '缺口说明',          default: INIT_GAP_NOTE,
                               'x-readonly': true, 'x-disabled': true },
      },
    },

    // ⑥ 核保/规划提示
    warnings: {
      type: 'object', title: '规划提示',
      properties: {
        shortfall: {
          type: 'string', title: '⚠ 替代率不足',
          default: '当前缴费方案下，养老替代率低于目标，建议增加缴费或调整退休年龄。',
          // 默认：替代率~60% < 目标70%，初始就应显示；规则运行后会正确更新
          'x-readonly': true, 'x-disabled': true, 'x-hidden': false,
        },
        taxOver: {
          type: 'string', title: '⚠ 超税优上限',
          default: '个人年缴额已超过税收优惠上限（月薪×12×6%），超出部分无法享受税前扣除。',
          // 默认：个人年缴 24000 > 税优上限 7200，初始就应显示
          'x-readonly': true, 'x-disabled': true, 'x-hidden': false,
        },
        tooShort: {
          type: 'string', title: '⚠ 积累年限过短',
          default: '积累年限不足 10 年，复利效应有限，建议尽早启动养老规划。',
          // 默认：积累年限 30 年 ≥ 10 年，初始正确隐藏
          'x-readonly': true, 'x-disabled': true, 'x-hidden': true,
        },
      },
    },
  },
}

// ── Rules（30 条）────────────────────────────────────────────────────────────
const rules: Record<string, FromDescriptor> = {

  // ── ① 个人信息推导（2 条）─────────────────────────────────────────────────
  'personal.accumYears.value': from(
    ['personal.retirementAge', 'personal.currentAge'],
    (ret: number, cur: number) => Math.max(1, ret - cur)
  ),

  // ── ② 投资策略（1 条）────────────────────────────────────────────────────
  'strategy.annualReturn.value': from(
    'strategy.style',
    (s: string) => STYLE_RETURN[s] ?? 5.5
  ),

  // ── ③ 缴费方案（4 条）────────────────────────────────────────────────────
  'contribution.totalMonthly.value': from(
    ['contribution.personalMonthly', 'contribution.companyMatchRate'],
    (personal: number, matchRate: number) =>
      Math.round(personal * (1 + matchRate / 100))
  ),
  'contribution.annualTotal.value': from(
    'contribution.totalMonthly',
    (total: number) => total * 12
  ),
  // 税优上限：个人年缴不超过月收入×12×6%
  'contribution.taxBenefitLimit.value': from(
    'personal.currentWage',
    (wage: number) => Math.round(wage * 12 * 0.06)
  ),
  // ⚠ 不能把 contribution.personalMonthly 放入自身规则的 sources 中（会在 DAG 形成自环导致死锁）
  // 超税优的视觉提示改由 warnings.taxOver 警告字段承担，此处不设 theme 规则

  // ── ④ 正向计算（8 条）────────────────────────────────────────────────────

  // 退休时月工资（名义）
  'forward.retirementWage.value': from(
    ['personal.currentWage', 'personal.wageGrowthRate', 'personal.accumYears'],
    (wage: number, growthRate: number, years: number) =>
      Math.round(wage * Math.pow(1 + growthRate / 100, years))
  ),

  // 月缴利率
  // （内部中间量，通过 forward.accumulatedFv 的来源直接内联计算）

  // 积累期终值 FV
  'forward.accumulatedFv.value': from(
    ['contribution.totalMonthly', 'strategy.annualReturn', 'personal.accumYears'],
    (pmt: number, annualReturn: number, years: number) => {
      const r = annualReturn / 100 / 12
      return Math.round(fv(r, years * 12, pmt))
    }
  ),

  // 通胀折现购买力
  'forward.realPurchasingPower.value': from(
    ['forward.accumulatedFv', 'strategy.inflationRate', 'personal.accumYears'],
    (accumFv: number, inflation: number, years: number) =>
      Math.round(accumFv / Math.pow(1 + inflation / 100, years))
  ),

  // 月退休金：用积累金额按领取期年金摊平
  // 领取期收益率取积累期的一半（更保守的运作策略）
  'forward.monthlyPension.value': from(
    ['forward.accumulatedFv', 'strategy.annualReturn', 'personal.withdrawYears'],
    (accumFv: number, annualReturn: number, withdrawYears: number) => {
      const r = (annualReturn * 0.5) / 100 / 12
      return Math.round(annuityPmt(r, withdrawYears * 12, accumFv))
    }
  ),

  // 养老替代率 = 月退休金 / 退休时月工资
  'forward.replacementRate.value': from(
    ['forward.monthlyPension', 'forward.retirementWage'],
    (pension: number, wage: number) =>
      wage > 0 ? Math.round(pension / wage * 100 * 10) / 10 : 0
  ),

  // 替代率评级
  'forward.replacementStatus.value': from(
    'forward.replacementRate',
    (rate: number) => {
      if (rate >= 80) return `🟢 优秀（${rate}%）`
      if (rate >= 60) return `🟡 良好（${rate}%）`
      if (rate >= 40) return `🟠 一般（${rate}%）`
      return `🔴 不足（${rate}%）`
    }
  ),

  // ── ⑤ 反向推算（6 条）────────────────────────────────────────────────────

  // 目标月退休金（基于退休时月工资 × 目标替代率）
  'reverse.targetMonthlyPension.value': from(
    ['forward.retirementWage', 'reverse.targetRate'],
    (wage: number, rate: number) => Math.round(wage * rate / 100)
  ),

  // 反推：达到目标月退休金所需的总积累金额
  'reverse.requiredAccumulation.value': from(
    ['reverse.targetMonthlyPension', 'strategy.annualReturn', 'personal.withdrawYears'],
    (targetPension: number, annualReturn: number, withdrawYears: number) => {
      const r = (annualReturn * 0.5) / 100 / 12
      return Math.round(annuityPv(r, withdrawYears * 12, targetPension))
    }
  ),

  // 反推：达到所需积累金额需要的月缴合计
  'reverse.requiredMonthly.value': from(
    ['reverse.requiredAccumulation', 'strategy.annualReturn', 'personal.accumYears'],
    (requiredFv: number, annualReturn: number, years: number) => {
      const r = annualReturn / 100 / 12
      const periods = years * 12
      if (r <= 0 || periods <= 0) return Math.round(requiredFv / Math.max(1, periods))
      return Math.round(requiredFv * r / (Math.pow(1 + r, periods) - 1))
    }
  ),

  // 个人月缴缺口 = 建议月缴 / (1 + 企业配比) - 实际个人月缴
  'reverse.personalGap.value': from(
    ['reverse.requiredMonthly', 'contribution.companyMatchRate', 'contribution.personalMonthly'],
    (reqTotal: number, matchRate: number, personal: number) =>
      Math.round(reqTotal / (1 + matchRate / 100) - personal)
  ),

  // 缺口说明
  'reverse.gapNote.value': from(
    ['reverse.personalGap', 'reverse.requiredMonthly'],
    (gap: number, req: number) => {
      if (gap <= 0) return `✅ 当前方案可达成目标，月缴还有余裕 ¥${Math.abs(gap).toLocaleString()}`
      return `每月还需追加个人缴费 ¥${gap.toLocaleString()}（或增加企业配比）`
    }
  ),

  // ── ⑥ 警告显隐（5 条）────────────────────────────────────────────────────
  'warnings.shortfall.hidden': from(
    ['forward.replacementRate', 'reverse.targetRate'],
    (actual: number, target: number) => actual >= target
  ),
  'warnings.taxOver.hidden': from(
    ['contribution.personalMonthly', 'contribution.taxBenefitLimit'],
    (monthly: number, limit: number) => monthly * 12 <= limit
  ),
  'warnings.tooShort.hidden': from(
    'personal.accumYears',
    (years: number) => years >= 10
  ),

  // ── ⑦ 积累年限过短警告（1 条）──────────────────────────────────────────────
  // ⚠ 同样不能把 personal.retirementAge 放入自身的 theme 规则 sources（自环）
  // 退休年龄 ≤ 当前年龄时，accumYears.value 会被限制到 1，warnings.tooShort 会触发
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

    // ① 个人信息
    group('个人信息',
      row(
        c(`${P}/personal/properties/currentAge`),
        c(`${P}/personal/properties/retirementAge`),
        c(`${P}/personal/properties/accumYears`),
      ),
      row(
        c(`${P}/personal/properties/withdrawYears`),
        c(`${P}/personal/properties/currentWage`),
        c(`${P}/personal/properties/wageGrowthRate`),
      ),
    ),

    // ② 投资策略
    group('投资策略',
      row(
        c(`${P}/strategy/properties/style`, 3),
        c(`${P}/strategy/properties/annualReturn`),
        c(`${P}/strategy/properties/inflationRate`),
      ),
    ),

    // ③ 缴费方案
    group('缴费方案',
      // 可编辑输入 + 月合计
      row(
        c(`${P}/contribution/properties/personalMonthly`),
        c(`${P}/contribution/properties/companyMatchRate`),
        c(`${P}/contribution/properties/totalMonthly`),
      ),
      // 年合计 + 税优上限
      row(
        c(`${P}/contribution/properties/annualTotal`),
        c(`${P}/contribution/properties/taxBenefitLimit`),
      ),
    ),

    // ④ 正向推算
    group('正向推算 · 按当前方案预估退休金',
      row(
        c(`${P}/forward/properties/accumulatedFv`),
        c(`${P}/forward/properties/realPurchasingPower`),
        c(`${P}/forward/properties/retirementWage`),
      ),
      row(
        c(`${P}/forward/properties/monthlyPension`),
        c(`${P}/forward/properties/replacementRate`),
        c(`${P}/forward/properties/replacementStatus`, 3),
      ),
    ),

    // ⑤ 反向推算
    group('反向推算 · 设定目标看缺口',
      row(
        c(`${P}/reverse/properties/targetRate`),
        c(`${P}/reverse/properties/targetMonthlyPension`),
        c(`${P}/reverse/properties/requiredAccumulation`),
      ),
      row(
        c(`${P}/reverse/properties/requiredMonthly`),
        c(`${P}/reverse/properties/personalGap`),
        c(`${P}/reverse/properties/gapNote`, 3),
      ),
    ),

    // ⑥ 规划提示
    group('规划提示',
      row(c(`${P}/warnings/properties/shortfall`, 5)),
      row(c(`${P}/warnings/properties/taxOver`,   5)),
      row(c(`${P}/warnings/properties/tooShort`,  5)),
    ),
  ],
}

// ── 状态 ──────────────────────────────────────────────────────────────────────
const submitted     = ref(false)
const submittedData = ref<Record<string, any>>({})
const submittedStr  = computed(() => JSON.stringify(submittedData.value, null, 2))

function onFormChange(_data: Record<string, any>) {}
function onSubmit(data: Record<string, any>) {
  submittedData.value = data
  submitted.value     = true
}
</script>

<style scoped>
.pf-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
  margin: 24px 0;
  font-size: 13px;
}
.pf-header {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 13px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.pf-badge {
  background: linear-gradient(135deg, #10b981, #6366f1);
  color: #fff; font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  font-family: 'JetBrains Mono', monospace;
}
.pf-title { font-size: 14px; font-weight: 700; color: var(--vp-c-text-1); }
.pf-desc  { font-size: 11px; color: var(--vp-c-text-2); margin-left: auto; }
.pf-vapp  { background: transparent !important; min-height: 0 !important; display: block !important; }
.pf-body  { padding: 20px 24px; }
.pf-body :deep(.v-input__details) { display: none !important; }
.pf-body :deep(.v-checkbox) { align-items: center !important; padding-top: 4px; }
.pf-body :deep(.v-checkbox .v-label) { font-size: 13px; opacity: 0.92; }
.pf-body :deep(.v-input--density-comfortable) { --v-input-padding-top: 4px; }
.pf-body :deep(.mesh-group__body--vertical) { display: flex; flex-direction: column; gap: 16px; }
.pf-body :deep(.mesh-layout--horizontal) {
  display: flex !important; flex-wrap: wrap !important;
  gap: 8px 16px !important; width: 100% !important;
}
.pf-body :deep(.mesh-layout__item),
.pf-body :deep(.mesh-layout--horizontal > *) { flex: 1 1 150px !important; min-width: 0 !important; }
.pf-body :deep(.mesh-group) { margin-bottom: 12px; }
.pf-actions { padding-top: 8px; }
.pf-result { border-top: 1px solid var(--vp-c-border); overflow: hidden; }
.pf-result-hd {
  display: flex; align-items: center; gap: 7px; padding: 8px 20px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  color: #4caf50; border-bottom: 1px solid var(--vp-c-border); background: var(--vp-c-bg);
}
.pf-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.pf-dot--green { background: #4caf50; box-shadow: 0 0 5px #4caf50; }
.pf-result-pre {
  margin: 0; padding: 14px 20px; font-size: 11px; line-height: 1.6;
  color: var(--vp-c-text-2); white-space: pre-wrap; word-break: break-all;
  max-height: 400px; overflow-y: auto;
  font-family: 'JetBrains Mono', monospace; background: var(--vp-c-bg-soft);
}
</style>
