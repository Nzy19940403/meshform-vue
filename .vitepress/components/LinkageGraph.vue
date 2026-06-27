<template>
  <div class="graph-outer">
    <div class="graph-header">
      <span class="graph-title">字段联动依赖图</span>
      <div class="graph-legend">
        <span class="legend-item"><span class="dot product"></span>产品信息</span>
        <span class="legend-item"><span class="dot discount"></span>折扣设置</span>
        <span class="legend-item"><span class="dot billing"></span>结算信息</span>
        <span class="legend-item"><span class="edge-sample solid"></span>值联动</span>
        <span class="legend-item"><span class="edge-sample dashed"></span>显隐控制</span>
      </div>
    </div>
    <div class="graph-wrapper">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :min-zoom="0.4"
        :max-zoom="2"
        :fit-view-on-init="true"
        :nodes-draggable="true"
        :pan-on-drag="true"
        :zoom-on-scroll="true"
        class="mesh-vueflow"
      >
        <template #node-field="{ data }">
          <div class="mesh-node" :class="[data.group, { computed: data.computed }]">
            <div class="node-group-label">{{ groupName(data.group) }}</div>
            <div class="node-name">{{ data.label }}</div>
            <div v-if="data.computed" class="node-badge">自动计算</div>
          </div>
        </template>
      </VueFlow>
    </div>
    <div class="graph-hint">可拖动节点 · 滚轮缩放</div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

function groupName(g: string) {
  return g === 'product' ? '产品信息' : g === 'discount' ? '折扣设置' : '结算信息'
}

// ── Nodes ──────────────────────────────────────────────────────────────────────
const nodes = [
  // Product group
  {
    id: 'category',
    type: 'field',
    position: { x: 0, y: 40 },
    data: { label: 'category', group: 'product', computed: false },
  },
  {
    id: 'name',
    type: 'field',
    position: { x: 220, y: 40 },
    data: { label: 'name', group: 'product', computed: false },
  },
  {
    id: 'basePrice',
    type: 'field',
    position: { x: 440, y: 40 },
    data: { label: 'basePrice', group: 'product', computed: true },
  },
  {
    id: 'quantity',
    type: 'field',
    position: { x: 0, y: 160 },
    data: { label: 'quantity', group: 'product', computed: false },
  },
  // Discount group
  {
    id: 'discountType',
    type: 'field',
    position: { x: 0, y: 300 },
    data: { label: 'discount.type', group: 'discount', computed: false },
  },
  {
    id: 'discountAmount',
    type: 'field',
    position: { x: 220, y: 300 },
    data: { label: 'discount.amount', group: 'discount', computed: false },
  },
  // Billing computed
  {
    id: 'subtotal',
    type: 'field',
    position: { x: 650, y: 100 },
    data: { label: 'subtotal', group: 'billing', computed: true },
  },
  {
    id: 'total',
    type: 'field',
    position: { x: 870, y: 100 },
    data: { label: 'total', group: 'billing', computed: true },
  },
  // Billing inputs
  {
    id: 'paymentMethod',
    type: 'field',
    position: { x: 0, y: 430 },
    data: { label: 'paymentMethod', group: 'billing', computed: false },
  },
  {
    id: 'installments',
    type: 'field',
    position: { x: 220, y: 430 },
    data: { label: 'installments', group: 'billing', computed: false },
  },
  {
    id: 'monthlyPayment',
    type: 'field',
    position: { x: 1090, y: 260 },
    data: { label: 'monthlyPayment', group: 'billing', computed: true },
  },
]

// ── Edges ──────────────────────────────────────────────────────────────────────
const valueStyle  = { stroke: '#6366f1', strokeWidth: 2 }
const hiddenStyle = { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '5 3' }

const edges = [
  // category → name (options)
  {
    id: 'e-cat-name',
    source: 'category',
    target: 'name',
    label: 'options',
    animated: true,
    style: valueStyle,
    labelStyle: { fill: '#818cf8', fontSize: 11 },
    labelBgStyle: { fill: 'transparent' },
  },
  // name → basePrice
  {
    id: 'e-name-price',
    source: 'name',
    target: 'basePrice',
    label: 'value',
    animated: true,
    style: valueStyle,
    labelStyle: { fill: '#818cf8', fontSize: 11 },
    labelBgStyle: { fill: 'transparent' },
  },
  // basePrice + quantity → subtotal
  {
    id: 'e-price-sub',
    source: 'basePrice',
    target: 'subtotal',
    animated: true,
    style: valueStyle,
  },
  {
    id: 'e-qty-sub',
    source: 'quantity',
    target: 'subtotal',
    animated: true,
    style: valueStyle,
  },
  // discountType → discountAmount (hidden)
  {
    id: 'e-dt-da',
    source: 'discountType',
    target: 'discountAmount',
    label: 'hidden',
    style: hiddenStyle,
    labelStyle: { fill: '#fbbf24', fontSize: 11 },
    labelBgStyle: { fill: 'transparent' },
  },
  // subtotal + discountType + discountAmount → total
  {
    id: 'e-sub-total',
    source: 'subtotal',
    target: 'total',
    animated: true,
    style: valueStyle,
  },
  {
    id: 'e-dt-total',
    source: 'discountType',
    target: 'total',
    animated: true,
    style: valueStyle,
  },
  {
    id: 'e-da-total',
    source: 'discountAmount',
    target: 'total',
    animated: true,
    style: valueStyle,
  },
  // paymentMethod → installments (hidden)
  {
    id: 'e-pm-inst',
    source: 'paymentMethod',
    target: 'installments',
    label: 'hidden',
    style: hiddenStyle,
    labelStyle: { fill: '#fbbf24', fontSize: 11 },
    labelBgStyle: { fill: 'transparent' },
  },
  // paymentMethod → monthlyPayment (hidden)
  {
    id: 'e-pm-mp',
    source: 'paymentMethod',
    target: 'monthlyPayment',
    label: 'hidden',
    style: hiddenStyle,
    labelStyle: { fill: '#fbbf24', fontSize: 11 },
    labelBgStyle: { fill: 'transparent' },
  },
  // total + installments → monthlyPayment
  {
    id: 'e-total-mp',
    source: 'total',
    target: 'monthlyPayment',
    animated: true,
    style: valueStyle,
  },
  {
    id: 'e-inst-mp',
    source: 'installments',
    target: 'monthlyPayment',
    animated: true,
    style: valueStyle,
  },
]
</script>

<style scoped>
.graph-outer {
  margin: 24px 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-border);
  flex-wrap: wrap;
  gap: 8px;
}
.graph-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: 'JetBrains Mono', monospace;
}
.graph-legend {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--vp-c-text-2);
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex-shrink: 0;
}
.dot.product  { background: rgba(99, 102, 241, 0.7); }
.dot.discount { background: rgba(245, 158, 11, 0.7); }
.dot.billing  { background: rgba(16, 185, 129, 0.7); }
.edge-sample {
  display: inline-block;
  width: 22px;
  height: 2px;
  flex-shrink: 0;
}
.edge-sample.solid  { background: #6366f1; }
.edge-sample.dashed {
  background: repeating-linear-gradient(
    to right, #f59e0b 0, #f59e0b 5px, transparent 5px, transparent 8px
  );
}

.graph-wrapper {
  height: 500px;
}
.mesh-vueflow {
  background: transparent;
}
.graph-hint {
  text-align: center;
  font-size: 11px;
  color: var(--vp-c-text-2);
  padding: 7px;
  border-top: 1px solid var(--vp-c-border);
}

/* Custom node styles */
.mesh-node {
  padding: 8px 14px;
  border-radius: 8px;
  min-width: 130px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  cursor: default;
  border: 1.5px solid;
  transition: box-shadow 0.2s;
}
.mesh-node:hover {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}
.mesh-node.product {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.45);
}
.mesh-node.discount {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.45);
}
.mesh-node.billing {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.45);
}
.mesh-node.computed {
  border-style: dashed;
}
.node-group-label {
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: 3px;
}
.mesh-node.product .node-group-label  { color: #a5b4fc; }
.mesh-node.discount .node-group-label { color: #fcd34d; }
.mesh-node.billing .node-group-label  { color: #6ee7b7; }
.node-name {
  font-size: 12px;
  font-weight: 600;
}
.mesh-node.product .node-name  { color: #c7d2fe; }
.mesh-node.discount .node-name { color: #fde68a; }
.mesh-node.billing .node-name  { color: #a7f3d0; }
.node-badge {
  font-size: 9px;
  margin-top: 3px;
  opacity: 0.65;
}
.mesh-node.product .node-badge  { color: #a5b4fc; }
.mesh-node.discount .node-badge { color: #fcd34d; }
.mesh-node.billing .node-badge  { color: #6ee7b7; }
</style>
