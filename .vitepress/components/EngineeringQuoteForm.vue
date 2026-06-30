<template>
  <div class="eq-wrap">
    <div class="eq-header">
      <span class="eq-badge-ent">⟳ useEntangle</span>
      <span class="eq-badge-dag">→ from/define</span>
      <span class="eq-title">工程项目报价单 — DAG + 双向纠缠</span>
      <span class="eq-desc">53 节点 · 42 条联动规则 · 2 对纠缠</span>
    </div>

    <v-app theme="dark" class="eq-vapp">
      <div class="eq-body">
        <MeshForm
          ref="meshFormRef"
          :schema="schema"
          :rules="rules"
          :uischema="uischema"
          :renderers="customRenderers"
          @change="onFormChange"
          @submit="onSubmit"
        >
          <template #actions="{ submit }">
            <div class="eq-actions">
              <v-btn color="primary" variant="tonal" @click="submit">导出报价单</v-btn>
            </div>
          </template>
        </MeshForm>
      </div>

      <div v-if="submitted" class="eq-result">
        <div class="eq-result-hd">
          <span class="eq-dot eq-dot--green" />✓ 报价单已生成
        </div>
        <pre class="eq-result-pre">{{ submittedStr }}</pre>
      </div>
    </v-app>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, onMounted } from 'vue'
import { MeshForm, from } from '@meshflow/form-vue'
import type { MeshFormSchema, FromDescriptor, MeshFormInstance } from '@meshflow/form-vue'
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

// ── 角色日费率（随项目类型变化）────────────────────────────────────────────
const TYPE_RATES: Record<string, { pm: number; dev: number; qa: number; mgmt: number; risk: number }> = {
  software:    { pm: 1200, dev: 1500, qa:  800, mgmt: 0.12, risk: 0.10 },
  integration: { pm: 1000, dev: 1200, qa:  700, mgmt: 0.15, risk: 0.12 },
  consulting:  { pm: 2000, dev: 1600, qa:  900, mgmt: 0.10, risk: 0.08 },
  maintenance: { pm:  800, dev: 1000, qa:  600, mgmt: 0.08, risk: 0.06 },
}
// 行业税率
const INDUSTRY_TAX: Record<string, number> = {
  finance: 6, manufacturing: 13, government: 9, retail: 13, healthcare: 9,
}

// ── 默认 WBS 人天（3 阶段 × 3 角色）────────────────────────────────────────
const DEF = {
  pm1: 5,  dev1: 5,  qa1: 3,    // 需求分析
  pm2: 8,  dev2: 12, qa2: 5,    // 系统设计
  pm3: 10, dev3: 40, qa3: 20,   // 开发实施
  hardware: 20000,
  travel:    8000,
  marginRate: 20,
  duration:  90,
  teamSize:   2,
  depositRate: 30,
}

// ── 预计算初始值（避免首帧闪烁）────────────────────────────────────────────
const R = TYPE_RATES['software']
const TAX = INDUSTRY_TAX['finance']

const INIT_PHASE1_DAYS = DEF.pm1 + DEF.dev1 + DEF.qa1              // 13
const INIT_PHASE2_DAYS = DEF.pm2 + DEF.dev2 + DEF.qa2              // 25
const INIT_PHASE3_DAYS = DEF.pm3 + DEF.dev3 + DEF.qa3              // 70
const INIT_TOTAL_PD    = INIT_PHASE1_DAYS + INIT_PHASE2_DAYS + INIT_PHASE3_DAYS  // 108

const INIT_PHASE1_COST = DEF.pm1*R.pm + DEF.dev1*R.dev + DEF.qa1*R.qa   // 15900
const INIT_PHASE2_COST = DEF.pm2*R.pm + DEF.dev2*R.dev + DEF.qa2*R.qa   // 31600
const INIT_PHASE3_COST = DEF.pm3*R.pm + DEF.dev3*R.dev + DEF.qa3*R.qa   // 88000

const INIT_LABOR      = INIT_PHASE1_COST + INIT_PHASE2_COST + INIT_PHASE3_COST  // 135500
const INIT_MGMT_FEE   = Math.round(INIT_LABOR * R.mgmt)                   // 16260
const INIT_RISK_BUF   = Math.round((INIT_LABOR + INIT_MGMT_FEE + DEF.hardware + DEF.travel) * R.risk) // 17976
const INIT_TOTAL_COST = INIT_LABOR + INIT_MGMT_FEE + DEF.hardware + DEF.travel + INIT_RISK_BUF       // 197736

const INIT_QUOTE     = Math.round(INIT_TOTAL_COST * (1 + DEF.marginRate / 100))  // 237283
const INIT_TAX_AMT   = Math.round(INIT_QUOTE * TAX / 100)                        // 14237
const INIT_TOTAL_TAX = INIT_QUOTE + INIT_TAX_AMT                                  // 251520

const INIT_DEPOSIT   = Math.round(INIT_TOTAL_TAX * DEF.depositRate / 100)         // 75456
const INIT_MILESTONE = Math.round(INIT_TOTAL_TAX * 0.40)                          // 100608
const INIT_FINAL_PAY = INIT_TOTAL_TAX - INIT_DEPOSIT - INIT_MILESTONE             // 75456

const INIT_DAILY_REV = Math.round(INIT_QUOTE / DEF.duration)                      // 2636
const INIT_PD_RATE   = Math.round(INIT_QUOTE / INIT_TOTAL_PD)                     // 2197

// ── Schema ────────────────────────────────────────────────────────────────────
const schema: MeshFormSchema = {
  type: 'object',
  title: '工程项目报价单',
  properties: {

    // ① 项目基础信息
    project: {
      type: 'object', title: '项目基础信息',
      properties: {
        projectType: {
          type: 'string', title: '项目类型', default: 'software', 'x-widget': 'select',
          'x-options': [
            { label: '软件开发（PM 1200 / Dev 1500 / QA 800）',       value: 'software'    },
            { label: '系统集成（PM 1000 / Dev 1200 / QA 700）',       value: 'integration' },
            { label: '管理咨询（PM 2000 / Dev 1600 / QA 900）',       value: 'consulting'  },
            { label: '运维托管（PM 800  / Dev 1000 / QA 600）',       value: 'maintenance' },
          ],
        },
        clientIndustry: {
          type: 'string', title: '客户行业', default: 'finance', 'x-widget': 'select',
          'x-options': [
            { label: '金融（增值税 6%）',    value: 'finance'       },
            { label: '制造（增值税 13%）',   value: 'manufacturing' },
            { label: '政府（增值税 9%）',    value: 'government'    },
            { label: '零售（增值税 13%）',   value: 'retail'        },
            { label: '医疗（增值税 9%）',    value: 'healthcare'    },
          ],
        },
        pmRate:   { type: 'number', title: 'PM 日费率 (元)',  default: R.pm,   'x-readonly': true, 'x-disabled': true },
        devRate:  { type: 'number', title: '开发 日费率 (元)', default: R.dev, 'x-readonly': true, 'x-disabled': true },
        qaRate:   { type: 'number', title: 'QA 日费率 (元)',   default: R.qa,  'x-readonly': true, 'x-disabled': true },
        mgmtRate: { type: 'number', title: '管理费率 (%)',  default: R.mgmt * 100, 'x-readonly': true, 'x-disabled': true },
        riskRate: { type: 'number', title: '风险储备率 (%)', default: R.risk * 100, 'x-readonly': true, 'x-disabled': true },
        taxRate:  { type: 'number', title: '增值税率 (%)',   default: TAX,    'x-readonly': true, 'x-disabled': true },
      },
    },

    // ② WBS 工作分解（3 阶段 × 3 角色）
    wbs: {
      type: 'object', title: 'WBS 工作分解',
      properties: {
        // 阶段一：需求分析
        pm1:  { type: 'integer', title: '需求分析·PM (天)', default: DEF.pm1,  'x-widget': 'number-input', 'x-min': 0 },
        dev1: { type: 'integer', title: '需求分析·开发 (天)', default: DEF.dev1,'x-widget': 'number-input', 'x-min': 0 },
        qa1:  { type: 'integer', title: '需求分析·QA (天)',  default: DEF.qa1, 'x-widget': 'number-input', 'x-min': 0 },
        phase1Days: { type: 'integer', title: '需求分析·小计人天', default: INIT_PHASE1_DAYS, 'x-readonly': true, 'x-disabled': true },
        phase1Cost: { type: 'number',  title: '需求分析·阶段人力成本 (元)', default: INIT_PHASE1_COST, 'x-readonly': true, 'x-disabled': true },

        // 阶段二：系统设计
        pm2:  { type: 'integer', title: '系统设计·PM (天)', default: DEF.pm2,  'x-widget': 'number-input', 'x-min': 0 },
        dev2: { type: 'integer', title: '系统设计·开发 (天)', default: DEF.dev2,'x-widget': 'number-input', 'x-min': 0 },
        qa2:  { type: 'integer', title: '系统设计·QA (天)',  default: DEF.qa2, 'x-widget': 'number-input', 'x-min': 0 },
        phase2Days: { type: 'integer', title: '系统设计·小计人天', default: INIT_PHASE2_DAYS, 'x-readonly': true, 'x-disabled': true },
        phase2Cost: { type: 'number',  title: '系统设计·阶段人力成本 (元)', default: INIT_PHASE2_COST, 'x-readonly': true, 'x-disabled': true },

        // 阶段三：开发实施
        pm3:  { type: 'integer', title: '开发实施·PM (天)', default: DEF.pm3,  'x-widget': 'number-input', 'x-min': 0 },
        dev3: { type: 'integer', title: '开发实施·开发 (天)', default: DEF.dev3,'x-widget': 'number-input', 'x-min': 0 },
        qa3:  { type: 'integer', title: '开发实施·QA (天)',  default: DEF.qa3, 'x-widget': 'number-input', 'x-min': 0 },
        phase3Days: { type: 'integer', title: '开发实施·小计人天', default: INIT_PHASE3_DAYS, 'x-readonly': true, 'x-disabled': true },
        phase3Cost: { type: 'number',  title: '开发实施·阶段人力成本 (元)', default: INIT_PHASE3_COST, 'x-readonly': true, 'x-disabled': true },

        // 汇总
        totalPersonDays: { type: 'integer', title: '合计投入人天', default: INIT_TOTAL_PD,
                           'x-readonly': true, 'x-disabled': true, 'x-theme': 'info' },
      },
    },

    // ③ 成本汇总
    costs: {
      type: 'object', title: '成本汇总',
      properties: {
        laborCost:    { type: 'number', title: '总人力成本 (元)',    default: INIT_LABOR,     'x-readonly': true, 'x-disabled': true },
        managementFee:{ type: 'number', title: '管理费 (元)',        default: INIT_MGMT_FEE,  'x-readonly': true, 'x-disabled': true },
        hardwareCost: { type: 'number', title: '硬件/软件采购 (元)', default: DEF.hardware,   'x-widget': 'number-input', 'x-min': 0, 'x-step': 1000 },
        travelCost:   { type: 'number', title: '差旅及其他 (元)',    default: DEF.travel,     'x-widget': 'number-input', 'x-min': 0, 'x-step': 1000 },
        riskBuffer:   { type: 'number', title: '风险储备金 (元)',    default: INIT_RISK_BUF,  'x-readonly': true, 'x-disabled': true },
        totalCost:    { type: 'number', title: '项目总成本 (元)',    default: INIT_TOTAL_COST,'x-readonly': true, 'x-disabled': true, 'x-theme': 'warning' },
      },
    },

    // ④ 报价计算（⟳ 纠缠区：利润率 ↔ 报价金额）
    pricing: {
      type: 'object', title: '报价计算',
      properties: {
        marginRate:    { type: 'number', title: '目标利润率 (%) ⟳',  default: DEF.marginRate,
                         'x-widget': 'number-input', 'x-min': 0, 'x-max': 100, 'x-step': 0.5 },
        suggestedQuote:{ type: 'number', title: '建议报价 (元)',       default: INIT_QUOTE,
                         'x-readonly': true, 'x-disabled': true },
        quotePrice:    { type: 'number', title: '最终报价 (元) ⟳',    default: INIT_QUOTE,
                         'x-widget': 'number-input', 'x-min': 0, 'x-step': 1000 },
        marginAmount:  { type: 'number', title: '利润额 (元)',         default: INIT_QUOTE - INIT_TOTAL_COST,
                         'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
        taxRate:       { type: 'number', title: '增值税率 (%)',        default: TAX,
                         'x-readonly': true, 'x-disabled': true },
        taxAmount:     { type: 'number', title: '增值税额 (元)',       default: INIT_TAX_AMT,
                         'x-readonly': true, 'x-disabled': true },
        totalWithTax:  { type: 'number', title: '含税总价 (元)',       default: INIT_TOTAL_TAX,
                         'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
      },
    },

    // ⑤ 资源规划（⟳ 纠缠区：工期 ↔ 团队规模）
    resource: {
      type: 'object', title: '资源规划',
      properties: {
        efficiency: {
          type: 'number', title: '团队并行效率', default: 0.8, 'x-widget': 'select',
          'x-options': [
            { label: '0.7（新团队 / 跨部门协作）', value: 0.7 },
            { label: '0.8（常规团队）',             value: 0.8 },
            { label: '0.9（成熟老团队）',           value: 0.9 },
          ],
        },
        duration:  { type: 'integer', title: '项目工期 (天) ⟳',  default: DEF.duration,
                     'x-widget': 'number-input', 'x-min': 10, 'x-max': 730 },
        teamSize:  { type: 'integer', title: '团队规模 (人) ⟳',  default: DEF.teamSize,
                     'x-widget': 'number-input', 'x-min': 1, 'x-max': 50 },
        dailyRevenue: { type: 'number', title: '日均合同额 (元/天)', default: INIT_DAILY_REV,
                        'x-readonly': true, 'x-disabled': true },
        personDayRate: { type: 'number', title: '人天单价 (元/人天)', default: INIT_PD_RATE,
                         'x-readonly': true, 'x-disabled': true },
      },
    },

    // ⑥ 付款方案
    payment: {
      type: 'object', title: '付款方案',
      properties: {
        depositRate: {
          type: 'integer', title: '首付比例 (%)', default: DEF.depositRate, 'x-widget': 'select',
          'x-options': [
            { label: '20%', value: 20 },
            { label: '30%', value: 30 },
            { label: '40%', value: 40 },
            { label: '50%', value: 50 },
          ],
        },
        depositAmount: { type: 'number', title: '签约首付 (元)',  default: INIT_DEPOSIT,
                         'x-readonly': true, 'x-disabled': true, 'x-theme': 'info' },
        milestone:     { type: 'number', title: '里程碑中期款 (元)', default: INIT_MILESTONE,
                         'x-readonly': true, 'x-disabled': true },
        finalPayment:  { type: 'number', title: '验收尾款 (元)',  default: INIT_FINAL_PAY,
                         'x-readonly': true, 'x-disabled': true },
      },
    },

    // ⑦ 风险预警
    warnings: {
      type: 'object', title: '风险预警',
      properties: {
        lowMargin: {
          type: 'string', title: '⚠ 利润率偏低',
          default: '当前利润率低于 15%，项目盈利空间不足，建议检查成本结构或重新定价。',
          'x-readonly': true, 'x-disabled': true, 'x-hidden': true,
        },
        understaff: {
          type: 'string', title: '⚠ 团队规模不足',
          default: '按当前工期，建议配置更多人力以保障交付质量。',
          'x-readonly': true, 'x-disabled': true, 'x-hidden': true,
        },
        tightSchedule: {
          type: 'string', title: '⚠ 工期紧张',
          default: '人天总量较大而工期较短，人均日工作量超出正常水平，存在交付风险。',
          'x-readonly': true, 'x-disabled': true, 'x-hidden': true,
        },
      },
    },
  },
}

// ── Rules（42 条 DAG 规则）───────────────────────────────────────────────────
const rules: Record<string, FromDescriptor> = {

  // ─ ① 项目类型 → 费率（5 条）───────────────────────────────────────────────
  'project.pmRate.value':   from('project.projectType', (t: string) => TYPE_RATES[t]?.pm   ?? R.pm),
  'project.devRate.value':  from('project.projectType', (t: string) => TYPE_RATES[t]?.dev  ?? R.dev),
  'project.qaRate.value':   from('project.projectType', (t: string) => TYPE_RATES[t]?.qa   ?? R.qa),
  'project.mgmtRate.value': from('project.projectType', (t: string) => (TYPE_RATES[t]?.mgmt ?? R.mgmt) * 100),
  'project.riskRate.value': from('project.projectType', (t: string) => (TYPE_RATES[t]?.risk ?? R.risk) * 100),
  'project.taxRate.value':  from('project.clientIndustry', (i: string) => INDUSTRY_TAX[i] ?? TAX),

  // ─ ② WBS 阶段人天（3 条）──────────────────────────────────────────────────
  'wbs.phase1Days.value': from(['wbs.pm1', 'wbs.dev1', 'wbs.qa1'],
    (pm: number, dev: number, qa: number) => pm + dev + qa),
  'wbs.phase2Days.value': from(['wbs.pm2', 'wbs.dev2', 'wbs.qa2'],
    (pm: number, dev: number, qa: number) => pm + dev + qa),
  'wbs.phase3Days.value': from(['wbs.pm3', 'wbs.dev3', 'wbs.qa3'],
    (pm: number, dev: number, qa: number) => pm + dev + qa),

  // ─ ③ WBS 阶段人力成本（3 条，依赖费率）────────────────────────────────────
  'wbs.phase1Cost.value': from(
    ['wbs.pm1', 'wbs.dev1', 'wbs.qa1', 'project.pmRate', 'project.devRate', 'project.qaRate'],
    (pm, dev, qa, pmR, devR, qaR) => pm * pmR + dev * devR + qa * qaR
  ),
  'wbs.phase2Cost.value': from(
    ['wbs.pm2', 'wbs.dev2', 'wbs.qa2', 'project.pmRate', 'project.devRate', 'project.qaRate'],
    (pm, dev, qa, pmR, devR, qaR) => pm * pmR + dev * devR + qa * qaR
  ),
  'wbs.phase3Cost.value': from(
    ['wbs.pm3', 'wbs.dev3', 'wbs.qa3', 'project.pmRate', 'project.devRate', 'project.qaRate'],
    (pm, dev, qa, pmR, devR, qaR) => pm * pmR + dev * devR + qa * qaR
  ),

  // ─ ④ WBS 合计人天（1 条）──────────────────────────────────────────────────
  'wbs.totalPersonDays.value': from(
    ['wbs.phase1Days', 'wbs.phase2Days', 'wbs.phase3Days'],
    (p1, p2, p3) => p1 + p2 + p3
  ),

  // ─ ⑤ 成本汇总（5 条）──────────────────────────────────────────────────────
  'costs.laborCost.value': from(
    ['wbs.phase1Cost', 'wbs.phase2Cost', 'wbs.phase3Cost'],
    (p1, p2, p3) => p1 + p2 + p3
  ),
  'costs.managementFee.value': from(
    ['costs.laborCost', 'project.mgmtRate'],
    (labor: number, rate: number) => Math.round(labor * rate / 100)
  ),
  'costs.riskBuffer.value': from(
    ['costs.laborCost', 'costs.managementFee', 'costs.hardwareCost', 'costs.travelCost', 'project.riskRate'],
    (labor, mgmt, hw, travel, rate) => Math.round((labor + mgmt + hw + travel) * rate / 100)
  ),
  'costs.totalCost.value': from(
    ['costs.laborCost', 'costs.managementFee', 'costs.hardwareCost', 'costs.travelCost', 'costs.riskBuffer'],
    (labor, mgmt, hw, travel, risk) => labor + mgmt + hw + travel + risk
  ),

  // ─ ⑥ 报价 DAG 部分（4 条，注意：suggestedQuote 受利润率驱动）────────────
  'pricing.suggestedQuote.value': from(
    ['costs.totalCost', 'pricing.marginRate'],
    (tc: number, mr: number) => Math.round(tc * (1 + mr / 100))
  ),
  'pricing.taxRate.value': from(
    'project.taxRate',
    (r: number) => r
  ),
  'pricing.taxAmount.value': from(
    ['pricing.quotePrice', 'pricing.taxRate'],
    (quote: number, rate: number) => Math.round(quote * rate / 100)
  ),
  'pricing.totalWithTax.value': from(
    ['pricing.quotePrice', 'pricing.taxAmount'],
    (quote: number, tax: number) => quote + tax
  ),
  'pricing.marginAmount.value': from(
    ['pricing.quotePrice', 'costs.totalCost'],
    (quote: number, tc: number) => quote - tc
  ),

  // ─ ⑦ 资源规划（2 条）──────────────────────────────────────────────────────
  'resource.dailyRevenue.value': from(
    ['pricing.quotePrice', 'resource.duration'],
    (quote: number, dur: number) => dur > 0 ? Math.round(quote / dur) : 0
  ),
  'resource.personDayRate.value': from(
    ['pricing.quotePrice', 'wbs.totalPersonDays'],
    (quote: number, pd: number) => pd > 0 ? Math.round(quote / pd) : 0
  ),

  // ─ ⑧ 付款方案（3 条）──────────────────────────────────────────────────────
  'payment.depositAmount.value': from(
    ['pricing.totalWithTax', 'payment.depositRate'],
    (total: number, rate: number) => Math.round(total * rate / 100)
  ),
  'payment.milestone.value': from(
    ['pricing.totalWithTax', 'payment.depositRate'],
    (total: number, depositRate: number) => Math.round(total * 0.40)
  ),
  'payment.finalPayment.value': from(
    ['pricing.totalWithTax', 'payment.depositAmount', 'payment.milestone'],
    (total: number, deposit: number, mid: number) => total - deposit - mid
  ),

  // ─ ⑨ 风险预警显隐（3 条）──────────────────────────────────────────────────
  'warnings.lowMargin.hidden': from(
    'pricing.marginRate',
    (mr: number) => mr >= 15
  ),
  'warnings.understaff.hidden': from(
    ['wbs.totalPersonDays', 'resource.duration', 'resource.teamSize', 'resource.efficiency'],
    (pd: number, dur: number, team: number, eff: number) => {
      if (dur <= 0 || team <= 0) return true
      const needed = Math.ceil(pd / dur / eff)
      return team >= needed
    }
  ),
  'warnings.tightSchedule.hidden': from(
    ['wbs.totalPersonDays', 'resource.duration', 'resource.teamSize'],
    (pd: number, dur: number, team: number) => {
      if (dur <= 0 || team <= 0) return true
      const dailyLoad = pd / dur / team  // 人均日均人天，理想=1
      return dailyLoad <= 1.2
    }
  ),
}

// ── UISchema ─────────────────────────────────────────────────────────────────
function c(scope: string, span = 1) {
  return { type: 'Control', scope, ...(span !== 1 ? { options: { span } } : {}) } as any
}
function row(...els: any[]) { return { type: 'HorizontalLayout', elements: els } as any }
function group(label: string, nodePath?: string, ...elements: any[]) {
  return {
    type: 'Group', label,
    ...(nodePath ? { options: { nodePath } } : {}),
    elements,
  } as any
}

const P = '#/properties'
const uischema = {
  type: 'VerticalLayout',
  elements: [

    // ① 项目基础信息
    group('项目基础信息', undefined,
      row(c(`${P}/project/properties/projectType`, 2), c(`${P}/project/properties/clientIndustry`, 2)),
      row(
        c(`${P}/project/properties/pmRate`),
        c(`${P}/project/properties/devRate`),
        c(`${P}/project/properties/qaRate`),
        c(`${P}/project/properties/mgmtRate`),
        c(`${P}/project/properties/riskRate`),
        c(`${P}/project/properties/taxRate`),
      ),
    ),

    // ② WBS - 需求分析
    group('WBS · 阶段一：需求分析', undefined,
      row(
        c(`${P}/wbs/properties/pm1`),
        c(`${P}/wbs/properties/dev1`),
        c(`${P}/wbs/properties/qa1`),
        c(`${P}/wbs/properties/phase1Days`),
        c(`${P}/wbs/properties/phase1Cost`),
      ),
    ),

    // ② WBS - 系统设计
    group('WBS · 阶段二：系统设计', undefined,
      row(
        c(`${P}/wbs/properties/pm2`),
        c(`${P}/wbs/properties/dev2`),
        c(`${P}/wbs/properties/qa2`),
        c(`${P}/wbs/properties/phase2Days`),
        c(`${P}/wbs/properties/phase2Cost`),
      ),
    ),

    // ② WBS - 开发实施
    group('WBS · 阶段三：开发实施', undefined,
      row(
        c(`${P}/wbs/properties/pm3`),
        c(`${P}/wbs/properties/dev3`),
        c(`${P}/wbs/properties/qa3`),
        c(`${P}/wbs/properties/phase3Days`),
        c(`${P}/wbs/properties/phase3Cost`),
      ),
      row(c(`${P}/wbs/properties/totalPersonDays`, 5)),
    ),

    // ③ 成本汇总
    group('成本汇总', undefined,
      row(
        c(`${P}/costs/properties/laborCost`),
        c(`${P}/costs/properties/managementFee`),
        c(`${P}/costs/properties/hardwareCost`),
        c(`${P}/costs/properties/travelCost`),
      ),
      row(
        c(`${P}/costs/properties/riskBuffer`),
        c(`${P}/costs/properties/totalCost`, 3),
      ),
    ),

    // ④ 报价计算（纠缠区）
    group('报价计算  ·  ⟳ 利润率 ↔ 最终报价（双向纠缠）', undefined,
      row(
        c(`${P}/pricing/properties/marginRate`),
        c(`${P}/pricing/properties/suggestedQuote`),
        c(`${P}/pricing/properties/quotePrice`),
        c(`${P}/pricing/properties/marginAmount`),
      ),
      row(
        c(`${P}/pricing/properties/taxRate`),
        c(`${P}/pricing/properties/taxAmount`),
        c(`${P}/pricing/properties/totalWithTax`, 2),
      ),
    ),

    // ⑤ 资源规划（纠缠区）
    group('资源规划  ·  ⟳ 工期 ↔ 团队规模（双向纠缠）', undefined,
      row(
        c(`${P}/resource/properties/efficiency`),
        c(`${P}/resource/properties/duration`),
        c(`${P}/resource/properties/teamSize`),
        c(`${P}/resource/properties/dailyRevenue`),
        c(`${P}/resource/properties/personDayRate`),
      ),
    ),

    // ⑥ 付款方案
    group('付款方案', undefined,
      row(
        c(`${P}/payment/properties/depositRate`),
        c(`${P}/payment/properties/depositAmount`),
        c(`${P}/payment/properties/milestone`),
        c(`${P}/payment/properties/finalPayment`),
      ),
    ),

    // ⑦ 风险预警
    group('风险预警', 'warnings',
      row(c(`${P}/warnings/properties/lowMargin`,     5)),
      row(c(`${P}/warnings/properties/understaff`,    5)),
      row(c(`${P}/warnings/properties/tightSchedule`, 5)),
    ),
  ],
}

// ── 纠缠缓存（onFormChange 更新，entangle emit 读取）────────────────────────
const totalCostCache    = ref(INIT_TOTAL_COST)
const personDaysCache   = ref(INIT_TOTAL_PD)
const efficiencyCache   = ref(0.8)

function onFormChange(data: Record<string, any>) {
  totalCostCache.value  = data.costs?.totalCost     ?? INIT_TOTAL_COST
  personDaysCache.value = data.wbs?.totalPersonDays  ?? INIT_TOTAL_PD
  efficiencyCache.value = data.resource?.efficiency  ?? 0.8
}

// ── Engine & Entangle 注册（挂载后）────────────────────────────────────────
const meshFormRef = ref<MeshFormInstance | null>(null)

onMounted(() => {
  const engine = meshFormRef.value?.engine
  if (!engine) return

  // ── 纠缠 1A：利润率 → 最终报价
  // isProxy:true 让 emit 直接通过 .value 读取状态（而非 .state.value）
  // propose.set 是真正提交变更的 API，return { key, delta } 在同步路径中会被忽略
  engine.entangle({
    cause: 'pricing.marginRate',
    impact: 'pricing.quotePrice',
    via: ['value'],
    isProxy: true,
    emit: (mrNode: any, qpNode: any, propose: any) => {
      const tc = totalCostCache.value
      if (tc <= 0) return
      const target = Math.round(tc * (1 + mrNode.value / 100))
      if (Math.abs(target - qpNode.value) < 1) return
      propose.set('value', target)
    },
  })

  // ── 纠缠 1B：最终报价 → 利润率（客户压价场景：输入客户预算，反推利润率）
  engine.entangle({
    cause: 'pricing.quotePrice',
    impact: 'pricing.marginRate',
    via: ['value'],
    isProxy: true,
    emit: (qpNode: any, mrNode: any, propose: any) => {
      const tc = totalCostCache.value
      if (tc <= 0) return
      const target = Math.round((qpNode.value / tc - 1) * 100 * 10) / 10
      if (Math.abs(target - mrNode.value) < 0.1) return
      propose.set('value', target)
    },
  })

  // ── 纠缠 2A：工期 → 团队规模（固定总人天，缩短工期 → 需要更多人）
  engine.entangle({
    cause: 'resource.duration',
    impact: 'resource.teamSize',
    via: ['value'],
    isProxy: true,
    emit: (durNode: any, tsNode: any, propose: any) => {
      const pd  = personDaysCache.value
      const eff = efficiencyCache.value || 0.8
      if (pd <= 0 || durNode.value <= 0) return
      const target = Math.ceil(pd / durNode.value / eff)
      if (Math.abs(target - tsNode.value) < 0.01) return
      propose.set('value', target)
    },
  })

  // ── 纠缠 2B：团队规模 → 工期（固定总人天，增加人手 → 工期缩短）
  engine.entangle({
    cause: 'resource.teamSize',
    impact: 'resource.duration',
    via: ['value'],
    isProxy: true,
    emit: (tsNode: any, durNode: any, propose: any) => {
      const pd  = personDaysCache.value
      const eff = efficiencyCache.value || 0.8
      if (pd <= 0 || tsNode.value <= 0) return
      const target = Math.ceil(pd / tsNode.value / eff)
      if (Math.abs(target - durNode.value) < 0.01) return
      propose.set('value', target)
    },
  })
})

// ── 提交 ────────────────────────────────────────────────────────────────────
const submitted     = ref(false)
const submittedData = ref<Record<string, any>>({})
const submittedStr  = computed(() => JSON.stringify(submittedData.value, null, 2))

function onSubmit(data: Record<string, any>) {
  submittedData.value = data
  submitted.value     = true
}
</script>

<style scoped>
.eq-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
  margin: 24px 0;
  font-size: 13px;
}
.eq-header {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 13px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.eq-badge-ent {
  font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
  padding: 2px 9px; border-radius: 20px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff;
}
.eq-badge-dag {
  font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
  padding: 2px 9px; border-radius: 20px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4); color: #fff;
}
.eq-title { font-size: 14px; font-weight: 700; color: var(--vp-c-text-1); }
.eq-desc  { font-size: 11px; color: var(--vp-c-text-2); margin-left: auto; }
.eq-vapp  { background: transparent !important; min-height: 0 !important; display: block !important; }
.eq-body  { padding: 20px 24px; }
.eq-body :deep(.v-input__details) { display: none !important; }
.eq-body :deep(.v-checkbox) { align-items: center !important; padding-top: 4px; }
.eq-body :deep(.v-checkbox .v-label) { font-size: 13px; opacity: 0.92; }
.eq-body :deep(.v-input--density-comfortable) { --v-input-padding-top: 4px; }
.eq-body :deep(.mesh-group__body--vertical) { display: flex; flex-direction: column; gap: 16px; }
.eq-body :deep(.mesh-layout--horizontal) {
  display: flex !important; flex-wrap: wrap !important;
  gap: 8px 16px !important; width: 100% !important;
}
.eq-body :deep(.mesh-layout__item),
.eq-body :deep(.mesh-layout--horizontal > *) { flex: 1 1 140px !important; min-width: 0 !important; }
.eq-body :deep(.mesh-group) { margin-bottom: 12px; }
.eq-actions { padding-top: 8px; }
.eq-result { border-top: 1px solid var(--vp-c-border); overflow: hidden; }
.eq-result-hd {
  display: flex; align-items: center; gap: 7px; padding: 8px 20px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  color: #4caf50; border-bottom: 1px solid var(--vp-c-border); background: var(--vp-c-bg);
}
.eq-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.eq-dot--green { background: #4caf50; box-shadow: 0 0 5px #4caf50; }
.eq-result-pre {
  margin: 0; padding: 14px 20px; font-size: 11px; line-height: 1.6;
  color: var(--vp-c-text-2); white-space: pre-wrap; word-break: break-all;
  max-height: 400px; overflow-y: auto;
  font-family: 'JetBrains Mono', monospace; background: var(--vp-c-bg-soft);
}
</style>
