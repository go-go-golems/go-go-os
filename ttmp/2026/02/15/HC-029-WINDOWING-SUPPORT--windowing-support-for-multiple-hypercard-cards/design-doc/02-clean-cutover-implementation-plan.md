---
Title: Clean Cutover Implementation Plan
Ticket: HC-029-WINDOWING-SUPPORT
Status: active
Topics:
    - frontend
    - ux
    - architecture
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/cards/runtime.ts
      Note: Action execution path requiring window-session routing
    - Path: packages/engine/src/cards/runtimeStateSlice.ts
      Note: Runtime state keying to update for cardSession isolation
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Primary shell implementation to replace in clean cutover
    - Path: packages/engine/src/components/shell/index.ts
      Note: Exports cleanup target during legacy deletion phase
    - Path: packages/engine/src/features/navigation/navigationSlice.ts
      Note: Legacy single-stack navigation model targeted for replacement
    - Path: packages/engine/src/parts.ts
      Note: Part constants cleanup for deprecated shell elements
    - Path: packages/engine/src/theme/base.css
      Note: Theme and part cleanup for removed shell paths
    - Path: ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/01-windowing-container-framework-study.md
      Note: Upstream research and architecture rationale
ExternalSources: []
Summary: Detailed execution plan for a clean cutover to a multi-window desktop shell, with explicit removal of legacy single-window shell paths and no compatibility wrappers.
LastUpdated: 2026-02-15T14:47:00-05:00
WhatFor: Provide an implementation-ready, phase-by-phase cutover plan with concrete file/symbol scope and quality gates.
WhenToUse: Use during implementation and review of HC-029 windowing cutover.
---


# Clean Cutover Implementation Plan

## Executive Summary

This plan defines a hard cutover from the current single-window shell to a desktop-style multi-window shell for HyperCard. We will not preserve legacy shell behavior and we will not leave behind deprecated compatibility wrappers.

Key outcomes:

- `HyperCardShell` becomes desktop-windowing-first (single-window mode removed)
- Multi-window card sessions are first-class
- Menu bar and desktop icon launchers are first-class shell primitives
- Legacy split/drawer/tab shell layouts are removed from runtime surface
- Navigation and runtime state are updated for window-targeted card sessions

The implementation is organized in strict phases with quality gates, explicit deletions, and app cutovers in the same change stream.

## Problem Statement

Current architecture constraints block windowed workflows:

- One active card at a time in `HyperCardShell` (`packages/engine/src/components/shell/HyperCardShell.tsx`)
- One navigation stack (`packages/engine/src/features/navigation/navigationSlice.ts`)
- Runtime card state keyed by `stackId + cardId` only (`packages/engine/src/cards/runtimeStateSlice.ts`)

This prevents:

- multiple concurrent card sessions
- same-card duplicate windows with isolated local state
- window-targeted navigation and action routing

A clean cutover is preferred over layered compatibility because it avoids prolonged dual-architecture cost.

## Clean Cutover Policy (Non-Negotiable)

1. No compatibility mode.
- Remove legacy shell layout paths (`split`, `drawer`, `cardChat`) from production runtime API.

2. No deprecated wrappers.
- Do not keep `LegacyHyperCardShell`, adapter components, or prop translation shims.

3. One canonical shell implementation.
- `HyperCardShell` is the desktop windowing shell after cutover.

4. One canonical navigation model for UI shell.
- Window/session-targeted nav becomes the primary model.

5. Keep codebase clean at merge.
- Remove obsolete files, exports, and dead CSS parts in the same ticket.

## Proposed Solution

### High-level architecture

- Introduce `windowing` feature slice for desktop/window/session state.
- Replace shell rendering pipeline with desktop layers:
  - menu bar layer
  - icon layer
  - window layer
- Host card rendering per window session via `CardSessionHost`.
- Route commands via explicit command router with deterministic target resolution.
- Update runtime keying for card session isolation.

### Core state model

```ts
interface WindowingState {
  desktop: {
    activeMenuId: string | null;
    selectedIconId: string | null;
    focusedWindowId: string | null;
    zCounter: number;
  };
  windows: Record<string, WindowInstance>;
  order: string[];
  sessions: Record<string, { nav: NavEntry[] }>;
}
```

### Runtime keying model

Use session-aware runtime keys for card state isolation:

- synthetic runtime card key: `${cardId}::${cardSessionId}`
- `CardSessionHost` maps logical card to runtime card key

This avoids collisions when the same card is open in multiple windows.

## Detailed Scope (Files and Symbols)

### New files

1. `packages/engine/src/features/windowing/windowingSlice.ts`
2. `packages/engine/src/features/windowing/selectors.ts`
3. `packages/engine/src/features/windowing/commands.ts`
4. `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
5. `packages/engine/src/components/shell/windowing/DesktopMenuBar.tsx`
6. `packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx`
7. `packages/engine/src/components/shell/windowing/WindowLayer.tsx`
8. `packages/engine/src/components/shell/windowing/WindowSurface.tsx`
9. `packages/engine/src/components/shell/windowing/WindowTitleBar.tsx`
10. `packages/engine/src/components/shell/windowing/WindowResizeHandle.tsx`
11. `packages/engine/src/components/shell/windowing/WindowContentHost.tsx`
12. `packages/engine/src/components/shell/windowing/CardSessionHost.tsx`

### Files to replace heavily

1. `packages/engine/src/components/shell/HyperCardShell.tsx`
- rewrite around desktop shell architecture
- remove legacy layout mode handling

2. `packages/engine/src/features/navigation/navigationSlice.ts`
- either delete in favor of windowing nav or reduce to session helper primitives
- final state must not keep obsolete layout fields

3. `packages/engine/src/cards/runtimeStateSlice.ts`
- add session-aware key strategy integration

4. `packages/engine/src/cards/runtime.ts`
- support window/session context in nav bindings and debug metadata

5. `packages/engine/src/theme/base.css`
- add desktop/window/menu/icon parts
- remove obsolete tab/split/drawer specific selectors

6. `packages/engine/src/parts.ts`
- add new part constants, remove dead part constants

### Files likely removed

1. `packages/engine/src/components/shell/LayoutSplit.tsx`
2. `packages/engine/src/components/shell/LayoutDrawer.tsx`
3. `packages/engine/src/components/shell/LayoutCardChat.tsx`
4. `packages/engine/src/components/shell/TabBar.tsx`
5. possibly `packages/engine/src/components/shell/WindowChrome.tsx` if fully subsumed by `WindowSurface`

(If any remain, they must still be actively used by the new architecture; no dead code retention.)

## Design Decisions

1. Keep exported name `HyperCardShell` but replace implementation completely.
Rationale: avoid parallel exports while keeping import ergonomics simple.

2. Remove `layoutMode`/legacy tab layout concept.
Rationale: desktop windowing replaces that paradigm.

3. Make menu and icon launchers explicit configuration on stack/shell props.
Rationale: avoid hidden magic and allow app-owned desktop UX.

4. Session-aware card runtime is required for V1.
Rationale: duplicate-card windows are core behavior, not optional after cutover.

5. Use reducer-driven z-order with monotonic `zCounter`.
Rationale: deterministic layering and easy testability.

## Alternatives Considered

1. Keep old shell and add desktop shell separately.
- Rejected: violates clean cutover requirement and doubles maintenance.

2. Keep legacy layouts behind feature flag.
- Rejected: still leaves compatibility burden and stale paths.

3. Defer session isolation and block duplicate cards.
- Rejected: would ship an incomplete window model and cause immediate product debt.

## Implementation Plan

### Phase 0: Baseline and pre-cutover safety

Objectives:

- Capture current behavior snapshots before destructive refactor.
- Define exact removal list and ownership.

Work:

1. Add temporary branch-level verification checklist for current apps.
2. Record runtime tests and Storybook baseline screenshots.
3. Freeze changes touching shell architecture until cutover lands.

Exit criteria:

- Baseline artifacts captured.
- Removal list approved.

### Phase 1: Introduce windowing state domain

Objectives:

- Add authoritative windowing store with deterministic reducers.

Work:

1. Implement `windowingSlice` reducers:
- open, close, focus, move, resize, setMenu, setSelectedIcon
- session nav actions (go/back/home per session)

2. Implement selectors:
- `selectOrderedWindows`
- `selectFocusedWindow`
- `selectWindowSessionNav`

3. Add unit tests for reducer invariants.

Exit criteria:

- Reducer tests pass for all core actions and edge cases.

### Phase 2: Build desktop/window primitives

Objectives:

- Land presentational/interaction primitives independent of card runtime.

Work:

1. Build `DesktopMenuBar`, `DesktopIconLayer`, `WindowSurface`, `WindowTitleBar`, `WindowResizeHandle`, `WindowLayer`.
2. Implement pointer interaction controller with cleanup-safe listeners.
3. Add keyboard and accessibility semantics for menu/icon/window focus.

Exit criteria:

- Storybook stories for primitives pass interaction checks.

### Phase 3: Replace `HyperCardShell` with desktop composition

Objectives:

- Hard switch main shell to desktop architecture.

Work:

1. Rewrite `HyperCardShell.tsx` to orchestrate desktop layers.
2. Remove legacy `layoutMode`, `TabBar`, and split/drawer/card-chat branching.
3. Introduce command router wiring for menu and icon actions.

Exit criteria:

- `HyperCardShell` renders desktop container and windows only.
- No legacy layout code remains in shell.

### Phase 4: Session-aware card host and runtime integration

Objectives:

- Render card content per window with isolated runtime session state.

Work:

1. Implement `CardSessionHost` and `WindowContentHost`.
2. Add runtime card key derivation using `cardSessionId`.
3. Update runtime context creation and debug metadata paths.
4. Update action/nav routing to target window session.

Exit criteria:

- Two windows of same card maintain independent local scoped state.

### Phase 5: App cutover and config migration

Objectives:

- Move all apps to desktop semantics in the same cutover.

Work:

1. Update app `App.tsx` usage for required desktop props/config.
2. Define initial desktop icons/menu per app stack.
3. Remove obsolete app-level assumptions tied to legacy nav shortcuts/tabs.

Exit criteria:

- Inventory, Todo, CRM, Book Tracker compile and run on desktop shell.

### Phase 6: Delete legacy files and dead exports

Objectives:

- Complete clean cutover by removing obsolete architecture.

Work:

1. Delete obsolete shell components (`LayoutSplit`, `LayoutDrawer`, `LayoutCardChat`, `TabBar`, and any unused chrome component).
2. Update `packages/engine/src/components/shell/index.ts` exports.
3. Remove dead CSS parts and part constants.
4. Remove obsolete tests tied to removed architecture; replace with desktop equivalents.

Exit criteria:

- No deprecated or wrapper code remains.
- `rg -n "legacy|deprecated|LayoutSplit|LayoutDrawer|LayoutCardChat|TabBar" packages/engine/src/components/shell` returns no stale runtime references.

### Phase 7: QA hardening and acceptance

Objectives:

- Validate correctness, UX, and developer ergonomics before merge.

Work:

1. Add integration tests for multi-window behavior.
2. Add runtime tests for session isolation and targeted nav.
3. Add Storybook scenarios (1, 2, 6 windows + narrow fallback).
4. Validate keyboard paths and a11y semantics.

Exit criteria:

- Acceptance criteria all green.

## Testing Matrix

### Unit tests

- Window reducers:
  - open/focus/close semantics
  - z-order determinism
  - geometry clamps
- Command router:
  - command id to handler mapping
  - target window resolution

### Integration tests

1. Open 3 windows and verify focus/z transitions.
2. Open duplicate card windows and verify state isolation.
3. Run `nav.go` from menu against focused window only.
4. Close focused window and verify next focus policy.

### Regression tests

- Core card actions (`state.set`, `state.patch`, `nav.go`, `nav.back`) still behave correctly inside each session.

## Acceptance Criteria

1. Desktop shell is the only shell architecture in runtime code.
2. Legacy split/drawer/tab shell paths are removed.
3. Duplicate same-card windows are supported with isolated state.
4. Menu and desktop icons open/focus windows deterministically.
5. All first-party apps run with the new shell.
6. No deprecated wrappers or compatibility adapters exist.
7. Test suite and lint/typecheck pass.

## Rollout and Merge Strategy

- Land in one primary feature branch with phased commits.
- Keep each phase mergeable and testable, but do not merge partial compatibility.
- Merge only when all deletion and migration tasks are complete.

Suggested commit slicing:

1. `windowing slice + tests`
2. `desktop primitives + stories`
3. `hypercardshell hard rewrite`
4. `runtime session isolation`
5. `app migrations`
6. `legacy deletions + export/theme cleanup`
7. `integration tests + polish`

## Risks and Mitigations

1. Risk: broad refactor destabilizes app runtime.
- Mitigation: strict phase gates and mandatory app smoke tests per phase.

2. Risk: runtime session keying bugs.
- Mitigation: explicit duplicate-card integration tests before merge.

3. Risk: UX regressions in keyboard/a11y.
- Mitigation: add interaction tests and review checklist for menus/icons/windows.

4. Risk: hidden legacy dependencies remain.
- Mitigation: explicit deletion checklist and grep-based CI guard.

## Open Questions

1. Should desktop menu/icon config live on `CardStackDefinition` or shell props?
2. Should minimizing windows be in V1 or deferred to follow-up ticket?
3. How aggressive should narrow-viewport fallback be (tab strip vs sheet stack)?

## References

- `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/01-windowing-container-framework-study.md`
- `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/sources/local/mac1-windowing.jsx`
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/features/navigation/navigationSlice.ts`
- `packages/engine/src/cards/runtime.ts`
- `packages/engine/src/cards/runtimeStateSlice.ts`
- `packages/engine/src/components/shell/index.ts`
- `packages/engine/src/theme/base.css`
- `packages/engine/src/parts.ts`
