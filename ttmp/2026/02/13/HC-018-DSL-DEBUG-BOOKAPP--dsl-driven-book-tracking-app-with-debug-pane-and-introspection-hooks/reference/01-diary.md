---
Title: Diary
Ticket: HC-018-DSL-DEBUG-BOOKAPP
Status: active
Topics:
    - frontend
    - architecture
    - redux
    - debugging
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/book-tracker-debug/src/App.tsx
      Note: Task 2/3 debug shell profile wiring and debug-pane layout mode usage (commits fa65b66
    - Path: apps/book-tracker-debug/src/debug/DebugPane.tsx
      Note: Task 2 collapsible timeline/details/state inspector UI (commit fa65b66)
    - Path: apps/book-tracker-debug/src/debug/debugSlice.ts
      Note: Task 2/4 debug event ring buffer and filtering model (commits fa65b66
    - Path: apps/book-tracker-debug/src/debug/useRuntimeDebugHooks.ts
      Note: Task 2 hook adapter and Task 4 sanitizer export for tests (commits fa65b66
    - Path: packages/engine/src/cards/index.ts
      Note: Task 1 exported runtime debug hook API surface (commit 3a0976a)
    - Path: packages/engine/src/cards/runtime.ts
      Note: Task 1 runtime debug event types/hooks and selector/action instrumentation (commit 3a0976a)
    - Path: packages/engine/src/components/shell/CardRenderer.tsx
      Note: Task 1 widget emit boundary debug events (commit 3a0976a)
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: |-
        Task 1 shell dispatch/context debug hook wiring (commit 3a0976a)
        Task 3 added debugPane layout mode and no-tab shell variant (commit e5c0d48)
    - Path: ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/design/01-debug-pane-and-introspection-system-implementation-guide.md
      Note: |-
        Main implementation guide written in this ticket.
        Detailed analysis and implementation guide delivered in Step 1 and published in Step 2.
    - Path: ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/index.md
      Note: |-
        Ticket index updated with links to design and script evidence.
        Ticket index linking design and evidence artifacts.
    - Path: ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/01-debug-event-pipeline-simulation.mjs
      Note: |-
        Prototype script used to validate event retention/redaction/filtering behavior.
        Prototype event pipeline model used to validate debug architecture assumptions.
    - Path: ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/01-debug-event-pipeline-simulation.out.txt
      Note: |-
        Captured output for the debug-event pipeline simulation.
        Output evidence for ring-buffer/redaction/filtering behavior.
    - Path: ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/02-runtime-debug-hooks-and-debug-slice-tests.mjs
      Note: Task 4 executable validation script
    - Path: ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/02-runtime-debug-hooks-and-debug-slice-tests.out.txt
      Note: Task 4 captured pass output evidence
    - Path: ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/tasks.md
      Note: |-
        Task checklist updated with analysis completion and future implementation backlog.
        Backlog and completion tracking for the debug-pane initiative.
ExternalSources: []
Summary: Step-by-step diary for creating HC-018 ticket, producing debug-pane/introspection architecture guidance, and publishing the deliverable.
LastUpdated: 2026-02-13T12:08:00-05:00
WhatFor: Record execution details, decisions, and validation outputs for the debug-pane planning work.
WhenToUse: Use when reviewing how the HC-018 design package was produced and what commands/artifacts back it.
---




# Diary

## Goal

Capture the complete sequence for creating HC-018, producing a detailed debug-pane/introspection implementation guide for the DSL engine, validating a prototype event pipeline, and publishing the design output.

## Step 1: Ticket Creation, Analysis Authoring, and Prototype Validation

I created a new ticket dedicated to a DSL-driven Book Tracking app with a collapsible debug pane and runtime introspection hooks, then authored a comprehensive design and implementation guide that maps current engine runtime behavior to a practical observability architecture. The guide includes concrete integration points, hook APIs, UI architecture, rollout phases, risk analysis, and testing strategy.

To support the analysis with evidence, I added a runnable prototype script in the ticket `scripts/` folder to simulate debug event ingestion (ring buffer retention, redaction, filtering) and captured the output for reference.

### Prompt Context

**User prompt (verbatim):** "Create a ticket to create a DSL driven book tracking application. Instead of the 3 tabs we have now, have a debug pane (collapseable) where we can track all the actions dispatched by the app, the cards, the state, etc...

That will probably require some way to expose hooks form the DSL engine to support introspection and debugging. 

Create the new document and create a detailed analysis and implementation guide on how to build the debug pane and debugging/introspection systems.

Be detailed. Then upload to remarkable. Keep a diary."

**Assistant interpretation:** Create a fresh ticket, produce a deep technical design for a debug-pane-first DSL Book Tracking app, include implementation-level hook architecture, and publish the document.

**Inferred user intent:** Establish a serious implementation-ready plan for observability tooling in the DSL engine and shell so future development/debugging is much easier.

**Commit (code):** fdddde4 — "docs(ticket): create HC-018 debug-pane introspection design package"

### What I did

- Created ticket:
- `docmgr ticket create-ticket --ticket HC-018-DSL-DEBUG-BOOKAPP --title "DSL-Driven Book Tracking App with Debug Pane and Introspection Hooks" --topics frontend,architecture,redux,debugging`
- Added docs:
- `design/01-debug-pane-and-introspection-system-implementation-guide.md`
- `reference/01-diary.md`
- Gathered current runtime integration points from:
- `HyperCardShell.tsx`
- `CardRenderer.tsx`
- `runtime.ts`
- `runtimeStateSlice.ts`
- `navigationSlice.ts`
- `TabBar.tsx`
- Authored full design guide covering:
- debug pane UX
- introspection event taxonomy
- hook API proposal
- file-level implementation plan
- pseudocode and diagrams
- testing and risk model
- Added prototype experiment artifacts:
- `scripts/01-debug-event-pipeline-simulation.mjs`
- `scripts/01-debug-event-pipeline-simulation.out.txt`
- Updated ticket bookkeeping:
- `tasks.md`
- `index.md`

### Why

- The current shell layout is optimized around AI-panel views, but the new requirement is runtime transparency and fast debugging loops. A deliberate introspection architecture is required rather than ad-hoc logging.

### What worked

- New ticket and document structure created cleanly.
- Event-pipeline prototype script validated retention/redaction/filter behavior.
- Design guide now provides concrete implementation direction with minimal ambiguity.

### What didn't work

- N/A

### What I learned

- The strongest instrumentation points are inside shell/runtime boundaries, not only Redux middleware, because DSL-level semantics happen before many Redux actions are dispatched.

### What was tricky to build

- Balancing engine-level hook design with app-level debug UI ownership required a strict boundary: engine emits normalized events, app stores/renders them.

### What warrants a second pair of eyes

- Event schema versioning and payload sanitization defaults should be reviewed carefully before implementation starts, to prevent later incompatibilities and accidental sensitive-data leakage.

### What should be done in the future

- Implement `RuntimeDebugHooks` in engine and build the new debug-pane app profile per the phased plan in the design doc.

### Code review instructions

- Start with `design/01-debug-pane-and-introspection-system-implementation-guide.md`.
- Review prototype behavior from `scripts/01-debug-event-pipeline-simulation.mjs` and output log.
- Confirm task/index updates in `tasks.md` and `index.md`.

### Technical details

- Prototype validation command:
- `set -o pipefail; npm exec -y tsx ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/01-debug-event-pipeline-simulation.mjs | tee ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/01-debug-event-pipeline-simulation.out.txt`
- Result: all assertions passed (`ring buffer`, `redaction`, `truncation`, `filtering`).


## Step 2: reMarkable Upload and Ticket Finalization

After committing the initial ticket package, I uploaded the design guide to reMarkable under the ticket-specific folder and verified the remote listing. I then updated task tracking to mark upload complete and prepared final changelog/diary bookkeeping.

This step confirms the deliverable is not only stored in-repo but also published to the requested reading surface.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Publish the created guide to reMarkable and keep ticket records up to date.

**Inferred user intent:** Ensure the architecture guide is available both in ticket docs and on the tablet workflow.

**Commit (code):** N/A (docs finalization commit recorded after this step)

### What I did

- Ran upload dry-run:
- `remarquee upload md --dry-run .../design/01-debug-pane-and-introspection-system-implementation-guide.md --remote-dir /ai/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP --non-interactive`
- Ran real upload:
- `remarquee upload md .../design/01-debug-pane-and-introspection-system-implementation-guide.md --remote-dir /ai/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP --non-interactive`
- Verified remote listing:
- `remarquee cloud ls /ai/2026/02/13 --long --non-interactive`
- `remarquee cloud ls /ai/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP/ --long --non-interactive`
- Updated `tasks.md` to mark upload task complete.

### Why

- The user requested explicit publication to reMarkable after document creation.

### What worked

- Upload succeeded:
- `OK: uploaded 01-debug-pane-and-introspection-system-implementation-guide.pdf -> /ai/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP`
- Remote folder contains:
- `01-debug-pane-and-introspection-system-implementation-guide`

### What didn't work

- One listing command without trailing slash failed:
- `remarquee cloud ls /ai/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP --long --non-interactive`
- Error: `no matches for 'HC-018-DSL-DEBUG-BOOKAPP'`
- Retrying with trailing slash succeeded.

### What I learned

- `remarquee cloud ls` can be path-format sensitive for some nested folder lookups; using a trailing slash is safer for verification.

### What was tricky to build

- Ensuring deterministic upload verification required checking parent directory and then child directory explicitly when the first direct lookup returned no match.

### What warrants a second pair of eyes

- None required for upload behavior itself; implementation risk remains in future engine hook coding, not publication.

### What should be done in the future

- Proceed to implementation tasks in `tasks.md` (engine hook plumbing + debug pane UI build).

### Code review instructions

- Verify upload command/output and cloud listing.
- Confirm task completion toggle in `tasks.md`.

### Technical details

- Remote upload target:
- `/ai/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP`
- Uploaded document basename:
- `01-debug-pane-and-introspection-system-implementation-guide`


## Step 3: Implement Runtime Debug Hook Plumbing (Task 1)

I started execution of the implementation backlog by finishing the first open engineering task: adding a concrete runtime introspection hook surface to the engine and threading it through selector resolution, action execution, UI emit boundaries, and Redux dispatch boundaries.

This step intentionally kept hooks optional and non-invasive: if no `debugHooks` are passed, runtime behavior remains unchanged. The result is an opt-in instrumentation layer that can feed the upcoming debug pane without forcing architecture changes on non-debug consumers.

### Prompt Context

**User prompt (verbatim):** "Now implement it, step by step, task by task, committing as you go, keeping a diary."

**Assistant interpretation:** Execute the ticket's remaining implementation tasks in order, with focused commits and continuous diary updates.

**Inferred user intent:** Move from planning docs to actual working code with traceable milestones.

**Commit (code):** 3a0976a — "feat(engine): add RuntimeDebugHooks instrumentation plumbing"

### What I did

- Added runtime hook model in `packages/engine/src/cards/runtime.ts`:
- `RuntimeDebugEvent`
- `RuntimeDebugHooks`
- `RuntimeDebugContext`
- `RuntimeDebugEventInput`
- `emitRuntimeDebugEvent(...)`
- Instrumented selector resolution in `createSelectorResolver(...)` to emit `selector.resolve` events with scope, args, and timing.
- Instrumented command/action path:
- `executeCommand(...)` emits argument-resolution timing events.
- `executeActionDescriptor(...)` emits start/end/error events plus `state.mutation` events for scoped state built-ins.
- Added async-action completion/error handling to preserve meaningful action lifecycle events.
- Updated shell wiring in `packages/engine/src/components/shell/HyperCardShell.tsx`:
- Added optional `debugHooks?: RuntimeDebugHooks` on `HyperCardShellProps`.
- Wrapped context dispatch/nav/toast dispatches with `redux.dispatch.*` debug events.
- Passed debug hooks into selector/action runtime helpers.
- Updated renderer boundary in `packages/engine/src/components/shell/CardRenderer.tsx`:
- Added optional runtime `debugEvent(...)`.
- Emit `ui.emit` and `ui.inlineAction` events before runtime execution.
- Exported hook types/util from `packages/engine/src/cards/index.ts`.
- Ran typecheck:
- `npm run typecheck`

### Why

- The debug pane planned in HC-018 needs first-class observability events from DSL runtime boundaries, not only raw Redux actions.

### What worked

- Hook plumbing compiled cleanly and remained opt-in.
- Task checklist item for Task 1 is now marked complete in `tasks.md`.

### What didn't work

- `npm run -w packages/engine build` failed because no workspace build script exists:
- `npm error Missing script: "build"`
- Initial typecheck failed once with:
- `packages/engine/src/cards/runtime.ts(...): error TS2774: This condition will always return true...`
- Cause: `Record<string, Fn>` index signatures were treated as always-defined.
- Fix: switched to explicit `hasOwnProperty` checks before resolving shared selectors/actions.

### What I learned

- For `Record<string, Fn>` maps, runtime existence checks should use `hasOwnProperty` to avoid false positives in both typing and debug event semantics.

### What was tricky to build

- Ensuring instrumentation catches both sync and async action handlers without changing existing call signatures required promise-like detection and asynchronous finalize/error event emission.

### What warrants a second pair of eyes

- Payload size and privacy controls: current event payloads include resolved args/value snapshots; the later pane integration should verify sanitization defaults are strict enough for real datasets.

### What should be done in the future

- Implement Task 2: build the collapsible debug pane UI and event reducer in the new DSL-driven Book Tracking app.

### Code review instructions

- Start with `packages/engine/src/cards/runtime.ts`.
- Then review shell integration in `packages/engine/src/components/shell/HyperCardShell.tsx`.
- Confirm renderer boundary events in `packages/engine/src/components/shell/CardRenderer.tsx`.
- Validate compile with:
- `npm run typecheck`

### Technical details

- Commit:
- `git commit -m "feat(engine): add RuntimeDebugHooks instrumentation plumbing"`
- Validation:
- `npm run typecheck`
- Task bookkeeping:
- `docmgr task check --ticket HC-018-DSL-DEBUG-BOOKAPP --id 5`


## Step 4: Build DSL-Driven Book Tracker Debug App and Collapsible Pane (Task 2)

I implemented a dedicated `apps/book-tracker-debug` workspace that runs a full book-tracking flow using CardDefinition DSL widgets and a live collapsible debug pane. This converts the planning work into a runnable app profile with practical observability.

I also fixed the rendering crash path the user reported (`cf.compute is not a function`) by hardening detail computed-field handling in `CardRenderer` so malformed/non-function computed entries no longer crash rendering.

### Prompt Context

**User prompt (verbatim):** (same as Step 3)

**Assistant interpretation:** Continue implementation by delivering the debug-pane app and core UI instrumentation behavior.

**Inferred user intent:** Validate end-to-end DSL capability in a real app while having first-class runtime visibility.

**Commit (code):** fa65b66 — "feat(book-tracker-debug): add DSL app with collapsible debug pane"

### What I did

- Created new workspace app:
- `apps/book-tracker-debug/package.json`
- `apps/book-tracker-debug/tsconfig.json`
- `apps/book-tracker-debug/vite.config.ts`
- `apps/book-tracker-debug/index.html`
- Added full app structure:
- `src/main.tsx`
- `src/App.tsx`
- `src/app/store.ts`
- `src/app/cardRuntime.ts`
- `src/domain/stack.ts`
- `src/domain/types.ts`
- `src/features/books/*`
- `src/debug/*`
- `src/stories/BookTrackerDebugApp.stories.tsx`
- Built `debugSlice` ring-buffer event storage with filtering and selection controls.
- Built `DebugPane` with:
- collapsible behavior
- event timeline
- selected-event JSON detail
- state inspector snapshot
- kind/text filters and clear action
- Added `useRuntimeDebugHooks` adapter to bridge engine `RuntimeDebugHooks` into app debug reducer.
- Integrated Storybook stories for this app and wired story discovery in:
- `apps/inventory/.storybook/main.ts`
- Added new app to root TypeScript project references in:
- `tsconfig.json`
- Fixed DetailView crash path by normalizing `node.computed` entries before passing to `DetailView`:
- `packages/engine/src/components/shell/CardRenderer.tsx`
- Validation run:
- `npm run typecheck`
- `npm run -w apps/book-tracker-debug build`
- `npm run -w apps/inventory build-storybook`

### Why

- Task 2 required a concrete UI debug surface and not just runtime hook plumbing. A dedicated app profile is the fastest way to verify behavior under realistic interactions.

### What worked

- New app builds and Storybook includes the new debug app stories.
- Full book flow is represented in DSL cards and shared actions/selectors.
- Debug pane collects and displays emitted runtime events.
- Storybook static build succeeded with the new stories included.

### What didn't work

- N/A for this step after the final patch set; validations passed.

### What I learned

- A lightweight app-scoped reducer is enough for useful introspection without coupling engine internals to a specific debug UI implementation.

### What was tricky to build

- Ensuring the detail widget stayed resilient under resolved DSL payloads required normalization logic rather than trusting every `computed` item to carry a callable `compute`.

### What warrants a second pair of eyes

- The `DebugPane` currently renders full JSON snapshots; for very large states, virtualization or selective subtree rendering may be desirable.

### What should be done in the future

- Implement Task 3 by removing legacy 3-tab layout for this app profile and using a dedicated debug-pane shell mode.

### Code review instructions

- Start from `apps/book-tracker-debug/src/App.tsx` and `apps/book-tracker-debug/src/debug/DebugPane.tsx`.
- Review DSL book cards in `apps/book-tracker-debug/src/domain/stack.ts`.
- Check robustness patch in `packages/engine/src/components/shell/CardRenderer.tsx`.
- Re-run:
- `npm run typecheck`
- `npm run -w apps/inventory build-storybook`

### Technical details

- Commit:
- `git commit -m "feat(book-tracker-debug): add DSL app with collapsible debug pane"`
- Storybook story registration:
- `apps/inventory/.storybook/main.ts`


## Step 5: Replace Legacy Tab Layout with Debug-Pane Shell Mode (Task 3)

I added a new shell layout variant so the Book Tracker debug profile can run without the legacy `split/drawer/cardChat` tab bar. This cleanly separates observability-first app mode from the older AI-panel-oriented mode.

The change is backward-compatible for existing consumers because the default remains `legacyTabs`; the new mode is opt-in via props.

### Prompt Context

**User prompt (verbatim):** (same as Step 3)

**Assistant interpretation:** Continue backlog execution by replacing 3-tab layout for the new profile.

**Inferred user intent:** Use a dedicated debug-pane UX instead of tabbed shell layout in the new Book Tracker app.

**Commit (code):** e5c0d48 — "feat(shell): add debug-pane layout mode without legacy tabs"

### What I did

- Extended `HyperCardShellProps`:
- `layoutMode?: 'legacyTabs' | 'debugPane'`
- `renderDebugPane?: (dispatch) => ReactNode`
- Implemented debug-pane branch in shell layout resolution:
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- In debug-pane mode:
- no top layout tab bar
- side pane rendered through `renderDebugPane`
- title/footer reflect debug mode
- Updated Book Tracker debug app to use new shell mode:
- `apps/book-tracker-debug/src/App.tsx`
- `apps/book-tracker-debug/src/stories/BookTrackerDebugApp.stories.tsx`
- Validation run:
- `npm run typecheck`
- `npm run -w apps/book-tracker-debug build`
- `npm run -w apps/inventory build-storybook`

### Why

- Task 3 explicitly required replacing legacy 3-tab shell behavior for this profile with debug-pane-first layout.

### What worked

- Debug profile now runs in dedicated debug-pane mode.
- Existing shells retain legacy behavior by default.

### What didn't work

- N/A in this step; validations succeeded.

### What I learned

- Keeping layout mode as an explicit prop makes feature-specific shell behavior straightforward without branching app forks.

### What was tricky to build

- Preserving default behavior while introducing a new top-level layout contract required careful prop defaults and minimal existing branch disruption.

### What warrants a second pair of eyes

- UX sizing for debug pane on narrow screens may need follow-up tuning.

### What should be done in the future

- Implement Task 4 validation scripts covering hook emission + reducer behavior.

### Code review instructions

- Review `HyperCardShell` layout branch changes in:
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- Confirm profile usage in:
- `apps/book-tracker-debug/src/App.tsx`
- `apps/book-tracker-debug/src/stories/BookTrackerDebugApp.stories.tsx`

### Technical details

- Commit:
- `git commit -m "feat(shell): add debug-pane layout mode without legacy tabs"`


## Step 6: Add Runtime/Reducer Validation Tests in Ticket Scripts (Task 4)

I added a dedicated executable validation script in the ticket `scripts/` directory to test runtime hook emission, debug reducer ring-buffer retention/filtering, and payload redaction/truncation behavior. This aligns with the explicit requirement to keep experiments/tests in ticket scripts.

I captured both an initial failing run and the final passing run. The failing assertion surfaced a realistic filter-string mismatch (`books/delete` vs `books.delete`) and was corrected directly in the test.

### Prompt Context

**User prompt (verbatim):** (same as Step 3)

**Assistant interpretation:** Finish the backlog with concrete tests and preserve evidence artifacts under ticket scripts.

**Inferred user intent:** Ensure debug architecture is validated beyond manual UI checks.

**Commit (code):** d51172d — "test(debug): add HC-018 runtime/debug-state validation script"

### What I did

- Exported sanitizer utility for direct testing:
- `apps/book-tracker-debug/src/debug/useRuntimeDebugHooks.ts`
- Added executable test script:
- `ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/02-runtime-debug-hooks-and-debug-slice-tests.mjs`
- Added captured output:
- `ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/02-runtime-debug-hooks-and-debug-slice-tests.out.txt`
- Script coverage:
- runtime selector/action hook emission
- ring-buffer retention
- kind/text filtering behavior
- sanitization redaction/truncation
- Ran script:
- `npm exec -y tsx .../02-runtime-debug-hooks-and-debug-slice-tests.mjs | tee .../02-runtime-debug-hooks-and-debug-slice-tests.out.txt`
- Ran full validation again:
- `npm run typecheck`
- `npm run -w apps/book-tracker-debug build`
- `npm run -w apps/inventory build-storybook`

### Why

- Task 4 required explicit tests for hook emission + data pipeline behavior and the project asked to keep tests/experiments in ticket scripts.

### What worked

- Final test script run passed all checks.
- Root typecheck, app build, and Storybook build all passed after test-related changes.

### What didn't work

- First script run failed with:
- `AssertionError [ERR_ASSERTION]: text filter should match payload/action strings`
- Cause: test expected `books/delete`, while filterable action key is `books.delete`.
- Fix: adjusted test filter literal to `books.delete`.

### What I learned

- Debug search expectations must align with normalized action naming (`.`-delimited action types vs `/`-delimited Redux action type strings).

### What was tricky to build

- Writing stable tests across runtime + app-level modules required careful isolation of each boundary while still covering the integrated behavior chain.

### What warrants a second pair of eyes

- If filter semantics should support punctuation normalization (e.g., slash vs dot), we may want explicit normalization in reducer selectors later.

### What should be done in the future

- Ticket can be closed after final documentation/review confirmation.

### Code review instructions

- Run the script directly from repo root:
- `npm exec -y tsx ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/02-runtime-debug-hooks-and-debug-slice-tests.mjs`
- Check captured output file next to script.
- Review sanitizer export and reducer selectors:
- `apps/book-tracker-debug/src/debug/useRuntimeDebugHooks.ts`
- `apps/book-tracker-debug/src/debug/debugSlice.ts`

### Technical details

- Commit:
- `git commit -m "test(debug): add HC-018 runtime/debug-state validation script"`
