# Changelog

## 2026-02-24

- Initial workspace created
- Added detailed implementation plan for showcase scenarios `1`, `2`, `3`, `4`, and `10`
- Added execution task checklist with phased plan and DoD
- Documented scenario `11` plugin-injected context actions feasibility and additional platform requirements

## 2026-02-25

Started OS-10 implementation by completing Phase 1 context-target foundation: target contracts, target-keyed context action registry, precedence resolution, target-scoped hooks, and command invocation target metadata plumbing.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/types.ts — Added `ContextTargetKind`, `DesktopContextTargetRef`, and `contextTarget` invocation metadata.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/contextActionRegistry.ts — New target-key registry and precedence resolver (`exact -> qualified kind -> kind -> window`).
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/contextActionRegistry.test.ts — Unit tests for keying, precedence ordering, and merge conflict policy.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx — Added generic target-scoped context registration APIs and helper hooks.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Switched context action storage to target registry and included context target metadata in routed command invocations.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShellView.tsx — Passed generic target runtime callbacks through provider wiring.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/index.ts — Exported new context target types/hooks/registry helpers.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/desktop/react/index.ts — Exported new target-scoped APIs from desktop-react surface.

Validation:

- `npm run typecheck -w packages/engine`
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts`

## 2026-02-25

Completed OS-10 Phase 2 (Scenario 1: icon quick actions): icon right-click now opens shell context menu quick actions, icon command routing supports context-menu open/open-new paths, and launcher integration test + Storybook demo were added.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx — Added right-click handling callback for desktop icons.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Added icon context menu item builder, icon context target metadata, and icon open/open-new command routing fallback.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShellView.tsx — Wired icon context-menu callback into shell icon layer.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx — Added integration test for icon quick actions and open-command routing.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx — Added Storybook scenario demonstrating icon quick-action context menu UX.

Validation:

- `npm run typecheck -w packages/engine`
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
- `npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx`

## 2026-02-25

Completed OS-10 Phase 3 (Scenario 2: folder/icon hybrid launcher): added folder icon contract, folder-aware context menu defaults/command routing, launcher folder icon contribution, integration tests, and Storybook showcase.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/types.ts — Added icon kind and folder metadata contracts (`DesktopIconKind`, `DesktopFolderIconOptions`) plus `iconKind` target metadata.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/contextActionRegistry.ts — Added `iconKind` key normalization and precedence fallback from icon-kind specific keys to generic icon keys.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Added folder command handling (`folder.open`, `folder.open-new`, `folder.launch-all`, `folder.sort-icons`), folder context menu defaults, and local deterministic icon sorting state.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/desktop-os/src/runtime/buildLauncherIcons.ts — Added default launcher folder icon generation with member icon mapping.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/desktop-os/src/runtime/buildLauncherContributions.ts — Wired folder icon options into launcher icon contribution composition.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx — Added folder integration tests (`Launch All`, `Sort Icons`) in launcher host.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx — Added `WithFolderHybridLauncherContextMenu` story.

Validation:

- `npm run typecheck -w packages/engine`
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
- `npm run test -w packages/desktop-os`
- `npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx src/__tests__/launcherHost.test.tsx`

## 2026-02-25

Completed OS-10 Phase 4 (Scenario 3: chat message context menu): added message-target context menu opening from message renderer, message action registration with payload metadata, runtime open-context-menu API, and launcher command-routing tests for message actions.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx — Added `openContextMenu` runtime API and `useOpenDesktopContextMenu` hook.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Added generic target menu opening, message-target menu resolution, and built-in `chat.message.copy` handling.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx — Added per-message context action registration (`Reply`, `Copy`, `Create Task`, `Debug Event`) and right-click target invocation with conversation/message payload.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx — Added inventory command handlers for message actions, including debug-event routing to event viewer.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx — Added command-level integration coverage for message context action payload routing.

Validation:

- `npm run typecheck -w packages/engine`
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
- `npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx src/__tests__/launcherHost.test.tsx`

## 2026-02-25

Completed OS-10 Phase 5 (Scenario 4: conversation-level menu): chat timeline background now opens a conversation-target context menu, conversation actions are registered and routed through inventory chat command namespace, and launcher host tests validate action routing.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/widgets/ChatWindow.tsx — Added timeline context-menu callback surface for conversation background targeting.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx — Registered conversation context actions and opened `conversation-context` menu on timeline background right-click.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx — Added inventory conversation command builders/parsing and handlers (`change-profile`, `replay-last-turn`, `open-timeline`, `export-transcript`).
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx — Added integration tests for conversation command namespace routing and payload outcomes.

Validation:

- `npm run typecheck -w packages/engine`
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
- `npm run test -w apps/os-launcher -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx`

## 2026-02-25

Completed OS-10 Phase 6 (Scenario 10: role/profile-aware menus): added action-level role/profile predicates, centralized visibility filtering, unauthorized hide/disable behavior, and context-menu command guardrails.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/types.ts — Added `DesktopActionVisibility` and `DesktopActionVisibilityContext` contracts on `DesktopActionItem`.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/contextActionVisibility.ts — Added visibility evaluator/filter pipeline and context command guard helper.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Wired profile/role-aware filtering into target menu resolution and added guardrails before context-menu command routing.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/contextActionVisibility.test.ts — Added unit tests for profile/role filtering, hide/disable fallback, separator normalization, and command guard behavior.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx — Added visibility policies to conversation actions (`Replay Last Turn`, `Export Transcript`, `Change Profile`) for scenario coverage.

Validation:

- `npm run typecheck -w packages/engine`
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/contextActionVisibility.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
- `npm run test -w apps/os-launcher -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx`

## 2026-02-25

Completed OS-10 Phase 7 and ticket closure: updated authoring docs for target-scoped menus, added a Storybook scenario board covering chat message/conversation/role-aware behavior, ran full frontend validation, and closed the ticket.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/docs/desktop-menu-runtime-authoring.md — Added target-scoped registration/open-menu APIs, `contextTarget` invocation metadata, and role/profile visibility guidance.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx — Added `WithChatMessageConversationAndRoleAwareContextMenu` showcase story to cover scenarios 3/4/10 in one board.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/index.ts — Exported visibility helper APIs and visibility context types from windowing surface.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/desktop/react/index.ts — Exported visibility helper APIs and visibility context types from desktop-react surface.

Validation:

- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/contextActionVisibility.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts`
- `npm run test -w apps/os-launcher -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx`
- `npm test`
- `npm run build`
