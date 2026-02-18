# Changelog

## 2026-02-17

- Initial workspace created


## 2026-02-17

Created a full 5+ page timeline-first chat implementation plan with architecture boundaries, pseudocode contracts, sequence/timeline diagrams, phased workstreams, and cutover policy.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md — Main design deliverable for this request


## 2026-02-17

Uploaded implementation plan PDF to reMarkable at /ai/2026/02/17/HC-51-TIMELINE-FIRST-CHAT and verified remote presence; updated diary and task checklist.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/reference/01-diary.md — Detailed activity record and upload commands
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/tasks.md — Checklist tracking for requested deliverables


## 2026-02-18

Imported expert review source (/tmp/hc-51-update.md), validated it against Pinocchio docs/web-chat code and current inventory chat implementation, and rewrote the HC-51 design doc in depth for strict SEM->timeline alignment.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md — Rewritten post-review implementation plan
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/sources/local/01-hc-51-update.md — Imported expert suggestions source


## 2026-02-18

Uploaded revised HC-51 implementation plan to reMarkable at /ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT and verified remote listing.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md — Uploaded revised plan source
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/reference/01-diary.md — Diary records exact upload and verification commands


## 2026-02-18

Uploaded latest post-cleanup revision of the HC-51 plan to reMarkable at /ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT-UPDATED and verified remote listing after path retry.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md — Latest uploaded revision source
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/reference/01-diary.md — Diary records retry and final verification path


## 2026-02-18

Implemented Impl A1/A2/B1 foundation (commit a6d375a): added engine timeline core slice/selectors/version comparator, added SEM registry + mapper/default handlers, and added focused tests.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts — SEM registry and default event handlers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/timelineMapper.ts — timeline.upsert entity mapper supporting snapshot variants
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/timeline/timelineSlice.ts — Conversation-scoped canonical timeline reducer


## 2026-02-18

Implemented Impl C1/C2 (commit 984659e): upgraded inventory webchat client to hydrate-buffer-replay flow with seq/stream_id retention and wired raw envelope emission at ingress before projection.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Ingress raw-event hook and snapshot callback integration
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/webchatClient.test.ts — Replay ordering tests for stream_id/seq behavior
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/webchatClient.ts — Hydration/replay session manager behavior and envelope ordering


## 2026-02-18

Implemented Impl D1/D2/E1 (commit 63e3a54): refactored inventory runtime to render from timeline entities via SEM registry projection, wired timeline reducer into app store, and preserved artifact/card runtime indexing from timeline semantic events.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/app/store.ts — Added timeline reducer wiring in inventory app store
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Registry-driven SEM projection and timeline-entity-based rendering path
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts — Chat state slice alignment for timeline-aware store shape


## 2026-02-18

Implemented Impl F1/F2 completion (commit 5141d98): removed legacy synthetic timeline widget-message reducer path, rewrote chat slice tests for metadata-only state contract, and completed focused runtime/test/typecheck validation.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts — Hard cutover to metadata-only chat slice
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.test.ts — New tests for suggestions/connection/stream stats metadata contract
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts — Dispatch typing alignment for timeline op applier
