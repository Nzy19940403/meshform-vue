# 架构设计

## 分层结构

整个体系由三个 npm 包构成，职责边界清晰：

```
@meshflow/core          纯 TypeScript 调度引擎，无任何框架依赖
    └── @meshflow/form  将 JSON Schema 转换为引擎可识别的节点树
            └── @meshflow/form-vue  Vue 3 渲染层，连接引擎与 JSON Forms
```

### `@meshflow/core` — 调度引擎

引擎的核心是一张**有向图**。每个字段是图上的一个节点，`from()` 声明的依赖关系是边。引擎支持两种拓扑结构：

**无环图（DAG）**：`from()` / `define()` 声明的单向依赖，引擎使用**水位线（watermark）机制**进行拓扑调度：

- 每轮计算开始时，引擎为所有待更新节点分配水位线（单调递增的时间戳）
- 下游节点只有在所有上游依赖都以更高水位线完成计算后，才会执行自己的逻辑
- 这保证了无论网络延迟、异步 IO 如何抖动，最终状态一定来自最新一轮输入的计算结果

**有环图（循环依赖）**：`useEntangle` 接口支持双向联动，通过"提案-接受"机制在时间轴上展平循环，逐步收敛至稳定态，不会死锁。Entangle Demo（人民币 ↔ 美元实时互换）和 Portfolio Demo（股票 ↔ 债券 ↔ 现金三角比例约束）均使用此机制。

### `@meshflow/form` — Schema 适配层

这一层做两件事：

1. **Schema 转换**：将 JSON Schema（`MeshFormSchema`）转换为引擎内部的节点树。每个叶子字段（`string`、`number`、`boolean`）成为一个引擎节点，对象节点成为 group 节点（用于组织结构，不参与依赖计算）。

2. **`from()` + `define()` 语法糖**：将 `'field.path.propertyName': from(sources, logic)` 解析为底层的 `SetRule` / `SetRules` 调用，注册到引擎的依赖图中。

字段节点上可以控制的属性：

| 属性 | 类型 | 说明 |
|---|---|---|
| `value` | any | 字段当前值 |
| `hidden` | boolean | 是否隐藏 |
| `disabled` | boolean | 是否禁用 |
| `readonly` | boolean | 是否只读 |
| `required` | boolean | 是否必填 |
| `options` | array | 下拉选项 |
| `placeholder` | string | 占位文本 |
| `label` | string | 字段标签 |
| `theme` | string | Vuetify 颜色主题 |

### `@meshflow/form-vue` — Vue 渲染层

这是唯一与 Vue 框架耦合的一层，主要由两个部分组成：

**`<MeshForm>` 组件**

负责引擎的生命周期管理和桥接：

```
MeshForm 组件挂载
    ↓
创建引擎实例（useMeshFormVue）
    ↓
注册 :rules（engine.define）
    ↓
engine.notifyAll()  ← 触发第一轮全量计算
    ↓
构建 nodeMap（所有节点路径 → 节点对象）
    ↓
provide(MESH_NODE_MAP_KEY, nodeMap)  ← 注入给所有子渲染器
    ↓
渲染 <json-forms>
```

**自定义 Renderer**

每个字段的渲染器通过 `inject(MESH_NODE_MAP_KEY)` 拿到 nodeMap，再通过 `control.value.path` 定位到自己的节点，读取其当前状态进行渲染。

---

## 响应式更新机制

Vue 的响应式系统（`ref` / `computed`）和引擎的状态系统是**两套独立的系统**。引擎直接修改节点对象的属性（如 `node.value = newVal`），Vue 无法自动追踪这种变化。

**`dirtySignal`** 解决了这个问题：

```
用户操作（如修改输入框）
    ↓
Renderer 调用 node.dependOn(() => newVal, 'value')
    ↓
引擎执行拓扑计算，更新相关节点的属性
    ↓
引擎每次计算完成后，对受影响节点执行 node.dirtySignal.value++
    ↓
Renderer 的 computed 中追踪了 node.dirtySignal.value
    ↓
Vue 检测到 computed 依赖变化 → 触发重新计算 → 读取最新属性 → 重渲染
```

关键：Renderer 的 `computed` 必须对**原始值（boolean/string/number）**单独建立 computed，而非对整个节点对象。因为节点对象引用不变，即使属性被修改，Vue 也不会触发更新。

```typescript
// ❌ 错误：对象引用不变，computed 不会重跑
const node = computed(() => {
  n?.dirtySignal?.value
  return nodeMap?.value?.[path]  // 返回同一对象
})

// ✅ 正确：返回原始值，dirtySignal 变化 → computed 重算 → 值变化 → 重渲染
const isHidden = computed(() => {
  node.value?.dirtySignal?.value
  return node.value?.hidden  // 返回 boolean
})
```

---

## 数据流全图

```
用户输入
   │
   ▼
Renderer.handleChange(newVal)
   │  node.dependOn(() => newVal, 'value')
   ▼
MeshFlow 引擎按拓扑顺序逐节点调度
   ├─ 节点 A 计算完成 → signalTrigger(signal) → signal.value++（同步）
   │                     └─ Vue 响应式系统将依赖该 signal 的 render effect 标脏，推入 Vue 调度队列
   ├─ 节点 B 计算完成 → signalTrigger(signal) → signal.value++（同步）
   │                     └─ render effect 推入 Vue 调度队列
   └─ 节点 C 计算完成 → signalTrigger(signal) → signal.value++（同步）
                         └─ render effect 推入 Vue 调度队列
   │
   ▼  （本轮任务所有节点变更完成）
engine.hooks.onSuccess
   │  emit('change', getFormData())
   ▼
父组件 @change 回调
   │
   ▼  （同步栈清空，进入微任务）
Vue 调度器 flush
   └─ 批量执行各 Renderer 的 render effect → 重渲染
```

`signalTrigger` 是**同步直接修改** `dirtySignal.value`，UITrigger 本身没有入队行为。入队的是 Vue 响应式系统感知到 `signal.value` 变化后、自动将依赖它的 **render effect** 推入 Vue 调度器队列。多个节点的 `signal.value++` 连续发生时，Vue 调度器将对应的 render effect 合并批处理，同步栈清空后统一 flush 重渲染。

---

## Group 显隐机制

Group（板块标题）的显隐不能通过引擎规则直接控制，因为 group 节点不参与依赖图（`SetRule` 仅支持叶子节点）。

`MeshGroupRenderer` 使用**推断**策略：当一个 Group 声明了 `options.nodePath`，渲染器会检查该路径下所有直接子节点是否全部 `hidden === true`。若是，则整个 Group（含标题）不渲染。

```typescript
// uischema 中声明
const warningsGroup = {
  type: 'Group',
  label: '核保提示',
  options: { nodePath: 'warnings' },  // 关联 warnings 对象路径
  elements: [...],
}

// MeshGroupRenderer 内部：
// 扫描 nodeMap 中 'warnings.' 前缀的所有直接子节点
// 全部 hidden → 不渲染 Group
// 任意一个 visible → 渲染 Group
```

这样，每条警告的显隐仍由各自的引擎规则独立控制，Group 标题的可见性由渲染器自动推断，无需额外规则。

---

## 自定义 Renderer 接入

实现自定义渲染器只需三步：

```typescript
// 1. 定义 tester：决定该 renderer 匹配哪类字段
const myTester = rankWith(20, and(
  uiTypeIs('Control'),
  schemaMatches(s => s['x-widget'] === 'my-widget')
))

// 2. 实现 renderer 组件，从 nodeMap 读取状态
const nodeMap = inject(MESH_NODE_MAP_KEY)
const isHidden = computed(() => {
  node.value?.dirtySignal?.value
  return node.value?.hidden
})

// 3. 注册到 MeshForm
const customRenderers = [
  { tester: myTester, renderer: markRaw(MyRenderer) }
]
```

```vue
<MeshForm :schema="schema" :rules="rules" :renderers="customRenderers" />
```

tester 的 rank（第一个参数）决定优先级，数字越大优先级越高，内置渲染器默认为 1。

---

## 与 JSON Forms 的关系

meshform-vue 是 `@jsonforms/vue` 的**超集**，不是替代品：

- Schema 格式：完全兼容 JSON Schema（加了少量 `x-*` 扩展属性）
- UISchema 格式：完全兼容 JSON Forms UISchema
- Renderer 协议：完全兼容，自定义 Renderer 可复用
- `@change` 格式：对齐 JSON Forms（`data: Record<string, any>`）

唯一的区别：字段的状态（值、显隐、禁用等）不再由 Vue 响应式数据驱动，而是由 MeshFlow 引擎驱动。从 `<json-forms>` 迁移只需换一个标签名，加一个 `:rules` prop。
