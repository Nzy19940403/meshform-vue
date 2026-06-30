<template>
  <div v-if="!isHidden" class="warn-box">
    <span class="warn-icon">⚠</span>
    <div class="warn-body">
      <div class="warn-title">{{ control.label }}</div>
      <div class="warn-text">{{ nodeValue ?? control.data }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { MESH_NODE_MAP_KEY } from '@meshflow/form-vue'

const props = defineProps({ ...rendererProps() })
const { control } = useJsonFormsControl(props)
const nodeMap = inject<any>(MESH_NODE_MAP_KEY)

// 先拿到 node 对象（不追踪 dirty，避免整体对象引用不变导致无效更新）
const node = computed(() => nodeMap?.value?.[control.value.path])

// 分别对 hidden 和 value 做独立 computed，返回原始值
// dirtySignal 变化 → computed 重算 → 原始值变化 → Vue 触发重渲染
const isHidden = computed(() => {
  node.value?.dirtySignal?.value
  return node.value?.hidden
})
const nodeValue = computed(() => {
  node.value?.dirtySignal?.value
  return node.value?.value
})
</script>

<style scoped>
.warn-box {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.35);
  margin: 2px 0;
}
.warn-icon {
  font-size: 15px;
  line-height: 1.4;
  color: #f59e0b;
  flex-shrink: 0;
}
.warn-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.warn-title {
  font-size: 12px;
  font-weight: 700;
  color: #f59e0b;
  letter-spacing: 0.03em;
}
.warn-text {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(245, 158, 11, 0.85);
}
</style>
