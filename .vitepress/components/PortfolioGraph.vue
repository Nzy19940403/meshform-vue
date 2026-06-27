<template>
  <div class="pg-wrap">
    <div class="pg-header">
      <span class="badge-ent">⟳ useEntangle</span>
      <span class="badge-dag">→ from/define</span>
      <span class="pg-title">资产配置联动图 — DAG + 有环图混合</span>
    </div>
    <div class="pg-body">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :fit-view-on-init="true"
        :prevent-scrolling="false"
        class="pg-flow"
      >
        <template #node-input="{ data }">
          <div class="pn-node pn-input">
            <div class="pn-icon">{{ data.icon }}</div>
            <div class="pn-label">{{ data.label }}</div>
            <div class="pn-sub">{{ data.sub }}</div>
          </div>
        </template>
        <template #node-ent="{ data }">
          <div class="pn-node pn-ent">
            <div class="pn-icon">{{ data.icon }}</div>
            <div class="pn-label">{{ data.label }}</div>
            <div class="pn-sub">{{ data.sub }}</div>
          </div>
        </template>
        <template #node-dag="{ data }">
          <div class="pn-node pn-dag">
            <div class="pn-label">{{ data.label }}</div>
            <div class="pn-sub">{{ data.sub }}</div>
          </div>
        </template>
        <template #node-out="{ data }">
          <div class="pn-node pn-out">
            <div class="pn-icon">{{ data.icon }}</div>
            <div class="pn-label">{{ data.label }}</div>
            <div class="pn-sub">{{ data.sub }}</div>
          </div>
        </template>
      </VueFlow>
    </div>
    <div class="pg-legend">
      <span class="leg-item">
        <span class="leg-edge ent"></span>⟳ useEntangle（双向，有环，差量收敛）
      </span>
      <span class="leg-item">
        <span class="leg-edge dag"></span>→ from/define（单向，DAG 拓扑调度）
      </span>
      <span class="leg-item">
        <span class="leg-edge dag-dim"></span>→ from（三收益合并至总收益）
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// ── 节点布局 ──────────────────────────────────────────────────────────────────
// 列位置: stock=80, bond=280, cash=480
// 行位置: total=0, pct=140, amt=280, ret=400, total_ret=520

const nodes = [
  // L0 — 输入
  { id: 'total', type: 'input', position: { x: 230, y: 0 },
    data: { icon: '💰', label: 'total', sub: '总资金（输入）' } },

  // L1 — 百分比（纠缠节点）
  { id: 'sp', type: 'ent', position: { x: 60,  y: 150 },
    data: { icon: '📈', label: 'stock%', sub: '股票比例' } },
  { id: 'bp', type: 'ent', position: { x: 240, y: 150 },
    data: { icon: '🏦', label: 'bond%', sub: '债券比例' } },
  { id: 'cp', type: 'ent', position: { x: 420, y: 150 },
    data: { icon: '💵', label: 'cash%', sub: '现金比例' } },

  // L2 — 金额（DAG 推导）
  { id: 'sa', type: 'dag', position: { x: 60,  y: 300 },
    data: { label: 'stockAmt', sub: '股票金额' } },
  { id: 'ba', type: 'dag', position: { x: 240, y: 300 },
    data: { label: 'bondAmt', sub: '债券金额' } },
  { id: 'ca', type: 'dag', position: { x: 420, y: 300 },
    data: { label: 'cashAmt', sub: '现金金额' } },

  // L3 — 收益（DAG 推导）
  { id: 'sr', type: 'dag', position: { x: 60,  y: 430 },
    data: { label: 'stockRet', sub: '股票收益' } },
  { id: 'br', type: 'dag', position: { x: 240, y: 430 },
    data: { label: 'bondRet', sub: '债券收益' } },
  { id: 'cr', type: 'dag', position: { x: 420, y: 430 },
    data: { label: 'cashRet', sub: '现金收益' } },

  // L4 — 总输出
  { id: 'total_ret', type: 'out', position: { x: 230, y: 560 },
    data: { icon: '📊', label: 'totalReturn', sub: '预期总收益（输出）' } },
]

// ── 边 ────────────────────────────────────────────────────────────────────────
// useEntangle: 紫色, 双向箭头, 动画
const ent = {
  animated: true,
  style: { stroke: '#a78bfa', strokeWidth: 2 },
  markerEnd:   { type: 'arrowclosed', color: '#a78bfa' },
  markerStart: { type: 'arrowclosed', color: '#a78bfa' },
  labelStyle:  { fill: '#a78bfa', fontSize: 9, fontWeight: 700 },
  labelBgStyle: { fill: 'transparent' },
}

// from/define: 蓝色, 单向
const dag = {
  style: { stroke: '#60a5fa', strokeWidth: 1.5 },
  markerEnd: { type: 'arrowclosed', color: '#60a5fa' },
}

// 收敛汇入边: 细线
const merge = {
  style: { stroke: '#34d399', strokeWidth: 1.5, strokeDasharray: '4 2' },
  markerEnd: { type: 'arrowclosed', color: '#34d399' },
}

const edges = [
  // useEntangle — 比例三角约束（紫色双向）
  { id: 'e-sp-bp', source: 'sp', target: 'bp', label: '⟳', ...ent },
  { id: 'e-sp-cp', source: 'sp', target: 'cp', label: '⟳', ...ent },
  { id: 'e-bp-cp', source: 'bp', target: 'cp', label: '⟳', ...ent },

  // DAG: total → 各金额（蓝色）
  { id: 'e-t-sa', source: 'total', target: 'sa', ...dag },
  { id: 'e-t-ba', source: 'total', target: 'ba', ...dag },
  { id: 'e-t-ca', source: 'total', target: 'ca', ...dag },

  // DAG: 比例 → 金额（蓝色）
  { id: 'e-sp-sa', source: 'sp', target: 'sa', ...dag },
  { id: 'e-bp-ba', source: 'bp', target: 'ba', ...dag },
  { id: 'e-cp-ca', source: 'cp', target: 'ca', ...dag },

  // DAG: 金额 → 收益（蓝色）
  { id: 'e-sa-sr', source: 'sa', target: 'sr', ...dag },
  { id: 'e-ba-br', source: 'ba', target: 'br', ...dag },
  { id: 'e-ca-cr', source: 'ca', target: 'cr', ...dag },

  // DAG: 收益 → 总收益（绿色虚线，汇合）
  { id: 'e-sr-tr', source: 'sr', target: 'total_ret', ...merge },
  { id: 'e-br-tr', source: 'br', target: 'total_ret', ...merge },
  { id: 'e-cr-tr', source: 'cr', target: 'total_ret', ...merge },
]
</script>

<style scoped>
.pg-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  overflow: hidden;
  margin: 20px 0;
}

.pg-header {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.badge-ent {
  font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
  padding: 2px 8px; border-radius: 4px;
  background: rgba(139,92,246,.15); color: #a78bfa;
  border: 1px solid rgba(139,92,246,.3);
}
.badge-dag {
  font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
  padding: 2px 8px; border-radius: 4px;
  background: rgba(59,130,246,.12); color: #60a5fa;
  border: 1px solid rgba(59,130,246,.25);
}
.pg-title { font-size: 12px; font-weight: 600; color: var(--vp-c-text-1); }

.pg-body { height: 680px; }
.pg-flow {
  width: 100%; height: 100%;
  background: transparent !important;
}

:deep(.vue-flow__background) { background: transparent !important; }
:deep(.vue-flow__node) { padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
:deep(.vue-flow__handle) { opacity: 0; }

/* Node types */
.pn-node {
  display: flex; flex-direction: column; align-items: center;
  gap: 3px; padding: 10px 14px; border-radius: 10px;
  min-width: 100px; text-align: center; cursor: default;
}
.pn-icon  { font-size: 18px; line-height: 1; }
.pn-label { font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
.pn-sub   { font-size: 9px; color: var(--vp-c-text-2); }

.pn-input {
  border: 1.5px solid rgba(100,116,139,.5);
  background: rgba(100,116,139,.1);
}
.pn-input .pn-label { color: var(--vp-c-text-1); }

.pn-ent {
  border: 1.5px solid rgba(139,92,246,.5);
  background: rgba(139,92,246,.1);
}
.pn-ent .pn-label { color: #a78bfa; }

.pn-dag {
  border: 1.5px solid rgba(59,130,246,.4);
  background: rgba(59,130,246,.08);
}
.pn-dag .pn-label { color: #60a5fa; }

.pn-out {
  border: 1.5px solid rgba(16,185,129,.5);
  background: rgba(16,185,129,.1);
}
.pn-out .pn-label { color: #34d399; }

/* Legend */
.pg-legend {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 10px 16px;
  border-top: 1px solid var(--vp-c-border);
  font-size: 11px; color: var(--vp-c-text-2);
}
.leg-item { display: flex; align-items: center; gap: 5px; }
.leg-edge {
  width: 22px; height: 2px; flex-shrink: 0; border-radius: 1px;
}
.leg-edge.ent { background: #a78bfa; }
.leg-edge.dag { background: #60a5fa; }
.leg-edge.dag-dim {
  background: #34d399;
  background-image: repeating-linear-gradient(90deg, #34d399 0, #34d399 4px, transparent 4px, transparent 6px);
}
</style>
