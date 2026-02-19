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

