<script setup>
import QuickDemo from '../.vitepress/components/QuickDemo.vue'
</script>

# 快速开始

## 先看效果

3 个字段、1 条计算规则 —— 这就是 meshform 最基本的用法：

<ClientOnly>
  <QuickDemo />
</ClientOnly>

## 安装

```bash
npm install @meshflow/form-vue
```

安装 Peer Dependencies：

```bash
npm install vue@^3 vuetify@^3 @jsonforms/core@^3 @jsonforms/vue@^3 @meshflow/core @meshflow/form
```

## 完整示例

下面用一个"云资源采购单"演示完整用法：**category 变化 → name 选项联动 → price 自动填充 → total 实时计算**。

### 1. 定义 Schema

```typescript
import type { MeshFormSchema } from '@meshflow/form-vue'

const schema: MeshFormSchema = {
  type: 'object',
  title: '云资源采购单',
  properties: {
    product: {
      type: 'object',
      title: '产品信息',
      'x-layout': 'horizontal',
      properties: {
        category: {
          type: 'string',
          title: '产品类目',
          default: 'software',
          'x-widget': 'select',
          'x-options': [
            { label: '软件授权', value: 'software' },
            { label: '硬件设备', value: 'hardware' },
            { label: '云服务',   value: 'cloud' },
          ],
        },
        name: {
          type: 'string',
          title: '产品名称',
          default: 'basic',
          'x-widget': 'select',
          'x-options': [],       // 由联动规则动态填充
        },
        quantity: { type: 'integer', title: '数量', default: 1 },
        unitPrice: { type: 'number', title: '单价 (¥)', default: 0, 'x-readonly': true },
      },
    },
    billing: {
      type: 'object',
      title: '结算信息',
      properties: {
        total: {
          type: 'number',
          title: '应付总额 (¥)',
          default: 0,
          'x-disabled': true,
          'x-theme': 'success',
        },
      },
    },
  },
}
```

### 2. 定义联动规则

```typescript
import { from } from '@meshflow/form-vue'
import type { FromDescriptor } from '@meshflow/form-vue'

const PRODUCT_OPTIONS = {
  software: [
    { label: '基础版  ¥999/年',   value: 'basic',      price: 999 },
    { label: '专业版  ¥4999/年',  value: 'pro',        price: 4999 },
  ],
  hardware: [
    { label: '入门服务器 ¥29999', value: 'server_s',   price: 29999 },
  ],
  cloud: [
    { label: '2C4G  ¥299/月',    value: 'cloud_s',    price: 299 },
  ],
}
const PRICE_MAP = Object.fromEntries(
  Object.values(PRODUCT_OPTIONS).flat().map(o => [o.value, o.price])
)

const rules: Record<string, FromDescriptor> = {
  // category 变化 → name 的选项列表更新，且自动重置 value
  'product.name.options': from('product.category', (cat: string) =>
    (PRODUCT_OPTIONS[cat] ?? []).map(({ label, value }) => ({ label, value })),
  {
    effect: ({ options, value }: any) => {
      const valid = options.some((o: any) => o.value === value)
      return valid ? undefined : { value: options[0]?.value ?? '' }
    },
    effectArgs: ['options', 'value'],
  }),

  // name → 单价
  'product.unitPrice.value': from('product.name', (name: string) => PRICE_MAP[name] ?? 0),

  // 数量 × 单价 → 总额
  'billing.total.value': from(
    ['product.quantity', 'product.unitPrice'],
    (qty: number, price: number) => qty * price,
  ),
}
```

### 3. 渲染表单

```vue
<template>
  <MeshForm :schema="schema" :rules="rules" @submit="onSubmit">
    <template #actions="{ submit }">
      <v-btn color="primary" @click="submit">提交</v-btn>
    </template>
  </MeshForm>
</template>

<script setup lang="ts">
import { MeshForm, from } from '@meshflow/form-vue'
import type { MeshFormSchema, FromDescriptor } from '@meshflow/form-vue'
// ... schema & rules 定义见上方

function onSubmit(data: Record<string, any>) {
  console.log('表单数据：', data)
}
</script>
```

::: tip
引擎由 `<MeshForm>` 内部管理，组件销毁时自动清理，无需手动调用 `deleteEngine`。
:::

## 下一步

- [Schema 定义](./schema) — 了解所有 `x-*` 扩展字段
- [联动 API](./linkage) — 深入 `from()` / `setRule` / `useEntangle` 的区别与用法
- [MeshForm 组件](./mesh-form) — Props / Events / Slots 完整参考
