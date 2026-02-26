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
    - Path: packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx
      Note: Added per-message context action registration and message-target menu open behavior.
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
      Note: Added runtime hook/API for opening target-scoped context menus from window content.
    - Path: apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: Added inventory command handlers for chat message and conversation context actions.
    - Path: apps/os-launcher/src/__tests__/launcherHost.test.tsx
      Note: Added command-level tests for message and conversation action routing.
    - Path: packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Added conversation-surface context menu targeting and action registration.
    - Path: packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Added timeline context-menu callback to support conversation right-click actions.
    - Path: packages/engine/src/components/shell/windowing/contextActionVisibility.ts
      Note: Added centralized role/profile visibility filtering and context-menu command guard helper.
    - Path: packages/engine/src/components/shell/windowing/contextActionVisibility.test.ts
      Note: Added Scenario 10 unit coverage for visibility policies, fallback behavior, and guardrails.
    - Path: packages/engine/docs/desktop-menu-runtime-authoring.md
      Note: Added authoring guidance for target-scoped APIs and visibility rules.
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx
      Note: Added scenario board story covering chat message, conversation, and role-aware context menus.
ExternalSources: []
Summary: Diary for OS-10 implementation work.
LastUpdated: 2026-02-25T17:25:00-05:00
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

## Step 4: Phase 4 Scenario 3 (Chat Message Context Menu)

Implemented message-scoped context menu behavior by allowing in-window components to open shell context menus with explicit targets, then wiring message renderer right-click events to register and invoke message actions.

This step focused on target accuracy and payload determinism: each message action now carries `conversationId` and `messageId`, and inventory command handlers can consume that metadata for app-specific behavior.

### Prompt Context

**User prompt (verbatim):** (same as Step 2)

**Assistant interpretation:** Continue executing OS-10 phases without pausing after Phase 3 completion.

**Inferred user intent:** Keep closing planned ticket phases in sequence, with concrete implementation plus tests/docs updates each time.

### What I did

- Extended window runtime API:
  - Added `openContextMenu` to `DesktopWindowMenuRuntime`.
  - Added `useOpenDesktopContextMenu()` hook so window content components can open shell context menus for arbitrary targets.
- Extended shell controller:
  - Added generic `openContextMenu(request)` handler to normalize targets and resolve menu items for icon/window/message/etc.
  - Reused this path for existing icon/window right-click behavior.
  - Added built-in `chat.message.copy` command handling with clipboard + toast fallback.
- Implemented message renderer context actions:
  - `MessageRenderer` now registers per-message actions with `useRegisterMessageContextActions`.
  - Actions: `Reply`, `Copy`, `Create Task`, `Debug Event`.
  - Payload includes `conversationId`, `messageId`, `role`, and `content`.
  - Right-click opens `message-context` menu with target metadata (`kind: message`, `conversationId`, `messageId`, `windowId`).
- Added inventory action handlers for message commands:
  - `chat.message.debug-event` opens event viewer for payload conversation id.
  - `chat.message.reply` and `chat.message.create-task` dispatch toast feedback for deterministic handling.
- Added launcher host tests:
  - Verified message action command routing and payload-based handling in `launcherHost.test.tsx`.
- Added engine integration test coverage in `DesktopShell.contextMenu.test.tsx` for message target invocation metadata (note: file remains outside default engine test include pattern).

### Why

- Scenario 3 requires right-click behavior tied to exact message entities, not window-level surfaces.
- Without an API for in-window components to request context menus, message-level targeting cannot be expressed cleanly.

### What worked

- `npm run typecheck -w packages/engine` passed.
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts` passed.
- `npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx src/__tests__/launcherHost.test.tsx` passed.

### What didn't work

- Running `DesktopShell.contextMenu.test.tsx` directly through the engine package test script still hangs/does not complete in this environment; the default engine test include pattern intentionally excludes `.test.tsx`, so this file is not part of the scripted suite yet.

### What I learned

- Message-target context menus need a runtime “open menu at coordinates with target” primitive; registration hooks alone are not enough.
- Payload-first command handling allows app modules to implement behavior without coupling the shell to app-specific semantics.

### What was tricky to build

- The main complexity was avoiding target mismatch between registration and invocation.
  - Cause: message actions are registered with window-scoped targets, while right-click events originate in nested renderer components.
  - Symptom: if `windowId` is omitted at invocation time, exact target lookup can miss registered message actions.
  - Resolution: message renderer now includes `windowId` via `useDesktopWindowId()` when opening message context menus.

### What warrants a second pair of eyes

- Confirm whether `chat.message.reply` should eventually prefill composer text rather than only dispatching an app-level handler/toast.
- Confirm desired policy for `DesktopShell.contextMenu.test.tsx`: include `.test.tsx` in CI suite or migrate this test into currently-included `.test.ts` patterns.

### What should be done in the future

- Phase 5 (`OS10-50`..`OS10-53`): conversation-surface context menu with conversation-level actions and routing.

### Code review instructions

- Start with:
  - `packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx`
  - `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
  - `packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx`
  - `apps/inventory/src/launcher/renderInventoryApp.tsx`
  - `apps/os-launcher/src/__tests__/launcherHost.test.tsx`
- Validate with:
  - `npm run typecheck -w packages/engine`
  - `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
  - `npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx src/__tests__/launcherHost.test.tsx`

### Technical details

- Message action ids:
  - `chat.message.reply`
  - `chat.message.copy`
  - `chat.message.create-task`
  - `chat.message.debug-event`
- Message target invocation uses:
  - `contextTarget.kind = 'message'`
  - `contextTarget.conversationId`
  - `contextTarget.messageId`
  - `contextTarget.windowId`
- Runtime API addition:
  - `openContextMenu({ x, y, menuId, target, windowId?, widgetId? })`

## Step 5: Phase 5 Scenario 4 (Conversation-Level Menu)

Implemented conversation-surface context menu targeting so right-clicking the chat timeline background opens conversation actions instead of falling back to window-level context.

This step kept command ownership in inventory’s existing chat namespace: conversation actions are emitted as `inventory.chat.<conv>.conversation.*` commands and routed through launcher contribution handlers.

### Prompt Context

**User prompt (verbatim):** (same as Step 2)

**Assistant interpretation:** Continue straight through the next planned phase after message context actions.

**Inferred user intent:** Complete OS-10 scenario execution sequentially with concrete behavior, tests, and ticket bookkeeping.

### What I did

- Added timeline context-menu callback in chat widget surface:
  - `ChatWindow` now accepts `onTimelineContextMenu`.
- Added conversation target opening in chat conversation window:
  - `ChatConversationWindow` now:
    - registers conversation-scoped actions via `useRegisterConversationContextActions`,
    - opens `conversation-context` menu on timeline background right-click using `useOpenDesktopContextMenu`,
    - ignores message bubble right-click events so message menu remains higher priority on messages.
- Added inventory conversation command namespace helpers:
  - command builders + parser branches for:
    - `inventory.chat.<conv>.conversation.change-profile`
    - `inventory.chat.<conv>.conversation.replay-last-turn`
    - `inventory.chat.<conv>.conversation.open-timeline`
    - `inventory.chat.<conv>.conversation.export-transcript`
- Added inventory handlers:
  - `open-timeline`: opens timeline debug window for conversation.
  - `change-profile`: rotates to next available profile in conversation scope.
  - `replay-last-turn` / `export-transcript`: dispatch deterministic toast feedback.
- Added launcher host test coverage:
  - validated conversation command routing and outcomes for all four actions.

### Why

- Scenario 4 requires context behavior on the conversation canvas itself, not just message nodes or window chrome.
- Routing through the existing inventory namespace keeps app logic in app handlers and avoids shell-level app coupling.

### What worked

- `npm run typecheck -w packages/engine` passed.
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts` passed.
- `npm run test -w apps/os-launcher -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx` passed (with known existing selector warnings from unrelated components).

### What didn't work

- N/A for blockers in this phase; no new failing suites after the profile-dispatch assertion fix in host tests.

### What I learned

- Conversation-level and message-level menus can coexist cleanly by using event propagation boundaries (`chat-message` stops propagation, timeline background handles conversation context).
- Namespace-first command routing remains maintainable as scenarios grow: parser + typed handlers keeps behavior explicit.

### What was tricky to build

- The sharp edge was ensuring profile-change action dispatches in the correct channel.
  - Cause: inventory handlers mix `hostContext.dispatch` for host-side side effects and `ctx.dispatch` for command-context state updates.
  - Symptom: initial test asserted against wrong dispatcher and failed.
  - Resolution: updated test to provide/assert `ctx.dispatch` for profile updates while still asserting host dispatch for toast-based actions.

### What warrants a second pair of eyes

- Confirm product expectation for `Change Profile` behavior (cyclic next profile vs explicit selector submenu).
- Confirm whether `Replay Last Turn` and `Export Transcript` should remain toast placeholders or gain concrete backend operations in next phase.

### What should be done in the future

- Phase 6 (`OS10-60`..`OS10-63`): role/profile-aware visibility filtering and guardrails on context actions.

### Code review instructions

- Start with:
  - `packages/engine/src/chat/components/ChatConversationWindow.tsx`
  - `packages/engine/src/components/widgets/ChatWindow.tsx`
  - `apps/inventory/src/launcher/renderInventoryApp.tsx`
  - `apps/os-launcher/src/__tests__/launcherHost.test.tsx`
- Validate with:
  - `npm run typecheck -w packages/engine`
  - `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
  - `npm run test -w apps/os-launcher -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx`

### Technical details

- Conversation command suffixes:
  - `.conversation.change-profile`
  - `.conversation.replay-last-turn`
  - `.conversation.open-timeline`
  - `.conversation.export-transcript`
- Conversation context registration and invocation:
  - Target kind: `conversation`
  - Menu id: `conversation-context`
  - Payload includes `conversationId`.

## Step 6: Phase 6 Scenario 10 (Role/Profile-Aware Context Menus)

Implemented a clean visibility pipeline for context actions so role/profile gating is declarative at the action entry level and enforced centrally in one place.

This phase avoided app-specific hacks in menu rendering paths by adding a shared visibility evaluator used by all context target kinds (`icon`, `window`, `message`, `conversation`, `widget`).

### Prompt Context

**User prompt (verbatim):** (same as Step 2)

**Assistant interpretation:** Continue OS-10 execution and implement scenario 10 properly, including cleanup of older ad-hoc behavior.

**Inferred user intent:** Ship a robust role/profile-aware menu model that remains maintainable and does not regress command routing behavior.

### What I did

- Added visibility contracts to `DesktopActionItem`:
  - `allowedProfiles`
  - `allowedRoles`
  - custom predicate (`when`)
  - unauthorized policy (`hide` | `disable`)
- Added `contextActionVisibility.ts` with:
  - `isActionVisible`
  - `applyActionVisibility`
  - `isContextCommandAllowed`
- Updated shell controller to:
  - resolve visibility context from active chat profile state (`chatProfiles` + conversation scope),
  - apply visibility filtering before opening any context menu,
  - enforce guardrails in `routeCommand` for context-menu invocations so hidden/disabled entries cannot execute through the context-menu path.
- Added Scenario 10 tests in `contextActionVisibility.test.ts`.
- Added inventory conversation action visibility metadata:
  - profile-gated disabled fallback for `Change Profile` and `Replay Last Turn`,
  - role-gated hidden fallback for `Export Transcript`.
- Exported visibility helpers/types from windowing and desktop-react public surfaces.

### Why

- Scenario 10 required a first-class visibility model, not per-feature conditional menu code.
- Centralizing filtering + guardrails keeps behavior consistent across all target kinds and makes plugin/app contributions predictable.

### What worked

- `npm run typecheck -w packages/engine` passed.
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/contextActionVisibility.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts` passed.
- `npm run test -w apps/os-launcher -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx` passed.

### What didn't work

- No blocking failures in this phase.
- Existing launcher test stderr warnings (selector memoization + `act(...)`) remain unchanged and predate this work.

### What I learned

- Keeping visibility as action metadata scales better than target-specific conditionals in controller builders.
- Guarding at command dispatch time is still valuable even when UI already disables/hides entries.

### What was tricky to build

- The tricky part was making profile/role resolution generic enough for shell-level code without hard-coding inventory-specific types.
  - Cause: shell code operates on generic Redux root shape, while profile state originates in chat-specific slices.
  - Symptom: visibility logic risked either tight coupling or missing scoped profile selection.
  - Resolution: add a tolerant state reader in shell controller (`chatProfiles` + `conv:<id>` scope fallback) and keep filtering logic itself pure/tested in `contextActionVisibility.ts`.

### What warrants a second pair of eyes

- Whether role extraction should continue to read `profile.extensions.role(s)` or move to a stronger typed contract once role semantics are finalized.
- Whether non-context-menu command paths should also honor Scenario 10 guardrails in future hardening.

### What should be done in the future

- Phase 7 (`OS10-70`..`OS10-75`): docs/storybook closure and full validation.

### Code review instructions

- Start with:
  - `packages/engine/src/components/shell/windowing/contextActionVisibility.ts`
  - `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
  - `packages/engine/src/components/shell/windowing/types.ts`
  - `apps/inventory/src/launcher/renderInventoryApp.tsx`
- Validate with:
  - `npm run typecheck -w packages/engine`
  - `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/contextActionVisibility.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
  - `npm run test -w apps/os-launcher -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx`

### Technical details

- Visibility context fields:
  - `profile`
  - `registry`
  - `roles`
  - `target`
- Unauthorized policies:
  - `hide` removes entries.
  - `disable` keeps entries rendered but disabled.
- Guardrail behavior:
  - context-menu command execution is denied when matching menu entry is hidden/disabled after visibility filtering.

## Step 7: Phase 7 Docs, Validation, and Ticket Closure

Completed closure tasks by updating authoring docs and Storybook showcase coverage, then running full workspace test/build validation and marking the ticket closed.

This step intentionally kept closure explicit: all remaining checkboxes were completed, status moved to `closed`, and final validation commands were recorded.

### Prompt Context

**User prompt (verbatim):** (same as Step 2)

**Assistant interpretation:** Keep going through the remaining OS-10 work and finish the ticket end-to-end.

**Inferred user intent:** Deliver the feature as done, not partial, with docs/tests/validation and bookkeeping complete.

### What I did

- Updated engine authoring guide with:
  - target-scoped registration hooks,
  - explicit `useOpenDesktopContextMenu` usage,
  - visibility/guardrail semantics.
- Added Storybook scenario board:
  - `WithChatMessageConversationAndRoleAwareContextMenu`
  - demonstrates scenarios 3/4/10 in one interactive window.
- Ran targeted validation:
  - engine context-action suite,
  - launcher context-menu/host suites.
- Ran full frontend validation:
  - `npm test`
  - `npm run build`
- Updated ticket docs:
  - checked off Phase 6/7 tasks and DoD,
  - appended changelog entries for steps 6/7,
  - updated index status to `closed` and refreshed related files/metadata.

### Why

- OS-10’s DoD explicitly requires documentation, demos, and complete validation, not only code implementation.
- Closure bookkeeping ensures downstream contributors can trust ticket state and follow the documented APIs.

### What worked

- `npm test` passed across engine, desktop-os, and os-launcher suites.
- `npm run build` passed across all workspace packages/apps.
- Targeted and full validations matched expected behavior with no new blocking failures.

### What didn't work

- No closure blockers.
- Existing non-blocking warnings in os-launcher tests persisted (selector memoization and `act(...)` notices from `PluginCardSessionHost`) and were not introduced by this ticket.

### What I learned

- The new scenario board is useful as a compact regression harness for target + visibility behavior without needing app backend setup.
- Keeping closure commands in changelog/tasks reduces ambiguity when revisiting long-running tickets.

### What was tricky to build

- The trickiest part was keeping Storybook runtime hooks stable to avoid re-registration loops.
  - Cause: target registration hooks react to action-array identity changes.
  - Symptom: story components can churn registrations each render if action arrays are not memoized.
  - Resolution: memoized message/conversation action arrays in the story component with `useMemo`.

### What warrants a second pair of eyes

- Optional follow-up to clean known os-launcher test warnings for overall suite hygiene.
- Optional expansion of story controls for role/registry simulation beyond profile switching.

### What should be done in the future

- `N/A`

### Code review instructions

- Start with:
  - `packages/engine/docs/desktop-menu-runtime-authoring.md`
  - `packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx`
  - `ttmp/2026/02/24/OS-10-CONTEXT-MENU-SHOWCASES--widget-and-icon-scoped-context-menu-showcase-scenarios/tasks.md`
  - `ttmp/2026/02/24/OS-10-CONTEXT-MENU-SHOWCASES--widget-and-icon-scoped-context-menu-showcase-scenarios/index.md`
  - `ttmp/2026/02/24/OS-10-CONTEXT-MENU-SHOWCASES--widget-and-icon-scoped-context-menu-showcase-scenarios/changelog.md`
- Validate with:
  - `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/contextActionVisibility.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
  - `npm run test -w apps/os-launcher -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx`
  - `npm test`
  - `npm run build`

### Technical details

- Storybook scenario id:
  - `WithChatMessageConversationAndRoleAwareContextMenu`
- Ticket status:
  - moved from `active` to `closed`
- Full validation commands completed:
  - `npm test`
  - `npm run build`
