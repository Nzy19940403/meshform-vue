# MeshForm Vue Docs

MeshForm Vue is a dynamic form solution for Vue 3 teams who already like `JSON Schema`, but do not want complex field linkage to collapse into a pile of `watch`, ad-hoc state, and async edge cases.

It keeps the `@jsonforms/vue` rendering model and adds a deterministic linkage engine powered by MeshFlow. In practice, that means you can keep your schema, UISchema, and custom renderers, while moving cross-field logic into explicit rules.

## What Problem It Solves

Simple forms are easy. The trouble starts when fields begin to affect each other:

- category changes, so product options must refresh
- one field drives visibility, required state, and readonly state of three others
- amount, rate, and total need real-time calculation
- two fields affect each other and must converge safely
- async option loading creates ordering and stale-state issues

MeshForm Vue is designed for these cases.

## Positioning

MeshForm Vue is not trying to replace JSON Forms from scratch.

It is a Vue 3 enhancement layer built on top of `@jsonforms/vue`:

- keep `JSON Schema`
- keep `UISchema`
- keep custom renderers
- keep Vue 3
- add deterministic form linkage with `:rules`

If your team is already using `@jsonforms/vue`, migration cost is intentionally low.

## When It Fits Best

MeshForm Vue is especially suitable for:

- insurance underwriting and application forms
- pricing and quote systems
- procurement and order forms
- financial planning and allocation forms
- product configuration and eligibility forms
- any back-office workflow with heavy field interaction

If your form is mostly plain CRUD with little linkage, plain JSON Forms may already be enough.

## Why Teams Care

- Declarative linkage instead of scattered `watch`
- Deterministic execution order for complex dependencies
- Safe support for cyclic interaction via entangle-style convergence
- Better testability because business logic is separated from the view
- Better observability because dependencies can be inspected as a graph
- Lower migration cost for teams already invested in JSON Forms

## Example

```ts
const rules = {
  'product.name.options': from('product.category', getOptions),
  'product.unitPrice.value': from('product.name', getPrice),
  'billing.total.value': from(
    ['product.quantity', 'product.unitPrice'],
    (qty, price) => qty * price
  ),
}
```

The goal is simple: make field interaction readable, predictable, and maintainable.

## Docs Structure

- [Quick Start](./guide/getting-started.md)
- [Why MeshForm Vue](./guide/why.md)
- [Architecture](./guide/architecture.md)
- [Schema](./guide/schema.md)
- [Linkage API](./guide/linkage.md)
- [MeshForm Component](./guide/mesh-form.md)
- [Custom Renderer](./guide/custom-renderer.md)
- [Full API](./guide/api.md)

## Demo Scenarios

- [Cloud Procurement Form](./demos/order-form.md)
- [Entangle Bidirectional Linkage](./demos/entangle.md)
- [Insurance Application](./demos/insurance.md)
- [Group Insurance Pricing](./demos/group-insurance.md)
- [Pension Planning](./demos/pension.md)
- [Engineering Quote](./demos/engineering-quote.md)

## Core Stack

- `Vue 3`
- `@jsonforms/vue`
- `@jsonforms/core`
- `@meshflow/core`
- `@meshflow/form`
- `@meshflow/form-vue`

## One-Sentence Summary

MeshForm Vue gives JSON Forms a deterministic state engine, so complex Vue forms stay understandable as they grow.
