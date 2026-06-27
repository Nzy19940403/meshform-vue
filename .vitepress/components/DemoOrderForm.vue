<template>
  <div class="df-wrap">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="df-header">
      <span class="df-badge">⧩ MeshForm</span>
      <span class="df-title">云资源采购单 — 11 条联动规则</span>
      <span class="df-desc">改产品类目自动刷新选项，折扣类型控制字段显隐，分期期数联动月付金额</span>
    </div>

    <!-- v-app 提供 Vuetify theme context，设为透明不干扰外层样式 -->
    <v-app theme="dark" class="df-vapp">
    <!-- ── Body ───────────────────────────────────────────────────────── -->
    <div class="df-body">
      <!-- 左：MeshForm 实际运行 -->
      <div class="df-form-col">
        <MeshForm
          ref="formRef"
          :schema="schema"
          :rules="rules"
          @change="onFormChange"
          @submit="onSubmit"
        >
          <template #actions="{ submit }">
            <div class="df-actions">
              <v-btn color="primary" variant="tonal" @click="submit">提交订单</v-btn>
              <v-btn variant="text" color="grey" @click="onReset">重置</v-btn>
            </div>
          </template>
        </MeshForm>
      </div>

      <!-- 右：实时数据 + 提交结果 -->
      <div class="df-panel-col">
        <div class="df-panel">
          <div class="df-panel-hd">
            <span class="df-dot df-dot--green" />实时表单数据
          </div>
          <pre class="df-panel-pre">{{ liveStr }}</pre>
        </div>

        <div v-if="submitted" class="df-panel df-panel--success">
          <div class="df-panel-hd">
            <span class="df-dot df-dot--gold" />提交数据
          </div>
          <pre class="df-panel-pre">{{ submittedStr }}</pre>
        </div>
      </div>
    </div>
    </v-app>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MeshForm, from } from '@meshflow/form-vue'
import type { MeshFormSchema, FromDescriptor, MeshFormInstance } from '@meshflow/form-vue'

// ── 产品数据 ──────────────────────────────────────────────────────────────────
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
        name:      { type: 'string',  title: '产品名称', default: 'basic', 'x-widget': 'select', 'x-options': [] },
        quantity:  { type: 'integer', title: '数量',      default: 1, 'x-min': 1 },
        basePrice: { type: 'number',  title: '单价 (¥)',  default: 999, 'x-readonly': true, 'x-disabled': true },
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
        amount: { type: 'number', title: '折扣值', default: 0, 'x-hidden': true, 'x-placeholder': '请输入折扣值' },
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
          type: 'string', title: '分期期数', default: '3', 'x-hidden': true,
          'x-widget': 'select',
          'x-options': [{ label: '3 期', value: '3' }, { label: '6 期', value: '6' }, { label: '12 期', value: '12' }],
        },
        monthlyPayment: { type: 'number', title: '每期金额 (¥)', default: 0, 'x-hidden': true, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'info' },
        notes: { type: 'string', title: '采购备注', default: '', 'x-placeholder': '可填写特殊要求、交付地点等' },
      },
    },
  },
}

// ── Rules ─────────────────────────────────────────────────────────────────────
const rules: Record<string, FromDescriptor> = {
  'product.name.options': from('product.category', (cat: string) =>
    (PRODUCT_OPTIONS[cat] ?? []).map(({ label, value }) => ({ label, value }))
  , {
    effect: ({ options, value }: any) => {
      const valid = options.some((o: any) => o.value === value)
      return valid ? undefined : { value: options[0]?.value ?? '' }
    },
    effectArgs: ['options', 'value'],
  }),

  'product.basePrice.value': from('product.name', (name: string) => PRICE_MAP[name] ?? 0),

  'billing.subtotal.value': from(
    ['product.basePrice', 'product.quantity'],
    (price: number, qty: number) => price * qty
  ),

  'discount.amount.hidden':      from('discount.type', (t: string) => t === 'none'),
  'discount.amount.placeholder': from('discount.type', (t: string) =>
    t === 'percent' ? '输入百分比，如 10 代表九折' : '输入减免金额，如 500'
  ),

  'billing.total.value': from(
    ['billing.subtotal', 'discount.type', 'discount.amount'],
    (subtotal: number, type: string, amount: number) => {
      if (type === 'percent') return Math.round(subtotal * (1 - amount / 100))
      if (type === 'fixed')   return Math.max(0, subtotal - amount)
      return subtotal
    }
  ),

  'billing.installments.hidden':   from('billing.paymentMethod', (m: string) => m !== 'monthly'),
  'billing.monthlyPayment.hidden': from('billing.paymentMethod', (m: string) => m !== 'monthly'),

  'billing.monthlyPayment.value': from(
    ['billing.total', 'billing.installments'],
    (total: number, inst: string) => {
      const n = parseInt(inst, 10)
      return n > 0 ? Math.round(total / n) : 0
    }
  ),
}

// ── 状态 ──────────────────────────────────────────────────────────────────────
const formRef = ref<MeshFormInstance>()
const liveData = ref<Record<string, any>>({})
const submitted = ref(false)
const submittedData = ref<Record<string, any>>({})

const liveStr      = computed(() => JSON.stringify(liveData.value, null, 2))
const submittedStr = computed(() => JSON.stringify(submittedData.value, null, 2))

function onFormChange(data: Record<string, any>) { liveData.value = data }
function onSubmit(data: Record<string, any>) { submittedData.value = data; submitted.value = true }
function onReset() { submitted.value = false; submittedData.value = {} }
</script>

<style scoped>
/* ── 外层容器 — 与 EntangleDemo 同款 ───────────────────────────── */
.df-wrap {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
  margin: 24px 0;
  font-size: 13px;
}

/* ── Header ─────────────────────────────────────────────────────── */
.df-header {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 13px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.df-badge {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff; font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  font-family: 'JetBrains Mono', monospace;
}
.df-title { font-size: 14px; font-weight: 700; color: var(--vp-c-text-1); }
.df-desc  { font-size: 11px; color: var(--vp-c-text-2); margin-left: auto; }

/* v-app 透明：只提供 Vuetify theme context */
.df-vapp {
  background: transparent !important;
  min-height: 0 !important;
  display: block !important;
}

/* ── Body ────────────────────────────────────────────────────────── */
.df-body {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 0;
  align-items: start;
}
@media (max-width: 800px) { .df-body { grid-template-columns: 1fr; } }

/* 左：表单列 */
.df-form-col {
  padding: 16px 20px;
  border-right: 1px solid var(--vp-c-border);
}
@media (max-width: 800px) { .df-form-col { border-right: none; border-bottom: 1px solid var(--vp-c-border); } }

.df-actions { display: flex; gap: 10px; padding-top: 8px; }

/* 右：数据面板列 */
.df-panel-col {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: sticky;
  top: 80px;
}

.df-panel {
  border-bottom: 1px solid var(--vp-c-border);
  overflow: hidden;
}
.df-panel:last-child { border-bottom: none; }
.df-panel--success .df-panel-hd { color: #4caf50; }

.df-panel-hd {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 14px;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.df-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}
.df-dot--green { background: #4caf50; box-shadow: 0 0 5px #4caf50; }
.df-dot--gold  { background: #ffd54f; box-shadow: 0 0 5px #ffd54f; }

.df-panel-pre {
  margin: 0;
  padding: 10px 14px;
  font-size: 11px; line-height: 1.6;
  color: var(--vp-c-text-2);
  white-space: pre-wrap; word-break: break-all;
  max-height: 340px; overflow-y: auto;
  font-family: 'JetBrains Mono', monospace;
  background: var(--vp-c-bg-soft);
}
</style>
