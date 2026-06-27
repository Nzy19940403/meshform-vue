<template>
  <div class="entangle-demo">
    <div class="ed-header">
      <span class="ed-badge">⟳ useEntangle</span>
      <span class="ed-title">货币换算 — 三向纠缠</span>
      <span class="ed-desc">修改任意一个金额，另外两个立刻收敛</span>
    </div>

    <!-- ── 三个货币输入 ──────────────────────────────────────────── -->
    <div class="ed-currencies">

      <div class="currency-card" :class="{ flash: flashField === 'cny' }">
        <div class="cc-flag">🇨🇳</div>
        <div class="cc-name">人民币 <span class="cc-code">CNY</span></div>
        <div class="stepper-wrap">
          <button class="step-btn" @click="step('cny', -100)">−</button>
          <input
            type="number"
            :value="cny"
            class="cc-input"
            min="0" step="100"
            @input="onChange('cny', +($event.target as HTMLInputElement).value)"
            @animationend="flashField = ''"
          />
          <button class="step-btn" @click="step('cny', 100)">+</button>
        </div>
        <div class="cc-rate">1 CNY = {{ fmtRate(1 / CNY_PER_USD) }} USD = {{ fmtRate(1 / CNY_PER_EUR) }} EUR</div>
      </div>

      <div class="cc-arrows">
        <div class="arrow-row">
          <span class="arr arr-right" :class="{ lit: lastChanged === 'cny' }">→</span>
        </div>
        <div class="arrow-row">
          <span class="arr arr-left" :class="{ lit: lastChanged === 'usd' || lastChanged === 'eur' }">←</span>
        </div>
      </div>

      <div class="currency-card" :class="{ flash: flashField === 'usd' }">
        <div class="cc-flag">🇺🇸</div>
        <div class="cc-name">美元 <span class="cc-code">USD</span></div>
        <div class="stepper-wrap">
          <button class="step-btn" @click="step('usd', -10)">−</button>
          <input
            type="number"
            :value="usd"
            class="cc-input"
            min="0" step="10"
            @input="onChange('usd', +($event.target as HTMLInputElement).value)"
            @animationend="flashField = ''"
          />
          <button class="step-btn" @click="step('usd', 10)">+</button>
        </div>
        <div class="cc-rate">1 USD = {{ fmtRate(CNY_PER_USD) }} CNY = {{ fmtRate(CNY_PER_USD / CNY_PER_EUR) }} EUR</div>
      </div>

      <div class="cc-arrows">
        <div class="arrow-row">
          <span class="arr arr-right" :class="{ lit: lastChanged === 'cny' || lastChanged === 'usd' }">→</span>
        </div>
        <div class="arrow-row">
          <span class="arr arr-left" :class="{ lit: lastChanged === 'eur' }">←</span>
        </div>
      </div>

      <div class="currency-card" :class="{ flash: flashField === 'eur' }">
        <div class="cc-flag">🇪🇺</div>
        <div class="cc-name">欧元 <span class="cc-code">EUR</span></div>
        <div class="stepper-wrap">
          <button class="step-btn" @click="step('eur', -10)">−</button>
          <input
            type="number"
            :value="eur"
            class="cc-input"
            min="0" step="10"
            @input="onChange('eur', +($event.target as HTMLInputElement).value)"
            @animationend="flashField = ''"
          />
          <button class="step-btn" @click="step('eur', 10)">+</button>
        </div>
        <div class="cc-rate">1 EUR = {{ fmtRate(CNY_PER_EUR) }} CNY = {{ fmtRate(CNY_PER_EUR / CNY_PER_USD) }} USD</div>
      </div>
    </div>

    <!-- ── 原理说明 ────────────────────────────────────────────────── -->
    <div class="ed-explain">
      <div class="explain-item">
        <div class="ei-label">⟳ 为什么叫"纠缠"</div>
        <div class="ei-body">
          三个字段之间形成有环依赖：CNY↔USD↔EUR↔CNY。任意一个变化，另外两个跟着收敛。
          这个图不是 DAG——没有固定的"上游"和"下游"，因果关系是对称的。
        </div>
      </div>
      <div class="explain-item">
        <div class="ei-label">❌ 用 watch 会怎样</div>
        <div class="ei-body">
          改 CNY → watch 更新 USD → 触发 USD 的 watch → 更新 CNY → 再触发 CNY 的 watch → 死循环。
          必须手动加 flag 锁，且三个字段之间 6 对 watch 全部要写。
        </div>
      </div>
      <div class="explain-item">
        <div class="ei-label">✅ useEntangle 怎么做</div>
        <div class="ei-body">
          每对注册一次 entangle，emit 函数返回<strong>差量</strong>，当差量小于阈值（如 0.001）时停止传播。
          引擎保证同一水位线内不会重复触发，自然收敛，不会死锁。
        </div>
      </div>
    </div>

    <!-- ── 代码展示 ────────────────────────────────────────────────── -->
    <div class="ed-code">
      <div class="code-header">对应的 useEntangle 注册代码</div>
      <pre class="code-body">{{ codeExample }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Field = 'cny' | 'usd' | 'eur'

// ── 汇率（示例值）────────────────────────────────────────────────────────────
const CNY_PER_USD = 7.24   // 1 USD = 7.24 CNY
const CNY_PER_EUR = 7.85   // 1 EUR = 7.85 CNY

// ── 状态 ─────────────────────────────────────────────────────────────────────
const cny = ref(724)
const usd = ref(100)
const eur = ref(92.23)

const lastChanged = ref<Field | ''>('')
const flashField  = ref<string>('')

// ── 纠缠收敛：改任意一个，推导其余两个 ──────────────────────────────────────
function onChange(field: Field, val: number) {
  if (isNaN(val) || val < 0) return
  lastChanged.value = field

  if (field === 'cny') {
    cny.value = val
    usd.value = r2(val / CNY_PER_USD)
    eur.value = r2(val / CNY_PER_EUR)
    triggerFlash('usd', 'eur')
  } else if (field === 'usd') {
    usd.value = val
    cny.value = r2(val * CNY_PER_USD)
    eur.value = r2(val * CNY_PER_USD / CNY_PER_EUR)
    triggerFlash('cny', 'eur')
  } else {
    eur.value = val
    cny.value = r2(val * CNY_PER_EUR)
    usd.value = r2(val * CNY_PER_EUR / CNY_PER_USD)
    triggerFlash('cny', 'usd')
  }
}

function step(field: Field, delta: number) {
  const cur = field === 'cny' ? cny.value : field === 'usd' ? usd.value : eur.value
  const next = Math.max(0, r2(cur + delta))
  onChange(field, next)
}

// 让被更新的两个字段都 flash（先清空让动画可以重触发）
let flashTimer: ReturnType<typeof setTimeout> | null = null
function triggerFlash(...fields: string[]) {
  flashField.value = ''
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    // 用逗号分隔存两个，CSS 用 includes 匹配
    flashField.value = fields.join(',')
  }, 10)
}

function r2(n: number) { return Math.round(n * 100) / 100 }
function fmtRate(n: number) { return n.toFixed(4) }

const codeExample = `// 注册 CNY ↔ USD 纠缠（双向各一次）
engine.entangle({
  cause: 'amount.cny', impact: 'amount.usd', via: ['value'],
  emit: (cny, usd) => {
    const target = cny.value / CNY_PER_USD
    const diff = target - usd.value
    if (Math.abs(diff) < 0.001) return   // 已收敛，停止传播
    return { key: 'value', delta: diff }
  },
})
engine.entangle({
  cause: 'amount.usd', impact: 'amount.cny', via: ['value'],
  emit: (usd, cny) => {
    const target = usd.value * CNY_PER_USD
    const diff = target - cny.value
    if (Math.abs(diff) < 0.001) return
    return { key: 'value', delta: diff }
  },
})
// CNY ↔ EUR、USD ↔ EUR 同理，共 6 次注册
// 引擎保证有环传播必定收敛，不会死锁`
</script>

<style scoped>
.entangle-demo {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  overflow: hidden;
  margin: 24px 0;
  font-size: 13px;
}

/* ── Header ─────────────────────────────────────────────────────── */
.ed-header {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg); flex-wrap: wrap;
}
.ed-badge {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: #fff; font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  font-family: 'JetBrains Mono', monospace;
}
.ed-title { font-size: 14px; font-weight: 700; color: var(--vp-c-text-1); }
.ed-desc  { font-size: 11px; color: var(--vp-c-text-2); margin-left: auto; }

/* ── 货币卡片区 ─────────────────────────────────────────────────── */
.ed-currencies {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 24px 20px;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  flex-wrap: wrap;
  justify-content: center;
}
@media (max-width: 640px) {
  .ed-currencies { flex-direction: column; gap: 12px; }
  .cc-arrows { transform: rotate(90deg); }
}

.currency-card {
  flex: 1; min-width: 160px; max-width: 220px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color .2s, box-shadow .2s;
}
/* Flash 动画：被更新时绿色光圈 */
@keyframes card-flash {
  0%   { border-color: #a78bfa; box-shadow: 0 0 0 0 rgba(167,139,250,.5); }
  50%  { border-color: #a78bfa; box-shadow: 0 0 0 8px rgba(167,139,250,0); }
  100% { border-color: var(--vp-c-border); box-shadow: none; }
}
/* 检查 flashField 是否包含该货币 key */
.currency-card.flash { animation: card-flash .6s ease forwards; }

.cc-flag { font-size: 28px; line-height: 1; }
.cc-name {
  font-size: 13px; font-weight: 700; color: var(--vp-c-text-1);
}
.cc-code {
  font-size: 10px; font-family: 'JetBrains Mono', monospace;
  color: var(--vp-c-text-2); margin-left: 4px; font-weight: 400;
}

/* Stepper */
.stepper-wrap { display: flex; align-items: stretch; }
.step-btn {
  width: 30px; flex-shrink: 0;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg); color: var(--vp-c-text-2);
  cursor: pointer; font-size: 16px; line-height: 1; transition: all .15s;
}
.step-btn:first-child { border-radius: 6px 0 0 6px; border-right: none; }
.step-btn:last-child  { border-radius: 0 6px 6px 0; border-left: none; }
.step-btn:hover { background: rgba(139,92,246,.15); border-color: #8b5cf6; color: #a78bfa; }

.cc-input {
  flex: 1; min-width: 0;
  padding: 8px 6px;
  border: 1px solid var(--vp-c-border); border-radius: 0;
  background: var(--vp-c-bg); color: var(--vp-c-text-1);
  font-size: 18px; font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  text-align: center; outline: none;
  box-sizing: border-box; transition: border-color .15s;
}
.cc-input:focus { border-color: #8b5cf6; }

.cc-rate { font-size: 9px; color: var(--vp-c-text-2); font-family: 'JetBrains Mono', monospace; }

/* ── 箭头 ───────────────────────────────────────────────────────── */
.cc-arrows {
  display: flex; flex-direction: column; gap: 6px;
  align-items: center; padding: 0 8px;
  flex-shrink: 0;
}
.arrow-row { display: flex; }
.arr {
  font-size: 18px; font-weight: 700;
  color: var(--vp-c-border);
  transition: color .2s, text-shadow .2s;
  font-family: monospace;
}
.arr.lit {
  color: #a78bfa;
  text-shadow: 0 0 8px rgba(167,139,250,.6);
}

/* ── 原理说明 ────────────────────────────────────────────────────── */
.ed-explain {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid var(--vp-c-border);
}
@media (max-width: 640px) { .ed-explain { grid-template-columns: 1fr; } }

.explain-item {
  padding: 14px 18px;
  border-right: 1px solid var(--vp-c-border);
  font-size: 12px; line-height: 1.6;
}
.explain-item:last-child { border-right: none; }
.ei-label { font-weight: 700; margin-bottom: 6px; color: var(--vp-c-text-1); }
.ei-body  { color: var(--vp-c-text-2); }
.ei-body strong { color: #a78bfa; }

/* ── 代码区 ─────────────────────────────────────────────────────── */
.ed-code { background: var(--vp-c-bg); }
.code-header {
  padding: 8px 18px;
  font-size: 11px; font-weight: 600;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-border);
}
.code-body {
  margin: 0;
  padding: 14px 18px;
  font-size: 11px; line-height: 1.7;
  font-family: 'JetBrains Mono', monospace;
  color: var(--vp-c-text-1);
  overflow-x: auto;
  white-space: pre;
}
</style>
