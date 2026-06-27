# Schema 定义

`MeshFormSchema` 是 JSON Schema 的超集，通过 `x-*` 扩展字段描述 UI 行为。

## 顶层结构

```typescript
type MeshFormSchema = MeshObjectSchema
```

整个 Schema 必须是一个 `object` 类型的根节点，其 `properties` 中可以嵌套子对象或叶子字段。

## MeshObjectSchema（对象/分组）

```typescript
interface MeshObjectSchema {
  type: 'object'
  title?: string         // 分组标题，显示为 Group header
  properties: Record<string, MeshFieldSchema | MeshObjectSchema>
  'x-layout'?: 'vertical' | 'horizontal'  // 子字段排列方向
  'x-order'?: string[]   // 指定字段渲染顺序（默认按 properties key 顺序）
}
```

**示例：**

```typescript
{
  type: 'object',
  title: '产品信息',
  'x-layout': 'horizontal',   // 子字段横向排列
  properties: {
    category: { ... },
    quantity: { ... },
  }
}
```

## MeshFieldSchema（叶子字段）

```typescript
interface MeshFieldSchema {
  type: 'string' | 'number' | 'integer' | 'boolean'
  title?: string
  default?: any

  // 控件类型（不填则按 type 推断）
  'x-widget'?: 'input' | 'number' | 'select' | 'checkbox'

  // 下拉选项（静态初始值，可由联动规则动态更新）
  'x-options'?: { label: string; value: any }[]

  // 状态控制（均可由联动规则动态覆盖）
  'x-hidden'?: boolean
  'x-disabled'?: boolean
  'x-readonly'?: boolean
  'x-required'?: boolean

  // 展示
  'x-placeholder'?: string
  'x-theme'?: string      // Vuetify color，如 'success' / 'error' / 'warning'
  'x-min'?: number        // 数字字段最小值
  'x-maxLength'?: number  // 文本字段最大长度
}
```

## 控件类型推断规则

| Schema type | x-widget | 实际渲染控件 |
|---|---|---|
| `boolean` | — | `v-checkbox` |
| `number` / `integer` | — | `v-text-field` (type=number) |
| `string` | — | `v-text-field` |
| 任意 | `select` | `v-select` |
| 任意 | `checkbox` | `v-checkbox` |
| 任意 | `number` | `v-text-field` (type=number) |
| 任意 | `input` | `v-text-field` |
| `x-options` 不为空 | — | 自动升级为 `v-select` |

## 字段路径规则

字段的路径由 `properties` 的 key 逐层拼接，以 `.` 分隔：

```typescript
{
  properties: {
    product: {
      type: 'object',
      properties: {
        category: { type: 'string' }  // 路径：'product.category'
      }
    },
    billing: {
      type: 'object',
      properties: {
        total: { type: 'number' }     // 路径：'billing.total'
      }
    }
  }
}
```

这个路径在联动规则中用于指定来源和目标字段。

## 完整示例

```typescript
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
          ],
        },
        quantity: {
          type: 'integer',
          title: '数量',
          default: 1,
          'x-min': 1,
        },
        unitPrice: {
          type: 'number',
          title: '单价 (¥)',
          default: 0,
          'x-readonly': true,
          'x-disabled': true,
        },
      },
    },
    discount: {
      type: 'object',
      title: '折扣设置',
      properties: {
        type: {
          type: 'string',
          title: '折扣类型',
          default: 'none',
          'x-widget': 'select',
          'x-options': [
            { label: '无折扣',   value: 'none' },
            { label: '百分比',   value: 'percent' },
            { label: '固定减免', value: 'fixed' },
          ],
        },
        amount: {
          type: 'number',
          title: '折扣值',
          default: 0,
          'x-hidden': true,           // 初始隐藏，由联动控制显示
          'x-placeholder': '请输入折扣值',
        },
      },
    },
    billing: {
      type: 'object',
      title: '结算',
      'x-layout': 'horizontal',
      properties: {
        total: {
          type: 'number',
          title: '应付总额 (¥)',
          default: 0,
          'x-disabled': true,
          'x-theme': 'success',
        },
        notes: {
          type: 'string',
          title: '备注',
          default: '',
          'x-placeholder': '可填写特殊要求',
          'x-maxLength': 200,
        },
      },
    },
  },
}
```
