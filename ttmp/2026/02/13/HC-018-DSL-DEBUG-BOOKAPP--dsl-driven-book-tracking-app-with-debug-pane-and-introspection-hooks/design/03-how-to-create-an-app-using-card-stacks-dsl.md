---
Title: How to Create an App Using Card Stacks DSL
Ticket: HC-018-DSL-DEBUG-BOOKAPP
Status: active
Topics:
    - frontend
    - architecture
    - redux
    - debugging
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/book-tracker-debug/src/app/cardRuntime.ts
      Note: |-
        Shared selector/action wiring between DSL and Redux logic.
        Tutorial explains shared selector/action bridge
    - Path: apps/book-tracker-debug/src/domain/cards
      Note: |-
        Example card-per-file authoring style used in production app.
        Tutorial demonstrates one-card-per-file authoring
    - Path: apps/book-tracker-debug/src/domain/stack.ts
      Note: |-
        Stack assembly entrypoint for a full app.
        Tutorial uses stack assembly as primary composition example
    - Path: apps/book-tracker-debug/src/features/books/booksSlice.ts
      Note: Domain state mutations that shared actions dispatch.
    - Path: packages/engine/src/cards/runtime.ts
      Note: |-
        Selector resolution, action execution, and debug hook internals.
        Tutorial references runtime resolution/execution semantics
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: |-
        Runtime host for stack rendering and action execution.
        Tutorial explains shell hosting and layout modes
ExternalSources: []
Summary: End-to-end tutorial for new developers to build a complete Card Stacks DSL app with Redux integration, navigation, scoped card state, Storybook, and runtime debugging.
LastUpdated: 2026-02-13T12:20:00-05:00
WhatFor: Teach engineers how to design, wire, test, and debug a full application using the CardDefinition/CardStack DSL.
WhenToUse: Use as the canonical onboarding guide when building a new DSL-driven app from scratch.
---


# How to Create an App Using Card Stacks DSL

## 1. Who this guide is for

This guide is for engineers new to this repository who need to build a production-style app using the Card Stacks DSL. It is written as a full path from zero to a complete app profile, not as a narrow API reference.

By the end, you will know how to:

- model domain state in Redux
- expose domain behavior to DSL cards through shared selectors/actions
- define UI cards with CardDefinition DSL widgets
- wire navigation and scoped state
- run in app mode and Storybook mode
- add runtime introspection/debug support

## 2. Mental model first

Before code, understand the architecture layers.

```text
Redux domain state + reducers
        |
        v
Shared selectors/actions (bridge)
        |
        v
CardDefinition DSL (cards + bindings)
        |
        v
HyperCardShell runtime (resolve + execute + navigate)
        |
        v
Widgets + interactions + optional debug pane
```

The important split:

- **Domain layer** owns truth and mutation rules.
- **DSL layer** declares screens/cards and interaction wiring.
- **Runtime layer** evaluates DSL expressions and executes descriptors.

## 3. Repository layout pattern

Recommended app layout (mirrors `apps/book-tracker-debug`):

```text
apps/<app-name>/src/
  app/
    store.ts
    cardRuntime.ts
  domain/
    stack.ts
    cards/
      <one card file per card>
      common.ts
      index.ts
    types.ts
  features/
    <feature>/
      <feature>Slice.ts
      selectors.ts
  debug/
    debugSlice.ts
    useRuntimeDebugHooks.ts
    DebugPane.tsx
  stories/
    <App>.stories.tsx
  App.tsx
  main.tsx
```

## 4. Step-by-step build

## 4.1 Step A: create domain types and Redux slice

Start with real domain data. For a book tracker:

- `Book` type
- `BooksStateSlice`
- reducers: create/save/delete/setStatus/reset

Example symbols:

- `apps/book-tracker-debug/src/domain/types.ts`
- `apps/book-tracker-debug/src/features/books/booksSlice.ts`

Design tips:

- Keep IDs stable and serializable.
- Keep reducers pure and small.
- Put derivations in selectors, not reducers.

## 4.2 Step B: create app store

Wire engine reducers + domain reducers:

```ts
configureStore({
  reducer: {
    hypercardRuntime: hypercardRuntimeReducer,
    navigation: navigationReducer,
    notifications: notificationsReducer,
    books: booksReducer,
    debug: debugReducer, // optional but recommended
  }
})
```

Reference: `apps/book-tracker-debug/src/app/store.ts`

## 4.3 Step C: create shared selectors and actions bridge

This is the bridge from DSL to domain behavior.

Shared selectors expose queryable data to DSL expressions:

- `books.all`
- `books.byParam`
- `books.reportSections`

Shared actions expose mutating behavior:

- `books.save`
- `books.create`
- `books.delete`

Reference: `apps/book-tracker-debug/src/app/cardRuntime.ts`

Pseudo-structure:

```ts
export const sharedSelectors = {
  'entity.list': (state) => ...,
  'entity.byParam': (state, _args, ctx) => ...ctx.params.param...
}

export const sharedActions = {
  'entity.save': (ctx, args) => ctx.dispatch(slice.actions.save(...)),
  'entity.create': (ctx, args) => ctx.dispatch(slice.actions.create(...))
}
```

## 4.4 Step D: define card modules (one file per card)

Use one file per card for maintainability.

Example files:

- `domain/cards/homeCard.ts`
- `domain/cards/browseCard.ts`
- `domain/cards/bookDetailCard.ts`
- `domain/cards/addBookCard.ts`

Common field/column/filter definitions go in:

- `domain/cards/common.ts`

Why this split matters:

- easier reviews
- fewer merge conflicts
- card ownership is obvious
- supports card-level evolution cleanly

## 4.5 Step E: assemble stack in one place

`domain/stack.ts` should be composition-only:

```ts
export const STACK = defineCardStack({
  id: 'bookTrackerDebug',
  homeCard: 'home',
  cards: {
    home: homeCard,
    browse: browseCard,
    detail: detailCard,
    add: addCard,
  }
})
```

Keep business logic out of this file; put behavior in card modules or shared bridge.

## 4.6 Step F: bind events and scoped card state

Bindings connect widget events to action descriptors.

Example (`bookDetail`):

- event: `change`
- command: `state.setField`
- target: `card` scope path `edits`

```ts
bindings: {
  bookDetailView: {
    change: Act('state.setField', {
      scope: 'card',
      path: 'edits',
      key: Ev('field'),
      value: Ev('value')
    })
  }
}
```

This pattern gives you form-style local draft edits without immediately mutating domain state.

## 4.7 Step G: host stack in `HyperCardShell`

In `App.tsx`, pass stack + shared bridge:

```tsx
<HyperCardShell
  stack={BOOK_STACK}
  sharedSelectors={bookSharedSelectors}
  sharedActions={bookSharedActions}
  navShortcuts={[...]}
/>
```

For debug-first apps, enable debug-pane mode:

```tsx
<HyperCardShell
  layoutMode="debugPane"
  renderDebugPane={() => <DebugPane />}
  ...
/>
```

References:

- `apps/book-tracker-debug/src/App.tsx`
- `packages/engine/src/components/shell/HyperCardShell.tsx`

## 4.8 Step H: add runtime debugging

There are three moving parts:

1. **Runtime emitters** in engine (`RuntimeDebugHooks`)
2. **Hook adapter** in app (`useRuntimeDebugHooks`)
3. **Debug UI/store** (`debugSlice` + `DebugPane`)

Flow:

```text
runtime event -> hooks.onEvent -> debugSlice.ingestEvent -> RuntimeDebugPane
```

References:

- `packages/engine/src/cards/runtime.ts`
- `apps/book-tracker-debug/src/debug/useRuntimeDebugHooks.ts`
- `apps/book-tracker-debug/src/debug/debugSlice.ts`
- `packages/engine/src/components/shell/RuntimeDebugPane.tsx`

## 4.9 Step I: add Storybook stories

You need stories at two levels:

- full app stories (`BookTrackerDebug/Full App`)
- component-level stories (for reusable engine components like `RuntimeDebugPane`)

Important:

- use fresh store per story decorator
- allow stories to force card navigation (`navigate({card, param})`)
- include your app story path in Storybook config

References:

- `apps/book-tracker-debug/src/stories/BookTrackerDebugApp.stories.tsx`
- `packages/engine/src/components/shell/RuntimeDebugPane.stories.tsx`
- `apps/inventory/.storybook/main.ts`

## 4.10 Step J: add script-level validation

Put executable checks in ticket `scripts/` when doing design-to-implementation work.

Current example:

- `ttmp/.../scripts/02-runtime-debug-hooks-and-debug-slice-tests.mjs`

What it validates:

- hook emission
- ring buffer behavior
- redaction/truncation
- filter behavior

This keeps architectural claims testable.

## 5. DSL authoring reference by example

## 5.1 Common expression primitives

- `Sel(name, args?, { from })` -> selector expression
- `Act(type, args?, { to })` -> action descriptor
- `Ev(path)` -> event payload path expression

## 5.2 Card widget examples

- menu: `ui.menu({...})`
- list: `ui.list({...})`
- detail: `ui.detail({...})`
- form: `ui.form({...})`
- report: `ui.report({...})`

## 5.3 Scope guide

State scopes available in runtime commands:

- `card`
- `cardType`
- `background`
- `stack`
- `global`

Action targeting:

- `to: 'shared'` for shared action registry
- local lookup chain for card/cardType/background/stack/global actions

## 6. Practical design patterns

## 6.1 Draft-edit pattern

Use `state.edits` card scope to buffer edits.

- `change` updates `state.edits.<field>`
- `save` sends merged edits through shared action
- on success, reset `state.edits = {}`

## 6.2 Param-detail navigation pattern

- list row click -> `nav.go` with `param: Ev('row.id')`
- detail selector resolves by `ctx.params.param`

## 6.3 Report card pattern

Build report sections in shared selectors from domain state, render with `ui.report`.

## 6.4 Debug-first app shell pattern

Use `layoutMode="debugPane"` to keep runtime introspection always available during development.

## 7. Common pitfalls and fixes

## 7.1 Pitfall: malformed `computed` entries in detail views

Symptom: `cf.compute is not a function`.

Fix: normalize computed entries in renderer (already implemented in `CardRenderer`).

## 7.2 Pitfall: selector/action existence checks with `Record<string, Fn>`

Symptom: type-level false positives.

Fix: use `hasOwnProperty` for runtime existence checks.

## 7.3 Pitfall: noisy debug payloads

Fix: sanitize at ingress in `useRuntimeDebugHooks` and redact sensitive keys.

## 7.4 Pitfall: giant story regressions

Fix: keep both app-level and component-level stories and run `build-storybook` in CI/local checks.

## 8. End-to-end implementation checklist

Use this when starting a new DSL app:

1. Create workspace app skeleton (`package.json`, `tsconfig`, `vite`, `main.tsx`).
2. Define domain types and reducers.
3. Create store and include engine reducers.
4. Implement shared selectors/actions bridge.
5. Define card modules in `domain/cards/`.
6. Assemble stack with `defineCardStack`.
7. Mount in `HyperCardShell`.
8. Add Storybook app stories.
9. Add optional debug hooks + debug pane.
10. Add executable validation script for critical runtime invariants.
11. Run: `npm run typecheck`, app build, storybook build.

## 9. Suggested pseudocode template

```ts
// 1) domain slice
const featureSlice = createSlice(...)

// 2) shared bridge
const sharedSelectors = { ... }
const sharedActions = { ... }

// 3) card files
export const listCard = { ui: ui.list(...), bindings: ... }
export const detailCard = { ui: ui.detail(...), bindings: ... }

// 4) stack
const STACK = defineCardStack({ cards: { list: listCard, detail: detailCard } })

// 5) app shell
<HyperCardShell stack={STACK} sharedSelectors={sharedSelectors} sharedActions={sharedActions} />
```

## 10. Final advice for new engineers

Start simple: one list card + one detail card + one shared action. Get that loop stable first. Then add forms, reports, scoped draft state, and debug-pane instrumentation.

The DSL is most effective when you keep clear boundaries:

- domain logic in reducers/shared actions
- UI and flow in CardDefinition DSL
- execution semantics in runtime
- observability in hooks + pane

If you maintain those boundaries, your app stays easy to reason about as it grows.
