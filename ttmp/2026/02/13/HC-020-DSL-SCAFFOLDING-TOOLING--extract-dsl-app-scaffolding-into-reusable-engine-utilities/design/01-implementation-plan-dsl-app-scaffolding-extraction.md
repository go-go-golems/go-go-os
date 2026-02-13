---
Title: 'Implementation Plan: DSL App Scaffolding Extraction'
Ticket: HC-020-DSL-SCAFFOLDING-TOOLING
Status: active
Topics:
    - frontend
    - architecture
    - redux
    - storybook
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/index.ts
      Note: "Engine barrel exports — will grow with new utilities"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/debug/debugSlice.ts
      Note: "Current app-level debug slice — will be replaced by engine utility"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/debug/useRuntimeDebugHooks.ts
      Note: "Current app-level hooks — will be replaced by engine utility"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/app/store.ts
      Note: "Current app store — will be simplified by createAppStore()"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/stories/CrmApp.stories.tsx
      Note: "Current stories — will be simplified by generateCardStories()"
ExternalSources: []
Summary: Step-by-step plan to extract scaffolding boilerplate from DSL apps into reusable engine utilities.
LastUpdated: 2026-02-13T13:15:00-05:00
WhatFor: Guide implementation of scaffolding extraction.
WhenToUse: Reference during HC-020 implementation.
---


# Implementation Plan: DSL App Scaffolding Extraction

## Goal

Reduce DSL app scaffolding from ~504 lines to ~80 lines by extracting reusable utilities into `@hypercard/engine`. After this work, an LLM only needs to produce 7 domain files + a small `app.ts` bootstrap to get a complete working app.

## Task Breakdown

### Task 1: Extract debugSlice + useRuntimeDebugHooks into engine

**What:** Move `debugSlice.ts` and `useRuntimeDebugHooks.ts` (byte-identical across apps) into `packages/engine/src/debug/`.

**New files in engine:**
- `packages/engine/src/debug/debugSlice.ts` — the standard debug slice
- `packages/engine/src/debug/useStandardDebugHooks.ts` — the standard hooks
- `packages/engine/src/debug/index.ts` — barrel

**Exports added to engine:**
- `debugReducer`, `ingestEvent`, `clearEvents`, `toggleCollapsed`, `selectEvent`, `setKindFilter`, `setTextFilter`
- `selectDebugState`, `selectDebugKinds`, `selectFilteredDebugEvents`, `selectSelectedDebugEvent`
- `useStandardDebugHooks`, `sanitizeDebugValue`
- `DebugState`, `DebugStateSlice`

**Eliminates:** 163 lines per app (debugSlice.ts: 109 + useRuntimeDebugHooks.ts: 54)

### Task 2: Make DebugPane generic

**What:** The `DebugPane.tsx` wrapper currently hardcodes app-specific snapshot keys. Make the engine's `RuntimeDebugPane` accept a `snapshotKeys` config, or create a `StandardDebugPane` component in engine that reads snapshot from store generically.

**Approach:** Create `packages/engine/src/debug/StandardDebugPane.tsx` that:
- Accepts `snapshotSelector: (state) => Record<string, unknown>` as a prop
- Uses the engine's standard debug selectors internally
- Renders `RuntimeDebugPane` with the wired state

**Eliminates:** 60 lines per app (DebugPane.tsx)

### Task 3: Create createAppStore() helper

**What:** The store file is pure wiring. Create a helper that takes domain reducers and returns a configured store with engine reducers pre-wired.

```ts
// New API
import { createAppStore } from '@hypercard/engine';

export const { store, createStore } = createAppStore({
  contacts: contactsReducer,
  companies: companiesReducer,
  deals: dealsReducer,
  activities: activitiesReducer,
});
```

**Implementation:**
- `packages/engine/src/app/createAppStore.ts`
- Automatically includes `hypercardRuntime`, `navigation`, `notifications`, `debug` reducers
- Returns `{ store, createStore }` where `createStore` makes fresh stores for Storybook

**Eliminates:** ~31 lines per app (store.ts)

### Task 4: Create generateCardStories() utility

**What:** Per-card stories follow a mechanical pattern. Create a utility that generates them from a stack definition + config.

```ts
// New API
import { generateCardStories } from '@hypercard/engine';

const stories = generateCardStories({
  stack: CRM_STACK,
  sharedSelectors: crmSharedSelectors,
  sharedActions: crmSharedActions,
  createStore: createAppStore,
  title: 'CRM',
  navShortcuts: [...],
  cardParams: { contactDetail: 'c1', dealDetail: 'd1' },
});
export default stories.meta;
export const { Home, Contacts, ContactDetail, ... } = stories;
```

**Eliminates:** ~100 lines per app (stories file becomes ~20 lines)

### Task 5: Create createDSLApp() one-call setup

**What:** A single function that wires everything together: store, App component, debug hooks, nav shortcuts.

```ts
// New API
import { createDSLApp } from '@hypercard/engine';

export const { App, store, createStore } = createDSLApp({
  stack: CRM_STACK,
  sharedSelectors: crmSharedSelectors,
  sharedActions: crmSharedActions,
  domainReducers: { contacts: contactsReducer, ... },
  navShortcuts: [...],
  snapshotSelector: (state) => ({ contacts: state.contacts, ... }),
  title: 'CRM',
});
```

This produces a ready-to-render `App` component with debug pane, and a `createStore` for stories.

**Eliminates:** App.tsx, store.ts, debug/* — the app needs only `main.tsx` + domain files.

### Task 6: Migrate book-tracker-debug

Replace boilerplate in book-tracker-debug with new engine utilities. Verify all Storybook stories still work.

### Task 7: Migrate CRM app

Replace boilerplate in CRM app with new engine utilities. Verify all Storybook stories still work.

### Task 8: Verify everything

- `npx tsc --build` clean
- All Storybook stories load
- Both apps render correctly

## Dependency Order

```
Task 1 (debug extraction)
  └─> Task 2 (generic DebugPane)
        └─> Task 3 (createAppStore)
              └─> Task 5 (createDSLApp — combines 1+2+3)
Task 4 (generateCardStories — independent)
Task 6 (migrate book tracker — needs 1-5)
Task 7 (migrate CRM — needs 1-5)
Task 8 (verify — needs 6+7)
```

## After-state

Each app shrinks from ~504 lines of scaffolding to:
- `main.tsx` (~15 lines, unchanged)
- `app.ts` or inline in `main.tsx` (~20 lines with `createDSLApp` call)
- `stories.tsx` (~20 lines with `generateCardStories` call)
- Config files (~65 lines, unchanged)

**Total scaffolding: ~120 lines (down from 504)**

The remaining domain files (types, slices, bridge, cards, stack) stay exactly the same — they're what an LLM generates.
