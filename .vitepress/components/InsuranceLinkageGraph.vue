<template>
  <div class="ins-graph-wrap">
    <div class="graph-header">
      <span class="graph-badge">DAG</span>
      <span class="graph-title">保险表单联动依赖图（8 层计算链）</span>
      <span class="graph-hint">从 birthYear 到 perPayment，引擎保证拓扑顺序一次性传播</span>
    </div>
    <div class="graph-body">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :fit-view-on-init="true"
        :prevent-scrolling="false"
        class="ins-flow"
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
      <span class="leg-item"><span class="leg-dot insured"></span>被保险人</span>
      <span class="leg-item"><span class="leg-dot health"></span>健康告知</span>
      <span class="leg-item"><span class="leg-dot product"></span>险种方案</span>
      <span class="leg-item"><span class="leg-dot premium"></span>保费计算</span>
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
// Layer 0: inputs (birthYear, height, weight, gender, occupation, productType, coverageAmount, paymentFreq, smoke, chronicDisease)
// Layer 1: first-level computed (age, bmi, occupationRisk, baseRate)
// Layer 2: basePremium, needMedical
// Layer 3: surcharges (smoker, occupation, bmi, disease, accident, disability)
// Layer 4: adjustedAnnual
// Layer 5: freqFactor
// Layer 6: annualPremium
// Layer 7: perPayment

const nodes = [
  // ── Layer 0 – inputs ────────────────────────────────────────────────────
  { id: 'birthYear',      type: 'field', position: { x: 0,   y: 0   }, data: { label: 'birthYear',      group: 'insured' } },
  { id: 'gender',         type: 'field', position: { x: 0,   y: 60  }, data: { label: 'gender',         group: 'insured' } },
  { id: 'occupation',     type: 'field', position: { x: 0,   y: 120 }, data: { label: 'occupation',     group: 'insured' } },
  { id: 'height',         type: 'field', position: { x: 0,   y: 200 }, data: { label: 'height',         group: 'health' } },
  { id: 'weight',         type: 'field', position: { x: 0,   y: 260 }, data: { label: 'weight',         group: 'health' } },
  { id: 'smoke',          type: 'field', position: { x: 0,   y: 320 }, data: { label: 'smoke',          group: 'health' } },
  { id: 'chronicDisease', type: 'field', position: { x: 0,   y: 380 }, data: { label: 'chronicDisease', group: 'health' } },
  { id: 'productType',    type: 'field', position: { x: 0,   y: 460 }, data: { label: 'productType',    group: 'product' } },
  { id: 'coverageAmount', type: 'field', position: { x: 0,   y: 520 }, data: { label: 'coverageAmount', group: 'product' } },
  { id: 'paymentFreq',    type: 'field', position: { x: 0,   y: 580 }, data: { label: 'paymentFreq',    group: 'product' } },
  { id: 'addAccident',    type: 'field', position: { x: 0,   y: 640 }, data: { label: 'addAccident',    group: 'product' } },
  { id: 'addDisability',  type: 'field', position: { x: 0,   y: 700 }, data: { label: 'addDisability',  group: 'product' } },

  // ── Layer 1 – first computed ─────────────────────────────────────────────
  { id: 'age',            type: 'field', position: { x: 200, y: 0   }, data: { label: 'age',            group: 'insured', sub: '← birthYear' } },
  { id: 'occupationRisk', type: 'field', position: { x: 200, y: 120 }, data: { label: 'occupationRisk', group: 'insured', sub: '← occupation' } },
  { id: 'bmi',            type: 'field', position: { x: 200, y: 230 }, data: { label: 'bmi',            group: 'health',  sub: '← h + w' } },
  { id: 'bmiStatus',      type: 'field', position: { x: 200, y: 310 }, data: { label: 'bmiStatus',      group: 'health',  sub: '← bmi' } },
  { id: 'needMedical',    type: 'field', position: { x: 200, y: 520 }, data: { label: 'needMedical',    group: 'product', sub: '← coverageAmount' } },

  // ── Layer 2 – baseRate, basePremium ──────────────────────────────────────
  { id: 'baseRate',       type: 'field', position: { x: 400, y: 30  }, data: { label: 'baseRate',       group: 'premium', sub: '← productType + age + gender' } },
  { id: 'basePremium',    type: 'field', position: { x: 400, y: 490 }, data: { label: 'basePremium',    group: 'premium', sub: '← baseRate × coverageAmount × 10' } },

  // ── Layer 3 – surcharges ─────────────────────────────────────────────────
  { id: 'smokerSurcharge',      type: 'field', position: { x: 620, y: 320 }, data: { label: 'smokerSurcharge',      group: 'premium', sub: '× 30%' } },
  { id: 'occupationSurcharge',  type: 'field', position: { x: 620, y: 400 }, data: { label: 'occupationSurcharge',  group: 'premium', sub: '× risk%' } },
  { id: 'bmiSurcharge',         type: 'field', position: { x: 620, y: 480 }, data: { label: 'bmiSurcharge',         group: 'premium', sub: '× 10/20%' } },
  { id: 'diseaseSurcharge',     type: 'field', position: { x: 620, y: 560 }, data: { label: 'diseaseSurcharge',     group: 'premium', sub: '× 25%' } },
  { id: 'accidentPremium',      type: 'field', position: { x: 620, y: 640 }, data: { label: 'accidentPremium',      group: 'premium', sub: 'fixed' } },
  { id: 'disabilityPremium',    type: 'field', position: { x: 620, y: 720 }, data: { label: 'disabilityPremium',    group: 'premium', sub: 'fixed' } },

  // ── Layer 4 – adjustedAnnual ─────────────────────────────────────────────
  { id: 'adjustedAnnual', type: 'field', position: { x: 840, y: 490 }, data: { label: 'adjustedAnnual', group: 'premium', sub: 'sum of 6 sources' } },

  // ── Layer 5 – freqFactor ─────────────────────────────────────────────────
  { id: 'freqFactor',     type: 'field', position: { x: 840, y: 580 }, data: { label: 'freqFactor',     group: 'premium', sub: '← paymentFreq' } },

  // ── Layer 6 – annualPremium ──────────────────────────────────────────────
  { id: 'annualPremium',  type: 'field', position: { x: 1060, y: 520 }, data: { label: 'annualPremium', group: 'premium', sub: '× freqFactor' } },

  // ── Layer 7 – perPayment ─────────────────────────────────────────────────
  { id: 'perPayment',     type: 'field', position: { x: 1280, y: 520 }, data: { label: 'perPayment',    group: 'premium', sub: '÷ times' } },
]

// ── 边定义 ───────────────────────────────────────────────────────────────────
const blue  = { animated: true,  style: { stroke: '#6366f1', strokeWidth: 1.5 } }
const amber = { animated: false, style: { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '4 3' } }

const edges = [
  // Layer 0 → 1
  { id: 'e-by-age',    source: 'birthYear',      target: 'age',           ...blue },
  { id: 'e-occ-risk',  source: 'occupation',     target: 'occupationRisk',...blue },
  { id: 'e-h-bmi',     source: 'height',         target: 'bmi',           ...blue },
  { id: 'e-w-bmi',     source: 'weight',         target: 'bmi',           ...blue },
  { id: 'e-bmi-stat',  source: 'bmi',            target: 'bmiStatus',     ...blue },
  { id: 'e-cov-med',   source: 'coverageAmount', target: 'needMedical',   ...amber },

  // Layer 0/1 → baseRate
  { id: 'e-pt-br',     source: 'productType',    target: 'baseRate',      ...blue },
  { id: 'e-age-br',    source: 'age',            target: 'baseRate',      ...blue },
  { id: 'e-gen-br',    source: 'gender',         target: 'baseRate',      ...blue },

  // Layer 0/2 → basePremium
  { id: 'e-br-bp',     source: 'baseRate',       target: 'basePremium',   ...blue },
  { id: 'e-cov-bp',    source: 'coverageAmount', target: 'basePremium',   ...blue },

  // basePremium → surcharges
  { id: 'e-bp-smk',    source: 'basePremium',    target: 'smokerSurcharge',     ...blue },
  { id: 'e-bp-occ',    source: 'basePremium',    target: 'occupationSurcharge', ...blue },
  { id: 'e-bp-bmi',    source: 'basePremium',    target: 'bmiSurcharge',        ...blue },
  { id: 'e-bp-dis',    source: 'basePremium',    target: 'diseaseSurcharge',    ...blue },
  { id: 'e-cov-acc',   source: 'coverageAmount', target: 'accidentPremium',     ...blue },
  { id: 'e-cov-dbl',   source: 'coverageAmount', target: 'disabilityPremium',   ...blue },

  // side inputs to surcharges
  { id: 'e-smk-smk',   source: 'smoke',          target: 'smokerSurcharge',     ...blue },
  { id: 'e-risk-occ',  source: 'occupationRisk', target: 'occupationSurcharge', ...blue },
  { id: 'e-bmi-bmi',   source: 'bmi',            target: 'bmiSurcharge',        ...blue },
  { id: 'e-chro-dis',  source: 'chronicDisease', target: 'diseaseSurcharge',    ...blue },
  { id: 'e-acc-acc',   source: 'addAccident',    target: 'accidentPremium',     ...amber },
  { id: 'e-dbl-dbl',   source: 'addDisability',  target: 'disabilityPremium',   ...amber },

  // surcharges → adjustedAnnual
  { id: 'e-bp-adj',    source: 'basePremium',       target: 'adjustedAnnual', ...blue },
  { id: 'e-smks-adj',  source: 'smokerSurcharge',   target: 'adjustedAnnual', ...blue },
  { id: 'e-occs-adj',  source: 'occupationSurcharge', target: 'adjustedAnnual', ...blue },
  { id: 'e-bmis-adj',  source: 'bmiSurcharge',      target: 'adjustedAnnual', ...blue },
  { id: 'e-diss-adj',  source: 'diseaseSurcharge',  target: 'adjustedAnnual', ...blue },
  { id: 'e-acc-adj',   source: 'accidentPremium',   target: 'adjustedAnnual', ...blue },
  { id: 'e-dbl-adj',   source: 'disabilityPremium', target: 'adjustedAnnual', ...blue },

  // freqFactor
  { id: 'e-pf-ff',     source: 'paymentFreq',    target: 'freqFactor',    ...blue },

  // → annualPremium
  { id: 'e-adj-ann',   source: 'adjustedAnnual', target: 'annualPremium', ...blue },
  { id: 'e-ff-ann',    source: 'freqFactor',     target: 'annualPremium', ...blue },

  // → perPayment
  { id: 'e-ann-per',   source: 'annualPremium',  target: 'perPayment',    ...blue },
]
</script>

<style scoped>
.ins-graph-wrap {
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
  height: 560px;
}

.ins-flow {
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
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid;
  min-width: 150px;
  max-width: 175px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  cursor: default;
  position: relative;
  padding-left: 20px;
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

/* Group colors */
.field-node.insured {
  background: rgba(99,102,241,.1);
  border-color: rgba(99,102,241,.4);
  color: #818cf8;
}
.field-node.insured .fn-dot { background: #6366f1; }

.field-node.health {
  background: rgba(16,185,129,.1);
  border-color: rgba(16,185,129,.4);
  color: #34d399;
}
.field-node.health .fn-dot { background: #10b981; }

.field-node.product {
  background: rgba(245,158,11,.1);
  border-color: rgba(245,158,11,.4);
  color: #fbbf24;
}
.field-node.product .fn-dot { background: #f59e0b; }

.field-node.premium {
  background: rgba(52,211,153,.1);
  border-color: rgba(52,211,153,.4);
  color: #6ee7b7;
}
.field-node.premium .fn-dot { background: #34d399; }

/* Legend */
.graph-legend {
  display: flex;
  align-items: center;
  gap: 16px;
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
.leg-dot.insured  { background: #6366f1; }
.leg-dot.health   { background: #10b981; }
.leg-dot.product  { background: #f59e0b; }
.leg-dot.premium  { background: #34d399; }
.leg-edge {
  width: 24px; height: 2px; flex-shrink: 0;
}
.leg-edge.blue  { background: #6366f1; }
.leg-edge.amber { background: #f59e0b; border-top: 2px dashed #f59e0b; background: transparent; }
</style>
