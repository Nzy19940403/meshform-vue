---
layout: home

hero:
  name: "MeshForm Vue"
  text: "为 JSON Forms 注入确定性"
  tagline: "作为 <json-forms> 的 Drop-in 替代方案，将视图渲染与状态调度彻底解耦。基于 DAG 与水位线机制，为复杂表单的字段联动提供绝对的时序与高性能。"
  image:
    src: /logo.svg
    alt: MeshForm Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 了解架构设计
      link: /guide/architecture

features:
  - title: "Drop-in 无损替换"
    icon: "📦"
    details: "JSON Forms 的即插即用型状态大脑。完全兼容原有 API 和 UI 协议，只需注入 :rules 属性，即可将表单交互逻辑托管至 MeshFlow 引擎，迁移成本归零。"
  - title: "DAG 拓扑与循环依赖收敛"
    icon: "⚡"
    details: "同时支持拓扑有序的 DAG 执行流与带有环路依赖的纠缠系统。采用水位线调度与势能收敛算法，无论逻辑链路多复杂，都能保证状态演化的确定性与一致性。"
  - title: "控制权反转 (IoC)"
    icon: "🎛️"
    details: "组件仅负责被动渲染。从字段显隐到属性控制，皆由引擎通过 UITrigger 执行原子级调度。拒绝框架级全量重绘，只在计算结果演化时触发精准更新。"
  - title: "纯粹的 Headless 架构"
    icon: "🧩"
    details: "引擎逻辑与 UI 视图彻底解耦。核心计算由纯 TypeScript 实现，不绑定特定 UI 框架，支持跨端跨框架逻辑复用。"
---

<script setup>
import ArchGraph from './.vitepress/components/ArchGraph.vue'
</script>

## 架构哲学：计算与视图解耦

<ClientOnly>
  <ArchGraph />
</ClientOnly>

通过引入 MeshFlow 作为“最强外脑”，我们将表单的**数据推演流**与**UI 渲染流**进行了彻底的物理隔离。两层之间仅通过 `UITrigger` 接口通信：底层引擎在后台静默完成高频、复杂的拓扑计算，而视图层只负责接收确定的“稳态快照”进行局部刷新。

这意味着：你可以单独对联动逻辑进行单元测试，也可以随时更换底层的 UI 组件库（Element Plus / Ant Design / Vuetify）。任凭表现层千变万化，你的业务因果链条始终稳如泰山。