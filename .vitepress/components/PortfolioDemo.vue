<template>
  <div class="portfolio-demo">

    <!-- ── Header ───────────────────────────────────────────────── -->
    <div class="pd-header">
      <span class="badge-ent">⟳ useEntangle</span>
      <span class="badge-dag">→ from/define</span>
      <span class="pd-title">资产配置模拟器</span>
      <span class="pd-desc">三滑块纠缠 + 金额/收益 DAG 推导</span>
    </div>

    <!-- ── 总资金 ─────────────────────────────────────────────────── -->
    <div class="pd-total-bar">
      <span class="total-label">总资金</span>
      <div class="stepper-wrap">
        <button class="step-btn" @click="adjustTotal(-100000)">−</button>
        <input
          type="number"
          v-model.number="total"
          step="100000" min="100000"
          class="total-input"
        />
        <button class="step-btn" @click="adjustTotal(100000)">+</button>
      </div>
      <span class="total-value">¥ {{ fmt(total) }}</span>
    </div>

    <!-- ── 分配可视化条 ──────────────────────────────────────────── -->
    <div class="alloc-bar-wrap">
      <div class="alloc-bar">
        <div
          class="ab-seg ab-stock"
          :style="{ width: stockPct + '%', minWidth: stockPct > 3 ? '0' : '0' }"
        >
          <span v-if="stockPct >= 8">📈 {{ stockPct }}%</span>
        </div>
        <div class="ab-seg ab-bond" :style="{ width: bondPct + '%' }">
          <span v-if="bondPct >= 8">🏦 {{ bondPct }}%</span>
        </div>
        <div class="ab-seg ab-cash" :style="{ width: cashPct + '%' }">
          <span v-if="cashPct >= 8">💵 {{ cashPct }}%</span>
        </div>
      </div>
      <div class="bar-legend">
        <span class="bl-item stock">■ 股票</span>
        <span class="bl-item bond">■ 债券</span>
        <span class="bl-item cash">■ 现金</span>
        <span class="bl-constraint">⟳ 三者之和始终 = 100%</span>
      </div>
    </div>

    <!-- ── 三行配置 ──────────────────────────────────────────────── -->
    <div class="pd-rows">

      <!-- 股票 -->
      <div class="pd-row" :class="{ flash: flashSet.has('stock') }">
        <div class="row-icon">📈</div>
        <div class="row-name">股票</div>
        <div class="row-slider-group">
          <input
            type="range" min="0" max="100" step="1"
            :value="stockPct"
            @input="onPctChange('stock', +($event.target as HTMLInputElement).value)"
            class="row-slider slider-stock"
          />
          <div class="pct-input-wrap">
            <input
              type="number" min="0" max="100" step="1"
              :value="stockPct"
              @change="onPctChange('stock', +($event.target as HTMLInputElement).value)"
              class="pct-input"
            />
            <span class="pct-sym">%</span>
          </div>
        </div>
        <div class="row-dag-arrow">
          <span class="dag-label">→ DAG</span>
        </div>
        <div class="row-computed">
          <div class="comp-amt">¥ {{ fmt(stockAmt) }}</div>
          <div class="comp-rate stock-rate">年化 12%</div>
          <div class="comp-ret stock-ret">+¥ {{ fmt(stockRet) }}/年</div>
        </div>
      </div>

      <!-- 债券 -->
      <div class="pd-row" :class="{ flash: flashSet.has('bond') }">
        <div class="row-icon">🏦</div>
        <div class="row-name">债券</div>
        <div class="row-slider-group">
          <input
            type="range" min="0" max="100" step="1"
            :value="bondPct"
            @input="onPctChange('bond', +($event.target as HTMLInputElement).value)"
            class="row-slider slider-bond"
          />
          <div class="pct-input-wrap">
            <input
              type="number" min="0" max="100" step="1"
              :value="bondPct"
              @change="onPctChange('bond', +($event.target as HTMLInputElement).value)"
              class="pct-input"
            />
            <span class="pct-sym">%</span>
          </div>
        </div>
        <div class="row-dag-arrow">
          <span class="dag-label">→ DAG</span>
        </div>
        <div class="row-computed">
          <div class="comp-amt">¥ {{ fmt(bondAmt) }}</div>
          <div class="comp-rate bond-rate">年化 4%</div>
          <div class="comp-ret bond-ret">+¥ {{ fmt(bondRet) }}/年</div>
        </div>
      </div>

      <!-- 现金 -->
      <div class="pd-row" :class="{ flash: flashSet.has('cash') }">
        <div class="row-icon">💵</div>
        <div class="row-name">现金</div>
        <div class="row-slider-group">
          <input
            type="range" min="0" max="100" step="1"
            :value="cashPct"
            @input="onPctChange('cash', +($event.target as HTMLInputElement).value)"
            class="row-slider slider-cash"
          />
          <div class="pct-input-wrap">
            <input
              type="number" min="0" max="100" step="1"
              :value="cashPct"
              @change="onPctChange('cash', +($event.target as HTMLInputElement).value)"
              class="pct-input"
            />
            <span class="pct-sym">%</span>
          </div>
        </div>
        <div class="row-dag-arrow">
          <span class="dag-label">→ DAG</span>
        </div>
        <div class="row-computed">
          <div class="comp-amt">¥ {{ fmt(cashAmt) }}</div>
          <div class="comp-rate cash-rate">年化 2%</div>
          <div class="comp-ret cash-ret">+¥ {{ fmt(cashRet) }}/年</div>
        </div>
      </div>
    </div>

    <!-- ── 汇总 ──────────────────────────────────────────────────── -->
    <div class="pd-summary">
      <div class="sum-grid">
        <div class="sum-item">
          <div class="si-label">总资金</div>
          <div class="si-value">¥ {{ fmt(total) }}</div>
        </div>
        <div class="sum-divider">→</div>
        <div class="sum-item">
          <div class="si-label">预期年收益</div>
          <div class="si-value highlight">¥ {{ fmt(totalRet) }}</div>
        </div>
        <div class="sum-divider">=</div>
        <div class="sum-item">
          <div class="si-label">综合年化</div>
          <div class="si-value rate">{{ effectiveRate }}%</div>
        </div>
      </div>
    </div>

    <!-- ── 图例说明 ─────────────────────────────────────────────── -->
    <div class="pd-legend">
      <div class="leg-section">
        <div class="leg-section-title">⟳ useEntangle — 比例约束规则</div>
        <div class="leg-rules">
          <div class="rule-item">
            <span class="rule-trigger stock-c">调整股票%</span>
            <span class="rule-arrow">→</span>
            <span class="rule-desc">债券优先承担差额；债券触底后，现金跟着缩减</span>
          </div>
          <div class="rule-item">
            <span class="rule-trigger bond-c">调整债券%</span>
            <span class="rule-arrow">→</span>
            <span class="rule-desc">股票优先承担差额；股票触底后，现金跟着缩减</span>
          </div>
          <div class="rule-item">
            <span class="rule-trigger cash-c">调整现金%</span>
            <span class="rule-arrow">→</span>
            <span class="rule-desc">股票和债券按当前比例等比重新分配剩余份额</span>
          </div>
        </div>
      </div>
      <div class="leg-item">
        <span class="leg-dot dag"></span>
        <span>
          <strong>from / define</strong> — 资产金额（总资金 × 比例）、预期收益（金额 × 年化利率）、
          总收益（三项求和）均为单向 DAG 推导，不可反向操作
        </span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

type Field = 'stock' | 'bond' | 'cash'

// ── 基础输入 ─────────────────────────────────────────────────────────────────
const total    = ref(1_000_000)
const stockPct = ref(60)
const bondPct  = ref(30)
const cashPct  = ref(10)

// ── DAG 推导（单向，computed = 不可被用户直接赋值）───────────────────────────
const stockAmt = computed(() => Math.round(total.value * stockPct.value / 100))
const bondAmt  = computed(() => Math.round(total.value * bondPct.value  / 100))
const cashAmt  = computed(() => Math.round(total.value * cashPct.value  / 100))

const stockRet = computed(() => Math.round(stockAmt.value * 0.12))
const bondRet  = computed(() => Math.round(bondAmt.value  * 0.04))
const cashRet  = computed(() => Math.round(cashAmt.value  * 0.02))

const totalRet     = computed(() => stockRet.value + bondRet.value + cashRet.value)
const effectiveRate = computed(() =>
  total.value > 0 ? (totalRet.value / total.value * 100).toFixed(2) : '0.00'
)

// ── 纠缠：现金是储备，优先动另一个主力字段，现金非必要不变 ──────────────────
// 规则：
//   股票变 → 债券先承担差额，债券见底后现金才动
//   债券变 → 股票先承担差额，股票见底后现金才动
//   现金变 → 剩余按股票:债券原比例重新分配（两者都是主力）
const flashSet = ref<Set<Field>>(new Set())
let flashTimer: ReturnType<typeof setTimeout> | null = null

function onPctChange(field: Field, rawVal: number) {
  const val = Math.max(0, Math.min(100, Math.round(rawVal)))
  const remaining = 100 - val   // 其余两个字段的总份额

  let adjusted: Field[] = []

  if (field === 'stock') {
    stockPct.value = val
    // 现金尽量保持不变，债券承担剩余
    const cashNew = Math.min(cashPct.value, remaining)
    bondPct.value = remaining - cashNew
    cashPct.value = cashNew
    adjusted = ['bond', 'cash']

  } else if (field === 'bond') {
    bondPct.value = val
    // 现金尽量保持不变，股票承担剩余
    const cashNew = Math.min(cashPct.value, remaining)
    stockPct.value = remaining - cashNew
    cashPct.value = cashNew
    adjusted = ['stock', 'cash']

  } else {
    // 现金本身变化 → 按原比例重新分配给股票和债券
    cashPct.value = val
    const [ns, nb] = proportional(remaining, stockPct.value, bondPct.value)
    stockPct.value = ns; bondPct.value = nb
    adjusted = ['stock', 'bond']
  }

  // Flash 被调整的行
  flashSet.value = new Set()
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flashSet.value = new Set(adjusted as Field[])
    setTimeout(() => { flashSet.value = new Set() }, 700)
  }, 10)
}

/** 按 a:b 原始比例分配 total，结果之和 = total */
function proportional(total: number, a: number, b: number): [number, number] {
  if (total <= 0) return [0, 0]
  const sum = a + b
  if (sum === 0) {
    const half = Math.round(total / 2)
    return [half, total - half]
  }
  const na = Math.round(total * a / sum)
  return [na, total - na]
}

function adjustTotal(delta: number) {
  total.value = Math.max(100_000, total.value + delta)
}

function fmt(n: number) {
  return n.toLocaleString('zh-CN')
}
</script>

<style scoped>
.portfolio-demo {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
  margin: 24px 0;
  font-size: 13px;
}

/* ── Header ─────────────────────────────────────────────────────── */
.pd-header {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 12px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.badge-ent {
  font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
  padding: 2px 9px; border-radius: 20px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff;
}
.badge-dag {
  font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
  padding: 2px 9px; border-radius: 20px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4); color: #fff;
}
.pd-title { font-size: 14px; font-weight: 700; color: var(--vp-c-text-1); }
.pd-desc  { font-size: 11px; color: var(--vp-c-text-2); margin-left: auto; }

/* ── 总资金 ──────────────────────────────────────────────────────── */
.pd-total-bar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 12px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.total-label { font-size: 13px; font-weight: 600; color: var(--vp-c-text-2); min-width: 48px; }
.stepper-wrap { display: flex; }
.step-btn {
  width: 32px; border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft); color: var(--vp-c-text-2);
  font-size: 16px; cursor: pointer; transition: all .15s;
}
.step-btn:first-child { border-radius: 6px 0 0 6px; border-right: none; }
.step-btn:last-child  { border-radius: 0 6px 6px 0; border-left: none; }
.step-btn:hover { background: rgba(59,130,246,.15); border-color: #3b82f6; color: #60a5fa; }
.total-input {
  width: 130px; padding: 7px 10px;
  border: 1px solid var(--vp-c-border); border-radius: 0;
  background: var(--vp-c-bg); color: var(--vp-c-text-1);
  font-size: 15px; font-weight: 700;
  font-family: 'JetBrains Mono', monospace; text-align: right;
}
.total-value {
  font-size: 15px; font-weight: 800;
  font-family: 'JetBrains Mono', monospace; color: #3b82f6;
}

/* ── 分配条 ─────────────────────────────────────────────────────── */
.alloc-bar-wrap { padding: 14px 20px; border-bottom: 1px solid var(--vp-c-border); }
.alloc-bar {
  height: 36px; border-radius: 8px; overflow: hidden;
  display: flex; width: 100%; transition: all .3s ease;
}
.ab-seg {
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: rgba(255,255,255,.9);
  transition: width .3s ease;
  white-space: nowrap; overflow: hidden;
}
.ab-stock { background: linear-gradient(90deg, #f59e0b, #d97706); }
.ab-bond  { background: linear-gradient(90deg, #3b82f6, #2563eb); }
.ab-cash  { background: linear-gradient(90deg, #10b981, #059669); }

.bar-legend {
  display: flex; align-items: center; gap: 14px; margin-top: 7px;
  font-size: 11px; flex-wrap: wrap;
}
.bl-item { color: var(--vp-c-text-2); }
.bl-item.stock { color: #d97706; }
.bl-item.bond  { color: #3b82f6; }
.bl-item.cash  { color: #10b981; }
.bl-constraint { margin-left: auto; font-size: 10px; color: #a78bfa; font-weight: 600; }

/* ── 行 ─────────────────────────────────────────────────────────── */
.pd-rows { border-bottom: 1px solid var(--vp-c-border); }

@keyframes row-flash {
  0%   { background: rgba(167,139,250,.18); }
  100% { background: transparent; }
}

.pd-row {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 12px 20px;
  border-bottom: 1px solid var(--vp-c-divider, var(--vp-c-border));
  transition: background .15s;
}
.pd-row:last-child { border-bottom: none; }
.pd-row.flash { animation: row-flash .7s ease forwards; }

.row-icon  { font-size: 20px; flex-shrink: 0; }
.row-name  { width: 36px; font-size: 12px; font-weight: 600; color: var(--vp-c-text-1); flex-shrink: 0; }

/* Slider group */
.row-slider-group { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px; }

/* ── Range slider ────────────────────────────────────────────────
   Track height = 6px, thumb = 18px
   webkit margin-top = -(18-6)/2 = -6px to center thumb on track  */
.row-slider {
  flex: 1;
  height: 6px;
  outline: none; cursor: pointer;
  appearance: none; -webkit-appearance: none;
  border-radius: 3px;
  background: transparent;
}

/* Webkit track */
.slider-stock::-webkit-slider-runnable-track {
  height: 6px; border-radius: 3px;
  background: linear-gradient(90deg, #f59e0b, #d97706);
}
.slider-bond::-webkit-slider-runnable-track {
  height: 6px; border-radius: 3px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}
.slider-cash::-webkit-slider-runnable-track {
  height: 6px; border-radius: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
}

/* Webkit thumb — margin-top centers it on the track */
.row-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px;
  border-radius: 50%;
  margin-top: -6px;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,.4);
}
.slider-stock::-webkit-slider-thumb { background: #f59e0b; }
.slider-bond::-webkit-slider-thumb  { background: #3b82f6; }
.slider-cash::-webkit-slider-thumb  { background: #10b981; }

/* Firefox track */
.slider-stock::-moz-range-track {
  height: 6px; border-radius: 3px; border: none;
  background: linear-gradient(90deg, #f59e0b, #d97706);
}
.slider-bond::-moz-range-track {
  height: 6px; border-radius: 3px; border: none;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}
.slider-cash::-moz-range-track {
  height: 6px; border-radius: 3px; border: none;
  background: linear-gradient(90deg, #10b981, #059669);
}

/* Firefox thumb */
.row-slider::-moz-range-thumb {
  width: 18px; height: 18px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,.4);
}
.slider-stock::-moz-range-thumb { background: #f59e0b; }
.slider-bond::-moz-range-thumb  { background: #3b82f6; }
.slider-cash::-moz-range-thumb  { background: #10b981; }

.pct-input-wrap { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.pct-input {
  width: 50px; padding: 4px 6px;
  border: 1px solid var(--vp-c-border); border-radius: 6px;
  background: var(--vp-c-bg); color: var(--vp-c-text-1);
  font-size: 13px; font-weight: 700; text-align: right;
  font-family: 'JetBrains Mono', monospace;
}
.pct-sym { font-size: 12px; color: var(--vp-c-text-2); }

/* DAG arrow tag */
.row-dag-arrow {
  flex-shrink: 0;
}
.dag-label {
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(59,130,246,.12); color: #60a5fa;
  border: 1px solid rgba(59,130,246,.25);
}

/* Computed values */
.row-computed {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  flex-shrink: 0;
}
.comp-amt {
  font-size: 13px; font-weight: 800;
  font-family: 'JetBrains Mono', monospace; color: var(--vp-c-text-1);
  min-width: 100px;
}
.comp-rate { font-size: 10px; color: var(--vp-c-text-2); }
.comp-ret  { font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; min-width: 110px; }

.stock-rate { color: #d97706; }
.bond-rate  { color: #3b82f6; }
.cash-rate  { color: #10b981; }
.stock-ret  { color: #f59e0b; }
.bond-ret   { color: #60a5fa; }
.cash-ret   { color: #34d399; }

/* ── 汇总 ────────────────────────────────────────────────────────── */
.pd-summary {
  padding: 14px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}
.sum-grid {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
}
.sum-item { display: flex; flex-direction: column; gap: 3px; }
.si-label { font-size: 10px; color: var(--vp-c-text-2); font-weight: 600; }
.si-value { font-size: 16px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: var(--vp-c-text-1); }
.si-value.highlight { color: #10b981; }
.si-value.rate { color: #3b82f6; }
.sum-divider {
  font-size: 20px; color: var(--vp-c-text-3, var(--vp-c-border));
  font-weight: 300;
}

/* ── 图例 ────────────────────────────────────────────────────────── */
.pd-legend {
  padding: 12px 20px;
  display: flex; flex-direction: column; gap: 8px;
  background: var(--vp-c-bg-soft);
}
/* ── 图例 ────────────────────────────────────────────────────────── */
.leg-section {
  margin-bottom: 10px;
}
.leg-section-title {
  font-size: 11px; font-weight: 700; color: #a78bfa;
  margin-bottom: 8px;
}
.leg-rules {
  display: flex; flex-direction: column; gap: 5px;
}
.rule-item {
  display: flex; align-items: baseline; gap: 8px;
  font-size: 12px;
}
.rule-trigger {
  font-size: 11px; font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  padding: 1px 7px; border-radius: 4px; flex-shrink: 0;
}
.stock-c { background: rgba(245,158,11,.15); color: #d97706; border: 1px solid rgba(245,158,11,.3); }
.bond-c  { background: rgba(59,130,246,.12); color: #60a5fa; border: 1px solid rgba(59,130,246,.25); }
.cash-c  { background: rgba(16,185,129,.12); color: #34d399; border: 1px solid rgba(16,185,129,.25); }
.rule-arrow { color: var(--vp-c-text-3, #888); flex-shrink: 0; }
.rule-desc  { color: var(--vp-c-text-2); line-height: 1.5; }

.leg-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; color: var(--vp-c-text-2); line-height: 1.5;
}
.leg-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
}
.leg-dot.ent { background: #a78bfa; }
.leg-dot.dag { background: #60a5fa; }
.leg-item strong { color: var(--vp-c-text-1); }
</style>
