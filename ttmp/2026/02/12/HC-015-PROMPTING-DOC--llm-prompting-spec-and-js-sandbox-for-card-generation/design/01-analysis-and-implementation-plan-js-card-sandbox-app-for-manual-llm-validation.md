---
Title: 'Analysis and Implementation Plan: JS Card Sandbox App for Manual LLM Validation'
Ticket: HC-015-PROMPTING-DOC
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Core runtime shell to host previewed cards
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/CardRenderer.tsx
      Note: Renderer delegation model for custom card behavior
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/dsl/types.ts
      Note: Schema baseline for validating generated stacks and cards
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/actionRegistry.ts
      Note: Domain action integration target for generated runtime glue
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/overrides/cardRenderers.ts
      Note: Existing app-level renderer wiring pattern that sandbox should mirror
ExternalSources: []
Summary: "Exhaustive feasibility analysis and implementation plan for a manual JS card sandbox app where generated code can be pasted, edited, executed, validated, and inspected safely."
LastUpdated: 2026-02-12T17:19:51-05:00
WhatFor: "Define what it takes to build a practical card playground for manual LLM output validation."
WhenToUse: "Use for planning and executing HC-015 sandbox implementation work."
---

# Analysis and Implementation Plan: JS Card Sandbox App for Manual LLM Validation

## 1. Objective

Design an app where a developer can paste/edit generated JS or DSL snippets, run them immediately, and inspect behavior before committing changes to the repository.

Primary use case:

1. generate candidate card code with LLM
2. paste into sandbox
3. validate structure and runtime behavior
4. iterate quickly
5. only then apply to production app code

## 2. Why This Is Worth Building

Today, generated code feedback loops are slow:

- apply patch into repo
- run typecheck/build
- run app and click around
- undo/redo failed generations

A dedicated sandbox cuts this down to seconds and isolates generated code risk.

Benefits:

1. faster human-in-the-loop refinement
2. safer experimentation with generated JS
3. deterministic preflight checks (schema, action wiring, navigation targets)
4. better artifact capture for prompt tuning

## 3. Product Requirements

## 3.1 Functional Requirements

1. Paste/edit DSL stack snippets and/or JS renderer/action snippets.
2. Live preview current card in HyperCard shell context.
3. Validate generated artifacts against static checks.
4. Show compile/runtime errors with line references.
5. Provide event/action log for interaction tracing.
6. Export validated patch bundle for repo application.

## 3.2 Non-Functional Requirements

1. Safe execution boundary for untrusted generated JS.
2. Fast edit->run cycle (<1s for small snippets target).
3. Deterministic state reset for repeatable testing.
4. No impact on production app bundles.

## 4. Scope Model

Define explicit scope tiers to avoid overbuilding.

### Tier 1 (MVP)

1. DSL-only mode:
- edit `cards` and `data` JSON/TS object snippets
- preview with existing renderer map

2. JS action mode:
- edit action registry snippet
- dispatch test actions

3. static validation panel:
- card type validity
- navigation target existence
- domain action coverage

### Tier 2

1. custom renderer snippet execution
2. mock domain state editor
3. scenario scripts (click sequence replay)

### Tier 3

1. prompt execution integrated in app
2. automatic diff generation against real files
3. one-click patch export

## 5. Architecture Options

## Option A: Browser-only sandbox (recommended MVP)

Components:

1. Monaco editor(s)
2. Web Worker running transpile/validation
3. Isolated iframe for runtime rendering
4. postMessage bridge for logs/events

Pros:

- fastest iteration
- no backend dependency
- easiest local dev

Cons:

- careful sandbox hardening required
- module resolution needs in-browser strategy

## Option B: Server-side execution service

Components:

1. editor frontend
2. backend compile/execute endpoint
3. streamed logs/preview state

Pros:

- stronger process isolation
- simpler frontend runtime

Cons:

- more infra complexity
- slower loop
- harder offline/local usage

## Option C: Hybrid

- compile in worker, execute in iframe, fallback backend for heavy checks

Recommended path: Option A for MVP, optional C later.

## 6. Recommended Technical Design

## 6.1 New Workspace App

Create `apps/cardlab` with Vite + React.

Major modules:

1. `editor/`
- code panes (DSL, renderer, action registry)

2. `runtime/`
- iframe host
- bridge messages
- state reset

3. `validation/`
- static analyzers
- schema checks
- action coverage checks

4. `export/`
- patch bundle serialization

## 6.2 Runtime Contract for User Code

Require generated user snippet to export known symbols:

```ts
export const stackPatch = { ... }
export const actionRegistryPatch = { ... }
export const rendererPatch = { ... }
```

Avoid arbitrary imperative entry points in MVP.

Why:

- easier static validation
- less risky execution model
- clearer merge semantics

## 6.3 Execution Isolation Strategy

1. compile snippet in worker
2. send validated module text to iframe
3. iframe executes with constrained global surface
4. deny direct access to host `window.top`
5. communicate only via structured postMessage channel

Hardening checklist:

- CSP disallow remote script/network in sandbox frame (unless explicitly enabled)
- no eval unless transpiler/runtime absolutely requires and is constrained
- freeze exposed API objects

## 7. Validation Engine Design

## 7.1 Static Checks (before execution)

1. card types are valid
2. all `navigate.card` targets exist
3. all non-built-in actions mapped in action registry
4. data source tables exist
5. prohibited tokens absent (`eval`, `Function`, unknown imports)

## 7.2 Structural Checks

1. required exports exist (`stackPatch` etc.)
2. exported values are objects with expected shape
3. no unexpected top-level side-effect code in strict mode

## 7.3 Runtime Checks

1. render current card succeeds
2. dispatching sample actions does not crash
3. state reset reproducibility

Display results in three-state severity:

- error (blocking)
- warning (non-blocking)
- info

## 8. UI Layout Proposal

Split-pane layout:

1. Left: editors + snippet templates
2. Middle: live preview (HyperCardShell embedding)
3. Right: diagnostics and action/event timeline

Top toolbar:

- mode selector (DSL, Actions, Renderers)
- Run/Validate
- Reset State
- Export Patch

Bottom panel:

- logs
- recent dispatch list
- current navigation stack snapshot

## 9. Data and State Model in Sandbox

1. Base stack from chosen reference app (inventory or todo).
2. Apply patch overlays in memory.
3. Build temporary runtime store:
- navigation + notifications reducers from engine
- optional sample domain slices

Patch application order:

1. stack patch
2. action registry patch
3. renderer patch

If patch fails at any stage, preserve last good state and show diagnostics.

## 10. What It Takes to Implement (Effort Breakdown)

## Phase 0: Planning and Guardrails (1-2 days)

1. finalize runtime contract for snippets
2. decide editor format (TS vs JS only)
3. define validation severity and blocking rules

## Phase 1: MVP Sandbox (4-6 days)

1. scaffold `apps/cardlab`
2. implement DSL patch editor + preview
3. implement static validation checks
4. add diagnostics panel and action log

## Phase 2: JS Patch Support (4-6 days)

1. action registry patch support
2. renderer patch support
3. stronger isolation and forbidden API scanning

## Phase 3: Export + Workflow Integration (2-4 days)

1. patch bundle export
2. prompt/response artifact save
3. copy-ready patch text for repo application

Rough total: 10-18 engineering days depending on security hardening depth.

## 11. Risks and Mitigations

## Risk 1: Executing generated JS is unsafe

Mitigation:

1. strict export contract
2. isolate in iframe
3. static forbidden-pattern checks
4. optional "DSL-only mode" for safer default

## Risk 2: Sandbox diverges from real app runtime

Mitigation:

1. reuse actual engine components
2. import real renderer map and base stack from existing apps
3. include "run in target app" handoff instructions

## Risk 3: False confidence from shallow checks

Mitigation:

1. include interaction scripts and action assertions
2. keep explicit "sandbox passed, production unverified" label

## Risk 4: Too much flexibility early

Mitigation:

1. start with patch-object contract
2. delay arbitrary imperative hooks
3. gate advanced mode behind explicit toggle

## 12. Integration with Prompting Workflow

Recommended loop:

1. run LLM with HC-015 prompting spec
2. parse JSON output
3. auto-fill sandbox editors from `code_blocks`
4. run validation
5. run manual clickthrough
6. export accepted patch

This turns the sandbox into a practical verifier, not just a playground.

## 13. Suggested Ticket Decomposition After HC-015

1. `HC-016-CARDLAB-MVP`
- scaffold app + DSL patch live preview

2. `HC-017-CARDLAB-JS-PATCH`
- action/renderer patch execution support

3. `HC-018-CARDLAB-SECURITY`
- hardening and forbidden API enforcement

4. `HC-019-CARDLAB-EXPORT`
- patch export and artifact capture

## 14. Acceptance Criteria

1. Developer can paste stack patch and see preview update.
2. Validation catches at least core structural issues before runtime.
3. JS patch mode can update action registry safely.
4. Errors are localized and readable.
5. Accepted patch can be exported for repository integration.

## 15. Recommended MVP Decision

Build the app with a strict, object-export-based patch contract first.

Do not start with fully arbitrary JS execution as the primary mode.

Reason:

- easier to make safe
- easier to validate deterministically
- aligns with prompt output contract
- still supports iterative manual LLM validation

Once this baseline is stable, layer on advanced JS execution for edge cases.
