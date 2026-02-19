# Changelog

## 2026-02-19

- Initial workspace created


## 2026-02-19

Initialized execution-ready task plan for the clean TimelineEntityV2 cutover (steps 1-9) with explicit legacy-removal requirements at each phase.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/tasks.md — Added concrete step-by-step implementation tasks and hard legacy removal gates
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/index.md — Added ticket summary, execution context, and canonical implementation links

## 2026-02-19

Added comprehensive HC-54 implementation plan document consolidating cutover sequencing, protobuf extraction strategy, end-state file layout, legacy-removal gates, and validation/reviewer checklists.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/design/01-clean-cutover-implementation-plan-timelineentityv2.md — New detailed implementation plan for HC-54 execution
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/index.md — Added direct link to the detailed implementation plan

## 2026-02-19

Began HC-54 implementation execution and completed Step 1 (contract freeze + no-legacy baseline), including diary initialization for task-by-task tracking.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/tasks.md — Marked Step 1 complete and updated done checklist
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/reference/01-diary.md — Added execution diary with Step 1 entry and review guidance

## 2026-02-19

Completed HC-54 Step 2 by introducing app-owned protobuf extraction for Hypercard widget/card lifecycle payloads and cutting backend projection output to dedicated TimelineEntityV2 kinds (`hypercard_widget`, `hypercard_card`).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/proto/sem/hypercard/widget.proto — New widget lifecycle protobuf contract
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/proto/sem/hypercard/card.proto — New card lifecycle protobuf contract
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/pb/sem/hypercard/widget.pb.go — Generated Go binding for widget lifecycle payload extraction
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/pb/sem/hypercard/card.pb.go — Generated Go binding for card lifecycle payload extraction
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_payload_proto.go — Protojson decode + TimelineEntityV2 props mapping helpers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go — Backend timeline handler cutover to dedicated kinds and deterministic IDs
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_payload_proto_test.go — Decode/props unit coverage
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events_timeline_test.go — Projection tests asserting dedicated kind snapshots

## 2026-02-19

Completed HC-54 Step 3 by adding shared frontend registry seams for timeline-kind props normalization and inline-widget renderer dispatch, and rewired Inventory chat rendering to explicit bootstrap + registry-based widget dispatch.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/timelinePropsRegistry.ts — New shared kind normalizer registry API
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/timelineMapper.ts — Normalizer integration and unknown-kind `entity.props` fallback
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts — New shared inline widget renderer registry API
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/widgetRendererRegistry.tsx — Explicit Inventory bootstrap for widget registrations
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Manual widget switch removed in favor of registry dispatch
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/timelinePropsRegistry.test.ts — Kind normalizer registry tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/timelineMapper.test.ts — Timeline mapper custom-kind props normalization tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.test.ts — Inline widget renderer registry tests

## 2026-02-19

Marked HC-54 Step 4 complete after backend hard-cut verification confirmed widget/card projection now persists only through dedicated `TimelineEntityV2` kinds and no active backend `tool_result/customKind` routing remains.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go — Dedicated `hypercard_widget|hypercard_card` projection handlers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events_timeline_test.go — Snapshot coverage proving dedicated kind projection behavior
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_payload_proto.go — Protobuf extraction helpers used by projection handlers

## 2026-02-19

Completed HC-54 Step 5 by cutting frontend projection/render mapping over to dedicated Hypercard kinds and removing widget/card legacy custom-kind routing through `tool_result`.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts — Hypercard SEM direct handlers now upsert `hypercard_widget` / `hypercard_card` entities
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts — Dedicated kind timeline item projection; widget/card customKind branches removed
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/artifacts/artifactRuntime.ts — Artifact extraction updated for timeline `hypercard_widget` / `hypercard_card` entities
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts — Message fallback no longer treats widget/card as special tool-result custom kinds
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts — Snapshot hydration test updated to dedicated card kind
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts — Timeline projection tests updated to dedicated widget/card kinds
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/timelineEntityRenderer.test.ts — Renderer tests updated to dedicated kind fixtures
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactRuntime.test.ts — Artifact extraction tests updated for dedicated timeline kinds

## 2026-02-19

Completed HC-54 Step 6 by moving Hypercard widget panel files via `git mv`, introducing an engine-owned explicit widget-pack registration entrypoint, and removing inventory-local widget registration duplication.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/HypercardTimelinePanel.tsx — `git mv` target for former timeline widget file
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/HypercardArtifactPanels.tsx — `git mv` target for former artifact panel widget file
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx — New explicit renderer-pack bootstrap/registration API
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.test.ts — Renderer-pack registration tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Inventory now registers engine pack explicitly (`namespace: "inventory"`)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/widgetRendererRegistry.tsx — Removed duplicated inventory-local registration implementation

## 2026-02-19

Completed HC-54 Steps 7 and 8 by extracting reusable chat runtime orchestration components/hooks into engine and rewiring Inventory to consume those shared primitives plus the engine-owned Hypercard widget pack.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx — New reusable timeline-driven ChatWindow integration component
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts — New reusable projected-envelope connection orchestration hook
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts — Inventory timeline display builder extracted into engine runtime
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.test.ts — Extracted/updated runtime display tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Inventory now consumes reusable runtime primitives and keeps host/business callbacks
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts — Removed inventory-local timeline renderer implementation (moved to engine runtime)

## 2026-02-19

Completed HC-54 Step 9 final hard-cut gate with full backend/frontend test validation, typecheck, and legacy-path scans; no active widget/card legacy custom-kind routing or old renderer-path references remain.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go — Dedicated backend projection source of truth revalidated
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts — Dedicated frontend hypercard lifecycle projection revalidated
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx — Final reusable runtime integration target for chat shell
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Inventory final host-layer integration after cutover
