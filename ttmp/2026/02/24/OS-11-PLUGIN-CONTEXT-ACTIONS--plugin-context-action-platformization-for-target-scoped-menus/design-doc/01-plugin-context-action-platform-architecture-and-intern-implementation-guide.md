---
Title: plugin context action platform architecture and intern implementation guide
Ticket: OS-11-PLUGIN-CONTEXT-ACTIONS
Status: active
Topics:
    - architecture
    - frontend
    - desktop
    - plugins
    - menus
    - engine
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-go-os/packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx
      Note: Current icon interactions and right-click gap
    - Path: go-go-os/packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
      Note: Current window-scoped runtime registration API
    - Path: go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Current context-menu resolution path and invocation metadata flow
    - Path: go-go-os/packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts
      Note: Current plugin capability model
    - Path: go-go-os/packages/engine/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Current plugin JS authoring surface
    - Path: go-go-os/ttmp/2026/02/24/OS-10-CONTEXT-MENU-SHOWCASES--widget-and-icon-scoped-context-menu-showcase-scenarios/design-doc/01-context-menu-showcase-implementation-plan.md
      Note: Scenario 11 baseline requirements
ExternalSources: []
Summary: End-to-end implementation design for scenario 11 (plugin-injected context actions), including target model, capability model, plugin JS API, host runtime architecture, testing, rollout, and intern onboarding map.
LastUpdated: 2026-02-25T10:42:00-05:00
WhatFor: Use this design to implement production-grade plugin-contributed context actions on top of the OS launcher desktop shell.
WhenToUse: Use when building or reviewing scenario 11 work, including target-scoped menu APIs, plugin capability validation, lifecycle management, and command routing.
---


# plugin context action platform architecture and intern implementation guide

## Executive Summary

Scenario 11 from `OS-10-CONTEXT-MENU-SHOWCASES` proposes plugin-injected context actions. The codebase already supports window-scoped runtime context actions and plugin runtime intents, but it does not yet support target-scoped plugin context actions (icon, message, conversation, widget), plugin action lifecycle management, or policy/telemetry hardening for external action providers.

This ticket defines the missing platform work as a single implementation package for new contributors:

1. Introduce a target-scoped context model in shell runtime.
2. Introduce a plugin context action contract and capability model.
3. Add plugin JS authoring API for declaring context actions.
4. Validate and namespace plugin actions before registration.
5. Add lifecycle-safe register/unregister tied to plugin session/window lifetimes.
6. Add deterministic conflict policy, telemetry, and kill switch behavior.
7. Add tests and docs so app teams can use the platform safely.

## Problem Statement

Today, context actions are effectively window-level add-ons that can be registered by a React component using `useRegisterWindowContextActions`. This solves focused window title-bar/surface menus, but scenario 11 requires significantly more:

1. Target-aware menus (message-specific, icon-specific, conversation-specific, etc).
2. Plugin-owned action registration through a constrained API.
3. Capability and payload validation for plugin-provided actions.
4. Stable cleanup when plugin sessions end or reload.
5. Production diagnostics and fault isolation.

Without this work, plugin actions can only be simulated via app-owned glue code, not declared and managed as plugin capabilities.

## Scope

In scope:

1. Frontend shell/runtime contracts and registry changes.
2. Plugin runtime contract additions for context action declarations.
3. Capability model extension and authorization behavior.
4. Lifecycle, conflict resolution, and observability.
5. Intern-ready documentation, pseudocode, and task plan.

Out of scope:

1. Backend policy enforcement service (beyond integration hooks and payload contracts).
2. Packaging/distribution system for third-party plugins.
3. Full remote plugin marketplace UX.

## Current State (Evidence-backed)

### 1) Desktop shell context runtime is window scoped

- `DesktopWindowMenuRuntime` exposes only `registerWindow*` APIs keyed by `windowId` ([desktopMenuRuntime.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx:4)).
- Controller stores context actions in `windowContextActionsById` and builds context menus per window ([useDesktopShellController.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:159), [useDesktopShellController.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:527)).
- `DesktopIconLayer` currently supports select/open interactions only; no right-click target registration ([DesktopIconLayer.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx:4)).

Implication: no generic target registry for `icon`, `message`, `conversation`, `widget`, etc.

### 2) Command routing already supports contextual metadata

- `DesktopCommandInvocation` includes `source`, `menuId`, `windowId`, `widgetId`, and `payload` ([types.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/types.ts:27)).
- Context-menu dispatch path forwards metadata to command handlers and host fallback ([useDesktopShellController.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:584)).

Implication: we can reuse this invocation channel; we mainly need richer target descriptors and resolution.

### 3) Plugin runtime supports intents, not menu action declarations

- Plugin contracts define runtime intents (`card`, `session`, `domain`, `system`) but no context action declaration contract ([contracts.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/plugin-runtime/contracts.ts:13)).
- Stack bootstrap API supports `defineStackBundle`, `defineCard`, handlers, and intent dispatch helpers only ([stack-bootstrap.vm.js](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/plugin-runtime/stack-bootstrap.vm.js:37)).
- Runtime service validates UI trees and intents, but not action manifests ([runtimeService.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/plugin-runtime/runtimeService.ts:4)).

Implication: plugins cannot natively declare context menu contributions.

### 4) Capability policy exists but only for domain/system intents

- `CapabilityPolicy` includes `domain` and `system` sets only ([capabilityPolicy.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts:3)).
- App stack plugin capability declarations mirror this shape ([apps/inventory stack.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/domain/stack.ts:42)).

Implication: no capability gates exist for plugin context-action registration or execution.

### 5) Scenario 11 is explicitly deferred pending platformization

- OS-10 design notes list missing pieces: permissions, validation, lifecycle cleanup, conflict policy, telemetry/kill switch ([OS-10 design doc](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-10-CONTEXT-MENU-SHOWCASES--widget-and-icon-scoped-context-menu-showcase-scenarios/design-doc/01-context-menu-showcase-implementation-plan.md:205)).

Implication: this ticket is the required follow-up phase.

## Gap Analysis

Gap A: No target model beyond window/title-bar context.

Gap B: No plugin declaration API for context actions.

Gap C: No policy/capability representation for context action rights.

Gap D: No runtime bridge tying plugin session lifecycle to menu registrations.

Gap E: No deterministic cross-source conflict strategy (core vs app vs plugin).

Gap F: Limited diagnostics for plugin context-action failures and kill controls.

## Proposed Architecture

### Architectural intent

Build a plugin context-action platform as a constrained extension layer on top of the existing shell command router.

Key rule:

- Plugins declare actions and matching rules.
- Host validates, authorizes, and resolves those actions against runtime targets.
- Execution still flows through existing command routing and invocation metadata.

### Concept map

```text
+-------------------+      right-click      +-----------------------+
| Desktop target UI | ---------------------> | ContextTargetResolver |
| (icon/message/...)|                        +-----------+-----------+
+-------------------+                                    |
                                                         v
                                           +-----------------------------+
                                           | ContextActionRegistry       |
                                           | sources: core/app/plugin    |
                                           +------+---------------+------+
                                                  |               |
                                       authorize+validate         |
                                                  |               |
                                                  v               v
                                      +----------------+   +-------------------+
                                      | PluginAction   |   | Desktop command   |
                                      | Policy Engine  |   | router            |
                                      +--------+-------+   +---------+---------+
                                               |                     |
                                               v                     v
                                    +-------------------+   +-------------------+
                                    | telemetry + kill  |   | existing handlers |
                                    | switches           |   | + host fallback   |
                                    +-------------------+   +-------------------+
```

### Core contracts to add

#### 1) Target descriptor model

```ts
export type ContextTargetKind = 'icon' | 'folder' | 'window' | 'widget' | 'message' | 'conversation';

export interface ContextTargetRef {
  kind: ContextTargetKind;
  targetId: string;
  windowId?: string;
  appId?: string;
  conversationId?: string;
  messageId?: string;
  widgetId?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
}
```

Why:

- Creates one shape for resolution, policy checks, and telemetry.
- Keeps source UI components thin.

#### 2) Registry action entry with origin metadata

```ts
export type ContextActionOrigin =
  | { source: 'core'; owner: string }
  | { source: 'app'; appId: string; owner: string }
  | { source: 'plugin'; appId: string; pluginId: string; sessionId: string };

export interface ContextActionDescriptor {
  id: string;
  label: string;
  commandId: string;
  order?: number;
  group?: string;
  payload?: Record<string, unknown>;
  disabled?: boolean;
  targetKinds: ContextTargetKind[];
  match?: {
    widgetIds?: string[];
    tagsAny?: string[];
    appIds?: string[];
  };
  when?: {
    profile?: string[];
    role?: string[];
  };
  origin: ContextActionOrigin;
}
```

#### 3) Plugin capability extensions

```ts
export interface CapabilityPolicy {
  domain: 'all' | string[];
  system: 'all' | string[];
  contextActions?: {
    register: 'all' | ContextTargetKind[];
    invoke: 'all' | string[]; // command namespaces or explicit command ids
  };
}
```

Default behavior for backwards compatibility:

- Existing stacks without `contextActions` get a deny-by-default policy for plugin-injected context actions.

#### 4) Plugin bundle declaration extension

Option A (recommended): declarative bundle metadata

```ts
interface StackBundle {
  id: string;
  title: string;
  cards: Record<string, PluginCardDef>;
  contextActions?: PluginContextActionDeclaration[];
}
```

Option B: imperative registration API

```ts
defineContextAction({ ... });
```

Recommendation:

- Use Option A first for deterministic load-time validation and easier tooling.
- Add Option B later only if runtime mutation is required.

### Resolution algorithm

Resolution precedence (deterministic):

1. Exact target match (`kind + targetId`).
2. Kind-level matches with qualifiers (`widgetId`, `tags`, `appId`).
3. Window fallback actions.
4. Core default actions (close/tile/cascade or target defaults).

Conflict policy:

1. Sort by `order` (ascending), then origin weight, then registration order.
2. Origin weight: `core > app > plugin` for same `id` and slot.
3. Duplicate `id` from same origin replaces previous registration (supports plugin reload).
4. Duplicate `id` cross-origin logs warning and keeps higher precedence entry.

### Plugin lifecycle model

Registration bind keys:

- `pluginId`
- `sessionId`
- `windowId`

Lifecycle rules:

1. Register context actions after plugin session transitions to `ready`.
2. Unregister all actions for `(pluginId, sessionId)` when:
   - session disposed,
   - window closes,
   - runtime enters `error` or reload.
3. On plugin reload, replace registration atomically.

### Command safety and namespacing

Namespace pattern:

- `plugin.<appId>.<pluginId>.<actionId>`

Validation rules:

1. `commandId` must be namespaced under plugin prefix.
2. `actionId` and `commandId` must match safe regex.
3. payload must be JSON-serializable object with bounded depth/size.
4. unknown target kinds rejected at load time.

Execution:

- Plugin command handlers run through existing command routing with full invocation metadata plus `targetRef` in payload.

### Telemetry and kill switch

Add lightweight telemetry slice/log channel:

```ts
interface PluginContextActionEvent {
  ts: string;
  pluginId: string;
  sessionId: string;
  actionId: string;
  commandId: string;
  targetKind: ContextTargetKind;
  outcome: 'shown' | 'invoked' | 'blocked' | 'error';
  reason?: string;
}
```

Kill switch hierarchy:

1. Global: disable all plugin context actions.
2. Per-app: disable plugin context actions for one app.
3. Per-plugin: deny one plugin id.

## JS API Design (Intern-facing)

### Authoring declaration (recommended)

```ts
// inside pluginBundle.vm.js
return {
  id: 'inventory',
  title: 'Shop Inventory',
  cards: { /* existing cards */ },
  contextActions: [
    {
      id: 'open-item-audit',
      label: 'Open Item Audit',
      targetKinds: ['message', 'widget'],
      match: {
        tagsAny: ['inventory:item'],
      },
      commandId: 'plugin.inventory.inventory.open-item-audit',
      payloadSchema: {
        type: 'object',
        required: ['sku'],
        properties: {
          sku: { type: 'string', minLength: 1 },
        },
      },
    },
  ],
};
```

### Host-side registration pseudocode

```ts
function registerPluginContextActions(bundle, sessionCtx) {
  const declared = bundle.contextActions ?? [];
  for (const action of declared) {
    validateActionDeclaration(action);
    enforceCapability(sessionCtx.capabilities, action);

    registry.register({
      ...toDescriptor(action),
      origin: {
        source: 'plugin',
        appId: sessionCtx.appId,
        pluginId: sessionCtx.pluginId,
        sessionId: sessionCtx.sessionId,
      },
    });
  }
}
```

### Invocation pseudocode

```ts
function onContextActionClick(targetRef, action) {
  if (killSwitch.blocks(action.origin)) {
    telemetry.blocked(action, targetRef, 'kill_switch');
    return;
  }

  routeCommand(action.commandId, {
    source: 'context-menu',
    menuId: `context:${targetRef.kind}`,
    windowId: targetRef.windowId ?? null,
    widgetId: targetRef.widgetId,
    payload: {
      ...(action.payload ?? {}),
      targetRef,
    },
  });

  telemetry.invoked(action, targetRef);
}
```

## File-level Implementation Plan

### Phase 0: Read and align (1 day)

Primary references for intern onboarding:

1. Shell runtime and context menu baseline:
   - [desktopMenuRuntime.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx:4)
   - [useDesktopShellController.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:527)
   - [DesktopIconLayer.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx:51)
2. Contribution composition and command routing:
   - [desktopContributions.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.ts:36)
3. Plugin runtime and intent handling:
   - [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/plugin-runtime/stack-bootstrap.vm.js:37)
   - [runtimeService.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/plugin-runtime/runtimeService.ts:155)
   - [pluginIntentRouting.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/pluginIntentRouting.ts:81)
4. Existing scenario intent:
   - [OS-10 scenario 11 section](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-10-CONTEXT-MENU-SHOWCASES--widget-and-icon-scoped-context-menu-showcase-scenarios/design-doc/01-context-menu-showcase-implementation-plan.md:205)

### Phase 1: Contracts and registry foundation

Target files:

1. `packages/engine/src/components/shell/windowing/types.ts`
2. New: `packages/engine/src/components/shell/windowing/contextActionRegistry.ts`
3. `packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx`
4. `packages/engine/src/desktop/react/index.ts`

Deliverables:

1. Add `ContextTargetRef` and plugin-aware action descriptor types.
2. Add registry with register/unregister/query by target.
3. Extend runtime hooks to support target-scoped registration.
4. Export new contracts from desktop-react barrel.

### Phase 2: Controller integration

Target files:

1. `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
2. `packages/engine/src/components/shell/windowing/DesktopShellView.tsx`
3. `packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx`
4. Chat/message surface integration files as needed.

Deliverables:

1. Resolve context menus from target refs, not only window id.
2. Enable right-click target extraction for icons and additional widgets.
3. Keep fallback defaults (close/tile/cascade) for window context.
4. Preserve existing `DesktopCommandInvocation` contract and augment payload with `targetRef`.

### Phase 3: Plugin declaration and capability model

Target files:

1. `packages/engine/src/plugin-runtime/contracts.ts`
2. `packages/engine/src/plugin-runtime/stack-bootstrap.vm.js`
3. `packages/engine/src/plugin-runtime/runtimeService.ts`
4. `packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts`
5. `apps/*/src/domain/pluginBundle.authoring.d.ts`

Deliverables:

1. Add plugin context-action declaration schema.
2. Validate declaration shape on bundle load.
3. Extend capability policy with `contextActions` rights.
4. Expose authoring d.ts updates for plugin bundle authors.

### Phase 4: Plugin lifecycle bridge and command handling

Target files:

1. `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
2. New: `packages/engine/src/components/shell/windowing/pluginContextActionBridge.ts`
3. `packages/engine/src/components/shell/windowing/pluginIntentRouting.ts`
4. App launcher module files where plugin actions are consumed.

Deliverables:

1. Register plugin actions when runtime session is ready.
2. Unregister on dispose/reload/window close.
3. Enforce command namespace and permission checks.
4. Route plugin action commands through existing command path.

### Phase 5: Observability and safety controls

Target files:

1. New: `packages/engine/src/features/pluginContextActions/*`
2. Debug surfaces (if needed) in `packages/engine/src/debug/*`
3. Optional launcher wiring for kill switch toggles.

Deliverables:

1. Emit telemetry events for show/invoke/block/error.
2. Provide global/app/plugin kill switch policy hooks.
3. Surface status in debug panel.

### Phase 6: Test matrix and documentation

Target files:

1. `packages/engine/src/components/shell/windowing/*.test.tsx`
2. `packages/engine/src/plugin-runtime/*.test.ts`
3. `apps/os-launcher/src/__tests__/*.test.tsx`
4. `packages/engine/docs/desktop-menu-runtime-authoring.md`

Deliverables:

1. Unit tests: contracts, validation, capability checks, conflict resolution.
2. Integration tests: right-click target resolution with plugin actions.
3. Lifecycle tests: session disposal unregisters plugin actions.
4. Authoring docs: plugin context-action examples and anti-patterns.

## Testing Strategy

### Unit

1. Target matching predicates and precedence ordering.
2. Action declaration schema validation and rejection cases.
3. Capability authorization (`allowed` vs `denied`).
4. Conflict policy stable sorting and replacement rules.

### Integration

1. Plugin declares action for `message`; message right-click shows action.
2. Invocation dispatch includes `targetRef` payload fields.
3. Disallowed capability blocks action registration or invocation.
4. Plugin session reload replaces old action registration.

### End-to-end (launcher app)

1. Open plugin-backed app window.
2. Right-click supported target.
3. Verify plugin action appears and executes expected command.
4. Close window and verify action no longer appears.

Suggested commands:

```bash
npm run test -w packages/engine
npm run test -w apps/os-launcher
npm run build -w packages/engine
npm run build -w apps/os-launcher
```

## Risks and Mitigations

1. Risk: untrusted plugin payloads can inject malformed menu behavior.
   - Mitigation: strict schema validation and payload size bounds.
2. Risk: action leaks after session/window close.
   - Mitigation: lifecycle binding and automatic origin-key cleanup.
3. Risk: command collisions with core handlers.
   - Mitigation: enforced namespace plus deterministic precedence.
4. Risk: UX clutter from too many plugin actions.
   - Mitigation: target filters, ordering, and optional grouping limits.

## Alternatives Considered

1. App-only bridge (no plugin declaration support).
   - Rejected: does not satisfy scenario 11 objective.
2. Fully dynamic imperative plugin registration only.
   - Rejected for v1: harder to validate and reason about lifecycle deterministically.
3. Separate menu router for plugins.
   - Rejected: duplicates existing command routing and increases inconsistency.

## Open Questions

1. Should unauthorized plugin actions be hidden or shown disabled with reason?
2. Do we want per-tenant kill switches persisted server-side, or client-only runtime config first?
3. Should plugin actions support async preconditions before visibility (for example API-backed checks)?
4. Do we want keyboard-triggered context menu parity for all target kinds in first release?

## Intern Start Here (Step-by-step)

1. Read this design and OS-10 scenario 11 section.
2. Run tests for baseline confidence.
3. Implement Phase 1 contracts/registry first.
4. Add unit tests before wiring controller behavior.
5. Implement Phase 2 target resolution and icon right-click support.
6. Add plugin declaration/capability pieces in Phase 3.
7. Wire lifecycle bridge in Phase 4.
8. Finish telemetry + kill switch baseline.
9. Update docs and run full validation commands.

## API Reference Summary

### Existing APIs to preserve

- `useRegisterWindowContextActions(actions)` (window fallback behavior)
- `DesktopCommandInvocation` metadata fields
- `routeContributionCommand(...)` command routing semantics

### New APIs to add

- `useRegisterTargetContextActions(targetRef, actions)`
- `registerPluginContextActions(sessionCtx, declarations)`
- `resolveContextActionsForTarget(targetRef, state)`
- plugin bundle `contextActions` declaration shape

## References

- Shell contracts and runtime:
  - [types.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/types.ts:1)
  - [desktopMenuRuntime.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx:4)
  - [useDesktopShellController.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:97)
  - [DesktopIconLayer.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx:51)
- Contribution and command composition:
  - [desktopContributions.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.ts:36)
  - [desktopContributions.test.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.test.ts:11)
- Plugin runtime and policy:
  - [contracts.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/plugin-runtime/contracts.ts:13)
  - [stack-bootstrap.vm.js](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/plugin-runtime/stack-bootstrap.vm.js:37)
  - [runtimeService.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/plugin-runtime/runtimeService.ts:201)
  - [capabilityPolicy.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts:3)
  - [pluginIntentRouting.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/pluginIntentRouting.ts:81)
- App integrations and runtime usage:
  - [inventory renderInventoryApp.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx:326)
  - [inventory stack.ts](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/domain/stack.ts:37)
  - [os-launcher App.tsx](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/App.tsx:18)
- Prior ticket context:
  - [OS-10 scenario 11 notes](/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-10-CONTEXT-MENU-SHOWCASES--widget-and-icon-scoped-context-menu-showcase-scenarios/design-doc/01-context-menu-showcase-implementation-plan.md:205)
