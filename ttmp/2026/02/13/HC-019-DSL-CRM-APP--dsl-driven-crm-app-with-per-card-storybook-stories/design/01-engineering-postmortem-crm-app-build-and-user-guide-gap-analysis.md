---
Title: 'Engineering Postmortem: CRM App Build and User Guide Gap Analysis'
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
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/app/cardRuntime.ts
      Note: "Shared selectors/actions bridge — 295 lines, most complex file in the app"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/cards/common.ts
      Note: "Column/field/filter/computed configs — 173 lines of type-annotated definitions"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/types.ts
      Note: "CRM domain types with index signatures that caused RTK type friction"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/stories/CrmApp.stories.tsx
      Note: "Per-card Storybook stories — pattern not documented in guide"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/stack.ts
      Note: "Stack assembly — 13 cards, larger than guide example scope"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/design/03-how-to-create-an-app-using-card-stacks-dsl.md
      Note: "The user guide being evaluated — HC-018 design doc 03"
ExternalSources: []
Summary: Engineering postmortem for the HC-019 CRM app build, with a detailed gap analysis of what the HC-018 user guide (design/03) does and does not cover.
LastUpdated: 2026-02-13T12:30:00-05:00
WhatFor: Capture what went well, what was missing from the guide, and what to improve in both the DSL and its documentation.
WhenToUse: Use when updating the user guide, onboarding new DSL app authors, or planning DSL improvements.
---


# Engineering Postmortem: CRM App Build and User Guide Gap Analysis

## 1. Executive Summary

HC-019 built a complete CRM application (4 entity types, 4 Redux slices, 13 DSL cards, 14 Storybook stories) using the Card Stacks DSL. The build was guided by the HC-018 user guide ("How to Create an App Using Card Stacks DSL," design doc 03). The app was completed in a single implementation pass with one TypeScript compilation failure that required a workaround.

**Overall assessment of the user guide:** The guide's architecture description, mental model, and step sequence are excellent. An engineer reading it can orient quickly and produce a working app. However, several practical topics that surfaced during a real multi-entity build are either missing, under-specified, or only covered by example rather than by explanation. This postmortem catalogs those gaps.


## 2. What the Guide Got Right

### 2.1 Mental model and layer diagram

The five-layer diagram (Redux → bridge → DSL → runtime → widgets) is the single most useful artifact in the guide. It correctly establishes the separation of concerns and makes it obvious where each piece of code belongs. During the CRM build, every file was created with immediate confidence about which layer it belonged to.

### 2.2 File layout convention

The recommended directory structure (`app/`, `domain/cards/`, `features/`, `debug/`, `stories/`) mapped 1:1 to the CRM app. No deviation was needed even with 4 feature slices instead of 1. The one-card-per-file recommendation was particularly valuable at 13 cards.

### 2.3 Step sequence (A through J)

The guide's step ordering exactly matched the natural dependency chain. Domain types → slices → store → bridge → cards → stack → shell → stories → debug → validation. No backtracking was required.

### 2.4 Design patterns section

The draft-edit pattern (§6.1), param-detail pattern (§6.2), and report pattern (§6.3) were all directly reused. The CRM build applied draft-edit on contact, company, and deal detail cards; param-detail on all three detail navigations; and the report pattern on the pipeline card.

### 2.5 Expression primitives documentation

`Sel()`, `Act()`, `Ev()` with their `from`/`to` routing options were well-explained and sufficient for all CRM wiring.


## 3. What Was Missing From the Guide

This section is the core of the postmortem. Each gap is categorized by severity:

- **🔴 Blocker** — caused a compilation failure or required non-obvious workaround
- **🟡 Significant** — caused confusion, wasted time, or required reading engine source
- **🟢 Minor** — would improve quality of life but didn't block progress

---

### 3.1 🔴 RTK Type Friction with Index-Signature Domain Types

**Gap:** The guide says "Keep IDs stable and serializable" but does not mention the `[key: string]: unknown` index signature that the book tracker's `Book` type uses. This index signature is inherited silently by any developer copying the pattern.

**What happened:** The CRM's `Contact`, `Company`, `Deal`, and `Activity` types all included `[key: string]: unknown` (copied from the `Book` pattern). When writing `createSlice` reducers, RTK's `WritableNonArrayDraft<T>` type refused to accept `{ id: nextId(...), ...action.payload }` because TypeScript's `Omit<T, 'id'>` over an index-signature type collapses to `{ [key: string]: unknown }`, which doesn't satisfy the full concrete type when spread.

**Workaround:** Replaced spread-based push with explicit field-by-field construction:
```ts
// FAILS:
state.items.push({ id: nextId(state.items), ...action.payload });

// WORKS:
const p = action.payload;
state.items.push({
  id: nextId(state.items),
  name: p.name,
  email: p.email,
  // ... explicit field by field
});
```

**Recommendation for guide:** Either (a) remove `[key: string]: unknown` from the recommended type pattern and document why, or (b) add a pitfall section explaining the RTK type interaction and the field-by-field workaround. Option (a) is strongly preferred — the index signature exists for extensibility but causes ergonomic harm with no clear benefit in a typed DSL app.

---

### 3.2 🟡 No Multi-Entity / Multi-Slice Guidance

**Gap:** The guide uses a single entity (Book) with a single slice. It does not discuss:
- How to organize `features/` when there are multiple feature slices
- How the `CrmStateSlice` root type should compose multiple sub-slices
- How `SharedSelectorRegistry<TRootState>` should be typed when the root state has multiple branches
- How shared selectors can cross-reference entities (e.g., resolving a company name for a contact's `companyId`)

**What happened:** The CRM needed a composite state slice type:
```ts
export interface CrmStateSlice {
  contacts: { items: Contact[] };
  companies: { items: Company[] };
  deals: { items: Deal[] };
  activities: { items: Activity[] };
}
```
This was straightforward to figure out, but a new developer might not realize that `SharedSelectorRegistry<CrmStateSlice>` needs to type the full intersection of all sub-slices.

**Recommendation for guide:** Add a "Scaling to Multiple Entities" subsection after Step A. Show the composite state type pattern and explain that the `TRootState` generic threads through the entire bridge and card stack.

---

### 3.3 🟡 No Concrete `ColumnConfig` / `FieldConfig` / `FilterConfig` API Reference

**Gap:** The guide references column configs, field configs, filters, and computed fields but only says "see `common.ts`" for examples. It does not document:
- Available `FieldType` values (`'readonly' | 'text' | 'number' | 'select' | 'tags' | 'label'`)
- `ColumnConfig` formatting options (`format`, `align`, `cellStyle`, `renderCell`)
- `FilterConfig` magic field `_search` for full-text search
- `ComputedFieldConfig` contract (`compute: (record) => string`)
- That `FilterConfig.options` must include `'All'` as the first option for the "show all" behavior

**What happened:** Had to read `packages/engine/src/types.ts` to learn the available field types, column formatting options, and the `_search` convention. The CRM's deal columns use `format` and `align` for currency display — this required reading engine source, not the guide.

**Recommendation for guide:** Add a "Widget Configuration Reference" section with tables documenting each config type's properties, allowed values, and behavior. Specifically:

| Config | Key Properties | Notes |
|--------|---------------|-------|
| `ColumnConfig` | `key`, `label`, `width`, `format`, `align`, `cellStyle`, `renderCell` | `format` takes `(value, row) => string` |
| `FieldConfig` | `id`, `label`, `type`, `options`, `placeholder`, `required`, `step` | `type` is one of: `readonly`, `text`, `number`, `select`, `tags`, `label` |
| `FilterConfig` | `field`, `type`, `options`, `placeholder` | Use `_search` field for full-text; first option should be `'All'` |
| `ComputedFieldConfig` | `id`, `label`, `compute` | `compute: (record) => string` |

---

### 3.4 🟡 No `package.json` / `tsconfig.json` / `vite.config.ts` Templates

**Gap:** Step 8 in the guide's checklist says "Create workspace app skeleton (package.json, tsconfig, vite, main.tsx)" but provides no templates or even lists of required dependencies and configuration.

**What happened:** Had to copy `package.json`, `tsconfig.json`, `vite.config.ts`, and `index.html` from `apps/book-tracker-debug/` and adapt them. The required pieces are:
- `@hypercard/engine: "*"` workspace dependency
- `@reduxjs/toolkit`, `react`, `react-dom`, `react-redux` as runtime deps
- `tsconfig.json` with `moduleResolution: "bundler"`, `paths` alias, and `references`
- `vite.config.ts` with `@hypercard/engine` alias to engine source
- `index.html` with root div and script tag

**Recommendation for guide:** Add a "Scaffold Files" appendix with copy-paste templates for all four files. Alternatively, create a `create-app` script/template in the monorepo.

---

### 3.5 🟡 Per-Card Storybook Story Pattern Not Documented

**Gap:** The guide's Step I mentions stories at "full app" and "component" levels but does not show how to create per-card stories — i.e., stories that force navigation to a specific card with a specific param.

**What happened:** The book tracker already had a `DebugShellAtCard` helper in its stories file, but the guide doesn't explain this pattern. The CRM stories required:
1. A `CrmStoreDecorator` that creates a fresh store per story
2. A `CrmShellAtCard` component that dispatches `navigate({ card, paramValue: param })` in a `useEffect`
3. One named export per card with the correct `param` value

This pattern is crucial for verifying detail/form cards in isolation and should be a first-class documented pattern.

**Recommendation for guide:** Add a "Per-Card Story Pattern" subsection to Step I with the `ShellAtCard` helper code and an explanation of why each card gets its own story.

---

### 3.6 🟡 Storybook Config Wiring Not Documented

**Gap:** The guide mentions "include your app story path in Storybook config" but does not show the specific line to add to `apps/inventory/.storybook/main.ts`.

**What happened:** Had to read the existing Storybook config, understand the glob pattern, and add:
```ts
'../../crm/src/**/*.stories.@(ts|tsx)',
```

**Recommendation for guide:** Show the exact config line and file path. Also explain that the monorepo uses a single Storybook instance rooted in `apps/inventory/.storybook/`.

---

### 3.7 🟡 Shared Action Handler Patterns Insufficiently Detailed

**Gap:** The guide's Step C shows pseudo-structure for shared actions but doesn't cover:
- How to access `ctx.patchScopedState('card', ...)` to reset form/edit state after mutations
- How to use `ctx.nav.back()` after deletion
- How to validate form input inside a shared action and report errors via scoped state
- The full `CardContext` API available to action handlers

**What happened:** The CRM's `contacts.create` action needed to:
1. Validate that name and email are non-empty
2. On validation failure, patch scoped state with an error message
3. On success, dispatch the create action AND reset form values via scoped state

This required reading the book tracker's `bookSharedActions` implementation, not the guide.

**Recommendation for guide:** Add a "Shared Action Patterns" subsection with three concrete examples:
1. Simple mutation (save with edits, then clear edits)
2. Delete with navigation (delete + `ctx.nav.back()`)
3. Form creation with validation (validate → dispatch → reset form state OR set error message)

---

### 3.8 🟡 No Guidance on Cross-Entity Relationships

**Gap:** The guide doesn't discuss how to handle relationships between entities — a very common CRM/ERP pattern.

**What happened:** The CRM has cross-references:
- `Contact.companyId` → `Company.id`
- `Deal.contactId` → `Contact.id`
- `Deal.companyId` → `Company.id`
- `Activity.contactId` / `Activity.dealId`

Currently the list views show raw IDs (e.g., `companyId: "co1"`) instead of resolved names. The guide provides no pattern for:
- Creating a "name map" selector (`companies.nameMap`)
- Using `ColumnConfig.format` or `ColumnConfig.renderCell` to resolve IDs to display names
- How to handle cross-navigation (from contact detail → their deals)

**Recommendation for guide:** Add a "Cross-Entity Relationships" pattern section covering name resolution in columns, cross-navigation actions, and the tradeoffs of doing resolution in selectors vs. formatters.

---

### 3.9 🟢 `ui.list` Props Not Fully Documented

**Gap:** `ui.list()` accepts props like `emptyMessage`, `toolbar`, `searchFields`, `rowKey`, but these are only discoverable by reading the `ListView.tsx` source or existing card files.

**What happened:** For the `openDeals` and `activityLog` cards, `emptyMessage` was needed to show a friendly message when no items match. This prop was found by reading the `readingNowCard.ts` example.

**Recommendation for guide:** Add a prop table for each `ui.*` widget function: `menu`, `list`, `detail`, `form`, `report`. Even a brief table would dramatically reduce engine source diving.

---

### 3.10 🟢 `defineCardStack` Required Fields Not Documented

**Gap:** The guide shows `defineCardStack` with `id`, `homeCard`, and `cards`, but doesn't mention that `name` and `icon` are also required fields on `CardStackDefinition`.

**What happened:** TypeScript caught the missing fields, but the guide's example in §4.5 omits `name` and `icon`:
```ts
// Guide example (incomplete):
export const STACK = defineCardStack({
  id: 'bookTrackerDebug',
  homeCard: 'home',
  cards: { ... }
})
```

**Recommendation for guide:** Update the example to include all required fields.

---

### 3.11 🟢 No `npm install` Step Mentioned

**Gap:** After creating a new app workspace in the monorepo, `npm install` must be run from the root to wire the workspace dependency. The guide doesn't mention this.

**Recommendation for guide:** Add a note after the scaffold step: "Run `npm install` from the monorepo root to resolve workspace dependencies."

---

### 3.12 🟢 Debug Plumbing is Boilerplate-Heavy

**Gap:** The debug pane requires 3 files (`debugSlice.ts`, `useRuntimeDebugHooks.ts`, `DebugPane.tsx`) that are nearly identical between apps. The guide says "add runtime debugging" but doesn't acknowledge that these files are pure boilerplate that could be extracted.

**What happened:** The CRM's debug files are character-for-character identical to the book tracker's except for the `snapshot` object in `DebugPane.tsx` (which includes app-specific state slices).

**Recommendation for guide:** Either (a) extract a reusable `createDebugSlice()` and `useStandardDebugHooks()` into the engine package, or (b) acknowledge in the guide that these files are boilerplate and provide copy-paste templates. Option (a) would eliminate ~150 lines of copy-paste per app.


## 4. Quantitative Assessment

### 4.1 Guide coverage by step

| Guide Step | Covered? | Gaps Found |
|-----------|----------|------------|
| A: Domain types + slice | ✅ Mostly | 🔴 Index signature pitfall missing |
| B: App store | ✅ Complete | — |
| C: Shared bridge | 🟡 Partial | Missing multi-entity, action patterns, CardContext API |
| D: Card modules | ✅ Complete | — |
| E: Stack assembly | 🟡 Partial | Missing required `name`/`icon` fields |
| F: Bindings + scoped state | ✅ Complete | — |
| G: Shell hosting | ✅ Complete | — |
| H: Debug pane | 🟡 Partial | Boilerplate acknowledgment, no templates |
| I: Storybook stories | 🟡 Partial | No per-card story pattern, no config wiring |
| J: Script validation | ✅ Complete | — |
| — Widget config reference | ❌ Missing | No API tables for ColumnConfig, FieldConfig, etc. |
| — Scaffold templates | ❌ Missing | No package.json/tsconfig/vite templates |
| — Multi-entity patterns | ❌ Missing | No composite state type, cross-entity guidance |
| — ui.* prop reference | ❌ Missing | No prop tables for menu/list/detail/form/report |

### 4.2 Build metrics

| Metric | Value |
|--------|-------|
| Total files created | 37 |
| Lines of app code | ~1,200 |
| Lines of config/scaffold | ~60 |
| Lines of Storybook stories | ~130 |
| Time blocked by type error | ~5 min |
| Times reading engine source instead of guide | 4 |
| Cards implemented | 13 |
| Storybook stories | 14 |
| Shared selectors | 20 |
| Shared actions | 16 |


## 5. Recommended Guide Improvements (Prioritized)

### Priority 1 — Add immediately

1. **Widget Configuration Reference** (§3.3): Tables for `ColumnConfig`, `FieldConfig`, `FilterConfig`, `ComputedFieldConfig` with all properties and allowed values.
2. **RTK Index Signature Pitfall** (§3.1): Either remove the pattern or add a pitfall section. This is the only compilation blocker.
3. **Scaffold Templates** (§3.4): Copy-paste `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`.

### Priority 2 — Add for multi-entity apps

4. **Multi-Entity Guidance** (§3.2): Composite state type, multi-slice organization.
5. **Shared Action Patterns** (§3.7): Validation, form reset, delete+navigate.
6. **Cross-Entity Relationships** (§3.8): Name maps, column formatters, cross-navigation.

### Priority 3 — Polish

7. **Per-Card Storybook Pattern** (§3.5): `ShellAtCard` helper with explanation.
8. **Storybook Config Wiring** (§3.6): Exact file and glob line.
9. **ui.* Prop Reference** (§3.9): Prop tables for each widget function.
10. **Debug Boilerplate Extraction** (§3.12): Extract reusable utilities or provide templates.
11. **defineCardStack Required Fields** (§3.10): Fix example.
12. **npm install Note** (§3.11): One-line addition.


## 6. What Worked Well in the Build

- **The guide's mental model is correct and complete.** Every architectural question had a clear answer from the layer diagram.
- **One-card-per-file scales beautifully.** 13 cards in 13 files, each independently understandable.
- **The DSL expression system is expressive enough.** All CRM interactions (list, detail, form, report, navigation, scoped state) were expressible with `Sel/Act/Ev` and the existing widget set.
- **Storybook integration is seamless.** Per-card stories give immediate visual verification of every screen.
- **Debug pane reuse was trivial.** The engine's `RuntimeDebugPane` component worked out of the box.


## 7. What Was Costly or Fragile

- **The RTK type error** was the only real blocker. It's a known TypeScript/RTK edge case with index signatures, but it shouldn't be a footgun for new app authors.
- **Cross-entity display** (showing company names instead of IDs in contact lists) is a gap in the current DSL — there's no built-in "join" or "lookup" primitive. Workarounds are possible via `ColumnConfig.format` or custom shared selectors, but neither is documented.
- **Debug boilerplate copy-paste** across apps is maintenance debt waiting to happen.


## 8. Follow-up Recommendations

1. **Update the user guide** with the Priority 1 and Priority 2 items above.
2. **Remove `[key: string]: unknown`** from domain type conventions (or make it opt-in with documentation).
3. **Extract debug plumbing** into `@hypercard/engine` as `createDebugSetup()` or similar.
4. **Add a `create-app` CLI or template** to the monorepo that scaffolds the full directory structure with all config files.
5. **Consider a DSL-level join/lookup primitive** so that cross-entity name resolution doesn't require custom `ColumnConfig.format` callbacks.


## 9. Closing Assessment

The Card Stacks DSL is production-ready for multi-entity CRUD applications. The CRM build validated that the architecture scales from 1 entity / 6 cards (book tracker) to 4 entities / 13 cards without structural changes. The guide is a strong starting point but needs the additions listed above to serve as a standalone onboarding document — currently it requires supplementary engine source reading approximately 4 times during a real build.
