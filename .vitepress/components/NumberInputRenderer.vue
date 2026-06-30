<template>
  <div v-if="!state.hidden" class="mesh-control">
    <!-- Editable: show increment/decrement controls -->
    <v-number-input
      v-if="!state.readonly && !state.disabled"
      :model-value="state.value"
      :label="state.label"
      :required="state.required"
      :min="state.min"
      :max="state.max ?? undefined"
      :step="state.step"
      :precision="state.precision"
      :color="state.theme || undefined"
      control-variant="default"
      density="comfortable"
      variant="outlined"
      hide-details="auto"
      @update:model-value="handleChange"
    />
    <!-- Readonly / disabled: plain text field, no increment controls -->
    <v-text-field
      v-else
      :model-value="state.value"
      :label="state.label"
      :disabled="state.disabled"
      :readonly="state.readonly"
      :required="state.required"
      :color="state.theme || undefined"
      density="comfortable"
      variant="outlined"
      hide-details="auto"
      type="number"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { rendererProps, useJsonFormsControl, type ControlProps } from '@jsonforms/vue'
import { MESH_NODE_MAP_KEY } from '@meshflow/form-vue'

const props = defineProps({ ...rendererProps() })
const { control } = useJsonFormsControl(props as ControlProps)

const nodeMap = inject(MESH_NODE_MAP_KEY)
const node = computed(() => nodeMap?.value?.[control.value.path])
const schema = computed(() => control.value.schema as any)

const state = computed(() => {
  // 读 dirtySignal 触发 Vue 响应式追踪（值本身不使用）
  void node.value?.dirtySignal?.value

  const n = node.value
  const s = schema.value
  return {
    value:     (n?.value ?? s?.default ?? 0) as number,
    label:     (n?.label ?? control.value.label ?? '') as string,
    disabled:  !!n?.disabled,
    readonly:  !!n?.readonly,
    hidden:    !!n?.hidden,
    required:  !!n?.required,
    theme:     (n?.theme ?? s?.['x-theme'] ?? '') as string,
    min:       (n?.min ?? s?.['x-min'] ?? undefined) as number | undefined,
    max:       (s?.['x-max'] ?? undefined) as number | undefined,
    step:      (s?.['x-step'] ?? 1) as number,
    precision: (s?.['x-precision'] ?? 0) as number,
  }
})

function handleChange(val: number | null) {
  node.value?.dependOn?.(() => val ?? 0, 'value')
}
</script>
