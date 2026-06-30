<template>
  <div class="grp-graph-wrap">
    <div class="graph-header">
      <span class="graph-badge">DAG</span>
      <span class="graph-title">企业团险联动依赖图（7 层计算链）</span>
      <span class="graph-hint">从 employeeCount 到 taxActual，引擎保证拓扑顺序一次性传播</span>
    </div>
    <div class="graph-body">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :fit-view-on-init="true"
        class="grp-flow"
      >
        <template #node-field="{ data }">
          <div class="field-node" :class="data.group">
            <div class="fn-dot"></div>
            <div class="fn-label">{{ data.label }}</div>
            <div v-if="data.sub" class="fn-sub">{{ data.sub }}</div>
          </div>
        </template>
      </VueFlow>
    </div>
    <div class="graph-legend">
      <span class="leg-item"><span class="leg-dot company"></span>企业信息</span>
      <span class="leg-item"><span class="leg-dot factor"></span>费率系数</span>
      <span class="leg-item"><span class="leg-dot config"></span>险种启用</span>
      <span class="leg-item"><span class="leg-dot count"></span>参保人数</span>
      <span class="leg-item"><span class="leg-dot bundle"></span>捆绑折扣</span>
      <span class="leg-item"><span class="leg-dot premium"></span>险种保费</span>
      <span class="leg-item"><span class="leg-dot summary"></span>费用汇总</span>
      <span class="leg-item"><span class="leg-edge blue"></span>值传播</span>
      <span class="leg-item"><span class="leg-edge amber"></span>显隐控制</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// ── 节点定义 ─────────────────────────────────────────────────────────────────
// Layout (x, y) arranged left-to-right by computation layer
// Top cluster  (y=0-320):   company inputs → 4 rate factors → combinedFactor
// Bottom cluster (y=430-790): insurance configs → insured counts → bundle → premiums → summary

const nodes = [
  // ── Layer 0 (top): Company inputs ───────────────────────────────────────
  { id: 'employeeCount',  type: 'field', position: { x: 0,    y: 0   }, data: { label: '员工人数',     group: 'company', sub: 'employeeCount' } },
  { id: 'monthlyWage',    type: 'field', position: { x: 0,    y: 70  }, data: { label: '月均工资',     group: 'company', sub: 'monthlyWage' } },
  { id: 'industry',       type: 'field', position: { x: 0,    y: 160 }, data: { label: '行业类别',     group: 'company', sub: 'industry' } },
  { id: 'region',         type: 'field', position: { x: 0,    y: 230 }, data: { label: '所在地区',     group: 'company', sub: 'region' } },
  { id: 'claimFreeYears', type: 'field', position: { x: 0,    y: 300 }, data: { label: '无赔付年数',   group: 'company', sub: 'claimFreeYears' } },

  // ── Layer 1 (top): Individual rate factors ───────────────────────────────
  { id: 'scaleFactor',    type: 'field', position: { x: 220,  y: 0   }, data: { label: '规模系数',     group: 'factor', sub: '← 员工人数' } },
  { id: 'industryFactor', type: 'field', position: { x: 220,  y: 160 }, data: { label: '行业系数',     group: 'factor', sub: '← 行业类别' } },
  { id: 'regionFactor',   type: 'field', position: { x: 220,  y: 230 }, data: { label: '地区系数',     group: 'factor', sub: '← 所在地区' } },
  { id: 'claimFactor',    type: 'field', position: { x: 220,  y: 300 }, data: { label: '赔付系数',     group: 'factor', sub: '← 无赔付年数' } },

  // ── Layer 2 (top): Combined factor ───────────────────────────────────────
  { id: 'combinedFactor', type: 'field', position: { x: 440,  y: 120 }, data: { label: '综合系数',     group: 'factor', sub: '× 4 系数' } },

  // ── Layer 0 (bottom): Insurance type enabled flags ───────────────────────
  { id: 'medical',        type: 'field', position: { x: 0,    y: 430 }, data: { label: '医疗险',       group: 'config', sub: 'medical.enabled' } },
  { id: 'life',           type: 'field', position: { x: 0,    y: 500 }, data: { label: '寿险',         group: 'config', sub: 'life.enabled' } },
  { id: 'accident',       type: 'field', position: { x: 0,    y: 570 }, data: { label: '意外险',       group: 'config', sub: 'accident.enabled' } },
  { id: 'ci',             type: 'field', position: { x: 0,    y: 640 }, data: { label: '重疾险',       group: 'config', sub: 'ci.enabled' } },
  { id: 'hospital',       type: 'field', position: { x: 0,    y: 710 }, data: { label: '住院补贴',     group: 'config', sub: '← 依赖医疗险' } },
  { id: 'outpatient',     type: 'field', position: { x: 0,    y: 790 }, data: { label: '门诊补贴',     group: 'config', sub: '← 依赖医疗险' } },

  // ── Layer 1 (bottom): Insured headcounts ────────────────────────────────
  { id: 'medInsured',     type: 'field', position: { x: 220,  y: 430 }, data: { label: '医疗参保人数', group: 'count', sub: 'n × 参保率' } },
  { id: 'lifeInsured',    type: 'field', position: { x: 220,  y: 500 }, data: { label: '寿险参保人数', group: 'count', sub: 'n × 参保率' } },
  { id: 'accInsured',     type: 'field', position: { x: 220,  y: 570 }, data: { label: '意外参保人数', group: 'count', sub: 'n × 参保率' } },
  { id: 'ciInsured',      type: 'field', position: { x: 220,  y: 640 }, data: { label: '重疾参保人数', group: 'count', sub: 'n × 参保率' } },
  { id: 'hospInsured',    type: 'field', position: { x: 220,  y: 710 }, data: { label: '住院参保人数', group: 'count', sub: 'n × 参保率' } },
  { id: 'outInsured',     type: 'field', position: { x: 220,  y: 790 }, data: { label: '门诊参保人数', group: 'count', sub: 'n × 参保率' } },

  // ── Layer 2 (bottom): Bundle nodes ───────────────────────────────────────
  { id: 'bundleCount',    type: 'field', position: { x: 440,  y: 570 }, data: { label: '捆绑险种数',   group: 'bundle', sub: '← 已启用险种' } },
  { id: 'bundleDiscount', type: 'field', position: { x: 440,  y: 680 }, data: { label: '捆绑折扣',     group: 'bundle', sub: '← 捆绑险种数' } },

  // ── Layer 3: Per-type premiums ────────────────────────────────────────────
  { id: 'medPremium',     type: 'field', position: { x: 660,  y: 430 }, data: { label: '医疗险保费',   group: 'premium', sub: '¥5/万保额/人' } },
  { id: 'lifePremium',    type: 'field', position: { x: 660,  y: 500 }, data: { label: '寿险保费',     group: 'premium', sub: '¥4/万保额/人' } },
  { id: 'accPremium',     type: 'field', position: { x: 660,  y: 570 }, data: { label: '意外险保费',   group: 'premium', sub: '¥3/万保额/人' } },
  { id: 'ciPremium',      type: 'field', position: { x: 660,  y: 640 }, data: { label: '重疾险保费',   group: 'premium', sub: '¥6/万保额/人' } },
  { id: 'hospPremium',    type: 'field', position: { x: 660,  y: 710 }, data: { label: '住院补贴保费', group: 'premium', sub: '¥1.8/日额/人' } },
  { id: 'outPremium',     type: 'field', position: { x: 660,  y: 790 }, data: { label: '门诊补贴保费', group: 'premium', sub: '50%/限额/人' } },

  // ── Layer 4: Summary ─────────────────────────────────────────────────────
  { id: 'total',          type: 'field', position: { x: 880,  y: 590 }, data: { label: '总保费',       group: 'summary', sub: 'Σ 6 险种' } },
  { id: 'taxLimit',       type: 'field', position: { x: 880,  y: 730 }, data: { label: '税前抵扣上限', group: 'summary', sub: '月薪×12×5%' } },
  { id: 'perMonth',       type: 'field', position: { x: 1100, y: 490 }, data: { label: '人均月保费',   group: 'summary', sub: '÷ 人数 ÷ 12' } },
  { id: 'saved',          type: 'field', position: { x: 1100, y: 580 }, data: { label: '折扣节省',     group: 'summary', sub: '折扣节省金额' } },
  { id: 'taxActual',      type: 'field', position: { x: 1100, y: 720 }, data: { label: '实际税前抵扣', group: 'summary', sub: 'min(总保费, 上限)' } },
]

// ── 边定义 ───────────────────────────────────────────────────────────────────
const blue  = { animated: true,  style: { stroke: '#6366f1', strokeWidth: 1.5 } }
const amber = { animated: false, style: { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '4 3' } }

const edges = [
  // ── Company → Rate factors
  { id: 'e-n-sc',    source: 'employeeCount',  target: 'scaleFactor',    ...blue },
  { id: 'e-ind-if',  source: 'industry',       target: 'industryFactor', ...blue },
  { id: 'e-reg-rf',  source: 'region',         target: 'regionFactor',   ...blue },
  { id: 'e-cl-cf',   source: 'claimFreeYears', target: 'claimFactor',    ...blue },

  // ── Rate factors → combinedFactor
  { id: 'e-sc-comb', source: 'scaleFactor',    target: 'combinedFactor', ...blue },
  { id: 'e-if-comb', source: 'industryFactor', target: 'combinedFactor', ...blue },
  { id: 'e-rf-comb', source: 'regionFactor',   target: 'combinedFactor', ...blue },
  { id: 'e-cf-comb', source: 'claimFactor',    target: 'combinedFactor', ...blue },

  // ── medical.enabled controls hospital + outpatient (show/hide)
  { id: 'e-med-hosp', source: 'medical',       target: 'hospital',    ...amber },
  { id: 'e-med-out',  source: 'medical',       target: 'outpatient',  ...amber },

  // ── enabled + employeeCount → insured headcounts
  { id: 'e-med-mi',  source: 'medical',        target: 'medInsured',  ...blue },
  { id: 'e-lif-li',  source: 'life',           target: 'lifeInsured', ...blue },
  { id: 'e-acc-ai',  source: 'accident',       target: 'accInsured',  ...blue },
  { id: 'e-ci-cii',  source: 'ci',             target: 'ciInsured',   ...blue },
  { id: 'e-hos-hi',  source: 'hospital',       target: 'hospInsured', ...blue },
  { id: 'e-out-oi',  source: 'outpatient',     target: 'outInsured',  ...blue },
  { id: 'e-n-mi',    source: 'employeeCount',  target: 'medInsured',  ...blue },
  { id: 'e-n-li',    source: 'employeeCount',  target: 'lifeInsured', ...blue },
  { id: 'e-n-ai',    source: 'employeeCount',  target: 'accInsured',  ...blue },
  { id: 'e-n-cii',   source: 'employeeCount',  target: 'ciInsured',   ...blue },
  { id: 'e-n-hi',    source: 'employeeCount',  target: 'hospInsured', ...blue },
  { id: 'e-n-oi',    source: 'employeeCount',  target: 'outInsured',  ...blue },

  // ── All enabled → bundleCount
  { id: 'e-med-bc',  source: 'medical',        target: 'bundleCount', ...blue },
  { id: 'e-lif-bc',  source: 'life',           target: 'bundleCount', ...blue },
  { id: 'e-acc-bc',  source: 'accident',       target: 'bundleCount', ...blue },
  { id: 'e-ci-bc',   source: 'ci',             target: 'bundleCount', ...blue },
  { id: 'e-hos-bc',  source: 'hospital',       target: 'bundleCount', ...blue },
  { id: 'e-out-bc',  source: 'outpatient',     target: 'bundleCount', ...blue },
  { id: 'e-bc-bd',   source: 'bundleCount',    target: 'bundleDiscount', ...blue },

  // ── insured + combinedFactor + bundleDiscount → premiums
  { id: 'e-mi-mp',   source: 'medInsured',     target: 'medPremium',  ...blue },
  { id: 'e-li-lp',   source: 'lifeInsured',    target: 'lifePremium', ...blue },
  { id: 'e-ai-ap',   source: 'accInsured',     target: 'accPremium',  ...blue },
  { id: 'e-ci-cp',   source: 'ciInsured',      target: 'ciPremium',   ...blue },
  { id: 'e-hi-hp',   source: 'hospInsured',    target: 'hospPremium', ...blue },
  { id: 'e-oi-op',   source: 'outInsured',     target: 'outPremium',  ...blue },

  { id: 'e-comb-mp', source: 'combinedFactor', target: 'medPremium',  ...blue },
  { id: 'e-comb-lp', source: 'combinedFactor', target: 'lifePremium', ...blue },
  { id: 'e-comb-ap', source: 'combinedFactor', target: 'accPremium',  ...blue },
  { id: 'e-comb-cp', source: 'combinedFactor', target: 'ciPremium',   ...blue },
  { id: 'e-comb-hp', source: 'combinedFactor', target: 'hospPremium', ...blue },
  { id: 'e-comb-op', source: 'combinedFactor', target: 'outPremium',  ...blue },

  { id: 'e-bd-mp',   source: 'bundleDiscount', target: 'medPremium',  ...blue },
  { id: 'e-bd-lp',   source: 'bundleDiscount', target: 'lifePremium', ...blue },
  { id: 'e-bd-ap',   source: 'bundleDiscount', target: 'accPremium',  ...blue },
  { id: 'e-bd-cp',   source: 'bundleDiscount', target: 'ciPremium',   ...blue },
  { id: 'e-bd-hp',   source: 'bundleDiscount', target: 'hospPremium', ...blue },
  { id: 'e-bd-op',   source: 'bundleDiscount', target: 'outPremium',  ...blue },

  // ── Premiums → total
  { id: 'e-mp-tot',  source: 'medPremium',     target: 'total', ...blue },
  { id: 'e-lp-tot',  source: 'lifePremium',    target: 'total', ...blue },
  { id: 'e-ap-tot',  source: 'accPremium',     target: 'total', ...blue },
  { id: 'e-cp-tot',  source: 'ciPremium',      target: 'total', ...blue },
  { id: 'e-hp-tot',  source: 'hospPremium',    target: 'total', ...blue },
  { id: 'e-op-tot',  source: 'outPremium',     target: 'total', ...blue },

  // ── Summary derivations
  { id: 'e-tot-pm',  source: 'total',          target: 'perMonth',  ...blue },
  { id: 'e-n-pm',    source: 'employeeCount',  target: 'perMonth',  ...blue },
  { id: 'e-tot-sav', source: 'total',          target: 'saved',     ...blue },
  { id: 'e-bd-sav',  source: 'bundleDiscount', target: 'saved',     ...blue },
  { id: 'e-n-taxl',  source: 'employeeCount',  target: 'taxLimit',  ...blue },
  { id: 'e-w-taxl',  source: 'monthlyWage',    target: 'taxLimit',  ...blue },
  { id: 'e-tot-ta',  source: 'total',          target: 'taxActual', ...blue },
  { id: 'e-taxl-ta', source: 'taxLimit',       target: 'taxActual', ...blue },
]
</script>

<style scoped>
.grp-graph-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  margin: 24px 0;
}

.graph-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--vp-c-border);
  flex-wrap: wrap;
}
.graph-badge {
  font-size: 10px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(99,102,241,.15);
  color: #818cf8;
  border: 1px solid rgba(99,102,241,.3);
  letter-spacing: 0.06em;
}
.graph-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.graph-hint {
  font-size: 11px;
  color: var(--vp-c-text-2);
  margin-left: auto;
}

.graph-body {
  height: 620px;
}

.grp-flow {
  width: 100%;
  height: 100%;
  background: transparent !important;
}

:deep(.vue-flow__background) { background: transparent !important; }
:deep(.vue-flow__edge-path) { stroke-opacity: 0.75; }
:deep(.vue-flow__node) { padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
:deep(.vue-flow__handle) { opacity: 0; }

/* Field nodes */
.field-node {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 5px 10px 5px 22px;
  border-radius: 7px;
  border: 1px solid;
  min-width: 150px;
  max-width: 178px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  cursor: default;
  position: relative;
}
.fn-dot {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.fn-label {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
}
.fn-sub {
  font-size: 9px;
  opacity: 0.65;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

/* ── Group colors ─────────────────────────────────────────────────────────── */
.field-node.company {
  background: rgba(99,102,241,.1);
  border-color: rgba(99,102,241,.4);
  color: #818cf8;
}
.field-node.company .fn-dot { background: #6366f1; }

.field-node.factor {
  background: rgba(139,92,246,.1);
  border-color: rgba(139,92,246,.4);
  color: #a78bfa;
}
.field-node.factor .fn-dot { background: #8b5cf6; }

.field-node.config {
  background: rgba(16,185,129,.1);
  border-color: rgba(16,185,129,.4);
  color: #34d399;
}
.field-node.config .fn-dot { background: #10b981; }

.field-node.count {
  background: rgba(14,165,233,.1);
  border-color: rgba(14,165,233,.4);
  color: #38bdf8;
}
.field-node.count .fn-dot { background: #0ea5e9; }

.field-node.bundle {
  background: rgba(245,158,11,.1);
  border-color: rgba(245,158,11,.4);
  color: #fbbf24;
}
.field-node.bundle .fn-dot { background: #f59e0b; }

.field-node.premium {
  background: rgba(59,130,246,.1);
  border-color: rgba(59,130,246,.4);
  color: #93c5fd;
}
.field-node.premium .fn-dot { background: #3b82f6; }

.field-node.summary {
  background: rgba(244,63,94,.1);
  border-color: rgba(244,63,94,.4);
  color: #fb7185;
}
.field-node.summary .fn-dot { background: #f43f5e; }

/* Legend */
.graph-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 10px 18px;
  border-top: 1px solid var(--vp-c-border);
  font-size: 11px;
  color: var(--vp-c-text-2);
}
.leg-item { display: flex; align-items: center; gap: 5px; }
.leg-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.leg-dot.company  { background: #6366f1; }
.leg-dot.factor   { background: #8b5cf6; }
.leg-dot.config   { background: #10b981; }
.leg-dot.count    { background: #0ea5e9; }
.leg-dot.bundle   { background: #f59e0b; }
.leg-dot.premium  { background: #3b82f6; }
.leg-dot.summary  { background: #f43f5e; }
.leg-edge {
  width: 24px; height: 2px; flex-shrink: 0;
}
.leg-edge.blue  { background: #6366f1; }
.leg-edge.amber { border-top: 2px dashed #f59e0b; background: transparent; }
</style>
