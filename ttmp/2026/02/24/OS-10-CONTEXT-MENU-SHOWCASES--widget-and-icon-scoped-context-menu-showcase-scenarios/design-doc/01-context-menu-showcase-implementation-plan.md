---
Title: context menu showcase implementation plan
Ticket: OS-10-CONTEXT-MENU-SHOWCASES
Status: active
Topics:
    - frontend
    - desktop
    - menus
    - ux
    - plugins
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-24T23:05:25.688586754-05:00
WhatFor: Plan and execute target-scoped context menu showcases for icons, folders, chat surfaces, and role-aware behavior.
WhenToUse: Use when implementing OS-level context menu UX demos and deciding how plugin-injected context actions should be supported.
---

# context menu showcase implementation plan

## Executive Summary

This plan introduces target-scoped context menus on top of the existing window-level context menu runtime.  
It defines implementation for five showcase scenarios:

1. Icon quick actions
2. Folder/icon hybrid launcher
3. Chat message context menu
4. Conversation-level menu
5. Role/profile-aware menus

The plan keeps the existing command router and invocation metadata model, but extends runtime registration and context resolution to include non-window targets (`icon`, `widget`, `message`, `conversation`).

## Problem Statement

Current context menu behavior is mostly window-level. This is insufficient for UX patterns where right-click should depend on the precise interaction target (for example a message bubble vs the conversation background, or a desktop icon vs folder icon).  

We need:

- deterministic target-aware menu resolution,
- composable registration APIs for app modules/widgets,
- unified command routing with typed metadata,
- role/profile-aware filtering for enterprise-like UX,
- a path for plugin-provided context actions.

## Proposed Solution

### 1) Extend context target model

Add a normalized target descriptor for context menu open and runtime registration.

```ts
type ContextTargetKind = 'window' | 'icon' | 'widget' | 'message' | 'conversation';

type DesktopContextTarget = {
  kind: ContextTargetKind;
  windowId?: string;
  iconId?: string;
  widgetId?: string;
  messageId?: string;
  conversationId?: string;
  appId?: string;
};
```

### 2) Extend runtime registration API

Keep existing window APIs and add target-scoped APIs:

- `registerContextActions(target, actions)`
- `unregisterContextActions(target)`
- helper hooks (`useRegisterIconContextActions`, `useRegisterWidgetContextActions`, etc.)

### 3) Add context resolution precedence

At menu-open time:

1. resolve exact target key actions,
2. merge window-level actions (if any),
3. append shell defaults.

This prevents “wrong menu on right-click” when nested widgets exist.

### 4) Preserve unified command routing

All context actions still route through the existing command system and produce invocation metadata.  
Augment invocation with optional target fields (`iconId`, `messageId`, `conversationId`) for deterministic handlers.

### 5) Add role/profile filter support

Allow context entries to declare visibility guard (role/profile predicate or required capability).  
Filter actions before rendering and enforce guardrails at handler level.

## Design Decisions

1. Keep a single command router and enrich metadata, rather than bypass callbacks per widget.
2. Keep context state local to shell controller, not Redux.
3. Use precedence-based merge so apps can add specific actions without breaking defaults.
4. Keep scenario implementation mostly frontend-first; backend changes only where action semantics require persistence/export.

## Alternatives Considered

1. Separate context-menu stores per widget/app: rejected due to high complexity and inconsistent UX.
2. Ad-hoc `onContextMenu` callbacks in every widget without central routing: rejected due to poor composability and testability.
3. Global role filtering only in UI: rejected because command handlers still need server-safe enforcement and consistent behavior.

## Implementation Plan

### Foundation

1. Add target descriptor contracts and registry APIs.
2. Add target precedence resolution and metadata propagation.
3. Add target-scoped hooks + tests.

### Scenario 1: Icon quick actions

Frontend:

- Right-click support on desktop icons.
- Icon-specific context actions: `Open`, `Open New`, `Pin`, `Inspect Module`.

Backend:

- None required for baseline; optional persistence for pin/startup flags.

Tests:

- icon-right-click opens icon menu,
- icon commands carry `iconId`.

### Scenario 2: Folder/icon hybrid launcher

Frontend:

- Folder icon target kind and menu actions.
- Actions: `Open`, `Open in New Window`, `Launch All`, `Sort Icons`.

Backend:

- None required for baseline.

Tests:

- folder menu differs from normal icon menu,
- `Launch All` dispatches multiple open commands deterministically.

### Scenario 3: Chat message context menu

Frontend:

- Register per-message context actions from chat message component.
- Actions: `Reply`, `Copy`, `Create Task`, `Debug Event`.

Backend:

- `Create Task` may call existing task endpoint if persistence is required.

Tests:

- message menu contains message-specific entries,
- invocation contains `messageId` and `conversationId`.

### Scenario 4: Conversation-level menu

Frontend:

- Right-click on conversation background (not message bubble).
- Actions: `Change Profile`, `Replay Last Turn`, `Open Timeline`, `Export Transcript`.

Backend:

- Optional export endpoint if transcript export becomes server-backed.

Tests:

- conversation background menu appears with conversation-specific actions,
- action routing includes `conversationId`.

### Scenario 10: Role/profile-aware menus

Frontend:

- Add role/profile predicates on entries.
- Filter entries based on current active profile/role.

Backend:

- Ensure sensitive commands are denied server-side if unauthorized.

Tests:

- menu visibility changes when role/profile changes,
- unauthorized commands cannot execute even if invoked manually.

## Open Questions

1. Should unauthorized actions be hidden or shown disabled with reason tooltip?
2. Should role checks be based on frontend profile registry only, or backend capability token claims?
3. Do we want explicit keyboard-open equivalent for target context menus in v1?
4. Should `Launch All` in folder scenario be rate-limited / confirmation-gated?

## Scenario 11: Plugin-injected context actions

Scenario 11 (plugin modules contribute context actions for supported target types) is feasible, but needs additional platform work before it is safe and stable.

### How it would work

1. Plugin manifest declares capabilities, for example:
   - `context-actions:icon`
   - `context-actions:message`
2. Plugin registers target matchers + actions through a constrained API.
3. Shell merges plugin actions into target resolution pipeline.
4. Commands route through existing command router with plugin namespace.

### Additional build needed

1. Capability and permission model for plugin context actions.
2. Validation/sandboxing of plugin payload schemas and command ids.
3. Plugin lifecycle cleanup (register/unregister on plugin reload or window close).
4. Conflict policy when multiple plugins target the same context slot.
5. Telemetry and kill switch for faulty plugin actions.

Conclusion: scenario 11 should be a follow-up phase after the target-scoped foundation is in place; minimal core menu architecture does not need it immediately, but production-grade plugin support does require these extra pieces.

## References

- `OS-01-ADD-MENUS` ticket outputs (shell runtime, context routing, focused menu registration)
