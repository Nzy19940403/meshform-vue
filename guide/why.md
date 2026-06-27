<script setup>
import WhyGraph from '../.vitepress/components/WhyGraph.vue'
</script>

# 为什么选择 meshform-vue

## 传统表单联动的困境

中后台系统中，复杂表单的联动逻辑是最难维护的代码之一。常见的问题：

**Watch 地狱**

```typescript
// 传统写法：逻辑分散在大量 watch 里
watch(category, (cat) => {
  nameOptions.value = getOptions(cat)
  if (!nameOptions.value.find(o => o.value === name.value)) {
    name.value = nameOptions.value[0]?.value
  }
})
watch(name, (n) => {
  unitPrice.value = PRICE_MAP[n] ?? 0
})
watch([quantity, unitPrice], ([qty, price]) => {
  total.value = qty * price
})
watch(discountType, (type) => {
  discountAmountVisible.value = type !== 'none'
  // ...还有更多
})
// 字段多了之后，这个文件会无限膨胀
```

问题：
- 执行顺序不确定（异步 watch 的竞态）
- 循环依赖需要手动加锁
- 逻辑散落各处，难以追踪"这个字段被谁影响了"

## meshform-vue 的解法

**将联动关系显式声明为拓扑图**

```typescript
engine.define({
  'product.name.options': from('product.category', getOptions),
  'product.unitPrice.value': from('product.name', name => PRICE_MAP[name]),
  'billing.total.value': from(['product.quantity', 'product.unitPrice'], (q, p) => q * p),
  'discount.amount.hidden': from('discount.type', t => t === 'none'),
})
```

底层由 meshflow 引擎将这些声明转换为一张有向无环图（DAG），严格按照拓扑顺序执行：

<ClientOnly>
  <WhyGraph />
</ClientOnly>

**执行顺序确定**：无论异步 IO 如何抖动，引擎的水位线机制保证计算结果的时序正确性。

**循环依赖安全**：需要双向联动时，用 `useEntangle` 有环图接口，引擎会自动收敛而不会死锁。

**全局可观测**：任意时刻都可以查询依赖图：

```typescript
engine.graph.directDownstream('product.category')
// → ['product.name']

engine.graph.downstream('product.category')
// → ['product.name', 'product.unitPrice', 'billing.total']
```

## 与同类方案的对比

| | meshform-vue | @jsonforms/vue | 手写 watch | Formily |
|---|---|---|---|---|
| 字段联动引擎 | ✅ 拓扑 DAG | ❌ 无内置联动 | ⚠️ 手写 watch | ✅ |
| 执行顺序保证 | ✅ 拓扑调度 | — | ❌ 依赖框架调度 | ✅ |
| 双向联动 | ✅ useEntangle | — | ❌ 需要手动锁 | ⚠️ 有限支持 |
| 500+ 节点性能 | ✅ | — | ❌ | ⚠️ |
| JSON Schema 驱动 | ✅ | ✅ | ❌ | ✅ |
| Renderer 协议 | ✅ jsonforms 协议 | ✅ jsonforms 协议 | N/A | ✅ |
| 框架无关核心 | ✅ | ❌ | ❌ | ❌ |
| 从 jsonforms 迁移成本 | ✅ 换一个标签名 | — | 重写 | 重写 |

如果你已经在用 `@jsonforms/vue`，meshform-vue 是它的**直接超集**：保留所有 JSON Forms 的能力，加上联动引擎。
