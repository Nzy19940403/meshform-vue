<template>
  <div class="why-graph-wrap">
    <div class="wg-header">
      <span class="wg-badge">DAG</span>
      <span class="wg-title">云资源采购单 — 联动依赖图</span>
    </div>
    <div class="wg-body">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :fit-view-on-init="true"
        :prevent-scrolling="false"
        class="wg-flow"
      >
        <template #node-field="{ data }">
          <div class="wg-node" :class="data.type">
            <div class="wn-dot"></div>
            <span class="wn-label">{{ data.label }}</span>
          </div>
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const nodes = [
  // Column 0
  { id: 'category',  type: 'field', position: { x: 0,   y: 80  }, data: { label: 'product.category',  type: 'input' } },

  // Column 1
  { id: 'nameOpts',  type: 'field', position: { x: 220, y: 0   }, data: { label: 'product.name.options', type: 'computed' } },
  { id: 'name',      type: 'field', position: { x: 220, y: 80  }, data: { label: 'product.name',        type: 'input' } },

  // Column 2
  { id: 'unitPrice', type: 'field', position: { x: 440, y: 80  }, data: { label: 'product.unitPrice',   type: 'computed' } },

  // Column 2 parallel
  { id: 'quantity',  type: 'field', position: { x: 440, y: 160 }, data: { label: 'product.quantity',    type: 'input' } },

  // Column 3
  { id: 'total',     type: 'field', position: { x: 660, y: 110 }, data: { label: 'billing.total',       type: 'output' } },
]

const blue = { animated: true,  style: { stroke: '#6366f1', strokeWidth: 1.8 } }

const edges = [
  { id: 'e1', source: 'category',  target: 'nameOpts',  ...blue },
  { id: 'e2', source: 'nameOpts',  target: 'name',      ...blue },
  { id: 'e3', source: 'name',      target: 'unitPrice', ...blue },
  { id: 'e4', source: 'unitPrice', target: 'total',     ...blue },
  { id: 'e5', source: 'quantity',  target: 'total',     ...blue },
]
</script>

<style scoped>
.why-graph-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  overflow: hidden;
  margin: 20px 0;
}

.wg-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-border);
}
.wg-badge {
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
.wg-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.wg-body {
  height: 260px;
}

.wg-flow {
  width: 100%;
  height: 100%;
  background: transparent !important;
}

:deep(.vue-flow__background) { background: transparent !important; }
:deep(.vue-flow__node) { padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
:deep(.vue-flow__handle) { opacity: 0; }
:deep(.vue-flow__edge-path) { stroke-opacity: 0.8; }

.wg-node {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: 7px;
  border: 1px solid;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  white-space: nowrap;
  cursor: default;
}
.wn-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.wg-node.input {
  background: rgba(99,102,241,.1);
  border-color: rgba(99,102,241,.4);
  color: #818cf8;
}
.wg-node.input .wn-dot { background: #6366f1; }

.wg-node.computed {
  background: rgba(245,158,11,.1);
  border-color: rgba(245,158,11,.4);
  color: #fbbf24;
}
.wg-node.computed .wn-dot { background: #f59e0b; }

.wg-node.output {
  background: rgba(52,211,153,.1);
  border-color: rgba(52,211,153,.4);
  color: #34d399;
}
.wg-node.output .wn-dot { background: #34d399; }
</style>
