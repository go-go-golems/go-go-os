---
Title: CardDefinition DSL Implementation Guide and Developer Reference
Ticket: HC-017-NEW-DSL
Status: active
Topics:
    - frontend
    - architecture
    - redux
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/cards/types.ts
      Note: Core type system for CardDefinition, expressions, and scoped registries.
    - Path: packages/engine/src/cards/helpers.ts
      Note: Authoring helpers Sel/Ev/Param/Act and ui node constructors.
    - Path: packages/engine/src/cards/runtime.ts
      Note: Runtime execution, expression resolution, action dispatch, and scoped selector/action lookup.
    - Path: packages/engine/src/cards/runtimeStateSlice.ts
      Note: Scoped Redux state storage model and reducers.
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Shell wiring between Redux state, runtime context, and CardRenderer.
    - Path: packages/engine/src/components/shell/CardRenderer.tsx
      Note: UI node interpreter that maps DSL nodes to React widgets.
    - Path: packages/engine/src/components/widgets/BookTracker.stories.tsx
      Note: End-to-end story demonstrating full app flow authored with CardDefinition DSL.
ExternalSources:
    - local:js-ui-dsl.md
Summary: Textbook-style implementation and usage guide for the new CardDefinition DSL runtime, including architecture, execution model, authoring patterns, examples, and symbol-level reference.
LastUpdated: 2026-02-13T11:25:00-05:00
WhatFor: Onboard new developers to the CardDefinition DSL internals and practical authoring workflow.
WhenToUse: Use when implementing new DSL cards/stacks, debugging runtime behavior, or reviewing how expressions/actions/selectors flow through the shell.
---

# CardDefinition DSL Implementation Guide and Developer Reference

## Audience and Scope

This guide is written for developers who need to build, modify, or debug the CardDefinition DSL runtime and DSL-authored applications. It documents both how the system was implemented and how to author app behavior on top of it.

The guide covers:

- Architectural model and design intent.
- Type-level contracts and runtime flow.
- Selector/action scoping and Redux integration.
- Practical authoring patterns with complete examples.
- Known pitfalls and debugging playbooks.
- Symbol-by-symbol reference by file.

## 1. Big Picture

The new DSL system replaces card-specific bespoke runtime contracts with a single, uniform model:

- A card stack definition (`CardStackDefinition`) describes cards and optional scope-level state/actions/selectors.
- A small expression language (`Sel`, `Ev`, `Param`) allows declarative data wiring.
- A unified action descriptor (`Act`) allows declarative behavior wiring.
- A runtime interpreter resolves expressions and executes actions in scope-aware order.
- Scoped runtime state lives in Redux under a single `hypercardRuntime` slice.

### 1.1 Architecture Diagram

```text
+----------------------------- App / Story ------------------------------+
| CardStackDefinition + sharedSelectors + sharedActions                  |
| (cards, cardTypes, backgrounds, stack/global scoped behavior)          |
+-------------------------------+----------------------------------------+
                                |
                                v
+----------------------- HyperCardShell ---------------------------------+
| - ensures scoped runtime defaults                                      |
| - builds CardContext                                                   |
| - resolves expressions                                                 |
| - executes action descriptors                                          |
+-------------------------------+----------------------------------------+
                                |
                                v
+----------------------- CardRenderer -----------------------------------+
| UINode interpreter                                                     |
| menu/list/detail/form/report/chat -> React widget components           |
+-------------------------------+----------------------------------------+
                                |
                                v
+--------------------------- Redux Store --------------------------------+
| navigation | notifications | domain slices | hypercardRuntime          |
+------------------------------------------------------------------------+
```

## 2. Core Design Goals

The implementation intentionally optimizes for the following:

- One runtime path for all cards.
- Declarative data flow for UI values.
- Declarative action wiring for interactions.
- Scoped state (card/cardType/background/stack/global) with explicit precedence.
- Domain logic reuse through shared registries.
- Minimal boilerplate to author app-like experiences in story/demo/runtime contexts.

## 3. Type System (Contracts)

The type contracts live in `packages/engine/src/cards/types.ts`.

### 3.1 Scope model

- `LocalScope = 'card' | 'cardType' | 'background' | 'stack' | 'global'`
- `SelectorScope = LocalScope | 'shared' | 'auto'`
- `ActionScope = LocalScope | 'shared' | 'auto'`

`auto` means: resolve using runtime precedence.

### 3.2 Expression model

`ValueExpr` supports:

- Primitive values (`null`, boolean, number, string)
- Arrays and plain objects
- `SelExpr` (`{$:'sel', ...}`)
- `ParamExpr` (`{$:'param', ...}`)
- `EvExpr` (`{$:'event', ...}`)

Important behavior: only these expression tags are interpreted. Other tagged payloads (for example `{$:'act', ...}`) are treated as plain data by the value resolver.

### 3.3 Action descriptor

`ActionDescriptor` is:

```ts
{ $: 'act'; type: string; args?: ValueExpr; to?: ActionScope }
```

It is intentionally generic to support:

- Built-in runtime commands (`nav.go`, `state.setField`, `toast.show`, etc)
- Local scoped actions (card/cardType/background/stack/global)
- Shared app-domain actions.

### 3.4 Authoring primitives

Defined in `packages/engine/src/cards/helpers.ts`:

- `Sel(name, args?, { from? })`
- `Param(name)`
- `Ev(name)`
- `Act(type, args?, { to? })`
- `ui.*` node factories (menu/list/detail/form/report/chat and low-level nodes)

## 4. Runtime Data Model

`packages/engine/src/cards/runtimeStateSlice.ts` stores scoped state in Redux.

Conceptually:

```text
hypercardRuntime:
  global: {...}
  stacks:
    <stackId>:
      state: {...}                 # stack scope
      backgrounds:
        <backgroundId>: { state }
      cardTypes:
        <cardType>: { state }
      cards:
        <cardId>: { state }
```

### 4.1 Why this shape?

- It supports many stacks in one store.
- Each scope has stable, predictable addressing.
- `ensureCardRuntime` can safely seed defaults per scope.
- `selectMergedScopedState` can merge scope fragments in deterministic precedence.

## 5. End-to-End Runtime Flow

### 5.1 Initialization

In `HyperCardShell`:

1. Resolve current card from navigation.
2. Identify matching card type and optional background.
3. Dispatch `ensureCardRuntime` with default state seeds.

### 5.2 Rendering

`CardRenderer` walks `cardDef.ui` and maps each node type to a widget component.

For each node prop that may contain expressions:

- `runtime.resolve(expr)` invokes `resolveValueExpr`.
- Expression values are computed against current state, params, and event context.

### 5.3 Interaction

When widget events fire:

1. `CardRenderer` emits `(nodeKey, eventName, payload)`.
2. Shell looks up `cardDef.bindings[nodeKey][eventName]`.
3. Shell executes the bound `ActionDescriptor`.
4. Runtime resolves descriptor args first, then dispatches command/handler.

## 6. Expression Resolution Semantics

Implemented in `packages/engine/src/cards/runtime.ts` (`resolveValueExpr`).

### 6.1 Supported evaluation behavior

- Primitive values: passthrough.
- Arrays: recursively resolved.
- Plain objects without `$`: recursively resolved.
- `{$:'param'}`: lookup in `ctx.params`.
- `{$:'event'}`: deep-get from event payload.
- `{$:'sel'}`: call selector resolver.

### 6.2 Critical passthrough behavior

Two important correctness rules are implemented:

- Function values pass through unchanged.
  - Needed for widget config hooks like `computed[].compute` in detail views.
- Non-value-expression tagged objects pass through unchanged.
  - Needed so embedded `Act(...)` payloads inside resolved widget config are preserved.

Without these rules, action buttons and computed fields break in subtle runtime ways.

## 7. Selector and Action Resolution

### 7.1 Selector precedence (`from: 'auto'` or omitted)

Resolution order:

1. card
2. cardType
3. background
4. stack
5. global
6. shared

If `from` is explicit, only that scope is checked.

### 7.2 Action handler precedence (`to: 'auto'` or omitted)

Execution order:

1. Built-in commands (`nav.*`, `state.*`, `toast.*`)
2. card action registry
3. cardType action registry
4. background action registry
5. stack action registry
6. global action registry
7. shared action registry

### 7.3 Local state convenience selector behavior

For local scopes, selectors also support:

- `state.<path>` deep-get shorthand
- direct key lookup in scoped state object

This is why `Sel('state.edits')` works without custom selector registration.

## 8. Built-in Commands

`executeActionDescriptor` supports built-ins:

- Navigation:
  - `nav.go` / `navigate`
  - `nav.back` / `back`
- Notifications:
  - `toast.show` / `toast`
- Scoped state mutation:
  - `state.set`
  - `state.setField`
  - `state.patch`
  - `state.reset`

These commands are the default toolbox for card-level app behavior.

## 9. Authoring a Stack: Step-by-Step

### 9.1 Minimal stack skeleton

```ts
export const STACK = defineCardStack({
  id: 'bookTracker',
  name: 'Book Tracker',
  icon: '📚',
  homeCard: 'home',
  cards: {
    home: {
      id: 'home',
      type: 'menu',
      title: 'Home',
      ui: ui.menu({ key: 'homeMenu', buttons: [] }),
    },
  },
});
```

### 9.2 Add data selectors and actions (shared)

```ts
const sharedSelectors = {
  'books.all': (state) => state.books.items,
  'books.byParam': (state, _args, ctx) =>
    state.books.items.find((b) => b.id === String(ctx.params.param ?? '')) ?? null,
};

const sharedActions = {
  'books.delete': (ctx, args) => {
    ctx.dispatch(deleteBook({ id: String((args as any).id ?? '') }));
    ctx.nav.back();
  },
};
```

### 9.3 Bind node events to actions

```ts
bindings: {
  browseList: {
    rowClick: Act('nav.go', { card: 'bookDetail', param: Ev('row.id') }),
  },
  detailView: {
    change: Act('state.setField', {
      scope: 'card',
      path: 'edits',
      key: Ev('field'),
      value: Ev('value'),
    }),
  },
}
```

### 9.4 Pseudocode summary

```text
on widget event(nodeKey, eventName, payload):
  action = card.bindings[nodeKey][eventName]
  resolvedArgs = resolveValueExpr(action.args, { state, params, event: payload })
  executeActionDescriptor(action.type, resolvedArgs)
```

## 10. Full-Flow Example (BookTracker)

The current full flow lives in `packages/engine/src/components/widgets/BookTracker.stories.tsx`.

### 10.1 Home card

Home uses `ui.menu` and exposes app navigation and state mutation actions:

- `📋 Browse Books` -> `Act('nav.go', { card: 'browse' })`
- `🔥 Reading Now` -> `Act('nav.go', { card: 'readingNow' })`
- `📊 Reading Report` -> `Act('nav.go', { card: 'readingReport' })`
- `✅ Mark All Read` -> shared action
- `♻️ Reset Demo Data` -> shared action

### 10.2 Browse and detail

Browse list is pure DSL wiring:

- items: `Sel('books.all', ..., { from: 'shared' })`
- rowClick binding routes to detail with param.

Detail view demonstrates mixed concerns:

- record selected by route param via shared selector.
- local card edits in scoped runtime state (`state.edits`).
- save/status/delete actions delegated to shared domain actions.

### 10.3 Add flow

Form card uses local state (`formValues`, `submitResult`) and shared create action:

- change -> `state.setField` updates scoped form state.
- submit -> shared create action validates/dispatches/reset state.

### 10.4 Report flow

`readingReport` derives sections via shared selector and offers mutation actions to reshape dataset quickly.

This flow is valuable as a runtime smoke test because it exercises:

- navigation,
- selector resolution,
- shared action dispatch,
- local scoped state mutation,
- domain reducer mutation,
- re-render from derived selectors.

## 11. Recommended Authoring Patterns

### 11.1 Keep domain logic in shared actions/selectors

Use shared registries for domain operations touching app slices. Keep card-local actions mostly for composition or UI-only behavior.

### 11.2 Use card scoped state for in-progress UI state

Examples:

- form in-progress values,
- unsaved detail edits,
- transient UI flags/messages.

### 11.3 Use report cards for verification

A report card that summarizes shared state is an effective diagnostics surface during DSL app development.

### 11.4 Keep bindings explicit and node keys stable

Bindings depend on `node.key`. Prefer clear, durable keys (`browseList`, `bookDetailView`, `addBookForm`).

## 12. Common Failure Modes and Fixes

### 12.1 "Action buttons do nothing"

Typical causes:

- action descriptor was accidentally resolved away,
- missing `node.key` or missing `bindings` entry,
- wrong action scope/registry.

Checklist:

- Verify action object still has `{$:'act'}` after resolution.
- Confirm node key exists and binding event matches emitted event.
- Confirm handler exists in expected local/shared registry.

### 12.2 "Computed field function is not callable"

Cause:

- function-valued config got transformed during resolution.

Fix:

- ensure function passthrough in `resolveValueExpr`.

### 12.3 "Selector returns undefined unexpectedly"

Causes:

- wrong `from` scope,
- missing param (`ctx.params.param`),
- precedence overshadowing.

Fix:

- force explicit scope while debugging, then restore `auto` only when clear.

## 13. Testing and Validation Strategy

### 13.1 Build-time checks

- `npm run -s typecheck`
- app builds for impacted workspaces.

### 13.2 Runtime checks

- Storybook shell stories for navigation and mutation flows.
- Regression scripts under ticket `scripts/` for resolver semantics.

### 13.3 Suggested unit test targets

- `resolveValueExpr`:
  - function passthrough
  - non-expression tagged object passthrough (`$:'act'`)
  - `Sel`, `Ev`, `Param` semantics
- scoped state mutation actions (`state.setField`, patch/reset)
- selector precedence and explicit scope behavior

## 14. Migration Recipe for New Apps

When porting an app to CardDefinition DSL:

1. Define card inventory and navigation map.
2. Define shared selectors/actions for domain state.
3. Implement cards using `ui.*` nodes.
4. Bind widget events to `Act(...)` commands.
5. Introduce scoped local state for forms/edits.
6. Add one report or diagnostic card to verify key aggregates.
7. Run story-level smoke paths (home -> list -> detail -> mutate -> back).

## 15. Detailed Reference (Symbol Index)

### 15.1 `packages/engine/src/cards/types.ts`

- `LocalScope`, `SelectorScope`, `ActionScope`
- `ValueExpr`, `SelExpr`, `ParamExpr`, `EvExpr`
- `ActionDescriptor`
- `CardDefinition`, `CardStackDefinition`
- `CardContext`
- `SharedSelectorRegistry`, `SharedActionRegistry`

### 15.2 `packages/engine/src/cards/helpers.ts`

- `Sel`, `Param`, `Ev`, `Act`
- `ui` node factory surface
- `defineCardStack`

### 15.3 `packages/engine/src/cards/runtime.ts`

- `createSelectorResolver`
- `resolveValueExpr`
- `createCardContext`
- `executeActionDescriptor`
- `executeCommand`

### 15.4 `packages/engine/src/cards/runtimeStateSlice.ts`

- scoped state reducers/selectors
- default initialization and merged state selection helpers

### 15.5 `packages/engine/src/components/shell/HyperCardShell.tsx`

- runtime wiring and shell lifecycle
- `ensureCardRuntime` integration
- event emission, command execution, and expression resolution hookup

### 15.6 `packages/engine/src/components/shell/CardRenderer.tsx`

- node interpreter for widget components
- event emission contract
- action payload handling paths

### 15.7 `packages/engine/src/components/widgets/BookTracker.stories.tsx`

- practical end-to-end reference stack
- full app story path: `Shell Full App (CardDefinition DSL)`

## 16. Appendix: Quick Recipes

### A. Editable detail card

```ts
ui: ui.detail({
  key: 'detail',
  record: Sel('books.byParam', undefined, { from: 'shared' }),
  fields: FIELDS,
  edits: Sel('state.edits'),
  actions: [
    { label: 'Save', action: Act('books.save', { id: Sel('books.paramId', undefined, { from: 'shared' }), edits: Sel('state.edits') }, { to: 'shared' }) },
  ],
}),
bindings: {
  detail: {
    change: Act('state.setField', { scope: 'card', path: 'edits', key: Ev('field'), value: Ev('value') }),
  },
}
```

### B. Form card with local values and shared submit

```ts
state: { initial: { formValues: { title: '', author: '' }, submitResult: '' } },
ui: ui.form({
  key: 'createForm',
  fields: FORM_FIELDS,
  values: Sel('state.formValues'),
  submitResult: Sel('state.submitResult'),
}),
bindings: {
  createForm: {
    change: Act('state.setField', { scope: 'card', path: 'formValues', key: Ev('field'), value: Ev('value') }),
    submit: Act('books.create', { values: Ev('values') }, { to: 'shared' }),
  },
}
```

### C. Report card from derived selectors

```ts
ui: ui.report({
  key: 'summary',
  sections: Sel('books.reportSections', undefined, { from: 'shared' }),
  actions: [
    { label: 'Reset', action: Act('books.resetDemo', undefined, { to: 'shared' }) },
  ],
})
```

## 17. Final Notes

The CardDefinition DSL is intentionally small: a compact expression language, a single action descriptor shape, and a scope-aware runtime. Its leverage comes from disciplined composition:

- keep data derivation in selectors,
- keep domain mutations in shared actions,
- keep ephemeral UI state scoped locally,
- keep card wiring declarative through `ui.*` + `bindings`.

If those boundaries remain clear, the DSL stays predictable, testable, and easy to evolve.
