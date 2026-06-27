# 联动 API

meshform-vue 提供三种互补的联动 API，覆盖从简单到复杂的所有场景。

## 概览

| API | 适用场景 | 图类型 |
|---|---|---|
| `from()` + `define()` | 日常联动，推荐首选 | DAG（有向无环图） |
| `setRule` / `setRules` | 需要访问底层计算 API | DAG |
| `entangle` | 双向联动、循环依赖 | 有环图 |

---

## 方式一：`from()` + `define()`（推荐）

最简洁的联动写法。`define()` 接受一个规则对象，key 格式为 `"字段路径.属性名"`。

```typescript
engine.define({
  '目标路径.属性名': from(来源, 计算函数),
})
```

### 可以控制的属性

| 属性 | 说明 |
|---|---|
| `value` | 字段的值 |
| `hidden` | 是否隐藏（`true` / `false`） |
| `disabled` | 是否禁用 |
| `readonly` | 是否只读 |
| `required` | 是否必填 |
| `options` | 下拉选项列表 |
| `placeholder` | 占位文字 |
| `label` | 字段标签 |
| `theme` | Vuetify color |

### 单源依赖

```typescript
engine.define({
  // discount.type 变化 → 控制 discount.amount 的显隐
  'discount.amount.hidden': from('discount.type', (type: string) => type === 'none'),

  // discount.type 变化 → 动态修改 placeholder
  'discount.amount.placeholder': from('discount.type', (type: string) =>
    type === 'percent' ? '输入百分比，如 10 表示九折' : '输入减免金额，如 500'
  ),
})
```

### 多源依赖

```typescript
engine.define({
  // 数量 × 单价 → 总额
  'billing.total.value': from(
    ['product.quantity', 'product.unitPrice'],
    (qty: number, price: number) => qty * price,
  ),
})
```

### 带副作用（`effect`）

当某个属性变化后需要联动修改**同一字段的其他属性**时，使用 `effect`。最常见的场景：options 更新后重置 value。

```typescript
engine.define({
  'product.name.options': from('product.category', (cat: string) => getOptions(cat), {
    // effect 在 options 计算完成后执行
    // 参数由 effectArgs 指定，从节点当前状态中读取
    effect: ({ options, value }: any) => {
      const valid = options.some((o: any) => o.value === value)
      // 返回 undefined 表示不修改；返回对象则按 key 覆盖对应属性
      return valid ? undefined : { value: options[0]?.value ?? '' }
    },
    effectArgs: ['options', 'value'],
  }),
})
```

---

## 方式二：`setRule` / `setRules`（原生 DAG）

直接调用 meshflow 底层 API，可以访问完整的计算上下文。

### `setRule`（单源）

```typescript
engine.setRule(
  '来源路径',     // source
  '目标路径',     // target
  '属性名',       // key
  {
    triggerKeys: ['value'],   // 监听来源的哪个属性变化
    logic: ({ slot }) => {
      const [source] = slot.triggerTargets
      return source.value * 1.1
    },
  }
)
```

### `setRules`（多源）

```typescript
engine.setRules(
  ['来源A', '来源B'],   // sources（数组）
  '目标路径',
  '属性名',
  {
    triggerKeys: ['value'],
    logic: ({ slot }) => {
      const [a, b] = slot.triggerTargets
      return a.value * b.value
    },
  }
)
```

::: tip 何时用 `setRule` 而不是 `from()`？
- 需要访问 `slot` 上的完整上下文（如触发原因 `TriggerCause`、节点的历史值等）
- 需要配置非标准的 `triggerKeys`（监听 `value` 以外的属性变化）
:::

---

## 方式三：`entangle`（有环图 / 双向联动）

处理两个字段**互相影响**的场景，如汇率换算、互锁字段等。meshflow 通过"提案"机制避免死锁，循环依赖在时间轴上展平为线性演化。

```typescript
engine.entangle({
  cause: '触发源路径',    // 谁发生变化
  impact: '影响目标路径', // 影响谁
  via: ['value'],         // 监听 cause 的哪个属性
  emit: (cause, impact) => {
    const diff = cause.value - impact.value
    if (Math.abs(diff) < 0.01) return  // 已收敛，不再传播
    return {
      key: 'value',
      delta: diff * 0.1,   // 每次传递 10% 的差值，逐步收敛
    }
  },
})
```

**典型用例：温度单位互换**

```typescript
// 摄氏度 → 华氏度
engine.entangle({
  cause: 'celsius',
  impact: 'fahrenheit',
  via: ['value'],
  emit: (c) => ({ key: 'value', delta: c.value * 9/5 + 32 - /* current fahrenheit */ 0 })
})

// 华氏度 → 摄氏度（反向）
engine.entangle({
  cause: 'fahrenheit',
  impact: 'celsius',
  via: ['value'],
  emit: (f) => ({ key: 'value', delta: (f.value - 32) * 5/9 - /* current celsius */ 0 })
})
```

---

## 三种 API 混用

三种方式可以自由组合，在同一个 `engine` 上混用：

```typescript
const engine = useMeshFormVue('form', schema)

// 大多数联动用 from() 语法糖
engine.define({
  'billing.subtotal.value': from(['price', 'quantity'], (p, q) => p * q),
  'discount.hidden': from('type', t => t === 'none'),
})

// 特殊场景用原生 API
engine.setRule('subtotal', 'total', 'value', {
  logic: ({ slot }) => applyTax(slot.triggerTargets[0].value),
})

// 双向场景用 entangle
engine.entangle({ cause: 'fieldA', impact: 'fieldB', via: ['value'], emit: ... })
```
