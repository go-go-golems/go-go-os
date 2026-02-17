---
Title: Diary
Ticket: HC-041-REDUX-FPS-DEBUG
Status: active
Topics:
    - debugging
    - frontend
    - performance
    - redux
    - developer-experience
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Step-by-step implementation diary for HC-041: Redux throughput/FPS diagnostics middleware and dev HyperCard window."
LastUpdated: 2026-02-17T08:41:40.019504409-05:00
WhatFor: "Track implementation progress, decisions, issues, and review instructions for HC-041."
WhenToUse: "Use when reviewing, continuing, or onboarding on HC-041 diagnostics work."
---

# Diary

## Goal

Capture the full implementation journey for HC-041: adding a generic Redux throughput/FPS diagnostics middleware to the engine, wiring it into the store factory, and building a live HyperCard dev window for the inventory app.

## Step 1: Phase 1 — Engine diagnostics primitives (Tasks 5–17)

Created the entire `packages/engine/src/diagnostics/` module with all core types, data structures, middleware, frame monitor, Redux slice, and selectors. This establishes the engine-level infrastructure that all downstream work depends on.

### Prompt Context

**User prompt (verbatim):** "Implement docmgr ticket HC-041-REDUX-FPS-DEBUG, work task by task, commit at each task, keep a frequent diary."

**Assistant interpretation:** Implement the full ticket following the design doc and task list, committing incrementally and maintaining a diary of progress.

**Inferred user intent:** Get the complete HC-041 diagnostics system implemented with a traceable commit history and documentation trail.

**Commit (code):** c285f0d — "HC-041: Phase 1 — add diagnostics module (types, ring buffer, middleware, frame monitor, slice, selectors)"

### What I did
- Created `types.ts` with `ReduxPerfEvent`, `ReduxPerfSnapshot`, `FrameEvent`, `DiagnosticsConfig`, and defaults.
- Created `ringBuffer.ts` with a bounded, Immer-safe ring buffer (push, windowSince, toArray, clear).
- Created `reduxPerfMiddleware.ts` that times every dispatch, detects state changes via referential equality, and records events. Self-referencing actions (`recordPerfEvent`) are excluded to prevent infinite loops.
- Created `frameMonitor.ts` using `requestAnimationFrame` to measure inter-frame timing and dispatch `recordFrameEvent`.
- Created `reduxPerfSlice.ts` with ring buffers for events+frames, config, pause/reset actions.
- Created `selectors.ts` with `selectReduxPerfSnapshot` computing rolling throughput, avg/p95 reducer ms, FPS, long-frame rate, and top action rates.
- Created `index.ts` barrel and exported from engine `src/index.ts`.

### Why
Phase 1 establishes the generic, reusable diagnostics core in the engine package. All other phases (store wiring, UI window, inventory integration) depend on these primitives.

### What worked
- Clean TypeScript compilation on both engine and inventory projects.
- Ring buffer design is simple (array + cursor) and Immer-compatible for Redux state.
- Self-dispatch exclusion pattern prevents middleware infinite loop cleanly.

### What didn't work
- N/A — straightforward implementation following the design doc.

### What I learned
- The existing `debugSlice` uses a similar bounded-array pattern (splice at capacity), confirming the ring-buffer approach is consistent with project conventions.
- The engine barrel re-exports everything via `export *`, so adding a new `diagnostics/` module only needs one line in `src/index.ts`.

### What was tricky to build
- The middleware must skip its own `recordPerfEvent` action type to avoid infinite recursion (dispatch → middleware → dispatch → …). Solved by checking `action.type === recordPerfEvent.type` before recording.

### What warrants a second pair of eyes
- The `selectReduxPerfSnapshot` selector recomputes on every `reduxPerf` state change. In high-throughput scenarios the UI should throttle reads (documented in selector JSDoc). Verify this doesn't create render pressure.

### What should be done in the future
- Add optional sampling mode (Task 48) for very high action rates to reduce overhead.

### Code review instructions
- Start at `packages/engine/src/diagnostics/index.ts` for the API surface.
- Review `reduxPerfMiddleware.ts` for the self-dispatch guard.
- Review `selectors.ts` for rolling-window math correctness.
- Validate: `npx tsc --noEmit -p packages/engine/tsconfig.json`

### Technical details
- Ring buffer capacity defaults: 2000 events, 600 frames.
- Long-frame threshold: 33.34ms (~30fps boundary).
- Default rolling window: 5000ms.
- p95 uses sorted-array index method: `sorted[ceil(n * 0.95) - 1]`.
