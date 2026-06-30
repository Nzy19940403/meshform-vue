---
title: 案例：工程项目报价单
---

<script setup>
import EngineeringQuoteForm from '../.vitepress/components/EngineeringQuoteForm.vue'
import EngineeringQuoteLinkageGraph from '../.vitepress/components/EngineeringQuoteLinkageGraph.vue'
</script>

# 案例：工程项目报价单

工程报价单是迄今最复杂的案例——它同时包含**深层 DAG 计算链**和**两对真实的双向纠缠**。纯 DAG 无法表达"改报价反推利润率"或"改工期自动重算团队规模"这类对称约束；胶水代码需要手写 6+ 个互相监听的 watcher 且容易产生死循环。MeshForm 引擎原生支持两种拓扑，几行配置搞定。

**规模**：7 大板块 · 53 个节点 · 42 条 DAG 规则 · **2 对 useEntangle 双向纠缠**

| 板块 | 节点数 | 性质 |
|---|---|---|
| **项目基础信息** | 8 | 用户选择 → 费率/税率推导 |
| **WBS 工作分解** | 16 | 9 个人天录入 → 7 个阶段小计（DAG） |
| **成本汇总** | 6 | 6 层级联汇总（DAG） |
| **报价计算** | 7 | DAG 建议报价 + **⟳ 利润率 ↔ 最终报价纠缠** |
| **资源规划** | 5 | **⟳ 工期 ↔ 团队规模纠缠** + DAG 效率指标 |
| **付款方案** | 4 | 含税总价 → 分期金额（DAG） |
| **风险预警** | 3 | 条件显隐（DAG hidden 规则） |

## 实时演示

> ⟳ 标记的字段（利润率、最终报价、项目工期、团队规模）支持双向编辑——修改任意一个，另一个自动收敛。

<ClientOnly>
  <EngineeringQuoteForm />
</ClientOnly>

## 依赖关系图

<ClientOnly>
  <EngineeringQuoteLinkageGraph />
</ClientOnly>

## 两对纠缠的业务逻辑

### 纠缠 ①：利润率 ↔ 最终报价

**业务场景**：成本已知，销售侧有两种工作方式：
- 内部报价模式：设定利润率（如 20%），系统自动算出建议报价
- 客户预算模式：客户说"预算只有 50 万"，直接输入报价，系统反推实际利润率

```
成本（DAG 固定值）
   × (1 + 利润率%) = 建议报价（DAG，只读参考）

          ↕ ⟳ useEntangle（双向）

用户改 利润率  → 最终报价更新（按公式）
用户改 最终报价 → 利润率更新（反算 = 报价/成本 - 1）
```

```typescript
// 建议报价（DAG，随成本和利润率联动，只读参考值）
'pricing.suggestedQuote.value': from(
  ['costs.totalCost', 'pricing.marginRate'],
  (tc, mr) => Math.round(tc * (1 + mr / 100))
),

// 纠缠 A：利润率 → 最终报价（"我要赚 20%" → 算报价）
// isProxy:true 让 emit 参数是代理对象，直接 .value 读取状态
// propose.set 是提交变更的唯一正确方式（同步 emit 的 return 值会被引擎忽略）
engine.entangle({
  cause: 'pricing.marginRate',
  impact: 'pricing.quotePrice',
  via: ['value'],
  isProxy: true,
  emit: (mrNode, qpNode, propose) => {
    const tc = totalCostCache.value   // 从 onFormChange 拿到最新成本
    if (tc <= 0) return
    const target = Math.round(tc * (1 + mrNode.value / 100))
    if (Math.abs(target - qpNode.value) < 1) return
    propose.set('value', target)
  },
})

// 纠缠 B：最终报价 → 利润率（"客户预算 50 万" → 反推利润率）
engine.entangle({
  cause: 'pricing.quotePrice',
  impact: 'pricing.marginRate',
  via: ['value'],
  isProxy: true,
  emit: (qpNode, mrNode, propose) => {
    const tc = totalCostCache.value
    if (tc <= 0) return
    const target = Math.round((qpNode.value / tc - 1) * 100 * 10) / 10
    if (Math.abs(target - mrNode.value) < 0.1) return
    propose.set('value', target)
  },
})
```

### 纠缠 ②：工期 ↔ 团队规模

**业务场景**：WBS 算出总人天是固定的，资源规划侧有两种思路：
- 固定工期模式：工期定 90 天，系统算出最少需要几个人
- 固定团队模式：只有 3 个人可用，系统算出完工需要多少天

```
总人天（DAG 固定值）= 工期 × 团队规模 × 并行效率

          ↕ ⟳ useEntangle（双向）

用户改 工期   → 团队规模更新（总人天 ÷ 工期 ÷ 效率）
用户改 团队规模 → 工期更新（总人天 ÷ 人数 ÷ 效率）
```

```typescript
// 纠缠 C：工期 → 团队规模（"90 天交付，需要几个人？"）
engine.entangle({
  cause: 'resource.duration',
  impact: 'resource.teamSize',
  via: ['value'],
  isProxy: true,
  emit: (durNode, tsNode, propose) => {
    const pd  = personDaysCache.value
    const eff = efficiencyCache.value || 0.8
    if (pd <= 0 || durNode.value <= 0) return
    const target = Math.ceil(pd / durNode.value / eff)
    if (Math.abs(target - tsNode.value) < 0.01) return
    propose.set('value', target)
  },
})

// 纠缠 D：团队规模 → 工期（"只有 3 个人，要做多久？"）
engine.entangle({
  cause: 'resource.teamSize',
  impact: 'resource.duration',
  via: ['value'],
  isProxy: true,
  emit: (tsNode, durNode, propose) => {
    const pd  = personDaysCache.value
    const eff = efficiencyCache.value || 0.8
    if (pd <= 0 || tsNode.value <= 0) return
    const target = Math.ceil(pd / tsNode.value / eff)
    if (Math.abs(target - durNode.value) < 0.01) return
    propose.set('value', target)
  },
})
```

### 为什么这些场景纯 DAG 做不了？

DAG 要求每个节点有固定的"上游"和"下游"。

- `利润率 → 报价`：DAG 可以
- `报价 → 利润率`：DAG 不行，这是同一对关系的反向

如果强行用 DAG 表达：`报价` 既依赖 `利润率`（正向），又被 `利润率` 依赖（反向），形成自环——DAG 定义不允许这种结构。

用 `watch` 手写：改报价触发 watch → 更新利润率 → 触发利润率的 watch → 更新报价 → 死循环。必须手动加 `isUpdating` flag，且 4 对关系需要写 8 个带 flag 的 watcher。`useEntangle` 用"提案-收敛"机制天然避免死锁，无需 flag。

## DAG 主链概览

```
项目类型 ──┬──→ PM/开发/QA 日费率 ──┐
          └──→ 管理费率/风险率       │
                                    ↓
客户行业 ─────────→ 增值税率    WBS 人天录入（9 个）
                        │            │
                        │       ┌────┘
                        │       ↓
                        │   各阶段人天 × 费率 = 阶段成本（3 阶段）
                        │       │
                        │       ↓
                        │   总人力成本
                        │       │
                        │   管理费（× 管理费率）    ← 管理费率
                        │       │
                        │   风险储备金（× 风险率）  ← 风险率
                        │   + 硬件采购 + 差旅
                        │       │
                        │       ↓
                        │   项目总成本
                        │       │
                        │       ↓
                        │   ⟳ 纠缠①（利润率 ↔ 最终报价）
                        │       │
                        └──────→│ 增值税额 = 报价 × 税率
                                │
                                ↓
                            含税总价
                                │
                        ┌───────┴────────┐
                        ↓               ↓
                    签约首付       里程碑中期款
                        └───────┬────────┘
                                ↓
                            验收尾款 = 总价 - 首付 - 中期款
```

## DAG 与纠缠混用说明

三种 API 在同一个 engine 上协作：

```typescript
// ① 大多数字段用 from() 语法糖（DAG）
const rules = {
  'wbs.phase1Cost.value': from(
    ['wbs.pm1', 'wbs.dev1', 'wbs.qa1', 'project.pmRate', ...],
    (pm, dev, qa, pmR, ...) => pm * pmR + dev * devR + qa * qaR
  ),
  // ... 共 42 条
}

// ② 对称约束用 engine.entangle()（有环图）
onMounted(() => {
  engine.entangle({ cause: 'pricing.marginRate', impact: 'pricing.quotePrice', ... })
  engine.entangle({ cause: 'pricing.quotePrice', impact: 'pricing.marginRate', ... })
  engine.entangle({ cause: 'resource.duration',  impact: 'resource.teamSize',  ... })
  engine.entangle({ cause: 'resource.teamSize',  impact: 'resource.duration',  ... })
})
```

MeshFlow 引擎内部维护两套调度机制：DAG 节点走水位线拓扑排序，纠缠节点走"提案-收敛"的纪元演化。两者在同一个 `engine.hooks.onSuccess` 周期内协调完成，对上层 Vue 渲染层完全透明。
