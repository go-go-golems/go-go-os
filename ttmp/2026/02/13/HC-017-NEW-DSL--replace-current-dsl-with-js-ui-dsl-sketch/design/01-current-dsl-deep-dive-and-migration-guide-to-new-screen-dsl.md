---
Title: Current DSL Deep Dive and Migration Guide to New Screen DSL
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
      Note: Representative old DSL usage with all card types and ai intent blocks.
    - Path: apps/todo/src/domain/stack.ts
      Note: Second app migration target with list/detail/form patterns.
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Primary shell integration point that will host new runtime renderer.
    - Path: packages/engine/src/dsl/resolver.ts
      Note: Current limited resolver to be superseded by Sel/Param/Ev resolver.
    - Path: packages/engine/src/dsl/types.ts
      Note: Current card-type DSL contracts being replaced.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/02-runtime-update-semantics.mjs
      Note: Prototype runtime semantics used to validate update behavior and preview mode.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/sources/local/js-ui-dsl.md
      Note: Imported new DSL source spec that drives target architecture.
ExternalSources:
    - local:js-ui-dsl.md
Summary: Full replacement plan for moving from card-type DSL to AST+bindings screen DSL with Redux-backed selectors.
LastUpdated: 2026-02-13T10:12:00-05:00
WhatFor: Guide engineers through a no-backwards-compat migration from current HyperCard DSL to the new UI AST runtime model.
WhenToUse: Use when implementing HC-017 and reviewing architecture, sequencing, and risks.
---


# Current DSL Deep Dive and Migration Guide to New Screen DSL

## Executive Summary

This document proposes a full replacement of the current HyperCard DSL with the new screen DSL sketch imported from `/tmp/js-ui-dsl.md` (now in `sources/local/js-ui-dsl.md`). The migration explicitly does **not** preserve backwards compatibility.

The current system is a card-type schema (`menu`/`list`/`detail`/`form`/`report`/`chat`) interpreted by app-specific React override functions. Behavior is partly declarative (actions in card JSON) and partly imperative (custom code in override components). Selector usage is narrow and pre-flattened (`domainData`) rather than expression-based. The new sketch is a stronger model: UI AST + expression resolution + event bindings + action registries + runtime updates + preview mode.

The key architectural move is to install a runtime in `@hypercard/engine` that can:

- render AST nodes in React,
- resolve `Sel(...)` against **full Redux state**,
- route events through `bindings[nodeKey][eventName]`,
- dispatch to screen-local/global action handlers,
- update UI/bindings/actions at runtime atomically.

---

## 1) Current DSL, In Depth (What Exists Today)

### 1.1 Core Data Model

The current DSL is defined in `packages/engine/src/dsl/types.ts` as a discriminated union of **card types**. The primary object graph is:

- `Stack` (`name`, `icon`, `settings`, `data`, `cards`, optional `ai`)
- `cards: Record<string, CardDefinition>`
- `CardDefinition` variants:
- `MenuCardDef`
- `ListCardDef`
- `DetailCardDef`
- `FormCardDef`
- `ReportCardDef`
- `ChatCardDef`

Actions are open-ended `{ type: string; ... }` with three built-ins handled centrally:

- `navigate`
- `back`
- `toast`

These are dispatched by `dispatchDSLAction` in `packages/engine/src/app/dispatchDSLAction.ts`.

### 1.2 Runtime Flow and Control Boundaries

Current runtime/control flow looks like this:

```text
Stack (apps/*/src/domain/stack.ts)
  -> HyperCardShell (packages/engine/src/components/shell/HyperCardShell.tsx)
    -> CardRenderer
      -> app custom renderer by card type (apps/*/src/overrides/*.tsx)
        -> engine widgets (ListView, FormView, DetailView, etc.)
          -> onAction/onRowClick callbacks
            -> ctx.dispatch (DSLAction)
              -> dispatchDSLAction
                -> built-ins OR domainActionHandler
                  -> Redux slice action creators
```

Important boundary: there is no generic engine-level interpreter for per-widget events. Most behavior is embedded in custom renderer code.

### 1.3 Where Data Comes From

The shell consumes:

- static stack data (`stack.data`)
- optional `domainData` from selectors (e.g. `selectInventoryDomainData`)

`domainData` is prepared with `defineSelectorRegistry` + `selectDomainData` (`packages/engine/src/api/selectorRegistry.ts`) and merged into `stack.data` inside `HyperCardShell`.

This means current "selectors" are not inline DSL expressions; they are pre-projected arrays keyed by table names.

### 1.4 Current Expression Capability

`packages/engine/src/dsl/resolver.ts` supports only small string-token substitution:

- `$settings.*`
- `$input`
- `$match`

and filtering via `matchFilter`. This is used mostly in list pre-filtering and chat intent logic, not as a general value expression system.

### 1.5 Behavior in Overrides (Imperative and Fragmented)

The current card behavior is split across per-app override files (11 total per audit output):

- `apps/inventory/src/overrides/*.tsx`
- `apps/todo/src/overrides/*.tsx`

Examples of imperative logic currently living in overrides:

- `rowAction` mapping from clicked row -> `paramValue`
- form local state and submit/reset behavior
- special-case "priceCheck" flow in inventory form override
- per-field highlight and computed view logic
- chat intent resolution loop and fallback logic

This fragmentation is a core reason the current DSL feels problematic: semantics are not centralized.

### 1.6 Why the Current DSL is Costly

Main technical pain points:

- Semantic duplication: list/detail/form logic duplicated across apps.
- Weak declarative contract: behavior depends on ad hoc renderer code.
- No first-class event binding graph (`node + event -> command`).
- No preview mode semantics.
- No atomic runtime update model for bindings/actions.
- Selector access is indirect and constrained to precomputed domain tables.

### 1.7 Migration Surface (Measured)

From `scripts/03-current-dsl-gap-audit.out.txt`:

- Card types in active stacks: `menu`, `list`, `detail`, `form`, `report`, `chat`
- Action references include navigation, CRUD domain actions, toast, and `aiSend`
- Resolver primitives used in multiple override files
- Override files exist in both apps and encode substantial behavior

---

## 2) New Screen DSL Sketch, In Depth

Source: `sources/local/js-ui-dsl.md`.

### 2.1 Core Model

The new model pivots from card-type unions to one normalized type:

- `ScreenDefinition = { id, ui, bindings?, actions?, meta? }`

Key pieces:

- `ui`: AST tree (`UINode`) with node type `t`, optional `key`, nested props/children
- `bindings`: mapping of `nodeKey -> eventName -> Command`
- `actions`: registry of action handlers
- value expressions: `Sel`, `Param`, `Ev`

### 2.2 Expression and Event Semantics

`resolveValue(expr, ctx)` recursively handles:

- primitives
- arrays
- plain objects
- tagged objects:
- `$: "param"` -> route/navigation params
- `$: "event"` -> event payload fields (supports dot-paths like `row.sku`)
- `$: "sel"` -> selector lookup + invocation

Event routing is explicit:

```text
emit(screenId, nodeKey, eventName, payload)
  -> lookup bindings[nodeKey][eventName]
  -> resolve command args with EventContext
  -> dispatch action descriptor
```

### 2.3 Action Handling Model

Handler resolution order is defined:

1. screen-local actions (`screen.actions[type]`)
2. runtime global actions (`runtime.actions[type]`)

This gives local override semantics without scattering behavior across component files.

### 2.4 Preview and Runtime Update Semantics

Two major capabilities missing today but required in the new sketch:

- `mode: "preview"` where render works but interaction side effects are ignored
- atomic runtime updates to screen definitions:
- `updateScreen`
- `updateBindings`
- `updateActions`
- `updateAction`

This is exactly the right substrate for authoring tools and live updates.

### 2.5 Widget Vocabulary

Required v0.1 widgets include:

- `screen`, `toolbar`, `iconButton`, `button`, `select`, `table`, `form`, `field`, `input`, `kvTable`, `row`, `text`, `money`, `spacer`

This is intentionally lean and maps reasonably well to existing engine widgets.

---

## 3) Old vs New: Structural Gap Analysis

### 3.1 Conceptual Shift

Current:

- "Card type chooses renderer"
- data/behavior split across JSON + app code

Target:

- "UI AST + bindings + actions define behavior graph"
- renderer is generic adapter

### 3.2 Feature Mapping

| Current concept | New equivalent | Notes |
|---|---|---|
| `CardDefinition` union | `ScreenDefinition` | Replace entire type system |
| `rowAction` special field | table binding (`rowClick`) | removes hard-coded row param plumbing |
| `submitAction` special field | form/input binding (`press`/`submit`) | generic command semantics |
| `ctx.data[table]` in overrides | `Sel("...")` expressions | selector registry now first-class |
| custom renderer behavior | screen-local `actions` + generic adapter | concentrate semantics in runtime |
| ad hoc resolver (`$settings/$input/$match`) | recursive `resolveValue` with `Sel/Param/Ev` | broader and composable |

### 3.3 Known Mismatches to Plan For

- Existing `report` and `chat` cards are higher-order patterns, not single widgets in v0.1 list.
- Existing `ai` intent block on `Stack` is separate from screen AST.
- Some behavior currently depends on local React state in override components.

Recommendation: treat `chat` and `report` as composed screens (or extension widgets) in phase 2, not blockers for runtime foundation.

---

## 4) Target Architecture for This Repo

### 4.1 High-Level Shape

```text
Redux Store (single source of truth)
  -> ScreenRuntime (engine, framework-neutral core)
    -> React adapter (widget mapping + emit wiring)
      -> HyperCardShell (navigation/layout chrome)
        -> ScreenDefinition registry (inventory/todo app screens)
```

### 4.2 Redux Selector Access (Required)

Selectors must receive full store state:

```ts
type SelectorFn = (state: RootState, args: any, ctx: RenderContext) => any;
```

Runtime needs `getState` plumbed in, not only preselected `domainData`.

Proposed contract:

```ts
interface RuntimeEnv<TState> {
  getState: () => TState;
  dispatch: AppDispatch;
  nav: { go(card: string, param?: string): void; back(): void };
}
```

Then selector resolution uses `env.getState()` at evaluation time.

### 4.3 Proposed New Engine Modules

Create (or equivalent naming):

- `packages/engine/src/dsl/screenTypes.ts`
- `packages/engine/src/dsl/expr.ts`
- `packages/engine/src/runtime/UIRuntime.ts`
- `packages/engine/src/runtime/resolveValue.ts`
- `packages/engine/src/runtime/executeCommand.ts`
- `packages/engine/src/runtime/ReactScreenRenderer.tsx`
- `packages/engine/src/runtime/widgetAdapter.tsx`

Retire (after cutover):

- `packages/engine/src/dsl/types.ts`
- `packages/engine/src/dsl/resolver.ts`
- `packages/engine/src/app/dispatchDSLAction.ts`
- app-specific card override files

### 4.4 HyperCardShell Refactor Target

Today `HyperCardShell` obtains `cardDef` and calls `CardRenderer`.

After migration:

- current navigation still decides active screen id and params
- shell passes runtime + active screen id to a generic screen renderer
- `dslDispatch`/`domainActionHandler` model replaced by runtime action registry model

Pseudo flow:

```ts
const state = useStore().getState();
runtime.registerSelectors(domainSelectors);
runtime.registerActions(globalActionHandlers);
runtime.registerScreen(screenDefs[current.card]);

return <ReactScreenRenderer runtime={runtime} screenId={current.card} params={{ card: current.card, param: current.param }} />;
```

---

## 5) Concrete Integration Design

### 5.1 Runtime Core Pseudocode

```ts
class UIRuntime<TState> {
  screens: Map<string, ScreenDefinition>
  selectors: SelectorRegistry<TState>
  globalActions: ActionRegistry
  mode: 'interactive' | 'preview'

  constructor(env: RuntimeEnv<TState>) { ... }

  emit(screenId, nodeKey, eventName, payload) {
    if (this.mode === 'preview') return;
    const cmd = this.screens.get(screenId)?.bindings?.[nodeKey]?.[eventName];
    if (!cmd) return;
    this.executeCommand(screenId, cmd, { eventName, payload });
  }

  executeCommand(screenId, cmd, event) {
    if (cmd.$ !== 'act') return;
    const state = this.env.getState();
    const args = resolveValue(cmd.args, { state, selectors: this.selectors, event, params: this.currentParams });
    this.dispatch(screenId, { type: cmd.type, args });
  }

  dispatch(screenId, action) {
    const local = this.screens.get(screenId)?.actions?.[action.type];
    const global = this.globalActions[action.type];
    const handler = local ?? global;
    if (!handler) return;
    handler(this.actionContext(screenId), action.args);
  }
}
```

### 5.2 React Adapter Pseudocode

```ts
function renderNode(node: UINode, runtime: UIRuntime, screenId: string): ReactNode {
  const props = resolveProps(node, runtime.currentRenderContext());

  switch (node.t) {
    case 'button':
      return <Btn onClick={() => runtime.emit(screenId, node.key!, 'press', {})}>{props.label}</Btn>;
    case 'select':
      return <select value={props.value} onChange={(e) => runtime.emit(screenId, node.key!, 'change', { value: e.target.value })}>...</select>;
    case 'table':
      return <DataTable items={props.rows} columns={props.columns} onRowClick={(row, rowIndex) => runtime.emit(screenId, node.key!, 'rowClick', { row, rowIndex })} />;
    default:
      return <UnsupportedWidget type={node.t} />;
  }
}
```

### 5.3 Action Handler Conventions

Adopt namespaced action types (already aligned with sketch examples):

- `nav.go`, `nav.back`
- `inventory.updateQty`, `inventory.saveItem`, ...
- `tasks.create`, `tasks.save`, ...
- `chat.send`, `analytics.track`, etc.

Bridge existing RTK slice actions inside global action handlers:

```ts
const globalActions = {
  'nav.go': (ctx, { card, param }) => ctx.nav.go(card, param),
  'inventory.updateQty': (ctx, { sku, delta }) => ctx.dispatch(updateQty({ sku, delta })),
};
```

### 5.4 Selector Registry Conventions

Use selector names as stable external API:

- `inventory.items`
- `inventory.itemBySku`
- `sales.log`
- `sales.filterOptions`
- `tasks.list`
- `tasks.byId`

Selectors should be pure and derive from full Redux state.

---

## 6) Example Conversion (List Card -> Screen)

### 6.1 Before (Current Inventory Sales Card)

Source: `apps/inventory/src/domain/stack.ts` + `apps/inventory/src/overrides/ListCardOverride.tsx`.

- card has `dataSource`, `columns`, `filters`, optional `rowAction`
- override computes columns, binds filter UI, maps row click to navigation action

### 6.2 After (New Screen)

```ts
export const salesLogScreen: ScreenDefinition = {
  id: 'salesLog',
  ui: ui.screen({
    id: 'salesLog',
    title: 'Sales Log',
    header: ui.toolbar({
      left: [ui.iconButton({ key: 'back', icon: 'back' })],
      right: ui.text('Sales Log'),
    }),
    body: [
      ui.select({ key: 'dateFilter', value: Sel('sales.selectedDate'), options: Sel('sales.dateOptions') }),
      ui.table({
        key: 'salesTable',
        columns: Sel('sales.columns'),
        rows: Sel('sales.rows', { date: Sel('sales.selectedDate') }),
      }),
    ],
  }),
  bindings: {
    back: { press: Act('nav.back') },
    dateFilter: { change: Act('sales.setDateFilter', { value: Ev('value') }) },
    salesTable: { rowClick: Act('nav.go', { card: 'itemDetail', param: Ev('row.sku') }) },
  },
};
```

No special-case `rowAction` plumbing is needed. Event payload + binding handle it uniformly.

---

## 7) Tricky Parts and Engineering Risks

### 7.1 Form State Ownership

Current form/detail overrides keep local React `useState` edits/values. In new runtime, decide explicitly:

- Option A: keep ephemeral local state in adapter widget components
- Option B: push draft state into Redux slice

Recommendation for v1 migration: Option A for parity, with deterministic `node.key`-scoped state cache in renderer layer.

### 7.2 Selector Re-computation and Render Cost

`Sel(...)` can be nested heavily. Naive recursive resolution on every render can be expensive.

Mitigations:

- memoize resolved props per node using `(screenId, node.key, stateVersion, paramsHash)`
- prefer memoized selectors via Reselect where heavy
- avoid recomputing entire tree when only one branch depends on changed selector

### 7.3 Key Integrity and Binding Drift

Bindings reference keys by string; if UI keys drift, events silently drop.

Hard requirements:

- unique keys within a screen
- validation warning/error for bindings referencing missing keys
- CI test that validates all screen definitions

### 7.4 Async Actions and Update Ordering

`updateBindings/updateActions` + async handlers can create ordering hazards.

Policy:

- updates are atomic replace-by-new-object
- each dispatch observes a single snapshot
- async handlers should avoid mutating runtime registries directly mid-execution

### 7.5 Chat/Report as Non-Core Widgets

v0.1 widget set does not include rich chat/report components by name.

Plan:

- implement `chat` and `report` as composed screens from core widgets in initial migration OR
- define extension widgets in adapter with explicit event contracts

Given timeline, start with adapter extension widgets to preserve UX quickly, then decompose later.

---

## 8) Implementation Plan (No Backwards Compatibility)

### Phase 0: Lock and Inventory

- Freeze old DSL feature changes during migration branch.
- Snapshot current behavior via Storybook scenarios (`sb` tmux session exists) and scripts in ticket.
- Keep migration audit output under ticket scripts.

Exit criteria:

- baseline behavior and migration surface documented.

### Phase 1: Engine Runtime Foundation

- Add new screen types + expression helpers.
- Implement runtime core (`register`, `emit`, `dispatch`, `update*`).
- Implement validation (keys, root node type, dangling bindings).
- Implement preview mode behavior.

Exit criteria:

- runtime unit tests pass for resolution/event/action/update semantics.

### Phase 2: React Adapter and Shell Integration

- Build widget adapter mapping AST node types to existing widgets.
- Replace `CardRenderer` usage in `HyperCardShell` with `ReactScreenRenderer`.
- Pass `getState` from Redux store so selectors read full state.

Exit criteria:

- shell renders at least one migrated screen interactively and in preview.

### Phase 3: App Migration (Inventory, Todo)

- Rewrite `apps/*/src/domain/stack.ts` into screen definition modules.
- Replace per-card overrides with screen-specific actions/selectors.
- Register global and/or per-screen action handlers.

Exit criteria:

- all current app flows run on new screen DSL.

### Phase 4: Cleanup and Deletion

- Delete old DSL types/resolver/dispatch utilities.
- Delete old override files and card renderer routing.
- Update barrel exports in `packages/engine/src/index.ts`.

Exit criteria:

- build compiles without old DSL symbols.

### Phase 5: Hardening and Docs

- Add migration tests and snapshot comparisons.
- Add authoring docs for screen DSL conventions.
- Document extension widget policy and selector naming rules.

Exit criteria:

- maintainers can author new screens without touching runtime internals.

---

## 9) File-by-File Action List

### Engine

1. `packages/engine/src/dsl/types.ts`
- remove old card union types
- replace with screen DSL contracts (or replace import path entirely)

2. `packages/engine/src/dsl/resolver.ts`
- replace with recursive expression resolver supporting `Sel/Param/Ev`

3. `packages/engine/src/app/dispatchDSLAction.ts`
- remove switch-based built-in dispatcher
- move built-ins into global action registry handlers

4. `packages/engine/src/components/shell/HyperCardShell.tsx`
- swap `CardRenderer` integration for runtime-driven renderer
- inject `getState`/`dispatch`/navigation context

5. `packages/engine/src/index.ts`
- export new runtime and DSL helper APIs
- stop exporting obsolete DSL contracts

### Apps

6. `apps/inventory/src/domain/stack.ts`
- replace with screen defs + selector/action registration modules

7. `apps/todo/src/domain/stack.ts`
- same replacement as inventory

8. `apps/inventory/src/overrides/*.tsx` and `apps/todo/src/overrides/*.tsx`
- delete after behavior is represented through bindings/actions/selectors

9. `apps/*/src/app/domainActionHandler.ts`
- migrate registry entries to new global/screen action handler API

10. `apps/*/src/app/domainDataRegistry.ts`
- migrate to selector registry used directly by runtime expression resolver

---

## 10) Validation and Test Strategy

### 10.1 Runtime Unit Tests

Minimum test grid:

- `resolveValue` primitives/arrays/objects
- `Sel` with args, missing selector handling
- `Ev` dot-path payload extraction
- `bindings` routing by nodeKey + eventName
- local-over-global action precedence
- preview mode no-op on emits
- atomic update semantics for bindings/actions

### 10.2 Integration Tests

- render migrated inventory list screen and interact with select/table
- verify navigation action updates navigation slice
- verify selector-driven rows reflect Redux state changes

### 10.3 Storybook Regression Harness

Use stories to compare old/new visual behavior during transition window, then retire old stories post-cutover.

---

## 11) Experiment Evidence Stored in Ticket

Scripts and outputs stored in:

- `scripts/01-resolve-redux-selectors.mjs`
- `scripts/01-resolve-redux-selectors.out.txt`
- `scripts/02-runtime-update-semantics.mjs`
- `scripts/02-runtime-update-semantics.out.txt`
- `scripts/03-current-dsl-gap-audit.sh`
- `scripts/03-current-dsl-gap-audit.out.txt`

What they show:

- selectors can resolve against Redux-shaped state and event payload paths;
- runtime update APIs work for bindings and action overrides;
- current migration surface is broad but bounded and explicit.

---

## 12) Recommended First PR Cut

Keep first PR narrow and architectural:

1. introduce new runtime + expression resolver,
2. migrate one vertical slice (`todo` browse/detail/form),
3. keep inventory on a short-lived branch until second PR,
4. then remove old DSL completely in a dedicated cleanup PR.

This reduces merge risk while still respecting no-backwards-compat as the end state.

