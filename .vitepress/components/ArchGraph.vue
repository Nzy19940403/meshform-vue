<template>
  <div class="arch-wrap">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :fit-view-on-init="true"
      :prevent-scrolling="false"
      :nodes-draggable="false"
      :zoom-on-scroll="false"
      :pan-on-drag="false"
      class="arch-flow"
    >
      <template #node-layer="{ data }">
        <div class="layer-node" :class="data.variant">
          <div class="ln-head">
            <span class="ln-icon">{{ data.icon }}</span>
            <span class="ln-name">{{ data.name }}</span>
            <span v-if="data.badge" class="ln-badge" :class="data.badge">{{ data.badgeText }}</span>
          </div>
          <div class="ln-desc">{{ data.desc }}</div>
          <div v-if="data.apis?.length" class="ln-apis">
            <code v-for="api in data.apis" :key="api" class="api-chip">{{ api }}</code>
          </div>
        </div>
      </template>

      <template #node-ui-group="{ data }">
        <div class="ui-group-node">
          <div class="ug-title">{{ data.title }}</div>
          <div class="ug-items">
            <div v-for="item in data.items" :key="item.name" class="ug-item" :class="item.type">
              <span class="ug-icon">{{ item.icon }}</span>
              <span class="ug-name">{{ item.name }}</span>
              <span class="ug-sub">{{ item.sub }}</span>
            </div>
          </div>
        </div>
      </template>
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// ── 节点 ─────────────────────────────────────────────────────────────────────
// 居中宽度约 420px，x 从 0 开始，节点宽度在 CSS 里固定
const nodes = [
  {
    id: 'schema',
    type: 'layer',
    position: { x: 100, y: 0 },
    data: {
      variant: 'schema',
      icon: '📄',
      name: 'MeshFormSchema',
      desc: 'JSON Schema 字段声明 · x-widget · x-hidden · x-layout',
      badge: null,
      apis: [],
    },
  },
  {
    id: 'engine',
    type: 'layer',
    position: { x: 100, y: 130 },
    data: {
      variant: 'engine',
      icon: '⚙️',
      name: '@meshflow/form',
      desc: '联动引擎 — 纯 TypeScript，无任何 UI 依赖',
      badge: 'core',
      badgeText: '核心',
      apis: ['define()', 'from()', 'entangle()', 'setRule()'],
    },
  },
  {
    id: 'formvue',
    type: 'layer',
    position: { x: 100, y: 290 },
    data: {
      variant: 'formvue',
      icon: '💚',
      name: '@meshflow/form-vue',
      desc: 'Vue 3 绑定层 — 通过 UITrigger 接口桥接引擎与响应式',
      badge: null,
      apis: ['useMeshFormVue()', '<MeshForm>', 'meshRenderers'],
    },
  },
  {
    id: 'jsonforms',
    type: 'layer',
    position: { x: 100, y: 440 },
    data: {
      variant: 'jsonforms',
      icon: '🔀',
      name: '@jsonforms/vue',
      desc: 'Renderer 调度协议 — 按 Schema 类型匹配对应渲染器',
      badge: 'protocol',
      badgeText: '协议',
      apis: [],
    },
  },
  {
    id: 'ui',
    type: 'ui-group',
    position: { x: 26, y: 580 },
    data: {
      title: '可替换 UI 层',
      items: [
        { name: 'Vuetify 3',     sub: '默认内置', icon: '🎨', type: 'builtin' },
        { name: 'Element Plus',  sub: '自定义 Renderer', icon: '🧩', type: 'custom' },
        { name: 'Ant Design Vue',sub: '自定义 Renderer', icon: '🐜', type: 'custom' },
        { name: '自定义组件',    sub: '实现 Renderer 协议', icon: '✨', type: 'diy' },
      ],
    },
  },
]

// ── 边 ───────────────────────────────────────────────────────────────────────
const down = {
  type: 'smoothstep',
  style: { stroke: '#334155', strokeWidth: 1.5 },
  markerEnd: { type: 'arrowclosed', color: '#334155' },
  animated: false,
}
const uitrigger = {
  ...down,
  style: { stroke: '#a78bfa', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: '#a78bfa' },
  label: 'UITrigger 接口',
  labelStyle: { fill: '#a78bfa', fontSize: 10, fontWeight: 700 },
  labelBgStyle: { fill: 'transparent' },
}

const edges = [
  { id: 'e-s-e',   source: 'schema',   target: 'engine',   label: '解析', labelStyle: { fill: '#64748b', fontSize: 10 }, labelBgStyle: { fill: 'transparent' }, ...down },
  { id: 'e-e-fv',  source: 'engine',   target: 'formvue',  ...uitrigger },
  { id: 'e-fv-jf', source: 'formvue',  target: 'jsonforms', label: '委托渲染', labelStyle: { fill: '#64748b', fontSize: 10 }, labelBgStyle: { fill: 'transparent' }, ...down },
  { id: 'e-jf-ui', source: 'jsonforms', target: 'ui',       label: '匹配 Renderer', labelStyle: { fill: '#64748b', fontSize: 10 }, labelBgStyle: { fill: 'transparent' }, ...down },
]
</script>

<style scoped>
.arch-wrap {
  height: 760px;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  margin: 24px 0;
  background: var(--vp-c-bg);
}

.arch-flow {
  width: 100%; height: 100%;
  background: transparent !important;
}

:deep(.vue-flow__background)  { background: transparent !important; }
:deep(.vue-flow__node)        { padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
:deep(.vue-flow__handle)      { opacity: 0; }

/* ── Layer nodes ─────────────────────────────────────────────────── */
.layer-node {
  width: 420px;
  padding: 14px 18px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  display: flex; flex-direction: column; gap: 6px;
}

.ln-head {
  display: flex; align-items: center; gap: 8px;
}
.ln-icon  { font-size: 18px; line-height: 1; }
.ln-name  { font-size: 14px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
.ln-badge {
  font-size: 9px; font-weight: 800; padding: 2px 7px;
  border-radius: 4px; margin-left: auto; letter-spacing: .05em;
}
.ln-badge.core     { background: rgba(139,92,246,.2); color: #a78bfa; border: 1px solid rgba(139,92,246,.3); }
.ln-badge.protocol { background: rgba(59,130,246,.15); color: #60a5fa; border: 1px solid rgba(59,130,246,.3); }

.ln-desc { font-size: 11px; line-height: 1.5; }

.ln-apis { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
.api-chip {
  font-size: 10px; font-family: 'JetBrains Mono', monospace;
  padding: 2px 7px; border-radius: 4px;
}

/* Variant colours */
.layer-node.schema {
  border-color: rgba(100,116,139,.4);
  background: rgba(100,116,139,.08);
}
.layer-node.schema .ln-name { color: #94a3b8; }
.layer-node.schema .ln-desc { color: var(--vp-c-text-2); }

.layer-node.engine {
  border-color: rgba(139,92,246,.5);
  background: rgba(139,92,246,.1);
}
.layer-node.engine .ln-name { color: #a78bfa; }
.layer-node.engine .ln-desc { color: var(--vp-c-text-2); }
.layer-node.engine .api-chip {
  background: rgba(139,92,246,.15); color: #a78bfa;
  border: 1px solid rgba(139,92,246,.25);
}

.layer-node.formvue {
  border-color: rgba(16,185,129,.45);
  background: rgba(16,185,129,.08);
}
.layer-node.formvue .ln-name { color: #34d399; }
.layer-node.formvue .ln-desc { color: var(--vp-c-text-2); }
.layer-node.formvue .api-chip {
  background: rgba(16,185,129,.12); color: #34d399;
  border: 1px solid rgba(16,185,129,.25);
}

.layer-node.jsonforms {
  border-color: rgba(59,130,246,.4);
  background: rgba(59,130,246,.08);
}
.layer-node.jsonforms .ln-name { color: #60a5fa; }
.layer-node.jsonforms .ln-desc { color: var(--vp-c-text-2); }

/* ── UI group node ───────────────────────────────────────────────── */
.ui-group-node {
  width: 568px;
  border: 1.5px solid rgba(245,158,11,.35);
  background: rgba(245,158,11,.06);
  border-radius: 10px;
  padding: 12px 14px;
}
.ug-title {
  font-size: 10px; font-weight: 700;
  color: #f59e0b; margin-bottom: 10px;
  letter-spacing: .06em; text-transform: uppercase;
}
.ug-items {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.ug-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 6px; border-radius: 8px; text-align: center;
}
.ug-item.builtin {
  background: rgba(245,158,11,.15);
  border: 1px solid rgba(245,158,11,.3);
}
.ug-item.custom {
  background: rgba(245,158,11,.07);
  border: 1px dashed rgba(245,158,11,.3);
}
.ug-item.diy {
  background: rgba(245,158,11,.04);
  border: 1.5px dashed rgba(245,158,11,.4);
}
.ug-icon { font-size: 20px; }
.ug-name { font-size: 11px; font-weight: 700; color: #f59e0b; font-family: 'JetBrains Mono', monospace; }
.ug-sub  { font-size: 9px; color: var(--vp-c-text-2); }
</style>
