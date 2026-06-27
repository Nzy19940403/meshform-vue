---
title: 案例：云资源采购单
---

<script setup>
import DemoOrderForm from '../.vitepress/components/DemoOrderForm.vue'
import LinkageGraph from '../.vitepress/components/LinkageGraph.vue'
</script>

# 案例：云资源采购单

一个典型的中后台表单，4 种联动行为全覆盖：

- **级联选择** — 类目变了，产品名称选项跟着变，当前值自动重置
- **值计算** — 数量 × 单价实时算小计，折扣叠加算总额
- **动态显隐** — 折扣类型选"无"时折扣值隐藏，月度分期才显示分期字段
- **条件计算** — 只有月度分期时才算每期金额

## 实时演示

改改类目、调调折扣、切换支付方式，看看字段怎么联动：

<ClientOnly>
  <DemoOrderForm />
</ClientOnly>

## 联动依赖图

蓝色实线是值传播，黄色虚线是显隐控制：

<ClientOnly>
  <LinkageGraph />
</ClientOnly>

## 完整代码

```vue
<template>
  <MeshForm :schema="schema" :rules="rules" @submit="handleSubmit">
    <template #actions="{ submit }">
      <v-btn color="primary" variant="tonal" size="large" @click="submit">
        提交订单
      </v-btn>
    </template>
  </MeshForm>
</template>

<script setup lang="ts">
import { MeshForm, from } from '@meshflow/form-vue'
import type { MeshFormSchema, FromDescriptor } from '@meshflow/form-vue'

// ── Schema ────────────────────────────────────────────────────────────────────
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
          type: 'string', title: '产品类目', default: 'software',
          'x-widget': 'select',
          'x-options': [
            { label: '软件授权', value: 'software' },
            { label: '硬件设备', value: 'hardware' },
            { label: '云服务',   value: 'cloud' },
          ],
        },
        name: {
          type: 'string', title: '产品名称', default: 'basic',
          'x-widget': 'select', 'x-options': [],
        },
        quantity: { type: 'integer', title: '数量', default: 1, 'x-min': 1 },
        basePrice: {
          type: 'number', title: '单价 (¥)', default: 999,
          'x-readonly': true, 'x-disabled': true,
        },
      },
    },
    discount: {
      type: 'object',
      title: '折扣设置',
      'x-layout': 'horizontal',
      properties: {
        type: {
          type: 'string', title: '折扣类型', default: 'none',
          'x-widget': 'select',
          'x-options': [
            { label: '无折扣',           value: 'none' },
            { label: '百分比折扣 (%)',   value: 'percent' },
            { label: '固定金额减免 (¥)', value: 'fixed' },
          ],
        },
        amount: {
          type: 'number', title: '折扣值', default: 0,
          'x-hidden': true, 'x-placeholder': '请输入折扣值',
        },
      },
    },
    billing: {
      type: 'object',
      title: '结算信息',
      'x-layout': 'horizontal',
      properties: {
        subtotal:      { type: 'number', title: '小计 (¥)',     default: 999, 'x-readonly': true, 'x-disabled': true },
        total:         { type: 'number', title: '应付总额 (¥)', default: 999, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
        paymentMethod: {
          type: 'string', title: '支付方式', default: 'invoice',
          'x-widget': 'select',
          'x-options': [
            { label: '企业发票', value: 'invoice' },
            { label: '信用额度', value: 'credit' },
            { label: '月度分期', value: 'monthly' },
          ],
        },
        installments: {
          type: 'string', title: '分期期数', default: '3',
          'x-hidden': true, 'x-widget': 'select',
          'x-options': [
            { label: '3 期',  value: '3' },
            { label: '6 期',  value: '6' },
            { label: '12 期', value: '12' },
          ],
        },
        monthlyPayment: {
          type: 'number', title: '每期金额 (¥)', default: 0,
          'x-hidden': true, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'info',
        },
        notes: {
          type: 'string', title: '采购备注', default: '',
          'x-placeholder': '可填写特殊要求、交付地点等',
        },
      },
    },
  },
}

// ── 产品数据 ───────────────────────────────────────────────────────────────────
const PRODUCT_OPTIONS: Record<string, { label: string; value: string; price: number }[]> = {
  software: [
    { label: '基础版  ¥999/年',    value: 'basic',      price: 999 },
    { label: '专业版  ¥4,999/年',  value: 'pro',        price: 4999 },
    { label: '企业版  ¥19,999/年', value: 'enterprise', price: 19999 },
  ],
  hardware: [
    { label: '入门服务器  ¥29,999', value: 'server_s',   price: 29999 },
    { label: '性能服务器  ¥89,999', value: 'server_pro', price: 89999 },
  ],
  cloud: [
    { label: '2C4G  ¥299/月',   value: 'cloud_s', price: 299 },
    { label: '4C8G  ¥599/月',   value: 'cloud_m', price: 599 },
    { label: '8C16G ¥1,099/月', value: 'cloud_l', price: 1099 },
  ],
}
const PRICE_MAP: Record<string, number> = Object.fromEntries(
  Object.values(PRODUCT_OPTIONS).flat().map(o => [o.value, o.price])
)

// ── 联动规则 ──────────────────────────────────────────────────────────────────
const rules: Record<string, FromDescriptor> = {
  // category → name 选项，选项变化后自动重置 value
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
  'product.basePrice.value': from('product.name', (name: string) => PRICE_MAP[name] ?? 0),

  // 数量 × 单价 → 小计
  'billing.subtotal.value': from(
    ['product.basePrice', 'product.quantity'],
    (price: number, qty: number) => price * qty,
  ),

  // 折扣类型 → 折扣值显隐 & placeholder
  'discount.amount.hidden':      from('discount.type', (t: string) => t === 'none'),
  'discount.amount.placeholder': from('discount.type', (t: string) =>
    t === 'percent' ? '输入百分比，如 10 代表九折' : '输入减免金额，如 500'
  ),

  // 小计 + 折扣 → 总额
  'billing.total.value': from(
    ['billing.subtotal', 'discount.type', 'discount.amount'],
    (subtotal: number, type: string, amount: number) => {
      if (type === 'percent') return Math.round(subtotal * (1 - amount / 100))
      if (type === 'fixed')   return Math.max(0, subtotal - amount)
      return subtotal
    },
  ),

  // 支付方式 → 分期字段显隐
  'billing.installments.hidden':   from('billing.paymentMethod', (m: string) => m !== 'monthly'),
  'billing.monthlyPayment.hidden': from('billing.paymentMethod', (m: string) => m !== 'monthly'),

  // 总额 ÷ 期数 → 每期金额
  'billing.monthlyPayment.value': from(
    ['billing.total', 'billing.installments'],
    (total: number, inst: string) => {
      const n = parseInt(inst, 10)
      return n > 0 ? Math.round(total / n) : 0
    },
  ),
})

function handleSubmit(data: Record<string, any>) {
  console.log('提交数据：', data)
}
</script>
```

## 读这份代码

**Schema** 只描述结构，不写联动。字段叫什么、是什么类型、用什么控件、初始值是多少 —— 都在 Schema 里。

**`:rules`** 是所有联动的入口。`from(source, logic)` 声明"这个属性的值，由哪个字段算出来"。引擎把这些声明编译成有向无环图，拓扑排序后执行 —— category 变了之后是先更新 name 的选项还是先更新 basePrice，你不用关心，引擎算。

**`<MeshForm>`** 是个薄薄的渲染壳，把引擎算出的 `value`、`hidden`、`disabled` 等状态同步给 Vuetify 控件。换 UI 库只需要换 Renderer，联动规则不动。
