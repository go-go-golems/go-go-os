---
Title: Diary
Ticket: OS-10-CONTEXT-MENU-SHOWCASES
Status: active
Topics:
    - frontend
    - desktop
    - menus
    - ux
    - plugins
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/types.ts
      Note: Added target descriptor contracts and icon-folder metadata.
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.ts
      Note: Added target-keyed context action registry and icon-kind precedence fallback.
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.test.ts
      Note: Added phase tests for keying, precedence, merge policy, and icon-kind fallback.
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
      Note: Added target-scoped hook APIs for context action registration.
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Wired target-based context action resolution and folder command routing into shell flow.
    - Path: packages/desktop-os/src/runtime/buildLauncherIcons.ts
      Note: Added default launcher folder icon composition with member icon ids.
    - Path: apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx
      Note: Added launcher integration tests for folder context menu actions.
ExternalSources: []
Summary: Diary for OS-10 implementation work.
LastUpdated: 2026-02-25T16:48:00-05:00
WhatFor: Capture implementation progress and rationale as OS-10 moves from planning into execution.
WhenToUse: Use when continuing OS-10 or reviewing completed showcase phases.
---

# Diary

## Goal

Start OS-10 execution by completing Phase 1 (context target foundation) on top of the OS-01 menu runtime baseline.

## Step 1: Phase 1 Foundation Implemented

Implemented target-scoped context menu contracts and runtime plumbing so context actions can be registered and resolved by normalized target keys, not just by window id.

### Prompt Context

**User prompt (verbatim):** "it works, check off tasks, close ticket, start on OS-10"

**Assistant interpretation:** Close OS-01 after manual verification and begin concrete OS-10 implementation work immediately.

**Inferred user intent:** Finish the prior ticket cleanly, then resume forward progress on menu feature development rather than more bugfix loops.

### What I did

- Added `ContextTargetKind` and `DesktopContextTargetRef` contracts in shell types.
- Added `contextTarget` metadata field to `DesktopCommandInvocation`.
- Added target registry helper module:
  - `normalizeContextTargetRef`
  - `buildContextTargetKey`
  - `resolveContextActionPrecedenceKeys`
  - `resolveContextActions`
- Added tests for registry keying/precedence/merge policy.
- Extended desktop menu runtime APIs with generic target-scoped registration:
  - `registerContextActions` / `unregisterContextActions`
  - hooks: `useRegisterContextActions`, `useRegisterIconContextActions`, `useRegisterWidgetContextActions`, `useRegisterConversationContextActions`, `useRegisterMessageContextActions`
- Updated shell controller to:
  - store context registrations by target key
  - resolve dynamic context actions via precedence (`exact -> qualified kind -> kind -> window`)
  - include `contextTarget` in routed context-menu command invocations
- Exported new APIs through `windowing/index.ts` and `desktop/react/index.ts`.

### Why

- OS-10 scenarios require target-specific menus (icons/messages/conversations), which window-only registration cannot express.
- This foundation unlocks scenarios 1/2/3/4/10 without breaking existing OS-01 window-level APIs.

### What worked

- `npm run typecheck -w packages/engine` passed.
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts` passed.

### What didn't work

- Direct invocation of `DesktopShell.contextMenu.test.tsx` via current package test script fails because test include pattern is `src/**/*.test.ts` (does not include `.test.tsx`).

### What warrants a second pair of eyes

- Confirm precedence contract matches intended OS-10 semantics before scenario-specific hooks start registering non-window targets in app code.
- Confirm `contextTarget` metadata shape is sufficient for downstream command handlers and telemetry.

### Next

- Start Phase 2 (`OS10-20`..`OS10-23`): icon right-click handling and icon target actions in `DesktopIconLayer` + shell controller wiring.

## Step 2: Phase 2 Scenario 1 (Icon Quick Actions)

Implemented icon right-click quick actions end-to-end and validated routing through launcher integration tests.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Keep executing the next OS-10 phase immediately after Phase 1 foundation.

**Inferred user intent:** Maintain momentum on menu feature development and move from contracts into user-visible showcase behavior.

### What I did

- Added right-click callback support to desktop icons in:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx`
- Added icon quick-action context menu composition in controller (`Open`, `Open New`, `Pin`, `Inspect`) and attached icon context target metadata:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
- Added icon command routing behavior:
  - `icon.open.<id>` opens stack card windows when `<id>` is a card id
  - `icon.open-new.<id>` opens stack card windows or falls back to contribution handling as `icon.open.<id>`
- Wired icon context callback into shell view:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShellView.tsx`
- Added launcher integration test:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx`
  - verifies icon context menu opens with quick actions and `Open` command routes to create a window.
- Added Storybook showcase:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx`
  - story: `WithIconQuickActionsContextMenu`

### Why

- OS-10 Scenario 1 is the first user-facing target-scoped showcase and validates that Phase 1 foundation is usable in real interaction paths.

### What worked

- `npm run typecheck -w packages/engine` passed.
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts` passed.
- `npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx` passed (with known pre-existing selector warnings in stderr).

### What didn't work

- Running `DesktopShell.contextMenu.test.tsx` directly through the engine package script still reports “No test files found” because the engine vitest include pattern currently only matches `src/**/*.test.ts`.

### What warrants a second pair of eyes

- Confirm default icon quick-action command IDs are final (`icon.open-*`, `icon.pin.*`, `icon.inspect.*`) before Scenario 2/3 reuse.
- Confirm launcher-module `icon.open.<id>` mapping semantics align with “Open New” fallback behavior.

### Next

- Start Phase 3 (`OS10-30`..`OS10-33`): folder/icon hybrid launcher target behavior and context actions.

## Step 3: Phase 3 Scenario 2 (Folder/Icon Hybrid Launcher)

Implemented folder-aware launcher context menus and command routing in the shell, then wired launcher icon composition to include a default folder icon so the behavior is visible in the host app and tests.

This phase focused on deterministic behavior rather than UI-only placeholders: folder actions now drive real command paths (`Open`, `Open in New Window`, `Launch All`, `Sort Icons`) and are validated in both package-level and launcher-level tests.

### Prompt Context

**User prompt (verbatim):** (same as Step 2)

**Assistant interpretation:** Continue OS-10 execution by completing the next planned scenario after icon quick actions.

**Inferred user intent:** Progress the ticket phase-by-phase with production-quality implementation, tests, and docs updates.

### What I did

- Extended icon contracts for folder behavior and target metadata:
  - Added `DesktopIconKind` (`app` | `folder`) and `DesktopFolderIconOptions` in `types.ts`.
  - Added optional `iconKind` on `DesktopContextTargetRef` for richer context keying.
- Extended context-action registry normalization/precedence:
  - Added `iconKind` to normalized target keys.
  - Added fallback precedence from icon-kind-specific key to generic icon key.
  - Added test coverage for fallback behavior.
- Implemented folder command routing in shell controller:
  - Added folder command paths: `folder.open.*`, `folder.open-new.*`, `folder.launch-all.*`, `folder.sort-icons.*`.
  - Added folder-specific default context menu entries.
  - Added local shell icon sort mode (`default` vs `label-asc`) to power `Sort Icons`.
  - Added icon-kind-aware target metadata on icon context invocation.
- Added launcher folder icon composition in desktop-os:
  - `buildLauncherIcons` now emits app icons with `kind: 'app'` and a default folder icon (`Applications`) with member ids.
  - Added `folderIcon` option support in `buildLauncherContributions`.
  - Added desktop-os tests for folder icon generation and overrides.
- Added integration coverage in launcher:
  - New folder context menu test verifies labels and `Launch All` opens all member apps.
  - New folder sort test verifies deterministic icon ordering after `Sort Icons`.
- Added Storybook scenario:
  - `WithFolderHybridLauncherContextMenu` in `DesktopShell.stories.tsx`.

### Why

- Scenario 2 requires folder-aware behavior to prove target-scoped menus handle non-window/non-message targets with richer command semantics.
- Implementing launcher folder icon generation (instead of only story mocks) ensures the scenario is exercised in real host integration paths.

### What worked

- `npm run typecheck -w packages/engine` passed.
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts` passed.
- `npm run test -w packages/desktop-os` passed.
- `npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx src/__tests__/launcherHost.test.tsx` passed (with known pre-existing selector warnings in stderr).

### What didn't work

- N/A for blocking failures; all targeted validations for this phase passed on first run.

### What I learned

- Adding `iconKind` to the key is useful for type-specific menus, but a fallback to generic icon keys is required so existing icon hooks/registrations keep working without migration churn.
- Folder semantics can stay command-driven by reusing existing icon open routes; no dedicated folder window implementation is required to make Scenario 2 useful.

### What was tricky to build

- The tricky part was adding folder-specific targeting without breaking generic icon registrations.
  - Cause: precedence previously assumed one icon target dimension (`iconId`) and would miss generic registrations if only kind-specific keys were present.
  - Symptom: potential silent loss of actions registered at generic icon target scope.
  - Resolution: add explicit precedence fallback from `iconKind` key to the same target minus `iconKind`.

### What warrants a second pair of eyes

- Confirm the folder default icon id/label (`launcher.apps.folder`, `Applications`) should be stable API or configurable-only detail before more apps depend on it.
- Confirm whether `Sort Icons` should become persistent (saved layout/order) or remain per-shell-session behavior.

### What should be done in the future

- Phase 4 (`OS10-40`..`OS10-43`): chat message context target registration and message-scoped actions.

### Code review instructions

- Start with:
  - `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
  - `packages/engine/src/components/shell/windowing/types.ts`
  - `packages/desktop-os/src/runtime/buildLauncherIcons.ts`
  - `apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx`
- Validate with:
  - `npm run typecheck -w packages/engine`
  - `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
  - `npm run test -w packages/desktop-os`
  - `npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx src/__tests__/launcherHost.test.tsx`

### Technical details

- Folder command ids introduced:
  - `folder.open.<folderId>`
  - `folder.open-new.<folderId>`
  - `folder.launch-all.<folderId>`
  - `folder.sort-icons.<folderId>`
- Folder icon contract:
  - `kind: 'folder'`
  - `folder.memberIconIds: string[]`
- App icon contract enhancement:
  - `kind: 'app'`
  - `appId` explicitly set by launcher icon builder.
