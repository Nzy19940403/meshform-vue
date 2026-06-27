<template>
  <div class="cycle-graph-wrap">
    <div class="cg-header">
      <span class="cg-badge">有环图</span>
      <span class="cg-title">贷款四字段纠缠关系（Cyclic Graph）</span>
      <span class="cg-hint">每条边 = 一次 useEntangle 注册，双向都有边</span>
    </div>
    <div class="cg-body">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :fit-view-on-init="true"
        :prevent-scrolling="false"
        class="cg-flow"
      >
        <template #node-field="{ data }">
          <div class="cg-node">
            <div class="cn-icon">{{ data.icon }}</div>
            <div class="cn-label">{{ data.label }}</div>
            <div class="cn-sub">{{ data.sub }}</div>
          </div>
        </template>
      </VueFlow>
    </div>
    <div class="cg-legend">
      <span class="leg-item">
        <span class="leg-edge purple"></span>
        双向纠缠（任意一端变更，另一端随之收敛）
      </span>
      <span class="leg-item cycle-note">
        ⟳ 引擎用时序水位线避免死锁，有环依赖在时间轴上线性演化
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// 四个字段排成菱形，每对之间双向箭头
const nodes = [
  // Top
  { id: 'principal', type: 'field', position: { x: 200, y: 0   }, data: { icon: '🏠', label: 'principal',  sub: '本金（万元）' } },
  // Left
  { id: 'rate',      type: 'field', position: { x: 0,   y: 150 }, data: { icon: '📈', label: 'rate',       sub: '年利率（%）' } },
  // Right
  { id: 'term',      type: 'field', position: { x: 400, y: 150 }, data: { icon: '📅', label: 'term',       sub: '期限（月）' } },
  // Bottom
  { id: 'monthly',   type: 'field', position: { x: 200, y: 300 }, data: { icon: '💰', label: 'monthly',    sub: '月供（元）' } },
]

const cyclic = {
  animated: true,
  style: { stroke: '#a78bfa', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: '#a78bfa' },
  markerStart: { type: 'arrowclosed', color: '#a78bfa' },
}

const edges = [
  { id: 'e-pr',  source: 'principal', target: 'rate',      ...cyclic },
  { id: 'e-pt',  source: 'principal', target: 'term',      ...cyclic },
  { id: 'e-pm',  source: 'principal', target: 'monthly',   ...cyclic },
  { id: 'e-rt',  source: 'rate',      target: 'term',      ...cyclic },
  { id: 'e-rm',  source: 'rate',      target: 'monthly',   ...cyclic },
  { id: 'e-tm',  source: 'term',      target: 'monthly',   ...cyclic },
]
</script>

<style scoped>
.cycle-graph-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  overflow: hidden;
  margin: 20px 0;
}

.cg-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-border);
  flex-wrap: wrap;
}
.cg-badge {
  font-size: 10px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(139,92,246,.15);
  color: #a78bfa;
  border: 1px solid rgba(139,92,246,.3);
  letter-spacing: 0.06em;
}
.cg-title { font-size: 12px; font-weight: 600; color: var(--vp-c-text-1); }
.cg-hint  { font-size: 11px; color: var(--vp-c-text-2); margin-left: auto; }

.cg-body {
  height: 380px;
}

.cg-flow {
  width: 100%;
  height: 100%;
  background: transparent !important;
}

:deep(.vue-flow__background) { background: transparent !important; }
:deep(.vue-flow__node) { padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
:deep(.vue-flow__handle) { opacity: 0; }
:deep(.vue-flow__edge-path) { stroke-opacity: 0.8; }

.cg-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1.5px solid rgba(139,92,246,.5);
  background: rgba(139,92,246,.1);
  min-width: 120px;
  text-align: center;
  cursor: default;
  transition: border-color .15s;
}
.cg-node:hover { border-color: #8b5cf6; }
.cn-icon  { font-size: 20px; line-height: 1; }
.cn-label {
  font-size: 13px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: #a78bfa;
}
.cn-sub { font-size: 10px; color: var(--vp-c-text-2); }

/* Legend */
.cg-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-top: 1px solid var(--vp-c-border);
  font-size: 11px;
  color: var(--vp-c-text-2);
}
.leg-item { display: flex; align-items: center; gap: 5px; }
.leg-edge {
  width: 24px; height: 2px; flex-shrink: 0;
}
.leg-edge.purple { background: #a78bfa; }
.cycle-note { color: #a78bfa; font-weight: 600; }
</style>
