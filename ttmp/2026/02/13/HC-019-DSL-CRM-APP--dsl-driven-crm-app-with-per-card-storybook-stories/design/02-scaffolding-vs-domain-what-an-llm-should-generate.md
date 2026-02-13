---
Title: 'Scaffolding vs Domain: What an LLM Should Generate'
Ticket: HC-019-DSL-CRM-APP
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
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/types.ts
      Note: "Domain types — LLM generates this"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/features/contacts/contactsSlice.ts
      Note: "Redux slice — LLM generates this"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/app/cardRuntime.ts
      Note: "Shared bridge — LLM generates this"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/cards/common.ts
      Note: "Column/field configs — LLM generates this"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/cards/homeCard.ts
      Note: "Card definition — LLM generates this"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/stack.ts
      Note: "Stack assembly — LLM generates this"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/debug/debugSlice.ts
      Note: "Scaffolding — identical across apps, never changes"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/main.tsx
      Note: "Scaffolding — identical across apps"
ExternalSources: []
Summary: Clear separation of scaffolding (identical across apps) vs. domain logic (what an LLM should generate per-app).
LastUpdated: 2026-02-13T13:00:00-05:00
WhatFor: Define the exact boundary for LLM-prompted app generation using the Card Stacks DSL.
WhenToUse: Use when designing the LLM prompt template or create-app tooling.
---


# Scaffolding vs Domain: What an LLM Should Generate

## 1. The Split

Every Card Stacks DSL app has exactly two categories of code:

1. **Scaffolding** — identical across all apps, varies only by app name and slice list
2. **Domain logic** — unique per app, this is what an LLM should generate

Here's the full file inventory of the CRM app (37 files, 1,822 lines) classified:

## 2. Scaffolding Files (IDENTICAL across apps)

These files are either byte-for-byte identical or differ only by app name / import paths / slice list. They can be generated mechanically from a minimal config (app name + list of slice names + list of card names + nav shortcuts).

| File | Lines | What varies |
|------|------:|-------------|
| `index.html` | 12 | `<title>` text |
| `package.json` | 25 | `"name"` field |
| `tsconfig.json` | 18 | Nothing |
| `vite.config.ts` | 12 | Nothing |
| `src/main.tsx` | 15 | **Nothing** (byte-identical) |
| `src/debug/debugSlice.ts` | 109 | **Nothing** (byte-identical) |
| `src/debug/useRuntimeDebugHooks.ts` | 54 | **Nothing** (byte-identical) |
| `src/debug/DebugPane.tsx` | 60 | `snapshot` keys (slice names) + title string |
| `src/app/store.ts` | 31 | Reducer import list + reducer map |
| `src/App.tsx` | 28 | Stack/bridge imports + `navShortcuts` array |
| `src/stories/CrmApp.stories.tsx` | 127 | Title, imports, `navShortcuts`, per-card story exports |
| `src/domain/cards/index.ts` | 13 | Re-export list |

**Total scaffolding: 504 lines (28% of app)**

**Key observation:** `debugSlice.ts`, `useRuntimeDebugHooks.ts`, and `main.tsx` are byte-for-byte identical between book-tracker-debug and CRM. They should be extracted to the engine package.

### What a scaffolding generator needs as input:

```yaml
appName: crm
packageName: "@hypercard/crm"
title: "CRM — HyperCard DSL"
stackExport: CRM_STACK
bridgeExports:
  selectors: crmSharedSelectors
  actions: crmSharedActions
slices:
  - { name: contacts, import: contactsReducer, from: ../features/contacts/contactsSlice }
  - { name: companies, import: companiesReducer, from: ../features/companies/companiesSlice }
  - { name: deals, import: dealsReducer, from: ../features/deals/dealsSlice }
  - { name: activities, import: activitiesReducer, from: ../features/activities/activitiesSlice }
navShortcuts:
  - { card: home, icon: "🏠" }
  - { card: contacts, icon: "👤" }
  - { card: companies, icon: "🏢" }
  - { card: deals, icon: "💰" }
  - { card: pipeline, icon: "📊" }
  - { card: activityLog, icon: "📝" }
cards:
  - { name: home }
  - { name: contacts }
  - { name: contactDetail, param: "c1" }  # param for stories
  - { name: addContact }
  # ... etc
```

## 3. Domain Logic Files (LLM GENERATES THESE)

These files contain all the app-specific logic and are what an LLM should produce from a natural-language prompt.

| File | Lines | Purpose |
|------|------:|---------|
| **`src/domain/types.ts`** | 57 | Entity types + composite state slice type |
| **`src/features/contacts/contactsSlice.ts`** | 64 | Redux slice: seed data + reducers |
| **`src/features/contacts/selectors.ts`** | 5 | Basic state accessor |
| **`src/features/companies/companiesSlice.ts`** | 54 | Redux slice |
| **`src/features/companies/selectors.ts`** | 5 | Basic state accessor |
| **`src/features/deals/dealsSlice.ts`** | 67 | Redux slice |
| **`src/features/deals/selectors.ts`** | 5 | Basic state accessor |
| **`src/features/activities/activitiesSlice.ts`** | 51 | Redux slice |
| **`src/features/activities/selectors.ts`** | 5 | Basic state accessor |
| **`src/app/cardRuntime.ts`** | 295 | Shared selectors + shared actions bridge |
| **`src/domain/cards/common.ts`** | 173 | Column/field/filter/computed configs |
| **`src/domain/cards/homeCard.ts`** | 28 | Home menu card |
| **`src/domain/cards/contactsCard.ts`** | 27 | Contacts list card |
| **`src/domain/cards/contactDetailCard.ts`** | 56 | Contact detail card |
| **`src/domain/cards/addContactCard.ts`** | 34 | Add contact form card |
| **`src/domain/cards/companiesCard.ts`** | 26 | Companies list card |
| **`src/domain/cards/companyDetailCard.ts`** | 45 | Company detail card |
| **`src/domain/cards/dealsCard.ts`** | 28 | Deals list card |
| **`src/domain/cards/openDealsCard.ts`** | 28 | Open deals filtered list |
| **`src/domain/cards/dealDetailCard.ts`** | 67 | Deal detail card |
| **`src/domain/cards/addDealCard.ts`** | 34 | Add deal form card |
| **`src/domain/cards/pipelineCard.ts`** | 18 | Pipeline report card |
| **`src/domain/cards/activityLogCard.ts`** | 28 | Activity log list card |
| **`src/domain/cards/addActivityCard.ts`** | 34 | Add activity form card |
| **`src/domain/stack.ts`** | 39 | Stack assembly (card map) |

**Total domain logic: 1,318 lines (72% of app)**


## 4. The Domain Logic in Detail

An LLM generating a DSL app needs to produce these 7 conceptual pieces:

### Piece 1: Domain Types (`types.ts`)

Define entity types and the composite state slice. **Do NOT use `[key: string]: unknown]` index signatures** — they cause RTK type friction.

```ts
// GOOD — explicit fields only
export type Contact = {
  id: string;
  name: string;
  email: string;
  status: ContactStatus;
};

// BAD — causes RTK createSlice issues
export type Contact = {
  id: string;
  name: string;
  [key: string]: unknown;  // DO NOT DO THIS
};
```

The composite state type must list every slice:
```ts
export interface CrmStateSlice {
  contacts: { items: Contact[] };
  companies: { items: Company[] };
}
```

### Piece 2: Redux Slices (`features/<entity>/<entity>Slice.ts` + `selectors.ts`)

Each entity needs:
- Seed data array
- `createSlice` with reducers: `save`, `create`, `delete`, `setStatus`/`setStage` (entity-specific), `reset`
- A basic selector: `(state) => state.<entity>.items`

**Important RTK pattern:** Use explicit field-by-field construction in create reducers, not spread:
```ts
// GOOD
createContact(state, action: PayloadAction<{ name: string; email: string }>) {
  const p = action.payload;
  state.items.push({ id: nextId(state.items), name: p.name, email: p.email });
}
```

### Piece 3: Shared Selectors (`cardRuntime.ts` — selectors half)

Pattern for each entity:
- `<entity>.all` — full list
- `<entity>.paramId` — extract param from navigation context
- `<entity>.byParam` — find one by param
- `<entity>.<filtered>` — filtered views (e.g., `deals.open`)
- `<entity>.reportSections` — aggregation for report cards

```ts
'contacts.byParam': (state, _args, ctx) => {
  const id = String(ctx.params.param ?? '');
  return selectContacts(state).find((c) => c.id === id) ?? null;
},
```

### Piece 4: Shared Actions (`cardRuntime.ts` — actions half)

Pattern for each entity:
- `<entity>.save` — apply edits, clear card scoped state
- `<entity>.create` — validate form values, dispatch, reset form state or set error
- `<entity>.delete` — dispatch delete, navigate back
- `<entity>.setStatus` / `<entity>.setStage` — status transition
- `<entity>.reset` — reset to seed data

```ts
'contacts.save': (ctx, args) => {
  const data = (args ?? {}) as Record<string, unknown>;
  ctx.dispatch(saveContact({
    id: String(data.id ?? ''),
    edits: (data.edits ?? {}) as Record<string, unknown>,
  }));
  ctx.patchScopedState('card', { edits: {} });
},
```

### Piece 5: Column / Field / Filter Configs (`common.ts`)

For each entity, define:
- `COLUMNS: ColumnConfig[]` — table columns for list views
- `FILTERS: FilterConfig[]` — filter bar options (use `_search` for text search)
- `DETAIL_FIELDS: FieldConfig[]` — detail view editable fields
- `COMPUTED: ComputedFieldConfig[]` — derived display fields
- `FORM_FIELDS: FieldConfig[]` — form view fields for creation

Available field types: `'readonly' | 'text' | 'number' | 'select' | 'tags' | 'label'`

### Piece 6: Card Definitions (`cards/<cardName>.ts`)

Five card patterns cover all use cases:

**Menu card** (home/dashboard):
```ts
ui: ui.menu({ key, icon, labels, buttons: [{ label, action: Act('nav.go', { card }) }] })
```

**List card** (entity browse):
```ts
ui: ui.list({ key, items: Sel('<entity>.all', undefined, { from: 'shared' }),
  columns, filters, searchFields, rowKey: 'id', toolbar })
bindings: { <key>: { rowClick: Act('nav.go', { card: '<detail>', param: Ev('row.id') }) } }
```

**Detail card** (entity view/edit):
```ts
state: { initial: { edits: {} } }
ui: ui.detail({ key, record: Sel('<entity>.byParam', ..., { from: 'shared' }),
  fields, computed, edits: Sel('state.edits'), actions: [...] })
bindings: { <key>: { change: Act('state.setField', {
  scope: 'card', path: 'edits', key: Ev('field'), value: Ev('value') }) } }
```

**Form card** (entity creation):
```ts
state: { initial: { formValues: { ... }, submitResult: '' } }
ui: ui.form({ key, fields, values: Sel('state.formValues'),
  submitLabel, submitResult: Sel('state.submitResult') })
bindings: { <key>: {
  change: Act('state.setField', { scope: 'card', path: 'formValues', key: Ev('field'), value: Ev('value') }),
  submit: Act('<entity>.create', { values: Ev('values') }, { to: 'shared' }) } }
```

**Report card** (dashboard/analytics):
```ts
ui: ui.report({ key, sections: Sel('<entity>.reportSections', ..., { from: 'shared' }),
  actions: [...] })
```

### Piece 7: Stack Assembly (`stack.ts`)

Pure composition — imports all cards, maps them by name:
```ts
export const MY_STACK = defineCardStack({
  id: 'myApp', name: 'My App', icon: '💼', homeCard: 'home',
  cards: { home: homeCard, list: listCard, detail: detailCard, ... }
});
```

## 5. Ideal LLM Prompt Structure

Given the split above, here's what an LLM prompt should look like:

```
Create a Card Stacks DSL app for: [DOMAIN DESCRIPTION]

Generate the following files:
1. src/domain/types.ts — entity types (no index signatures) + composite state slice
2. src/features/<entity>/<entity>Slice.ts — one per entity, with seed data
3. src/features/<entity>/selectors.ts — one per entity
4. src/app/cardRuntime.ts — shared selectors + shared actions
5. src/domain/cards/common.ts — columns, fields, filters, computed per entity
6. src/domain/cards/<card>.ts — one per card
7. src/domain/cards/index.ts — re-exports
8. src/domain/stack.ts — stack assembly

Also output a scaffold config (app name, nav shortcuts, card list with story params)
so the scaffolding generator can produce the remaining files.

Use these patterns:
- [paste Piece 1-7 reference from above]
```

## 6. Line Count Summary

```
┌─────────────────────────┬───────┬─────┐
│ Category                │ Lines │   % │
├─────────────────────────┼───────┼─────┤
│ Domain types            │    57 │   3 │
│ Redux slices+selectors  │   256 │  14 │
│ Shared bridge           │   295 │  16 │
│ Column/field configs    │   173 │  10 │
│ Card definitions (13)   │   498 │  27 │
│ Stack assembly          │    39 │   2 │
├─────────────────────────┼───────┼─────┤
│ DOMAIN TOTAL (LLM)      │ 1318 │  72 │
├─────────────────────────┼───────┼─────┤
│ Debug boilerplate       │   223 │  12 │
│ Store/App/Main          │    74 │   4 │
│ Stories                 │   127 │   7 │
│ Config files            │    80 │   5 │
├─────────────────────────┼───────┼─────┤
│ SCAFFOLD TOTAL          │   504 │  28 │
├─────────────────────────┼───────┼─────┤
│ GRAND TOTAL             │ 1822 │ 100 │
└─────────────────────────┴───────┴─────┘
```

## 7. Recommendations for Tooling

1. **Extract debug plumbing to engine** — `debugSlice.ts` and `useRuntimeDebugHooks.ts` are byte-identical. Move them to `@hypercard/engine` as `createStandardDebugSlice()` and `useStandardDebugHooks()`. This eliminates 163 lines of scaffolding per app.

2. **Create a `create-app` CLI** — Given scaffold config YAML, generate all scaffolding files. Then the LLM only needs to produce the 7 domain files.

3. **Make `DebugPane.tsx` generic** — Accept slice names as props instead of hardcoding the snapshot shape. This eliminates the last varying line in debug scaffolding.

4. **Auto-generate stories from stack** — The per-card story exports follow a mechanical pattern: one export per card in `stack.cards`, with `param` from seed data. A function like `generateCardStories(stack, config)` could produce them all.

5. **Auto-generate `store.ts` from slice list** — The store file is pure wiring. A `createAppStore(sliceMap)` helper would eliminate it.

With recommendations 1-5 implemented, scaffolding drops from 504 lines to approximately **80 lines** (just config files), and an LLM prompt produces a complete working app by generating only the 7 domain files.
