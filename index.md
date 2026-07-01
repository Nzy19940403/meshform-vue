---
layout: home

hero:
  name: "MeshForm Vue"
  text: "为 JSON Forms 注入确定性"
  tagline: "一个面向复杂业务表单的 Drop-in enhancement layer。保留 JSON Schema、UISchema 与 renderer 体系，把字段联动、异步传播与双向约束交给 MeshFlow。"
  image:
    src: /logo.svg
    alt: MeshForm Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 架构设计
      link: /guide/architecture

features:
  - title: "Drop-in 无损替换"
    icon: "📦"
    details: "作为 @jsonforms/vue 的增强层而存在。保留 JSON Schema、UISchema 与 renderer 协议，只需引入 :rules，即可将复杂联动交由 MeshFlow 接管。"
  - title: "DAG 拓扑与循环依赖收敛"
    icon: "⚡"
    details: "同时覆盖拓扑有序的单向依赖与带环路的双向约束。基于水位线调度与收敛机制，在异步传播、实时计算和复杂联动下维持稳定时序。"
  - title: "控制权反转 (IoC)"
    icon: "🎛️"
    details: "渲染层负责呈现，状态演化交由引擎调度。从字段显隐到属性控制，联动逻辑不再散落于 watch 与临时状态，而是统一进入规则系统。"
  - title: "纯粹的 Headless 架构"
    icon: "🧩"
    details: "将计算与视图彻底拆开。核心调度由纯 TypeScript 引擎承载，Vue 只是接收结果的渲染层，这让规则测试、跨端复用与系统演进都更从容。"
---

<script setup>
import ArchGraph from './.vitepress/components/ArchGraph.vue'
</script>

## 把复杂表单的状态调度，从视图层中剥离出来

MeshForm Vue 不试图重写一套新的表单范式。

它做的事情更直接：在保留 JSON Forms 渲染体系的前提下，把复杂表单里最难维护的部分单独抽出来，包括字段依赖、执行时序、异步传播，以及双向约束下的状态收敛。

## 为高密度联动场景设计

MeshForm Vue 更适合这些表单：

- 保险投保和核保表单
- 采购、报价、计费、算费表单
- 产品配置和资格判断表单
- 依赖跨字段推导、异步传播、双向约束与状态收敛的中后台系统
- 已经在使用 `@jsonforms/vue`，但联动代码越来越重的团队

## 架构哲学：计算与视图解耦

<ClientOnly>
  <ArchGraph />
</ClientOnly>

通过引入 MeshFlow 作为状态引擎，MeshForm Vue 将**字段计算**与**UI 渲染**拆成两层：底层负责规则调度、传播和收敛，视图层只负责消费当前结果并完成渲染。

这样做的直接收益是：业务规则更容易测试，联动关系更容易解释，渲染层也不必继续承担本不属于它的时序负担。