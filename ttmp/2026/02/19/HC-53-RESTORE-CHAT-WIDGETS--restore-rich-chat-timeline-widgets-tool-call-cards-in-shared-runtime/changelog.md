# Changelog

## 2026-02-19

- Initial workspace created


## 2026-02-19

Implemented rich timeline/widget/card restoration on timeline-first SEM projection, added regression tests, and authored long-form regression analysis + diary (commit pending).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Rewired ChatWindow to use rich synthesized display messages and renderWidget callback
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts — Added round-scoped timeline entity to widget message synthesis
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts — Added formatTimelineEntity bridge to reuse canonical timeline-upsert mapping semantics
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/01-regression-analysis-and-restoration-plan-rich-timeline-projections.md — Stored full regression analysis and restoration plan
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/reference/01-diary.md — Stored detailed implementation diary


## 2026-02-19

Finalized HC-53 implementation commit b091a8c and uploaded analysis bundle to reMarkable (/ai/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/changelog.md — Recorded final commit and upload completion
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/reference/01-diary.md — Documented finalization and upload validation outcomes
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/tasks.md — Closed task list after commit and upload


## 2026-02-19

Extended HC-53 architecture analysis with pinocchio `pkg/webchat` reuse mapping and protobuf custom-event contract strategy for Hypercard widget/card flows (docs-only update).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/02-generic-chatwindow-and-hypercard-renderer-pack-architecture.md — Added comparative architecture, reuse matrix, protobuf migration design, and hybrid runtime model
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/reference/01-diary.md — Added Step 8 diary entry documenting evidence gathering and docs-only constraints
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/index.md — Added design-doc 02 to ticket key links


## 2026-02-19

Committed the docs-only HC-53 extension (`e659bdb`) and uploaded the refreshed analysis bundle to reMarkable (`HC-53 Reusable Chat Runtime and Protobuf Analysis.pdf`).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/02-generic-chatwindow-and-hypercard-renderer-pack-architecture.md — Committed extended architecture analysis as durable ticket artifact
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/tasks.md — Closed docs-only publication task for reMarkable upload
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/reference/01-diary.md — Diary updated to include the extended analysis and publication trail


## 2026-02-19

Authored a new end-to-end implementation playbook for custom webchat timeline entities/widgets and uploaded it to reMarkable (`HC-53 Webchat Timeline Widget Entity Playbook.pdf`).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md — Added detailed implementation blueprint (protobuf contracts, backend/frontend projection registration, widget renderer registration, validation matrix)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/index.md — Linked design-doc 03 from ticket hub
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/tasks.md — Marked playbook drafting and publication complete
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/reference/01-diary.md — Added Step 10 diary entry for this docs-only playbook request

## 2026-02-19

Updated HC-53 documentation to align with latest Pinocchio architecture changes (TimelineEntityV2 open model) and linked the new tutorial guides used as implementation templates.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md — Rewritten playbook: removed TimelineEntityV1/oneof assumptions, enforced dedicated-kind TimelineEntityV2 strategy, and documented registry/explicit-bootstrap flow
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/tasks.md — Refreshed task list for V2/open-kind cutover and tutorial-backed implementation checklist
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/index.md — Added canonical links to Pinocchio tutorials and updated status wording
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md — Referenced as backend/frontend module registration template for HC-53 implementation
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md — Referenced as transport/hydration/render flow template for HC-53 implementation
