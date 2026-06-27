---
layout: home

hero:
  name: "⧩ MeshForm Vue"
  text: "@jsonforms/vue + 联动引擎"
  tagline: 已经在用 @jsonforms/vue？把 &lt;json-forms&gt; 换成 &lt;MeshForm&gt;，加一个 :rules prop，字段联动就有了。Schema 不动、Renderer 不动、@change 不动。
  image:
    src: /logo.svg
    alt: MeshForm Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 从 JSON Forms 迁移
      link: /guide/mesh-form#从-json-forms-迁移
    - theme: alt
      text: 看看效果
      link: /demos/order-form

features:
  - title: "一行替换，零迁移成本"
    icon: "🔄"
    details: "`<json-forms>` → `<MeshForm>`，保留 `:schema`、`:renderers`、`@change`。不改 Schema 结构，不改自定义 Renderer，不改数据格式。"
  - title: "联动顺序，永远正确"
    icon: "⚡"
    details: 底层是有向无环图，引擎按拓扑顺序严格执行。500 个字段、几十条规则，不会算错顺序，不会竞态，不用你操心执行时机。
  - title: "所有动态状态全覆盖"
    icon: "🎛️"
    details: "hidden / disabled / readonly / required / label / placeholder / options / value / theme — 任意字段的任意属性都可以用 `from()` 声明为另一个字段的函数。"
  - title: "今天 Vue，明天也能换"
    icon: "🔗"
    details: 联动核心是纯 TypeScript，通过 UITrigger 接口与框架响应式解耦。今天跑在 Vue 3，迁移到 React 时联动逻辑不用动。
---

<script setup>
import ArchGraph from './.vitepress/components/ArchGraph.vue'
</script>

## 分层架构，各管各的

<ClientOnly>
  <ArchGraph />
</ClientOnly>

逻辑层只管计算，渲染层只管显示，两层之间通过 UITrigger 接口通信。要换 UI 库、单独测联动逻辑、或者迁移到其他框架，互相都不影响。
