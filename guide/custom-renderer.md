# 自定义 Renderer

`@meshflow/form-vue` 的渲染层完全基于 `@jsonforms/vue` 的 Renderer 注册体系，可以无缝替换或扩展任何控件。

## 注册自定义 Renderer

```typescript
import { meshRenderers } from '@meshflow/form-vue'
import { rankWith, isStringControl } from '@jsonforms/core'
import MyStringInput from './MyStringInput.vue'

const myRenderers = [
  // rank 越高优先级越高；内置 renderer 的 rank 是 3（select/enum 为 5）
  { tester: rankWith(10, isStringControl), renderer: MyStringInput },
]
```

然后将 `renderers` 传给 `<MeshForm>`，组件会自动将它们**前置**于内置 renderer 列表（即 rank 更高时自定义 renderer 优先生效）：

```vue
<MeshForm :schema="schema" :rules="rules" :renderers="myRenderers" />

## 编写 Renderer 组件

Renderer 需遵循 `@jsonforms/vue` 的协议，通过 `MESH_NODE_MAP_KEY` 注入拿到 meshflow 节点：

```vue
<template>
  <div v-if="!node?.hidden" class="my-string-input">
    <label>{{ node?.label ?? control.label }}</label>
    <input
      :value="node?.value ?? ''"
      :disabled="node?.disabled"
      @input="handleChange($event.target.value)"
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

// node.value?.dirtySignal?.value  ← 在 computed 里读取，建立响应式追踪
const state = computed(() => {
  const _sig = node.value?.dirtySignal?.value  // UITrigger 订阅
  return {
    value: node.value?.value ?? '',
    label: node.value?.label ?? control.value.label,
    disabled: !!node.value?.disabled,
    hidden: !!node.value?.hidden,
  }
})

function handleChange(newValue: string) {
  // 通过 dependOn 将新值写回 meshflow 节点
  node.value?.dependOn?.(() => newValue, 'value')
}
</script>
```

## UITrigger 响应式原理

meshflow 节点通过 `dirtySignal` 通知 Vue 响应式系统：

```
meshflow 节点计算完成
    │
    ▼
signalTrigger(signal) → signal.value++
    │
    ▼
computed 内读取了 node.dirtySignal.value → Vue 追踪到依赖
    │
    ▼
computed 重新执行 → 读取 node.value / node.hidden / ... → UI 更新
```

因此，**在 `computed` 里读取 `node?.dirtySignal?.value` 是必须的**，即使这个值本身没有被使用。

## 可读取的节点属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `node.value` | `any` | 字段当前值 |
| `node.hidden` | `boolean` | 是否隐藏 |
| `node.disabled` | `boolean` | 是否禁用 |
| `node.readonly` | `boolean` | 是否只读 |
| `node.required` | `boolean` | 是否必填 |
| `node.label` | `string` | 字段标签 |
| `node.placeholder` | `string` | 占位文字 |
| `node.options` | `{label,value}[]` | 下拉选项 |
| `node.theme` | `string` | Vuetify color |
| `node.dirtySignal` | `Ref<number>` | 响应式触发信号 |

## 写回节点值

```typescript
// 写回 value
node.value?.dependOn?.(() => newValue, 'value')

// 也可以写回其他可写属性
node.value?.dependOn?.(() => true, 'hidden')
```
