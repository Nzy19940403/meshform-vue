# API 参考

## MeshForm（组件）

见 [MeshForm 组件](./mesh-form) 页面。核心用法：

```vue
<MeshForm :schema="schema" :rules="rules" @submit="onSubmit" />
```

## from

```typescript
function from(
  source: string | string[],
  logic: (...values: any[]) => any,
  options?: {
    triggerKeys?: string[]
    effect?: (args: any) => any
    effectArgs?: string[]
  }
): FromDescriptor
```

声明单个联动规则，与 `:rules` prop 配合使用：

```typescript
const rules = {
  'billing.total.value': from(['price', 'qty'], (p, q) => p * q),
  'discount.hidden':     from('type', t => t === 'none'),
}
```

## MeshFormInstance（ref 类型）

```typescript
import type { MeshFormInstance } from '@meshflow/form-vue'

const formRef = ref<MeshFormInstance>()
// <MeshForm ref="formRef" ... />

onMounted(() => {
  formRef.value.engine    // 引擎实例（见下方 engine.* API）
  formRef.value.getFormData()  // 获取当前表单数据
  formRef.value.submit()       // 手动触发 @submit 事件
})
```

## engine.define

```typescript
engine.define(rules: Record<string, FromDescriptor>): void
```

批量声明联动规则，key 格式：`"路径.属性"`。通常通过 `:rules` prop 传入；需要在运行时动态追加规则时才直接调用。

## engine.entangle

```typescript
engine.entangle(config: {
  cause: string
  impact: string
  via: string[]
  emit: (cause: any, impact: any, propose: any) => void | EntangleGhost
}): void
```

双向纠缠（有环依赖）。见 [Entangle](../demos/entangle) 页面。

## engine.graph

```typescript
engine.graph.upstream(path: string): string[]         // 全量上游
engine.graph.downstream(path: string): string[]       // 全量下游
engine.graph.directUpstream(path: string): string[]   // 直接上游
engine.graph.directDownstream(path: string): string[] // 直接下游
engine.graph.order(): string[][]                      // 拓扑执行层序
```

## engine.hooks

```typescript
engine.hooks.onSuccess(callback: () => void): void  // 每次计算完成后触发
```

## engine.config

```typescript
engine.config.notifyAll(): Promise<void>  // 手动触发全量重算
```

## engine.setRule / engine.setRules

```typescript
engine.setRule(source: string, target: string, key: string, options: { ... }): void
engine.setRules(sources: string[], target: string, key: string, options: { ... }): void
```

底层 API，直接操作 meshflow scheduler。通常用 `from()` + `engine.define()` 替代。

---

## 逃生舱：自管理引擎

需要跨组件共享引擎、或在组件之外访问引擎时，可直接使用：

```typescript
import { useMeshFormVue, deleteEngine } from '@meshflow/form-vue'

const engine = useMeshFormVue('my-form', schema)
engine.define({ ... })

// 组件销毁时手动清理
onUnmounted(() => deleteEngine('my-form'))
```

## 类型导出

```typescript
import type {
  MeshFormSchema,      // = MeshObjectSchema
  MeshObjectSchema,
  MeshFieldSchema,
  MeshWidgetType,
  FromDescriptor,
  MeshFormInstance,    // template ref 类型
  MeshGraph,
  SetRuleOptions,
  GhostProposalApi,
  MeshNodeProxy,
} from '@meshflow/form-vue'
```
