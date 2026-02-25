# Tasks

## Execution Checklist

### Ticket setup and plan framing

- [x] `OS10-00` Create ticket `OS-10-CONTEXT-MENU-SHOWCASES` and baseline docs.
- [x] `OS10-01` Add implementation plan covering showcase scenarios `1`, `2`, `3`, `4`, and `10`.
- [x] `OS10-02` Document scenario `11` feasibility and required platform extensions.

### Phase 1: Context target foundation

- [x] `OS10-10` Add target descriptor contract for context menus (`icon`, `widget`, `message`, `conversation`, `window`).
- [x] `OS10-11` Extend shell runtime registry to register context actions per target key, not only per window id.
- [x] `OS10-12` Add context menu resolution precedence (`exact target` -> `window target` -> `default`).
- [x] `OS10-13` Add hook helpers for target-scoped registration (icon/widget/message/conversation).
- [x] `OS10-14` Add command invocation metadata coverage for target attributes.

### Phase 2: Scenario 1 - Icon quick actions

- [x] `OS10-20` Add right-click handling to desktop icons in `DesktopIconLayer`.
- [x] `OS10-21` Add icon-target context action registration and default quick actions (`Open`, `Open New`, `Pin`, `Inspect`).
- [x] `OS10-22` Add icon quick action command handlers and routing tests.
- [x] `OS10-23` Add Storybook demo for icon quick actions.

### Phase 3: Scenario 2 - Folder/icon hybrid launcher

- [x] `OS10-30` Add folder icon type contract and launcher semantics (`Open`, `Open in New Window`, `Launch All`, `Sort Icons`).
- [x] `OS10-31` Implement folder-target context menu actions and command handlers.
- [x] `OS10-32` Add integration tests for folder menu behavior.
- [x] `OS10-33` Add Storybook demo for folder context menu flow.

### Phase 4: Scenario 3 - Chat message context menu

- [x] `OS10-40` Add per-message context target registration in chat message renderer.
- [x] `OS10-41` Implement message actions (`Reply`, `Copy`, `Create Task`, `Debug Event`).
- [x] `OS10-42` Ensure message action payload includes conversation/message ids.
- [x] `OS10-43` Add chat integration tests for message menu targeting.

### Phase 5: Scenario 4 - Conversation-level menu

- [x] `OS10-50` Add conversation-surface context target for chat window body.
- [x] `OS10-51` Implement conversation actions (`Change Profile`, `Replay Last Turn`, `Open Timeline`, `Export Transcript`).
- [x] `OS10-52` Route conversation actions through existing inventory chat command namespace.
- [x] `OS10-53` Add integration tests for conversation-level context actions.

### Phase 6: Scenario 10 - Role/profile-aware menus

- [x] `OS10-60` Add role/profile predicate support to context action entries.
- [x] `OS10-61` Wire visibility filtering against current profile/role selection state.
- [x] `OS10-62` Add fallback disabled/hidden policy for unauthorized actions.
- [x] `OS10-63` Add test coverage for role-aware menu filtering and command guardrails.

### Phase 7: Docs, quality, and closure

- [x] `OS10-70` Add engine authoring docs for target-scoped context menu APIs.
- [x] `OS10-71` Add Storybook showcase board for scenarios 1/2/3/4/10.
- [x] `OS10-72` Run targeted tests for engine + launcher context menu suites.
- [x] `OS10-73` Run full frontend validation (`pnpm test`, `pnpm build`) and record results.
- [x] `OS10-74` Update changelog/diary and run `docmgr doctor --ticket OS-10-CONTEXT-MENU-SHOWCASES --stale-after 30`.
- [x] `OS10-75` Close ticket once showcases are implemented and demo-ready.

## Definition of Done

- [x] Context menu system supports target-specific menus for icons/widgets/messages/conversations.
- [x] Showcase scenarios `1`, `2`, `3`, `4`, and `10` are implemented and demoed.
- [x] Scenario `11` extension path is documented with explicit platform prerequisites.
- [x] Tests cover target resolution precedence and role/profile filtering behavior.
- [x] Documentation and Storybook are updated for downstream app/module authors.
