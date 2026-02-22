# Changelog

## 2026-02-21

- Initial workspace created


## 2026-02-21

Backfilled bug analysis and diary; implemented merge-based hydrate patch in progress to prevent timeline reorder/entity loss on focus.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.ts — Added mergeSnapshot and shared upsert helper
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.ts — Switched hydrate snapshot application to merge semantics and removed clearConversation
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-54-CHAT-FOCUS-TIMELINE-ORDER--prevent-timeline-reorder-on-chat-window-focus/reference/01-diary.md — Backfilled implementation diary for this bug


## 2026-02-21

Implemented merge-based hydrate fix and regression tests (commit 1f63ce0679738d05e7c88074e4c1dd07caceb8c5); targeted vitest suite passed (2 files, 9 tests).

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.test.ts — Added mergeSnapshot order-preservation test
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.ts — Added mergeSnapshot and shared version-aware upsert helper
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.test.ts — Added focus/reconnect hydrate regression test
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.ts — Hydrate now merges snapshot entities without clearing timeline

