---
Title: 'Developer Handoff: File Map, HyperCard Window Integration, and Middleware Wiring'
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
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Startup window behavior and appKey-to-component mapping
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/app/store.ts
      Note: Inventory store creation callsite for diagnostics enable flag
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts
      Note: How plugin cards are declared and surfaced in desktop shell
    - Path: 2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts
      Note: configureStore location where middleware and diagnostics reducer should be wired
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: renderAppWindow contract and app window rendering behavior
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/types.ts
      Note: app/card/dialog content-kind contract
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts
      Note: openWindow action and dedupe behavior
    - Path: apps/inventory/src/App.tsx
      Note: Reference for appKey routing and startup window creation
    - Path: apps/inventory/src/domain/stack.ts
      Note: Reference for adding plugin cards versus app windows
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Reference for middleware wiring location
    - Path: packages/engine/src/features/windowing/types.ts
      Note: Reference for app window payload structure
ExternalSources: []
Summary: |
    Copy/paste handoff guide for implementing HC-041: where to add generic Redux diagnostics middleware, how to surface metrics in an app window, how to auto-open the window in dev mode, and how HyperCard card vs app window integration works today.
LastUpdated: 2026-02-17T09:12:00-05:00
WhatFor: |
    Allow a new developer to pick up HC-041 and implement directly without rediscovering architecture or integration points.
WhenToUse: Use during implementation, code review, and onboarding for Redux diagnostics window work.
---


# Developer Handoff: File Map, HyperCard Window Integration, and Middleware Wiring

## Goal

Provide an implementation-ready map for HC-041 so a new developer can:

1. Add a generic Redux throughput/FPS diagnostics middleware.
2. Wire it cleanly into the app store setup.
3. Add a HyperCard app window for diagnostics.
4. Auto-open the diagnostics window in dev mode only.

## Context

### DEV mode behavior under Vite

- `import.meta.env.DEV` is `true` when running `vite dev` (`npm run dev` / `pnpm dev` flow).
- `import.meta.env.DEV` is `false` in production build runtime.

This is the intended gate for startup auto-open and diagnostics enablement.

### Current architecture summary

- Store factory is centralized in engine: `createAppStore`.
- Inventory app composes engine + domain reducers in `apps/inventory/src/app/store.ts`.
- Desktop app windows are opened via `openWindow({ content: { kind: 'app', appKey } })`.
- `renderAppWindow` in `apps/inventory/src/App.tsx` resolves each `appKey` to a React component.

## Quick Reference

## File map (where to edit)

### Store and middleware wiring

1. `packages/engine/src/app/createAppStore.ts`
- Add optional diagnostics enable flag.
- Attach diagnostics middleware when enabled.
- Add diagnostics reducer slice when enabled.

2. `apps/inventory/src/app/store.ts`
- Pass diagnostics enable option from `import.meta.env.DEV`.

### Dev diagnostics window integration

1. `apps/inventory/src/App.tsx`
- Add diagnostics `appKey` route in `renderAppWindow`.
- Auto-open diagnostics window on startup in dev mode.
- Optional: add icon/menu command for manual reopening.

2. `packages/engine/src/features/windowing/windowingSlice.ts`
- No change required for basic usage.
- Use existing `openWindow` + `dedupeKey` behavior.

3. `packages/engine/src/features/windowing/types.ts`
- No change required; already supports `content.kind = 'app'` and `appKey`.

### Suggested new files for this ticket

1. `packages/engine/src/diagnostics/reduxPerfMiddleware.ts`
2. `packages/engine/src/diagnostics/frameMonitor.ts`
3. `packages/engine/src/diagnostics/reduxPerfSlice.ts`
4. `packages/engine/src/diagnostics/selectors.ts`
5. `packages/engine/src/diagnostics/types.ts`
6. `packages/engine/src/diagnostics/index.ts`
7. `apps/inventory/src/features/debug/ReduxPerfWindow.tsx`

## Copy/paste integration snippets

### 1) Extend `createAppStore` options

```ts
interface CreateAppStoreOptions {
  enableReduxDiagnostics?: boolean;
  diagnosticsWindowMs?: number;
}

export function createAppStore<T extends Record<string, Reducer>>(
  domainReducers: T,
  options: CreateAppStoreOptions = {},
) {
  const reducer = {
    pluginCardRuntime: pluginCardRuntimeReducer,
    windowing: windowingReducer,
    notifications: notificationsReducer,
    debug: debugReducer,
    ...(options.enableReduxDiagnostics ? { reduxPerf: reduxPerfReducer } : {}),
    ...domainReducers,
  };

  function createStore() {
    const perfMiddleware = options.enableReduxDiagnostics
      ? createReduxPerfMiddleware({ windowMs: options.diagnosticsWindowMs ?? 5000 })
      : null;

    return configureStore({
      reducer,
      middleware: (getDefault) =>
        perfMiddleware ? getDefault().concat(perfMiddleware) : getDefault(),
    });
  }

  const store = createStore();
  return { store, createStore } as ...;
}
```

### 2) Enable in inventory store (dev only)

```ts
export const { store, createStore: createInventoryStore } = createAppStore(
  {
    inventory: inventoryReducer,
    sales: salesReducer,
    artifacts: artifactsReducer,
    chat: chatReducer,
  },
  {
    enableReduxDiagnostics: import.meta.env.DEV,
    diagnosticsWindowMs: 5000,
  },
);
```

### 3) Add diagnostics app window route in `App.tsx`

```tsx
const REDUX_PERF_APP_KEY = 'redux-perf-debug';

const renderAppWindow = useCallback((appKey: string): ReactNode => {
  if (appKey === REDUX_PERF_APP_KEY) return <ReduxPerfWindow />;
  // existing routes...
  return null;
}, []);
```

### 4) Auto-open diagnostics window on startup in dev

```tsx
useEffect(() => {
  openNewChatWindow(dispatch);

  if (import.meta.env.DEV) {
    dispatch(
      openWindow({
        id: 'window:redux-perf:dev',
        title: '📈 Redux Perf',
        icon: '📈',
        bounds: { x: 900, y: 40, w: 420, h: 320 },
        content: { kind: 'app', appKey: REDUX_PERF_APP_KEY },
        dedupeKey: REDUX_PERF_APP_KEY,
      }),
    );
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### 5) Suggested diagnostics metrics contract

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

## How to add HyperCard cards vs app windows

### Add a plugin card (stack card)

Use `apps/inventory/src/domain/stack.ts`:

1. Add `id/title/icon` to `INVENTORY_CARD_META`.
2. Card is converted by `toPluginCard(...)`.
3. Desktop icons/menus derived from `STACK.cards` in `App.tsx` and/or `DesktopShell`.

Use this when the window body should come from plugin runtime card rendering.

### Add a non-card app window (recommended for diagnostics)

Use `openWindow({ content: { kind: 'app', appKey } })` in `App.tsx`, and handle `appKey` in `renderAppWindow`.

Use this when the window body is regular React UI (diagnostics panel, event viewer, tools).

## Usage Examples

### Example debugging scenario

1. Run inventory dev server.
2. Dev diagnostics window opens automatically.
3. Start chat streaming + drag windows.
4. Verify:
   - `actions/sec` rises with event bursts.
   - `windowing/moveWindow` and chat action rates are visible.
   - FPS drops can be correlated with reducer/dispatch pressure.

### Example manual reopen after close

Add menu command and icon in `App.tsx`:

- Command: `debug.redux-perf`
- Icon id: `redux-perf`

On command/icon open same `openWindow` payload with dedupe key.

## Acceptance Checklist (for implementer)

1. Diagnostics disabled in prod by default.
2. Diagnostics enabled in inventory dev mode.
3. Dev window opens once at startup and can be reopened.
4. Metrics update continuously and remain bounded in memory.
5. Tests cover rolling-window math and slice behavior.
6. Docs (`design-doc` + `tasks`) updated after implementation.

## Related

- `ttmp/2026/02/17/HC-041-REDUX-FPS-DEBUG--redux-throughput-fps-diagnostics-middleware-and-dev-hypercard-window/design-doc/01-implementation-plan-redux-throughput-fps-diagnostics-middleware-and-dev-window.md`
- `apps/inventory/src/App.tsx`
- `apps/inventory/src/app/store.ts`
- `packages/engine/src/app/createAppStore.ts`
