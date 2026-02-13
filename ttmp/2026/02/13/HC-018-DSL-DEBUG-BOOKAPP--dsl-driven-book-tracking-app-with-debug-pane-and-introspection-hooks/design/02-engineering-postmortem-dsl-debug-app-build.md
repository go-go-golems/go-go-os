---
Title: 'Engineering Postmortem: DSL Debug App Build'
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
    - Path: apps/book-tracker-debug/src/debug/debugSlice.ts
      Note: App-level debug event ring buffer, selection, and filtering.
    - Path: apps/book-tracker-debug/src/domain/cards
      Note: |-
        CardDefinition files split one-card-per-file for maintainability.
        Card-per-file refactor outcomes covered in postmortem
    - Path: apps/book-tracker-debug/src/domain/stack.ts
      Note: Book stack entrypoint now composes per-card modules.
    - Path: packages/engine/src/cards/runtime.ts
      Note: |-
        Runtime hook/event model added and threaded through selector/action execution.
        Runtime hook emission architecture analyzed in postmortem
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: |-
        Added debug-pane shell layout mode and debug hook plumbing.
        Shell layout-mode/debug-pane integration discussed in postmortem
    - Path: packages/engine/src/components/shell/RuntimeDebugPane.tsx
      Note: |-
        Reusable debug pane extracted into engine package.
        Reusable debug pane extraction and API covered in postmortem
ExternalSources: []
Summary: Engineering recap of the HC-018 implementation from planning through runtime hook integration, debug-pane app delivery, refactors, incidents, and validation results.
LastUpdated: 2026-02-13T12:20:00-05:00
WhatFor: Capture technical decisions, tradeoffs, failures, and lessons learned while implementing the DSL debug app.
WhenToUse: Use when onboarding engineers to HC-018 implementation details or evaluating follow-up architecture changes.
---


# Engineering Postmortem: DSL Debug App Build

## 1. Executive Summary

HC-018 started as an architecture/design exercise and then became a full implementation effort across the DSL runtime, shell layer, app layer, Storybook coverage, and ticket evidence pipeline. The core requirement was to make a DSL-driven Book Tracking app that is debuggable in real time: runtime semantics, dispatched actions, scoped state, and card transitions had to be visible in a collapsible pane.

The implementation succeeded and shipped in four incremental task phases:

- Runtime introspection hooks in the engine.
- New DSL-driven Book Tracker debug app with a live debug pane.
- Shell-level replacement of legacy tab layout for this profile.
- Executable validation script for hook emission, retention, redaction, and filtering.

Secondary improvements were delivered during execution:

- Crash-path hardening for detail computed fields (`cf.compute is not a function`).
- Refactor to split stack cards into one file per card.
- Reusable debug pane extraction into `packages/engine`.

## 2. Starting Conditions and Constraints

At the beginning of implementation, the repository already contained a mature CardDefinition DSL runtime and shell, but the shell UI model was AI-panel oriented (`split`, `drawer`, `cardChat`) instead of debugging oriented. We had planning docs and a prototype simulation script, but no production debug-pane app profile.

We also had explicit project constraints:

- No backward-compatibility shims were required for the old DSL.
- Storybook had to remain a first-class verification environment.
- Ticket artifacts had to be complete: tasks, diary, changelog, scripts, and uploads.
- Experiments/tests should be stored in ticket `scripts/`.

## 3. Timeline of Engineering Changes

### 3.1 Runtime instrumentation foundation

The first implementation milestone was adding explicit runtime debug hooks and event emission points in `packages/engine/src/cards/runtime.ts` and shell call sites.

New symbols included:

- `RuntimeDebugEvent`
- `RuntimeDebugHooks`
- `RuntimeDebugContext`
- `RuntimeDebugEventInput`
- `emitRuntimeDebugEvent(...)`

Instrumentation points included:

- Selector resolution (`createSelectorResolver`)
- Command argument resolution (`executeCommand`)
- Action execution start/end/error (`executeActionDescriptor`)
- Built-in scoped state mutation actions (`state.set`, `state.patch`, etc.)
- UI emit boundaries and inline action execution (`CardRenderer`)
- Redux dispatch wrappers (`HyperCardShell`)

This changed runtime from black-box execution to observable execution without forcing a concrete debug UI into engine internals.

### 3.2 Debug app implementation

The second phase built a dedicated app workspace: `apps/book-tracker-debug`.

Delivered modules:

- Domain and stack definitions (`src/domain/*`)
- Shared selectors/actions (`src/app/cardRuntime.ts`)
- Books slice (`src/features/books/*`)
- Debug event reducer and selectors (`src/debug/debugSlice.ts`)
- Hook adapter (`src/debug/useRuntimeDebugHooks.ts`)
- Debug pane integration (`src/debug/DebugPane.tsx`)
- Storybook app stories (`src/stories/BookTrackerDebugApp.stories.tsx`)

The app intentionally exercised many DSL features:

- menu/list/detail/form/report widgets
- event bindings (`rowClick`, `change`, `submit`)
- shared actions/selectors
- scoped card-local edits
- navigation with params

### 3.3 Shell behavior replacement

The third phase introduced a new shell profile mode in `packages/engine/src/components/shell/HyperCardShell.tsx`:

- `layoutMode?: 'legacyTabs' | 'debugPane'`
- `renderDebugPane?: (...) => ReactNode`

In `debugPane` mode, the top tab strip is removed and the debug pane becomes the first-class side panel. Existing consumers default to `legacyTabs`, so behavior remains stable unless explicitly switched.

### 3.4 Verification and evidence pipeline

Task 4 added executable validations in ticket scripts:

- `scripts/02-runtime-debug-hooks-and-debug-slice-tests.mjs`
- `scripts/02-runtime-debug-hooks-and-debug-slice-tests.out.txt`

The script asserts:

- runtime hook emission occurs for selector/action/state mutation paths
- reducer ring buffer keeps only latest N events
- filter selectors behave as expected
- redaction/truncation sanitizer works on sensitive keys and large payloads

## 4. Major Architectural Decisions

## 4.1 Decision: hook callbacks over middleware-only instrumentation

**Decision:** instrument at runtime semantic boundaries using optional callback hooks, not only Redux middleware.

**Reasoning:** DSL semantics happen before many Redux actions and include metadata middleware cannot infer (node key, selector scope, descriptor resolution).

**Result:** cleaner event model with DSL-specific context and no engine coupling to a specific reducer/UI.

## 4.2 Decision: app-owned debug store, engine-owned emission

**Decision:** engine emits normalized events; app stores and visualizes them.

**Reasoning:** keeps engine package generic while allowing app-specific retention, filtering, and UX choices.

**Result:** `RuntimeDebugHooks` remains lightweight; `debugSlice` is independently evolvable.

## 4.3 Decision: add shell profile mode instead of replacing legacy behavior globally

**Decision:** introduce `layoutMode` toggle instead of deleting old layout behavior.

**Reasoning:** reduced risk to existing profiles while delivering required debug-pane-first UX in the new profile.

**Result:** targeted behavior change with minimal blast radius.

## 4.4 Decision: card-per-file stack organization

**Decision:** split monolithic stack card definitions into one file per card in `apps/book-tracker-debug/src/domain/cards/`.

**Reasoning:** improves readability, ownership, review quality, and supports growth of card-specific selectors/actions/state.

**Result:** clearer module boundaries and easier onboarding.

## 4.5 Decision: move debug pane UI into engine package

**Decision:** extract reusable pane component to `packages/engine/src/components/shell/RuntimeDebugPane.tsx`.

**Reasoning:** debug UI should be reusable by multiple apps and Storybook scenarios; app only wires state + handlers.

**Result:** reusable shell primitive with app-specific wrapper retained for store binding.

## 5. Incident Log and Failure Analysis

## 5.1 Storybook card detail crash (`cf.compute is not a function`)

**Symptom:** clicking a row in Book Tracker Browse/Detail story triggered render failure in `DetailView`.

**Root cause:** `DetailView` assumes every `computed` item has a callable `compute` function; resolved DSL payloads could include non-function shapes.

**Fix:** normalize computed entries in `CardRenderer` before passing to `DetailView`.

Pseudo-logic:

```ts
if computedEntry.compute is function -> keep
else if computedEntry.value exists -> convert to compute() => String(value)
else -> drop entry
```

**Outcome:** crash path removed while preserving intended computed-field rendering semantics.

## 5.2 TypeScript false-positive existence checks

**Symptom:** TS2774 on shared selector/action checks in runtime maps.

**Root cause:** `Record<string, Fn>` index signatures look always-defined to TypeScript.

**Fix:** switched to `hasOwnProperty` checks for explicit runtime existence semantics.

## 5.3 Test assertion mismatch in filter test

**Symptom:** initial Task 4 script failed on text filter assertion.

**Root cause:** expected string used slash-delimited action (`books/delete`) while event used dot-delimited DSL action (`books.delete`).

**Fix:** corrected test literal and captured passing output.

## 6. Integration Diagram

```text
User Event (widget)
   |
   v
CardRenderer.emit/runNodeAction
   |
   +--> RuntimeDebugHooks: ui.emit / ui.inlineAction
   |
   v
executeCommand
   |
   +--> RuntimeDebugHooks: command.resolveArgs*
   |
   v
selector resolution + action execution
   |
   +--> RuntimeDebugHooks: selector.resolve / action.execute* / state.mutation
   |
   v
Redux dispatch wrapper in HyperCardShell
   |
   +--> RuntimeDebugHooks: redux.dispatch*
   |
   v
App hook adapter (useRuntimeDebugHooks)
   |
   v
debugSlice.ingestEvent -> RuntimeDebugPane
```

## 7. Validation Matrix

Primary validation commands used repeatedly:

- `npm run typecheck`
- `npm run -w apps/book-tracker-debug build`
- `npm run -w apps/inventory build-storybook`
- `npm exec -y tsx ttmp/.../scripts/02-runtime-debug-hooks-and-debug-slice-tests.mjs`

What each protects:

- `typecheck`: symbol wiring and API consistency across engine/apps.
- app build: production compile viability of new workspace.
- Storybook build: story discoverability and render-time integration of refactors.
- script tests: runtime/debug data-path behavior invariants.

## 8. What Worked Well

- Incremental task/commit progression kept changes reviewable.
- Hook model gave immediate visibility into DSL runtime internals.
- App-level debug reducer remained simple and predictable.
- Storybook-first verification caught integration issues early.
- Ticket hygiene (tasks/changelog/diary/scripts) made implementation auditable.

## 9. What Was Costly or Fragile

- Inline style-heavy debug pane is fast to ship but less themeable.
- Large event payloads can pressure rendering without virtualization.
- Filter semantics are string-based and can be brittle for naming mismatches.
- Event schema is not versioned yet.

## 10. Reusable Patterns Established

- **Engine emits, app stores:** a clean separation for observability features.
- **Layout profile flagging:** `layoutMode` for app-specific shell behavior.
- **Card modularization:** one-file-per-card avoids stack-file sprawl.
- **Ticket script evidence:** reproducible tests alongside design artifacts.

## 11. Follow-up Recommendations

- Add event schema version and compatibility policy.
- Add optional payload-size guardrails and sampling controls.
- Add virtualized event list rendering once event volume grows.
- Add keyboard shortcuts for pane toggle/filter focus.
- Consider extracting reusable debug reducer/helpers into engine utilities once two or more apps adopt the pattern.

## 12. Closing Assessment

HC-018 achieved its technical objective: a DSL-driven app that is operationally transparent at runtime. The implementation now includes both architecture and delivery-grade artifacts: engine hooks, app profile, reusable UI primitive, story coverage, and executable tests.

The key outcome is not just a new app, but a repeatable observability pattern for all future CardDefinition DSL applications.
