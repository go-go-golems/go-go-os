---
Title: CardDefinition Scoped State Architecture (Card + Background + Stack + Global)
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
    - Path: apps/inventory/src/domain/stack.ts
      Note: Representative stack/cards source to migrate into scoped CardDefinition model.
    - Path: apps/todo/src/domain/stack.ts
      Note: Second app migration target for scoped state behavior validation.
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Shell integration point where scoped runtime context will be threaded.
    - Path: packages/engine/src/dsl/types.ts
      Note: Current CardDefinition union baseline and naming anchor for new CardDefinition runtime contract.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/04-carddefinition-state-scope-simulation.mjs
      Note: Prototype demonstrating scope merge and action resolution precedence.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/sources/local/js-ui-dsl.md
      Note: Source sketch adapted from ScreenDefinition to CardDefinition architecture.
ExternalSources:
    - local:js-ui-dsl.md
Summary: State management architecture for CardDefinition with local scoped state plus scoped shared Redux state/actions.
LastUpdated: 2026-02-13T10:35:00-05:00
WhatFor: Define how to evolve the DSL/runtime from ScreenDefinition to CardDefinition with HyperCard-like scope hierarchy and reusable shared state/actions.
WhenToUse: Use when implementing scoped state runtime and authoring cards that combine local state with shared Redux domain data.
---


# CardDefinition Scoped State Architecture (Card + Background + Stack + Global)

## Executive Summary

This document updates the migration direction from `ScreenDefinition` to `CardDefinition` and defines a scoped state/action/selector architecture inspired by HyperCard layers: **background + card + stack + global**, with additional **cardType scope** and explicit bridge to **shared Redux domain state**.

The design goal is to make cards flexible and composable:

- cards can have their own state,
- card state is queryable via selectors,
- cards can run local actions to update local scoped state,
- cards can opt into shared Redux selectors/actions,
- shared selectors/actions are reusable from any card through scoped registries.

No backward compatibility is required. This is a full replacement model.

---

## 1) Why This Change Is Necessary

The prior sketch introduced strong runtime ideas (`UI AST`, `bindings`, `actions`, `preview`, runtime updates) but used `ScreenDefinition` and left scoped state strategy under-specified.

For this codebase, we need richer state semantics because cards are not flat pages. They need:

- local UI behavior state (filters, edit buffers, toggles, pagination, selection),
- shared behavior state (inventory records, tasks, nav state),
- reusable shared selectors/actions that remain easy to reason about.

HyperCard-like layering is a natural fit:

- `global`: app-wide preferences/flags
- `stack`: stack-level state
- `background`: shared among related cards
- `cardType`: reusable defaults/behavior for all cards of same type
- `card`: specific card instance state
- `shared`: existing domain Redux slices (inventory, tasks, sales, etc.)

---

## 2) Core Model Shift: `CardDefinition` (not `ScreenDefinition`)

### 2.1 Canonical Type

```ts
type CardDefinition = {
  id: string;
  type: string; // menu, list, detail, form, report, chat, custom
  ui: UINode;

  // behavior
  bindings?: CardBindings;
  actions?: ScopedActionRegistry;
  selectors?: ScopedSelectorRegistry;

  // new: card-local state contract
  state?: {
    initial?: Record<string, unknown>;
    schema?: unknown; // optional runtime validation schema (zod/json-schema/etc.)
  };

  meta?: Record<string, unknown>;
};
```

Key change: `CardDefinition` is now the top-level authoring unit and includes local state semantics.

### 2.2 Terminology

- `Local scoped state`: runtime-managed state in `hypercardRuntime` slice.
- `Shared state`: domain state in existing Redux slices.
- `Scoped selectors/actions`: handlers resolved by explicit scope precedence.
- `Shared bridge`: selector/action registrations backed by domain Redux slices.

---

## 3) State Hierarchy and Scope Semantics

### 3.1 Scope Levels

Read/write scopes:

- `card`
- `cardType`
- `background`
- `stack`
- `global`
- `shared` (read/write via domain action bridges)

### 3.2 Read Merge Precedence

Recommended selector read merge (highest to lowest):

1. `card`
2. `cardType`
3. `background`
4. `stack`
5. `global`

This means card-specific values override broader defaults.

### 3.3 Write Target Rules

Actions must declare a target scope explicitly (except shared bridges):

- local scope writes: `card`/`cardType`/`background`/`stack`/`global`
- shared writes: dispatch to domain Redux reducers via registered shared handlers

No implicit cross-scope writes.

### 3.4 Redux State Shape

```ts
interface HypercardRuntimeState {
  global: Record<string, unknown>;
  stacks: Record<string, {
    state: Record<string, unknown>;
    backgrounds: Record<string, { state: Record<string, unknown> }>;
    cardTypes: Record<string, { state: Record<string, unknown> }>;
    cards: Record<string, {
      state: Record<string, unknown>;
      type: string;
      backgroundId?: string;
    }>;
  }>;
}
```

Store composition:

```text
Redux Root
  ├─ hypercardRuntime   (new scoped local state)
  ├─ navigation         (existing)
  ├─ notifications      (existing)
  └─ domain slices      (inventory/tasks/sales/chat/...)
```

---

## 4) Selector System Design

### 4.1 Selector Descriptor

Replace generic `Sel(name, args)` with scope-aware selector descriptors:

```ts
type SelExpr = {
  $: 'sel';
  name: string;
  args?: ValueExpr;
  from?: 'card' | 'cardType' | 'background' | 'stack' | 'global' | 'shared' | 'auto';
};
```

`from: 'auto'` (default) means runtime resolves in precedence order.

### 4.2 Selector Resolution Algorithm

```text
resolveSelector(name, from, context):
  if from == shared:
    call sharedSelectorRegistry[name](rootState, args, ctx)
  else if from is explicit local scope:
    call local scoped registry for that scope
  else (auto):
    try local scope registries by precedence (card -> cardType -> background -> stack -> global)
    if not found, try shared registry
```

### 4.3 Shared Selector Reuse

Shared selectors are globally registered by namespace and looked up directly:

- `inventory.*`
- `sales.*`
- `tasks.*`
- `prefs.*`

Recommendation:

- keep selector names namespaced and stable,
- require registration at runtime bootstrap,
- warn on missing selectors in dev mode.

---

## 5) Action System Design

### 5.1 Action Descriptor

```ts
type ActionDescriptor = {
  $: 'act';
  type: string;
  args?: ValueExpr;
  to?: 'card' | 'cardType' | 'background' | 'stack' | 'global' | 'shared' | 'auto';
};
```

`to` defaults to `auto` for local registry resolution order.

### 5.2 Action Handler Lookup Precedence

Recommended order:

1. `card.actions`
2. `cardType.actions`
3. `background.actions`
4. `stack.actions`
5. `global runtime actions`
6. `shared action bridge`

This preserves override power at the most local level.

### 5.3 Local State Update Actions

Provide first-class built-ins for scoped state mutation:

- `state.set`
- `state.patch`
- `state.merge`
- `state.reset`

Built-in payload shape:

```ts
type StateMutationArgs = {
  scope: 'card' | 'cardType' | 'background' | 'stack' | 'global';
  path: string; // dot path in scoped state
  value?: unknown;
  patch?: Record<string, unknown>;
};
```

This keeps simple state changes declarative and avoids requiring custom handlers for every form field.

### 5.4 Shared Action Reuse

Shared actions are registered centrally and resolved by namespaced type:

```ts
sharedActions.register('inventory.updateQty', (ctx, args) => {
  ctx.dispatch(updateQty(args));
});
```

---

## 6) Card/Background/Stack/Global Composition

### 6.1 Definition Graph

```text
StackDefinition
  ├─ global defaults
  ├─ backgrounds
  │   └─ background actions/selectors/state defaults
  ├─ cardType profiles
  │   └─ type-level actions/selectors/state defaults
  └─ cards
      └─ CardDefinition (id/type/background binding + local overrides)
```

### 6.2 Suggested Types

```ts
type BackgroundDefinition = {
  id: string;
  state?: ScopedStateInit;
  actions?: ScopedActionRegistry;
  selectors?: ScopedSelectorRegistry;
};

type CardTypeProfile = {
  type: string;
  state?: ScopedStateInit;
  actions?: ScopedActionRegistry;
  selectors?: ScopedSelectorRegistry;
};

type StackDefinition = {
  id: string;
  global?: {
    state?: ScopedStateInit;
    actions?: ScopedActionRegistry;
    selectors?: ScopedSelectorRegistry;
  };
  backgrounds?: Record<string, BackgroundDefinition>;
  cardTypes?: Record<string, CardTypeProfile>;
  cards: Record<string, CardDefinition>;
};
```

---

## 7) Runtime Context Contract

### 7.1 Render/Action Context

```ts
type CardContext = {
  stackId: string;
  cardId: string;
  cardType: string;
  backgroundId?: string;
  mode: 'interactive' | 'preview';
  params: Record<string, string>;

  getState: () => RootState;
  dispatch: AppDispatch;

  // scoped state helpers
  getScopedState: (scope: LocalScope) => Record<string, unknown>;
  setScopedState: (scope: LocalScope, path: string, value: unknown) => void;

  // navigation
  nav: { go(card: string, param?: string): void; back(): void };
};
```

### 7.2 Why Keep Local State in Redux

Benefits:

- predictable behavior + time-travel/debugging,
- no hidden mutable state in renderer widgets,
- selectors stay pure and testable,
- scoped state can be inspected and reset centrally.

Use ephemeral React local state only for transient input latency optimization (optional), syncing through scoped actions.

---

## 8) Shared Registry and Safety Model

### 8.1 Problem

If shared selectors/actions are unmanaged, coupling and accidental naming conflicts spread quickly.

### 8.2 Solution

Use namespaced shared registries with explicit bootstrap registration:

- selectors registered under stable namespaces (`inventory.*`, `tasks.*`, ...)
- actions registered under stable namespaces (`inventory.*`, `nav.*`, ...)
- dev-mode warnings for missing/duplicate registrations
- optional strict mode: throw on unresolved shared selector/action

### 8.3 Auditability

Add runtime logging hook:

- selector/action attempted,
- resolved scope,
- cardId/cardType,
- handler source.

This is crucial for diagnosing scope bugs.

---

## 9) Pseudocode: End-to-End Resolution

### 9.1 Selector Resolution

```ts
function resolveSel(expr: SelExpr, ctx: CardContext): unknown {
  const args = resolveValue(expr.args, ctx);
  const from = expr.from ?? 'auto';

  if (from !== 'auto') {
    return runSelectorInScope(from, expr.name, args, ctx);
  }

  for (const scope of ['card', 'cardType', 'background', 'stack', 'global']) {
    const result = runSelectorInScope(scope, expr.name, args, ctx, { soft: true });
    if (result.found) return result.value;
  }

  return sharedSelectors[expr.name]?.(ctx.getState(), args, ctx);
}
```

### 9.2 Action Dispatch

```ts
function dispatchCardAction(action: ActionDescriptor, ctx: CardContext) {
  const args = resolveValue(action.args, { ...ctx, event: currentEvent });
  const target = action.to ?? 'auto';

  if (target === 'shared') {
    sharedActions[action.type]?.(ctx, args);
    return;
  }

  const ordered = target === 'auto'
    ? ['card', 'cardType', 'background', 'stack', 'global']
    : [target];

  for (const scope of ordered) {
    const handler = scopedActions[scope]?.[action.type];
    if (handler) {
      handler(ctx, args);
      return;
    }
  }

  sharedActions[action.type]?.(ctx, args);
}
```

---

## 10) Example: Sales Card with Local + Shared State

```ts
const SalesTodayCard: CardDefinition = {
  id: 'salesToday',
  type: 'list',
  state: {
    initial: {
      selectedDate: 'All',
      sortBy: 'date',
    },
  },
  ui: ui.screen({
    id: 'salesToday',
    title: 'Sales Today',
    body: [
      ui.select({
        key: 'dateFilter',
        value: { $: 'sel', name: 'selectedDate', from: 'card' },
        options: { $: 'sel', name: 'sales.dateOptions', from: 'shared' },
      }),
      ui.table({
        key: 'salesTable',
        rows: {
          $: 'sel',
          name: 'sales.rowsForDate',
          from: 'shared',
          args: { date: { $: 'sel', name: 'selectedDate', from: 'card' } },
        },
      }),
    ],
  }),
  bindings: {
    dateFilter: { change: Act('state.set', { scope: 'card', path: 'selectedDate', value: Ev('value') }) },
    salesTable: { rowClick: Act('nav.goItem', { sku: Ev('row.sku') }, { to: 'shared' }) },
  },
  actions: {
    // optional local overrides
  },
};
```

---

## 11) Migration Strategy from Previous Proposal

### 11.1 Rename and Contract Changes

- replace all `ScreenDefinition` references with `CardDefinition`
- replace `runtime.registerScreen` -> `runtime.registerCard`
- replace `screenId` argument names -> `cardId`

### 11.2 New Engine Artifacts

Add:

- `packages/engine/src/dsl/cardTypes.ts`
- `packages/engine/src/runtime/scopedStateSlice.ts`
- `packages/engine/src/runtime/scopeResolver.ts`
- `packages/engine/src/runtime/cardRuntime.ts`

Refactor:

- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/index.ts` exports

### 11.3 App Integration Updates

- convert existing app stack/card sources to `CardDefinition`
- define `cardTypes` and `backgrounds` profiles
- register shared selector/action bridges per domain (`inventory`, `tasks`, `sales`)

---

## 12) Tricky Parts and Recommended Solutions

### 12.1 Multiple Open Instances of Same Card

Risk: `cardId` alone may collide when same card opens with different params.

Recommendation:

- add optional `instanceId` keyed by navigation entry,
- keep scope identity as `{ stackId, cardId, instanceId? }`.

### 12.2 State Lifecycle and Cleanup

Need predictable cleanup when cards unmount/pop.

Recommendation:

- config flag per card:
- `persistLocalState: 'session' | 'stack' | 'always' | 'none'`
- cleanup hook on navigation pop.

### 12.3 Shared Registry Drift

Shared selector/action naming and registration can become inconsistent.

Recommendation:

- maintain namespace vocabulary + lint checks,
- include missing/duplicate registration logs in dev mode.

### 12.4 Selector Name Collisions

Local and shared selectors can share names.

Recommendation:

- enforce namespace prefixes:
- local default selectors: `local.*`
- shared selectors: `inventory.*`, `tasks.*`, etc.

---

## 13) Testing Strategy

### 13.1 Unit Tests

- scope merge precedence (`card > cardType > background > stack > global`)
- scoped mutation actions (`state.set/patch/merge/reset`)
- shared selector/action registration and resolution checks
- action resolution precedence with overrides

### 13.2 Integration Tests

- one card updates card-local filter while shared rows update from domain state
- two cards of same type share `cardType` defaults but keep distinct `card` state
- background-scoped state shared across multiple cards

### 13.3 Prototype Evidence in Ticket

- `scripts/04-carddefinition-state-scope-simulation.mjs`
- `scripts/04-carddefinition-state-scope-simulation.out.txt`

This simulation validates scope merge and action dispatch resolution for all core scopes.

---

## 14) Recommended Implementation Sequence

1. Introduce `CardDefinition` contracts and rename runtime APIs.
2. Add `hypercardRuntime` scoped state slice and reducers.
3. Implement scope resolver and shared registry resolver.
4. Implement scoped selector/action registries (local + shared bridge).
5. Migrate one vertical flow (todo list/detail/form) to prove model.
6. Migrate inventory + chat/report flows with background/cardType reuse.
7. Remove old DSL artifacts and finalize docs/tests.

---

## 15) Bottom Line

The best state-management design for flexible cards is a **two-lane model**:

- lane A: scoped local state (`card/cardType/background/stack/global`) in a dedicated runtime Redux slice,
- lane B: shared domain Redux state/actions through namespaced shared registries.

With `CardDefinition` as the primary authoring unit and scoped resolution rules enforced by runtime, we get HyperCard-style composability without sacrificing Redux clarity, testability, or reuse discipline.
