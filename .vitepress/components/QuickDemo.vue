<template>
  <v-app theme="dark" class="qd-app">
    <MeshForm :schema="schema" :rules="rules" @change="onFormChange">
      <template #actions>
        <!-- 无提交按钮，纯实时演示 -->
      </template>
    </MeshForm>

    <!-- 保费结果卡片 -->
    <div class="result-card" v-if="liveData['annualPremium'] != null">
      <div class="result-label">预估年保费</div>
      <div class="result-value">¥ {{ Number(liveData['annualPremium'] ?? 0).toLocaleString() }}</div>
      <div class="result-sub">月均 ¥ {{ Number(liveData['monthlyPremium'] ?? 0).toLocaleString() }}</div>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MeshForm, from } from '@meshflow/form-vue'
import type { MeshFormSchema, FromDescriptor } from '@meshflow/form-vue'

// ── 费率表（每千元保额年保费‰）────────────────────────────────────────────────
const RATE_TABLE: Record<string, number[]> = {
  term:  [0.40, 0.70, 1.20, 2.00, 3.50],
  whole: [8.00, 10.0, 14.0, 19.0, 27.0],
  endow: [14.0, 18.0, 24.0, 32.0, 42.0],
}
function ageBracket(age: number) {
  if (age < 30) return 0; if (age < 40) return 1
  if (age < 50) return 2; if (age < 60) return 3; return 4
}

// ── Schema ────────────────────────────────────────────────────────────────────
const schema: MeshFormSchema = {
  type: 'object',
  title: '保费速算',
  properties: {
    productType: {
      type: 'string', title: '险种', default: 'term',
      'x-widget': 'select',
      'x-options': [
        { label: '定期寿险', value: 'term' },
        { label: '终身寿险', value: 'whole' },
        { label: '两全险',   value: 'endow' },
      ],
    },
    gender: {
      type: 'string', title: '性别', default: 'M',
      'x-widget': 'select',
      'x-options': [
        { label: '男',             value: 'M' },
        { label: '女（费率低 15%）', value: 'F' },
      ],
    },
    age:            { type: 'integer', title: '年龄',       default: 30, 'x-min': 18 },
    coverageAmount: {
      type: 'number', title: '保额 (万)', default: 100,
      'x-widget': 'select',
      'x-options': [
        { label: '50 万',   value: 50 },
        { label: '100 万',  value: 100 },
        { label: '200 万',  value: 200 },
        { label: '500 万',  value: 500 },
        { label: '1000 万', value: 1000 },
      ],
    },
    annualPremium:  { type: 'number', title: '年保费 (¥)',  default: 0, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'success' },
    monthlyPremium: { type: 'number', title: '月均保费 (¥)', default: 0, 'x-readonly': true, 'x-disabled': true, 'x-theme': 'info' },
  },
}

// ── Rules ─────────────────────────────────────────────────────────────────────
const rules: Record<string, FromDescriptor> = {
  'annualPremium.value': from(
    ['productType', 'gender', 'age', 'coverageAmount'],
    (pt: string, g: string, age: number, ca: number) => {
      const raw = RATE_TABLE[pt]?.[ageBracket(age)] ?? 5
      const rate = Math.round(raw * (g === 'F' ? 0.85 : 1.0) * 100) / 100
      return Math.round(ca * rate * 10)
    }
  ),
  'monthlyPremium.value': from('annualPremium', (p: number) => Math.round(p / 12)),
}

// ── 状态 ──────────────────────────────────────────────────────────────────────
const liveData = ref<Record<string, any>>({})
function onFormChange(data: Record<string, any>) { liveData.value = data }
</script>

<style scoped>
.qd-app { background: transparent !important; }
.result-card {
  margin-top: 16px;
  padding: 16px 20px;
  background: rgba(99,102,241,0.08);
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 10px;
  text-align: center;
}
.result-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.4);
  margin-bottom: 4px;
}
.result-value {
  font-size: 36px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: #4caf50;
  line-height: 1.1;
}
.result-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  margin-top: 4px;
}
</style>
