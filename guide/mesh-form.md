# MeshForm 组件

`<MeshForm>` 是 `@meshflow/form-vue` 的核心渲染组件，将引擎状态与 `@jsonforms/vue` 连接起来。

引擎在组件内部创建，生命周期与组件绑定——不需要手动管理 `id` 和 `deleteEngine`。

## Props

| Prop | 类型 | 必填 | 说明 |
|---|---|---|---|
| `schema` | `MeshFormSchema` | ✅ | 表单 Schema |
| `data` | `Record<string, any>` | — | 初始值，与 JSON Forms 的 `:data` prop 结构相同，在引擎首次计算前写入各字段节点 |
| `rules` | `Record<string, FromDescriptor>` | — | 联动规则，与 `engine.define()` 参数相同，在引擎初始化前注册 |
| `uischema` | `UISchemaElement` | — | 自定义 UISchema，不填则由 Schema 自动生成 |
| `renderers` | `JsonFormsRendererRegistryEntry[]` | — | 自定义渲染器，优先级高于内置 `meshRenderers` |

## Events

| 事件 | 参数 | 说明 |
|---|---|---|
| `@change` | `data: Record<string, any>` | 每次引擎计算完成后触发（初始化 + 每次字段变更），与 JSON Forms 的 `@change` 对齐 |
| `@submit` | `data: Record<string, any>` | 调用 `submit()` 时触发，携带当前完整表单数据 |

## Slots

| 插槽名 | 插槽 Props | 说明 |
|---|---|---|
| `#actions` | `{ submit, getFormData }` | 操作区（按钮等），注入 `submit()` 和 `getFormData()` 方法 |

## 基础用法

```vue
<template>
  <MeshForm :schema="schema" :rules="rules" @submit="handleSubmit">
    <template #actions="{ submit }">
      <v-btn color="primary" @click="submit">提交</v-btn>
      <v-btn variant="text" @click="reset">重置</v-btn>
    </template>
  </MeshForm>
</template>

<script setup lang="ts">
import { MeshForm, from } from '@meshflow/form-vue'
import type { MeshFormSchema, FromDescriptor } from '@meshflow/form-vue'

const schema: MeshFormSchema = { ... }

const rules: Record<string, FromDescriptor> = {
  'billing.total.value': from(['price', 'qty'], (p, q) => p * q),
  'discount.hidden':     from('type', t => t === 'none'),
}

function handleSubmit(data: Record<string, any>) {
  console.log(data)
}
</script>
```

## 主动获取表单数据

不通过 `@submit`，而是在任意时机主动获取：

```vue
<template>
  <MeshForm :schema="schema" :rules="rules">
    <template #actions="{ getFormData }">
      <v-btn @click="preview(getFormData())">预览</v-btn>
    </template>
  </MeshForm>
</template>
```

## 高级：通过 ref 访问引擎

需要访问引擎 hooks、依赖图等高级功能时，用模板 ref：

```vue
<template>
  <MeshForm ref="formRef" :schema="schema" :rules="rules" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MeshForm } from '@meshflow/form-vue'
import type { MeshFormInstance } from '@meshflow/form-vue'

const formRef = ref<MeshFormInstance>()

onMounted(() => {
  // 访问引擎实例
  formRef.value!.engine.hooks.onSuccess(() => {
    const data = formRef.value!.getFormData()
    console.log('表单更新：', data)
  })

  // 依赖图
  const downstream = formRef.value!.engine.graph.directDownstream('product.category')
  console.log('下游字段：', downstream)
})
</script>
```

## 自定义 UISchema

默认情况下，`MeshForm` 根据 Schema 的结构自动生成 UISchema：
- 根层 → `VerticalLayout`
- 对象节点 → `Group`（带标题）
- `x-layout: 'horizontal'` → `HorizontalLayout`
- 叶子字段 → `Control`

如需完全自定义布局，传入 `uischema`：

```typescript
import type { UISchemaElement } from '@jsonforms/core'

const uischema: UISchemaElement = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'HorizontalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/product/properties/category' },
        { type: 'Control', scope: '#/properties/product/properties/quantity' },
      ]
    }
  ]
}
```

```vue
<MeshForm :schema="schema" :rules="rules" :uischema="uischema" />
```

## 从 JSON Forms 迁移

已经在用 `@jsonforms/vue`？替换成本极低：

```vue
<!-- 之前 -->
<json-forms
  :schema="schema"
  :data="data"
  :renderers="renderers"
  @change="({ data }) => formData = data"
/>

<!-- 之后：换标签名，加 :rules -->
<MeshForm
  :schema="schema"
  :data="data"
  :renderers="renderers"
  :rules="rules"
  @change="data => formData = data"
/>
```

不需要改动的部分：Schema 结构、自定义 Renderer、`@change` 数据格式、`uischema`。

只需要新增：用 `from()` 声明字段之间的联动规则，传给 `:rules`。

## 加载状态

`MeshForm` 在引擎初始化（`notifyAll()`）完成前显示 `v-skeleton-loader`，完成后才渲染表单，避免闪烁。

## 生命周期

引擎随组件自动创建和销毁，不需要手动调用 `deleteEngine`。
