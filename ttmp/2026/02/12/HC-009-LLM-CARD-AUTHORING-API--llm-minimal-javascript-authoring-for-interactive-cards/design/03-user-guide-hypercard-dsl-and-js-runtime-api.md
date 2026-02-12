---
Title: 'User Guide: HyperCard DSL and JS Runtime API'
Ticket: HC-009-LLM-CARD-AUTHORING-API
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/dsl/types.ts
      Note: Canonical DSL type definitions (cards, actions, filters, stack)
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/dispatchDSLAction.ts
      Note: Action dispatch pipeline from DSL action objects to Redux effects
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Runtime orchestration layer (navigation, layout, context merge)
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/CardRenderer.tsx
      Note: Renderer extension contract and fallback behavior
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/actionRegistry.ts
      Note: Registry API for domain action handling
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/selectorRegistry.ts
      Note: Registry API for domain data binding
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts
      Note: Real-world stack example with all current card types
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/overrides/cardRenderers.ts
      Note: Card renderer registration map
Summary: "Comprehensive user guide for authoring and running HyperCard DSL stacks, including architecture, runtime flow, renderer contracts, and registry-based domain integration."
LastUpdated: 2026-02-12T15:00:48-05:00
WhatFor: "Help engineers implement, extend, and debug HyperCard stacks using the current DSL and JS runtime APIs."
WhenToUse: "Use when creating a new stack/app, migrating card behavior, or troubleshooting DSL-to-runtime execution."
---

# User Guide: HyperCard DSL and JS Runtime API

## 1) What This System Is

HyperCard in this repository is a declarative UI runtime where:

- The **DSL stack** declares cards, actions, data sources, settings, and optional AI intents.
- The **engine shell** (`HyperCardShell`) manages navigation, layout, toast notifications, and dispatch plumbing.
- The **app layer** supplies renderer implementations for card types and handles domain actions/state updates.

The key design choice is separation of concerns:

- DSL defines *what* a card does.
- Renderers define *how* it appears/interacts in React.
- Domain handlers define *how* business state mutates.

This means you can evolve UI workflows by editing stack definitions and targeted renderer/domain modules, without rewriting app scaffolding.

## 2) Mental Model and Data Flow

Think of the runtime as a pipeline:

1. `Stack` defines card graph + data tables + settings.
2. `HyperCardShell` resolves current card from navigation state.
3. `CardRenderer` calls the renderer for that card type.
4. User interaction emits a `DSLAction` object.
5. `dispatchDSLAction` routes built-in actions (`navigate`, `back`, `toast`) or forwards to your domain handler.
6. Domain actions update Redux slices, selectors recompute, shell re-renders.

At runtime, card renderers receive a context object:

- `data`: merged from `stack.data` plus app-provided `domainData`
- `settings`: `stack.settings`
- `dispatch`: DSL action dispatcher
- `paramValue`: route-like card parameter from navigation stack

Implementation references:

- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/components/shell/CardRenderer.tsx`
- `packages/engine/src/app/dispatchDSLAction.ts`

## 3) Core DSL Structure

The canonical DSL lives in `packages/engine/src/dsl/types.ts`.

### 3.1 Stack

A `Stack` is the top-level container:

```ts
interface Stack {
  name: string;
  icon: string;
  homeCard: string;
  settings: Record<string, unknown>;
  data: Record<string, Record<string, unknown>[]>;
  cards: Record<string, CardDefinition>;
  ai?: {
    intents: AIIntent[];
    fallback: AIFallback;
  };
}
```

Important behavior notes:

- `cards` keys are card IDs used for navigation.
- `data` is table-like and card renderers access tables by `dataSource` name.
- `homeCard` is semantic metadata, but initial nav state currently starts at `home` in navigation slice (`navigationSlice.ts`). Keep your root card ID as `home` unless you also change nav initialization.

### 3.2 DSL Actions

`DSLAction` is a discriminated union with three built-ins and open-ended domain actions:

- Built-ins:
  - `{ type: 'navigate', card, paramValue? }`
  - `{ type: 'back' }`
  - `{ type: 'toast', message }`
- Domain action:
  - `{ type: string, ...payload }`

The engine handles built-ins directly and forwards unknown types to the domain handler.

### 3.3 Card Types

Current card types:

- `menu`
- `list`
- `detail`
- `form`
- `chat`
- `report`

Each has its own definition shape. Example: `ListCardDef` includes:

- `dataSource`
- `columns`
- optional `filters`
- optional `dataFilter`
- optional `rowAction`
- optional `toolbar`
- optional `footer`

These are declarative inputs. App renderers decide how to realize them in widgets.

### 3.4 Filters and Dynamic Values

`DataFilter` supports operators:

- comparison: `<=`, `>=`, `<`, `>`, `==`, `!=`
- string: `contains`, `iequals`

`resolveValue` allows dynamic references:

- `$settings.<key>`
- `$input`
- `$match`

This is used in list pre-filters and AI intent filters.

Reference:

- `packages/engine/src/dsl/resolver.ts`

## 4) Authoring a Stack: Practical Pattern

The Inventory stack is the best full example:

- `apps/inventory/src/domain/stack.ts`

A recommended authoring sequence:

1. Define `settings` keys you need (thresholds, labels, model names).
2. Define static `data` tables for bootstrapping.
3. Define cards in order of user flow:
   - `home` menu
   - browse/list cards
   - detail cards
   - forms
   - reports/chat
4. Keep action types stable and explicit.
5. Prefer shallow payloads in actions (`id`, `sku`, `status`, `values`, `edits`).

### 4.1 Menu Cards

Use for navigation hubs and quick actions.

Typical shape:

- label fields (title/subtitle)
- button array with DSL actions

Implementation mapping example:

- `apps/inventory/src/overrides/MenuCardOverride.tsx`
- `apps/todo/src/overrides/MenuCardOverride.tsx`

### 4.2 List Cards

Use for browse/search/filter workflows.

Pattern:

- `dataSource` table
- column list
- optional static prefilter (`dataFilter`)
- optional interactive `filters`
- `rowAction` for detail navigation

Implementation mapping:

- `apps/inventory/src/overrides/ListCardOverride.tsx`
- `apps/todo/src/overrides/ListCardOverride.tsx`

### 4.3 Detail Cards

Use for single-record editing and action buttons.

Pattern:

- lookup by `keyField` + `paramValue`
- map DSL fields to form/view fields
- construct button actions by enriching DSL action with current record ID/SKU and pending edits

Implementation mapping:

- `apps/inventory/src/overrides/DetailCardOverride.tsx`
- `apps/todo/src/overrides/DetailCardOverride.tsx`

### 4.4 Form Cards

Use for create/submit flows.

Pattern:

- field definitions (with `required`, `default`, `placeholder`)
- `submitAction`
- renderer submits as `{ ...submitAction, values }`

Implementation mapping:

- `apps/inventory/src/overrides/FormCardOverride.tsx`
- `apps/todo/src/overrides/FormCardOverride.tsx`

### 4.5 Report and Chat Cards

These currently rely on custom logic in renderer overrides:

- Report compute orchestration:
  - `apps/inventory/src/overrides/ReportCardOverride.tsx`
  - `apps/inventory/src/domain/reportCompute.ts`
- Chat orchestration:
  - `apps/inventory/src/overrides/ChatCardOverride.tsx`

These are intentionally flexible escape hatches when generic templates are insufficient.

## 5) How Rendering Is Implemented

### 5.1 No Built-in Card-Type Renderers in Engine

`CardRenderer` in engine does not implement `menu/list/detail/form/...` itself. It delegates to app-supplied renderers and falls back to a warning card if none is registered.

Reference:

- `packages/engine/src/components/shell/CardRenderer.tsx`

Consequences:

- You control visual language and behavior details per app.
- You can gradually add/remove specialized renderers without forking engine shell.

### 5.2 Renderer Registration

You provide a map:

```ts
const renderers: Record<string, CardTypeRenderer> = {
  menu: renderMenuCard,
  list: renderListCard,
  detail: renderDetailCard,
  form: renderFormCard,
  report: renderReportCard,
  chat: renderChatCard,
};
```

Examples:

- `apps/todo/src/overrides/cardRenderers.ts`
- `apps/inventory/src/overrides/cardRenderers.ts`

### 5.3 Widget Layer

Renderers generally adapt DSL definitions into reusable widgets:

- `MenuGrid`, `ListView`, `DetailView`, `FormView`, `ReportView`, `ChatView`
- located in `packages/engine/src/components/widgets/`

This keeps DSL semantics independent of widget implementation details.

## 6) Action Dispatch Pipeline

### 6.1 Built-in Routing

`dispatchDSLAction` behavior:

- `navigate` -> dispatches `navigation/navigate`
- `back` -> dispatches `navigation/goBack`
- `toast` -> dispatches `notifications/showToast`
- default -> forwards to `domainHandler` if present

If a domain action is not handled, it warns in console.

Reference:

- `packages/engine/src/app/dispatchDSLAction.ts`

### 6.2 Navigation Slice

Navigation state:

- `layout`: `split | drawer | cardChat`
- `stack`: card/param history

Actions:

- `navigate({ card, paramValue })`
- `goBack()`
- `setLayout(layout)` resets stack to `home`

References:

- `packages/engine/src/features/navigation/navigationSlice.ts`
- `packages/engine/src/features/navigation/selectors.ts`

### 6.3 Toast Slice

Notifications are intentionally minimal:

- one active toast string
- `showToast`, `clearToast`

References:

- `packages/engine/src/features/notifications/notificationsSlice.ts`
- `packages/engine/src/features/notifications/selectors.ts`

## 7) Domain Action Handling: Registry API (Recommended)

The new recommended pattern is registry-based domain handling.

Reference:

- `packages/engine/src/api/actionRegistry.ts`

### 7.1 API Surface

- `defineActionRegistry(registry)`
- `createDomainActionHandler(registry)`

Each entry can define:

- `actionCreator(payload)`
- optional `mapPayload(action)`
- optional `toast` (string or function)
- optional `effect({ dispatch, action, payload })`

### 7.2 Why This Pattern

It replaces switch boilerplate with declarative per-action entries.

Before (old):

- large `switch(action.type)`
- repeated payload extraction
- repeated toast and side-effect code

After (new):

- one object map keyed by action type
- predictable payload normalization in `mapPayload`
- toast/effect colocated with action mapping

### 7.3 Real Example (Todo)

See:

- `apps/todo/src/app/domainActionHandler.ts`

Example entry:

```ts
deleteTask: {
  actionCreator: deleteTask,
  mapPayload: (action) => ({ id: String((action as any).id ?? '') }),
  effect: ({ dispatch }) => dispatch(goBack()),
  toast: 'Task deleted',
}
```

### 7.4 Real Example (Inventory)

See:

- `apps/inventory/src/app/domainActionHandler.ts`

Inventory demonstrates conditional toast for `receiveStock`:

- payload normalized even for partial/invalid values
- toast only shown when payload is meaningful

This improves resilience to loosely shaped DSL payloads.

## 8) Domain Data Wiring: Selector Registry (Recommended)

Reference:

- `packages/engine/src/api/selectorRegistry.ts`

### 8.1 API Surface

- `defineSelectorRegistry({ key: selector, ... })`
- `selectDomainData(state, registry)`

### 8.2 Why It Exists

It removes repeated app-root selector plumbing.

Instead of:

- multiple `useSelector` calls
- manual `{ items, salesLog, ... }` construction

You use:

- one registry declaration
- one `selectDomainData` call

### 8.3 Example (Inventory)

See:

- `apps/inventory/src/app/domainDataRegistry.ts`
- `apps/inventory/src/App.tsx`

```ts
export const inventoryDomainDataRegistry = defineSelectorRegistry({
  items: selectItems,
  salesLog: selectSalesLog,
});

export const selectInventoryDomainData = (state: InventoryDomainDataState) =>
  selectDomainData(state, inventoryDomainDataRegistry);
```

This object is passed to `HyperCardShell` as `domainData`.

## 9) HyperCardShell Integration Contract

Typical app integration:

```tsx
<HyperCardShell
  stack={STACK as any}
  domainActionHandler={inventoryActionHandler}
  customRenderers={inventoryRenderers}
  domainData={domainData}
  navShortcuts={[...]}
/>
```

What shell does for you:

- keeps navigation and layout state wired
- merges `stack.data` + `domainData`
- builds dispatch function for DSL actions
- passes normalized context to current card renderer
- shows toast component

Reference:

- `packages/engine/src/components/shell/HyperCardShell.tsx`

## 10) End-to-End Walkthrough (Concrete)

Scenario: user clicks `Sell 1` on Inventory detail card.

1. DSL button on `itemDetail` card has action `{ type: 'updateQty', delta: -1 }`.
2. Detail renderer enriches action with `sku` from current record.
3. Renderer calls `ctx.dispatch(action)`.
4. `dispatchDSLAction` sees unknown action type and forwards to domain handler.
5. `inventoryActionRegistry.updateQty.mapPayload` normalizes `{ sku, delta }`.
6. Dispatches Redux action creator `updateQty(payload)`.
7. Inventory slice mutates item quantity.
8. Registry `toast` function emits `-1 qty for <sku>`.
9. Selectors recompute, list/detail reflect new quantity.

All of this happens without imperative page/controller code.

## 11) Testing the DSL Runtime

### 11.1 Baseline Compile Validation

From repo root:

- `npm run typecheck`
- `npm run build -w apps/inventory`
- `npm run build -w apps/todo`

Note: root `npm run build` currently expects a `packages/engine` build script that does not exist.

### 11.2 Runtime Smoke Checklist

Todo app:

- navigate home -> list -> detail
- status buttons update row state
- save/delete/create actions trigger expected toasts
- delete navigates back

Inventory app:

- list filters + row navigation
- detail qty updates and save/delete behavior
- create item and receive stock form flows
- report card renders computed sections
- chat card intent actions navigate correctly

### 11.3 Contract Tests to Add (Recommended)

1. `dispatchDSLAction` built-in routing tests.
2. `createDomainActionHandler` tests:
   - payload mapping
   - effect execution
   - toast behavior
   - unhandled action returns false
3. `selectDomainData` tests for registry key mapping.
4. Renderer tests for row action param forwarding and submit payload shape.

## 12) Implementation Deep Dive

### 12.1 Why DSLAction Is Open-Ended

`GenericDSLAction` keeps domain extensibility unconstrained. Domain apps can define action payloads specific to business logic.

Tradeoff:

- Great flexibility
- Requires explicit payload normalization in registry entries to avoid runtime drift

### 12.2 Why Renderers Live in App Layer

The engine intentionally avoids hardcoding card visual behavior. This preserves:

- domain-specific presentation
- freedom to swap widgets/layout behavior
- ability to keep generic engine core stable

### 12.3 Why Domain Data Is Merged in Shell

Merging `stack.data` and `domainData` in shell keeps card renderers simple:

- renderers read `ctx.data[tableName]`
- they do not need to know which table is static seed data vs dynamic store-derived

### 12.4 Where "DSL" Ends and "Runtime Policy" Begins

DSL defines declarations.
Runtime policy lives in renderers/domain handlers:

- form validation policy
- fallback behavior
- side effects
- formatting/highlighting rules

This boundary is deliberate and should be preserved.

## 13) Authoring Conventions and Best Practices

1. Keep action names verb-based and stable (`createTask`, `saveItem`, `receiveStock`).
2. Normalize payloads in `mapPayload`; do not trust raw card action shape.
3. Keep renderer logic pure where possible; local state should only track editing/session UI state.
4. Use `dataFilter` for static list constraints and `filters` for user-controlled filtering.
5. Keep `paramValue` routing explicit via `rowAction.param` and renderer enrichment.
6. Use selector registry to keep `App.tsx` minimal and consistent.
7. Keep report/chat custom logic in dedicated modules, not mixed into generic list/detail renderers.

## 14) Common Pitfalls and Fixes

### Pitfall: "Card type X has no renderer registered"

Cause:

- card type exists in stack but missing in `customRenderers` map.

Fix:

- register renderer in app override map.

### Pitfall: Domain action logs "Unhandled DSL action type"

Cause:

- no matching entry in action registry.

Fix:

- add registry entry with `actionCreator` and payload mapping.

### Pitfall: Detail card edits are not persisted

Cause:

- button action does not include edit payload when dispatched.

Fix:

- merge local `edits` into dispatched action in detail renderer.

### Pitfall: List row navigation uses wrong param

Cause:

- `rowAction.param` mismatch with row field key.

Fix:

- align DSL `param` with actual row field and renderer param extraction logic.

### Pitfall: Build command confusion at repo root

Cause:

- root build script references missing engine workspace build script.

Fix:

- build apps directly (`-w apps/inventory`, `-w apps/todo`) or add engine build script if needed.

## 15) Migration Notes: Switch Handler -> Registry

If an app still uses switch-based domain handlers:

1. Create action registry object keyed by action type.
2. For each case, move payload extraction into `mapPayload`.
3. Move side effects (for example `goBack`) into `effect`.
4. Move toast strings into `toast`.
5. Replace exported switch handler with `createDomainActionHandler(registry)`.

Done correctly, behavior remains identical and maintenance becomes simpler.

## 16) Minimal Working Blueprint

Use this checklist to stand up a new HyperCard app quickly:

1. Create `domain/stack.ts` with `home`, `browse`, `detail`, `form` cards.
2. Create renderer overrides for those card types.
3. Add domain Redux slice(s) + selectors.
4. Define `domainDataRegistry` via selector registry.
5. Define `domainActionHandler` via action registry.
6. Wire `HyperCardShell` with stack/renderers/domainData/domain handler.
7. Run compile + smoke checks.

## 17) Final Notes

This DSL/runtime architecture is intentionally modular:

- DSL is compact and declarative.
- Runtime shell is stable and generic.
- App layer owns business behavior.

The registry APIs added in HC-009 significantly reduce app glue while preserving flexibility. If you keep action normalization and renderer contracts disciplined, this model scales well to additional card types and domains without increasing framework complexity.
