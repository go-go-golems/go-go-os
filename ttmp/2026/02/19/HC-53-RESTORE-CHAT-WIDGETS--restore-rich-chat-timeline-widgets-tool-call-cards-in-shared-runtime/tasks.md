# Tasks

## TODO

- [ ] Define Hypercard timeline kind contract on top of TimelineEntityV2 (no Pinocchio transport proto edits):
  - freeze dedicated kinds: `hypercard_widget`, `hypercard_card`
  - freeze deterministic IDs: `<itemId>:widget`, `<itemId>:card`
  - document required props (`schemaVersion`, `itemId`, `title`, `phase`, `error`, `data`) in HC-53 docs and code comments
- [ ] Refactor backend projection to emit dedicated TimelineEntityV2 kinds (hard cutover):
  - update `go-inventory-chat/internal/pinoweb/hypercard_events.go` handlers to upsert `kind=hypercard_widget|hypercard_card`
  - remove widget/card final payload emission through `tool_result` + `customKind`
  - keep sequence/version semantics compatible with canonical `timeline.upsert` replay
- [ ] Update backend tests for dedicated V2 kind projection:
  - adjust translator/projection tests to assert `kind=hypercard_widget|hypercard_card` payloads
  - remove tests that assert `tool_result.customKind` widget/card path
- [ ] Refactor frontend timeline mapping to dedicated kinds:
  - update `packages/engine/src/hypercard-chat/sem/registry.ts` and mapper utilities for canonical `timeline.upsert` kind ingestion
  - update `packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts` mappings
  - remove widget/card fallback mapping via `tool_result.customKind`
- [ ] Introduce registry-driven frontend extension seams (Pinocchio parity):
  - add kind props-normalizer registration seam (equivalent to Pinocchio `timelinePropsRegistry`)
  - add kind renderer registration seam (equivalent to Pinocchio `rendererRegistry`)
  - wire explicit Hypercard bootstrap registration from app startup (no init side effects)
- [ ] Move widget renderer files with `git mv` before edits (preserve history + styling):
  - `packages/engine/src/hypercard-chat/widgets/TimelineWidget.tsx` -> `packages/engine/src/hypercard-chat/widgets/HypercardTimelinePanel.tsx`
  - `packages/engine/src/hypercard-chat/widgets/ArtifactPanelWidgets.tsx` -> `packages/engine/src/hypercard-chat/widgets/HypercardArtifactPanels.tsx`
  - rewrite imports/exports after move rather than recreating files
- [ ] Simplify Inventory integration to reusable module wiring:
  - keep app-owned host actions in `InventoryChatWindow` only
  - move kind routing/normalization/renderer registration into reusable module files
- [ ] Cutover cleanup (explicitly no backward compatibility):
  - remove dead constants/types/functions tied to widget/card `customKind` routing
  - remove compatibility aliases and dual-path logic
  - enforce dedicated-kind-only behavior in docs and tests
- [ ] Validation and rollout gates:
  - hydration/replay test proving same state pre/post refresh with dedicated kinds
  - end-to-end inventory chat test with widget + card lifecycle events
  - visual QA checklist confirming rich timeline panels render and actions still work
  - verification checklist run against tutorial-backed flow:
    - `pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md`
    - `pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md`

## Done

- [x] Create ticket/docs and capture ongoing implementation diary
- [x] Perform git archaeology from 5daf495 to identify regression commit(s)
- [x] Design restoration aligned with timeline-first SEM projection architecture
- [x] Implement rich widget/tool-call/card rendering restoration
- [x] Validate via tests/typecheck and produce 5+ page ticket analysis
- [x] Commit HC-53 code + documentation changes (`b091a8c`)
- [x] Upload HC-53 analysis bundle to reMarkable (`HC-53 Restore Chat Widgets Analysis.pdf`)
- [x] Produce extended architecture analysis covering pinocchio pkg/webchat reuse and protobuf custom-event approach
- [x] Commit docs-only extension for reusable chat/protobuf architecture (`e659bdb`)
- [x] Upload updated HC-53 bundle to reMarkable (`HC-53 Reusable Chat Runtime and Protobuf Analysis.pdf`)
- [x] Produce end-to-end playbook for custom timeline entities/widgets (protobuf + backend/frontend projection + widget registration)
- [x] Upload playbook bundle to reMarkable (`HC-53 Webchat Timeline Widget Entity Playbook.pdf`)
- [x] Refresh HC-53 playbook/tasks for Pinocchio TimelineEntityV2 open model and tutorial-backed extension seams
