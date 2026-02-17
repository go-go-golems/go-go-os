---
Title: 'Implementation Plan: Redux Throughput/FPS Diagnostics Middleware and Dev Window'
Ticket: HC-041-REDUX-FPS-DEBUG
Status: active
Topics:
    - debugging
    - frontend
    - performance
    - redux
    - developer-experience
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: App-window routing and startup window bootstrap location for dev diagnostics window
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/app/store.ts
      Note: Inventory app store entrypoint that should enable diagnostics in dev mode
    - Path: 2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts
      Note: Primary store factory where generic middleware should be wired
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/RuntimeDebugPane.tsx
      Note: Existing debug UI shape that can inform diagnostics panel UX
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: renderAppWindow integration path for non-card app windows
    - Path: 2026-02-12--hypercard-react/packages/engine/src/debug/debugSlice.ts
      Note: Existing debug slice patterns and ring-buffer behavior references
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/types.ts
      Note: Window content kind and appKey structure used by diagnostics window
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts
      Note: openWindow action contract used to mount diagnostics as a HyperCard window
    - Path: apps/inventory/src/App.tsx
      Note: Startup auto-open and appKey route wiring for diagnostics window
    - Path: apps/inventory/src/app/store.ts
      Note: Inventory app dev-mode diagnostics enablement callsite
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Store factory integration point for diagnostics middleware and optional reducer
    - Path: packages/engine/src/components/shell/RuntimeDebugPane.tsx
      Note: Existing debug pane UX and layout patterns
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: renderAppWindow integration path for non-card windows
    - Path: packages/engine/src/debug/debugSlice.ts
      Note: Existing bounded debug-slice pattern used as reference
    - Path: packages/engine/src/features/windowing/types.ts
      Note: WindowContent kind/appKey contract
    - Path: packages/engine/src/features/windowing/windowingSlice.ts
      Note: openWindow action behavior and dedupe semantics
ExternalSources: []
Summary: |
    Implementation plan for a generic Redux throughput/FPS diagnostics setup: a dev-only instrumentation middleware + frame monitor + diagnostics state slice + a HyperCard app window that auto-opens on startup in Vite dev mode. The plan is structured so a new developer can implement without rediscovering architecture paths.
LastUpdated: 2026-02-17T09:10:00-05:00
WhatFor: |
    Enable reliable measurement of Redux event throughput and render performance regressions during high-frequency flows (chat streaming, dragging, runtime events) with minimal production impact.
WhenToUse: Use when implementing or reviewing HC-041 diagnostics instrumentation and dev debug window behavior.
---


# Implementation Plan: Redux Throughput/FPS Diagnostics Middleware and Dev Window

## Executive Summary

This ticket introduces a generic, reusable diagnostics system for Redux throughput and UI frame rate in development mode, plus a dedicated HyperCard diagnostics window that opens automatically at startup when running under Vite dev (`import.meta.env.DEV === true`).

The implementation should provide:

1. Store-level throughput metrics (`actions/sec`, `state updates/sec`, action-type rates).
2. Reducer-time metrics (`avg ms`, `p95 ms`, top slow actions).
3. UI frame metrics (`FPS`, long-frame count).
4. A live diagnostics window rendered as a normal HyperCard app window (`content.kind = 'app'`), not as an external overlay.
5. Zero production/runtime cost in non-dev mode.

This is designed as an engine-first capability with inventory app integration for the first rollout.

## Problem Statement

Current frontend performance analysis requires ad hoc logging and manual interpretation. We lack a generic, always-available dev tool to answer:

1. How many Redux actions per second are flowing right now?
2. Which action types dominate throughput?
3. Is reducer cost spiking under particular event streams?
4. Is UI FPS dropping while Redux throughput is high?

Without these metrics, optimization work (chat stream handling, drag handling, projection pipelines) is slow and less reliable.

## Context and Existing Architecture

### Store Factory Integration Point

`packages/engine/src/app/createAppStore.ts` currently calls `configureStore({ reducer })` without middleware customization. This is the safest generic insertion point for instrumentation.

### Inventory App Startup and Window Routing

`apps/inventory/src/App.tsx` already:

1. Opens windows on startup via `openWindow(...)` in `useEffect`.
2. Routes `appKey` values through `renderAppWindow(...)` to specific React components.

This is exactly the pattern needed for adding a diagnostics window.

### Windowing Contract

`openWindow` and windowing types already support app windows:

- `WindowContentKind = 'card' | 'app' | 'dialog'`
- `content: { kind: 'app', appKey: '...' }`

No schema changes are needed for hosting diagnostics.

### DEV-mode source of truth

For Vite builds/dev server, `import.meta.env.DEV` is `true` in `vite dev` and `false` in production build/preview runtime.

## Proposed Solution

## 1) Add a Generic Diagnostics Module (Engine)

Add a new engine diagnostics module that is independent of inventory domain logic.

Proposed new files:

```txt
packages/engine/src/diagnostics/
  reduxPerfMiddleware.ts
  frameMonitor.ts
  reduxPerfSlice.ts
  selectors.ts
  types.ts
  index.ts
```

Responsibilities:

- `reduxPerfMiddleware.ts`: measure per-action timing and throughput samples.
- `frameMonitor.ts`: collect FPS and long-frame stats using `requestAnimationFrame`.
- `reduxPerfSlice.ts`: bounded ring-buffer state + aggregated rolling metrics.
- `selectors.ts`: ready-to-render metrics for UI panel.

## 2) Wire Middleware via `createAppStore` (Engine)

Extend `createAppStore` with options so diagnostics can be enabled explicitly.

Proposed API:

```ts
interface CreateAppStoreOptions {
  enableReduxDiagnostics?: boolean;
  diagnosticsWindowMs?: number;
}

createAppStore(domainReducers, options?)
```

Rules:

1. Middleware and frame monitor only enabled when `enableReduxDiagnostics === true`.
2. Inventory app should set that option from `import.meta.env.DEV`.
3. Non-dev mode leaves behavior unchanged.

## 3) Add Dev Diagnostics Window Component (Inventory first)

Add an inventory-local first version of diagnostics window, rendered via appKey route in `App.tsx`.

Proposed file:

```txt
apps/inventory/src/features/debug/ReduxPerfWindow.tsx
```

Window behavior:

1. Shows current rolling metrics:
   - actions/sec
   - state updates/sec
   - avg reducer ms
   - p95 reducer ms
   - current FPS
   - long frames/sec
2. Shows top action types by rate.
3. Provides controls:
   - pause stream
   - reset stats
   - window duration selector (1s/5s/10s)
4. Uses bounded history (ring buffer) to avoid self-induced overhead.

## 4) Auto-open Diagnostics Window in DEV Mode

In `apps/inventory/src/App.tsx` startup effect, if `import.meta.env.DEV`, open a diagnostics app window with deterministic dedupe key.

Example payload pattern:

```ts
openWindow({
  id: 'window:redux-perf:dev',
  title: '📈 Redux Perf',
  icon: '📈',
  bounds: { x: 900, y: 40, w: 420, h: 320 },
  content: { kind: 'app', appKey: 'redux-perf-debug' },
  dedupeKey: 'redux-perf-debug',
})
```

## Metrics Model (Detailed)

Track these measurements:

1. `actionType`
2. `startedAt`, `endedAt`, `durationMs`
3. `stateChanged` (referential equality check before/after)
4. rolling counts in N ms window
5. long-frame threshold events (for example > 16.7ms or > 32ms)

Suggested diagnostics event shape:

```ts
interface ReduxPerfEvent {
  ts: number;
  type: string;
  durationMs: number;
  changed: boolean;
}
```

Suggested aggregates:

```ts
interface ReduxPerfSnapshot {
  windowMs: number;
  actionsPerSec: number;
  stateChangesPerSec: number;
  avgReducerMs: number;
  p95ReducerMs: number;
  fps: number;
  longFramesPerSec: number;
  topActionRates: Array<{ type: string; perSec: number }>;
}
```

## Design Decisions

1. **Dev-only by explicit option**

Why: avoids accidental instrumentation overhead in prod and keeps behavior obvious.

2. **Ring-buffer + rolling window math**

Why: bounded memory and O(1)-ish rolling behavior for continuous streams.

3. **Use HyperCard app window (not overlay)**

Why: aligns with existing desktop UX and makes diagnostics inspectable alongside app behavior.

4. **Engine capability + inventory first consumer**

Why: generic core, incremental rollout. Other apps can opt in later.

5. **No dependency on existing `debug` slice**

Why: avoids overloading semantics; keep perf telemetry separate and purpose-built.

## Alternatives Considered

### A) Browser extension/perf panel only

Rejected: does not provide app-specific throughput semantics and is less portable for team workflows.

### B) Reuse `debugSlice` for perf metrics

Rejected: `debugSlice` is event-log oriented and semantically different. Mixing concerns creates future debt.

### C) Instrument only in inventory app middleware

Rejected: not generic. The requirement is reusable diagnostics capability.

### D) Pure console logging without state/UI

Rejected: insufficient for sustained debugging, difficult to compare rolling metrics.

## Implementation Plan

### Phase 1: Engine diagnostics primitives

1. Create diagnostics types and ring buffer helpers.
2. Implement `reduxPerfMiddleware` with per-action duration and changed-state sampling.
3. Implement `frameMonitor` that dispatches periodic frame summary updates.
4. Implement `reduxPerfSlice` + selectors.
5. Export diagnostics module from engine barrel.

### Phase 2: Store wiring

1. Extend `createAppStore` options.
2. Add middleware + reducer inclusion based on option.
3. Keep backward compatibility for existing app calls.
4. Add unit tests for enable/disable behavior.

### Phase 3: Inventory app integration

1. Update `apps/inventory/src/app/store.ts` to enable diagnostics in dev mode.
2. Add `ReduxPerfWindow` component.
3. Add `appKey` route in `renderAppWindow`.
4. Auto-open diagnostics window in startup `useEffect` when `import.meta.env.DEV`.
5. Add menu/icon entry (optional but recommended) for reopening after close.

### Phase 4: Validation

1. Add tests for middleware metrics math and buffer retention.
2. Add component story for `ReduxPerfWindow` with mocked data.
3. Manual runbook:
   - `npm run dev -w apps/inventory`
   - verify dev window opens
   - generate chat traffic and dragging
   - confirm metrics react as expected.

## Testing Strategy

### Unit tests

1. Throughput calculations over rolling windows.
2. p95 computation correctness.
3. long-frame detection thresholds.
4. reducer disabled in non-enabled stores.

### Integration tests

1. Store dispatch stream produces snapshot updates.
2. Window closes/reopens without metric reset unless explicitly reset.
3. dev-mode conditional open behavior.

### Manual checks

1. Under chat streaming, actions/sec spikes and reducer timings update.
2. Under aggressive drag, windowing action rates increase.
3. Closing diagnostics window does not disable collection (unless designed otherwise).

## Rollout and Safety

1. Keep feature behind `enableReduxDiagnostics` option.
2. Default off in all apps initially except inventory dev.
3. Document how other apps can enable locally.
4. Ensure no diagnostics code path runs in prod unless deliberately configured.

## Open Questions

1. Should diagnostics collection continue if the diagnostics window is closed?
2. Should we sample every action or support sampling rate (for very high throughput)?
3. Do we want global hotkey/menu command to toggle diagnostics window?
4. Should frame monitor thresholds be configurable per app?

## Definition of Done

1. Generic middleware and frame monitor implemented in engine diagnostics module.
2. Inventory dev mode shows a working HyperCard diagnostics window at startup.
3. Metrics include throughput + reducer timing + FPS.
4. Documentation and task checklist updated for handoff.
5. Tests and manual verification steps included.

## References

- `apps/inventory/src/App.tsx`
- `apps/inventory/src/app/store.ts`
- `packages/engine/src/app/createAppStore.ts`
- `packages/engine/src/features/windowing/windowingSlice.ts`
- `packages/engine/src/features/windowing/types.ts`
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/debug/debugSlice.ts`
- `packages/engine/src/components/shell/RuntimeDebugPane.tsx`
