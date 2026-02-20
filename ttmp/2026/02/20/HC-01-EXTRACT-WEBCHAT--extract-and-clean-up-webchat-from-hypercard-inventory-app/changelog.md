# Changelog

## 2026-02-20

- Initial workspace created


## 2026-02-20

Explored all three codebases (inventory chat, engine, pinocchio web-chat). Created detailed implementation plan (design-doc/01) with 8 phases, 6 architectural decisions, and 45 tasks. Created exploration diary (reference/01).

Updated Phase 4 plan and tasks to remove legacy `messages` functionality from `ChatWindow` and preserve message UX in `MessageRenderer`/timeline renderers.

## 2026-02-20

Phase 1 complete: implemented engine chat skeleton, SemContext-based SEM registry, protobuf SEM types, conversation-scoped timeline/session slices, selectors, and unit tests (commit a813f39).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.test.ts — Added sem registry tests for handler registration and context threading
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.ts — Adapted registry handlers to SemContext with convId-scoped dispatch
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/chatSessionSlice.ts — Added per-conversation chat session state/actions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.test.ts — Added timeline reducer tests for scoping/version/rekey
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.ts — Added conversation-scoped timeline state and version-gated upsert

