---
Title: Webchat Timeline Widget Entity End-to-End Implementation Playbook
Ticket: HC-53-RESTORE-CHAT-WIDGETS
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../pinocchio/pkg/sem/pb/proto/sem/timeline/transport.pb.go
      Note: Canonical TimelineEntityV2 open model (kind + props + typed + meta)
    - Path: ../../../../../../../pinocchio/pkg/webchat/timeline_projector.go
      Note: Canonical backend projector with custom handler registry and timeline.upsert durability
    - Path: ../../../../../../../pinocchio/pkg/webchat/timeline_registry.go
      Note: Backend registration seam for custom SEM event to timeline projection
    - Path: ../../../../../../../pinocchio/cmd/web-chat/thinkingmode/backend.go
      Note: App-owned explicit bootstrap pattern for custom event translation + projection
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/features/thinkingMode/registerThinkingMode.tsx
      Note: App-owned frontend module registration for SEM handlers, normalizers, and renderers
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/sem/registry.ts
      Note: Frontend canonical timeline.upsert ingestion and default SEM handler model
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts
      Note: Registry-driven kind normalizer extension seam
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts
      Note: Registry-driven kind renderer dispatch seam
    - Path: ../../../../../../../pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md
      Note: End-to-end feature module tutorial used as implementation template
    - Path: ../../../../../../../pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md
      Note: Standalone web UI tutorial for websocket + timeline hydration + render flow
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Current app integration point to be simplified via reusable runtime + module bootstrap
    - Path: apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts
      Note: Current app-local display synthesis to migrate into registry-driven reusable layer
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Hypercard backend bridge where dedicated kind projection cutover lands
    - Path: packages/engine/src/hypercard-chat/sem/registry.ts
      Note: Hypercard frontend SEM registry requiring dedicated kind cutover
    - Path: packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts
      Note: Timeline entity formatting/mapping utilities used by display synthesis
    - Path: packages/engine/src/hypercard-chat/widgets/TimelineWidget.tsx
      Note: Rich timeline widget renderer to preserve with git mv-based extraction
    - Path: packages/engine/src/hypercard-chat/widgets/ArtifactPanelWidgets.tsx
      Note: Rich generated widget/card panel renderer to preserve with git mv-based extraction
ExternalSources: []
Summary: Updated HC-53 implementation playbook aligned with Pinocchio TimelineEntityV2/open-kind architecture and new tutorial-backed module registration model.
LastUpdated: 2026-02-19T15:10:00-05:00
WhatFor: Provide a concrete implementation blueprint for restoring Hypercard rich widgets/cards using dedicated timeline kinds under the new open model.
WhenToUse: Use when implementing HC-53 refactor and when reviewing migration away from tool_result/customKind routing.
---

# Webchat Timeline Widget Entity End-to-End Implementation Playbook

## Executive Summary

This playbook is the HC-53 implementation contract after the Pinocchio GP-028 refactor.

The prior plan assumed adding Hypercard snapshots to `TimelineEntityV1` oneof. That is now obsolete. Pinocchio has already hard-cut to `TimelineEntityV2` open model (`kind + props + optional typed payload`). Therefore HC-53 should not add new oneof cases or rely on `tool_result.customKind` hacks.

The target for Hypercard is:

1. Backend projects Hypercard widget/card lifecycle into dedicated timeline kinds (`hypercard_widget`, `hypercard_card`) using `TimelineEntityV2`.
2. Frontend consumes canonical `timeline.upsert` entities and renders by kind through registry-based dispatch.
3. Widget/card rendering is extracted from Inventory app wiring into self-contained registration modules.
4. No backward compatibility path for legacy `tool_result(customKind=...)` routing.

## Delta From Previous HC-53 Drafts

The following changes supersede prior HC-53 docs:

1. `TimelineEntityV1` oneof expansion is no longer valid; Pinocchio is V2-only.
2. Hypercard custom kinds do not require edits to `pinocchio/proto/sem/timeline/transport.proto` for each new kind.
3. The extension model is now explicitly registry + module bootstrap based (backend and frontend).
4. Canonical tutorial references now exist and should be treated as implementation guides, not optional reading:
   - `pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md`
   - `pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md`

## Canonical References For HC-53 Implementation

Use these as the implementation baseline:

1. `pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md`
2. `pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md`
3. `pinocchio/cmd/web-chat/thinkingmode/backend.go`
4. `pinocchio/cmd/web-chat/web/src/features/thinkingMode/registerThinkingMode.tsx`
5. `pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts`
6. `pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts`

These files show the exact pattern HC-53 should replicate for Hypercard.

## Required Architecture Invariants

HC-53 must satisfy these invariants:

1. Durable UI invariant:
   - rich widget/card UI state must be representable as timeline entities and emitted via `timeline.upsert`.
2. Kind ownership invariant:
   - Hypercard widgets/cards are first-class timeline kinds, not encoded through `tool_result.customKind`.
3. Registration invariant:
   - backend projection and frontend render integration are explicit module registration calls, not hidden side effects.
4. Replay invariant:
   - hydration from `/api/timeline` and live websocket replay produce equivalent widget/card render output.
5. No-compat invariant:
   - remove legacy widget/card rendering paths that depend on tool_result customKind compatibility.

## End-to-End Target Flow (TimelineEntityV2)

```text
Hypercard middleware/backend events
  -> SEM translator registration (backend)
  -> timeline projection registration (backend)
  -> TimelineEntityV2(kind=hypercard_widget|hypercard_card, props={...}) upsert
  -> timeline store write + timeline.upsert websocket emission
  -> frontend hydration (/api/timeline) + buffered websocket replay
  -> frontend timeline.upsert handler maps entity kind/props
  -> props normalizer registry (kind-specific)
  -> renderer registry (kind-specific)
  -> ChatWindow/Timeline renders rich widget/card components
```

## Implementation Plan

## Step 1: Freeze Hypercard Kind Contract (No Pinocchio Transport Edits)

Define dedicated kinds and payload contract conventions in HC-53 docs and code comments:

1. `kind=hypercard_widget`
2. `kind=hypercard_card`
3. required props fields:
   - `schemaVersion`
   - `itemId`
   - `title`
   - `phase` (`start|update|ready|error`)
   - `error` (optional)
   - `data` (structured object)
4. deterministic IDs:
   - widget: `<itemId>:widget`
   - card: `<itemId>:card`

Do not re-open Pinocchio core protobuf transport for every Hypercard domain kind.

## Step 2: Backend Projection Cutover (go-inventory-chat)

Update `go-inventory-chat/internal/pinoweb/hypercard_events.go` so Hypercard events project directly to dedicated V2 kinds.

Current anti-pattern to remove:

1. status + `tool_result(customKind=hypercard.widget.v1)`
2. status + `tool_result(customKind=hypercard.card.v2)`

Target pattern:

1. optional status entities for UX progress text (if needed)
2. dedicated timeline entity upserts for `hypercard_widget` / `hypercard_card`

Pseudo-shape:

```go
webchat.RegisterTimelineHandler("hypercard.widget.update", func(ctx context.Context, p *webchat.TimelineProjector, ev webchat.TimelineSemEvent, now int64) error {
  props := map[string]any{
    "schemaVersion": 1,
    "itemId": itemID,
    "title": title,
    "phase": "update",
    "data": data,
  }
  return p.Upsert(ctx, ev.Seq, timelineEntityV2(itemID+":widget", "hypercard_widget", props))
})
```

Success criteria:

1. no widget/card final payload emitted as tool_result.
2. timeline snapshot shows dedicated kinds in `entities[].kind`.

## Step 3: Frontend Projection Cutover (Hypercard Engine)

Update `packages/engine/src/hypercard-chat/sem/registry.ts` and timeline mapping utilities.

Required changes:

1. `timeline.upsert` must be canonical for durable widget/card state.
2. map `kind=hypercard_widget|hypercard_card` directly to timeline entities consumed by display synthesis.
3. remove widget/card mapping through `tool_result.customKind` branches.

If direct SEM custom events are still handled for non-durable UX hints, they must not become the durable widget/card source of truth.

## Step 4: Introduce Registry-Driven Frontend Extension Seams

Adopt the same seam model used in Pinocchio web frontend:

1. kind normalizer registry (equivalent of `timelinePropsRegistry.ts`)
2. kind renderer registry (equivalent of `rendererRegistry.ts`)
3. explicit module bootstrap function to register Hypercard extensions

Why this matters:

1. eliminates app-local switch/case growth.
2. enables self-contained feature packs.
3. allows ChatWindow to stay generic.

## Step 5: Extract Hypercard Renderer Pack (git mv First)

Before rewriting components, preserve history and styling via `git mv`:

1. `packages/engine/src/hypercard-chat/widgets/TimelineWidget.tsx` -> `packages/engine/src/hypercard-chat/widgets/HypercardTimelinePanel.tsx`
2. `packages/engine/src/hypercard-chat/widgets/ArtifactPanelWidgets.tsx` -> `packages/engine/src/hypercard-chat/widgets/HypercardArtifactPanels.tsx`

Then adapt moved files to consume dedicated kinds.

Target end state:

1. renderer pack exports registration function (for example `registerHypercardTimelineRenderers()`)
2. pack internals refer only to Hypercard kind contracts and props
3. Inventory app only calls bootstrap/registration and provides host callbacks

## Step 6: Simplify Inventory Chat Integration

`apps/inventory/src/features/chat/InventoryChatWindow.tsx` should become orchestration glue, not type-dispatch owner.

Move out of app file:

1. Hypercard kind routing logic
2. widget/card renderer selection logic
3. shape-normalization branches tied to widget/card payload quirks

Keep in app file:

1. host actions (open/edit card, inventory-side effects)
2. app-specific toolbar and UX controls

## Step 7: Remove Legacy Compatibility Path (Hard Cut)

Explicit removals required:

1. all widget/card routing branches based on `tool_result.customKind`
2. stale constants/types for `hypercard.widget.v1` and `hypercard.card.v2` customKind routing
3. tests that assert old tool_result behavior for widget/card final state

Do not ship dual old/new rendering paths.

## Step 8: Validation Matrix

Backend validation:

1. projector tests assert dedicated kinds are persisted/upserted
2. timeline snapshots contain `kind=hypercard_widget|hypercard_card`
3. no widget/card final payload in `tool_result`

Frontend validation:

1. hydration path renders dedicated kinds correctly after reload
2. live replay renders same UI as hydrated snapshot
3. unknown kind fallback still renders safely without crash

End-to-end validation:

1. run inventory scenario with widget and card lifecycle events
2. verify timeline panel + generated panels render rich components (not JSON text)
3. verify actions (Open/Edit/adjust stock/etc.) continue to work

## Step 9: Documentation and Developer Workflow

When implementing each subtask, link work back to tutorial patterns:

1. backend module registration pattern from `pinocchio/cmd/web-chat/thinkingmode/backend.go`
2. frontend module registration pattern from `pinocchio/cmd/web-chat/web/src/features/thinkingMode/registerThinkingMode.tsx`
3. websocket/hydration sequence from `pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md`

This reduces implementation drift and avoids re-discovering solved architecture decisions.

## Design Decisions (Final)

1. Dedicated Hypercard kinds on TimelineEntityV2 (`hypercard_widget`, `hypercard_card`) are mandatory.
2. `timeline.upsert` remains canonical durability and replay contract.
3. Registry + explicit bootstrap is mandatory on backend and frontend.
4. No backward compatibility path for `tool_result/customKind` widget/card rendering.

## Alternatives Rejected

1. Keep widget/card on `tool_result + customKind`:
   - rejected due semantic overload and replay fragility.
2. Reintroduce transport oneof expansion for each custom kind:
   - rejected because TimelineEntityV2 open model already solves this.
3. Keep app-local renderer switch in InventoryChatWindow:
   - rejected because it blocks reusable chat runtime extraction.

## Acceptance Checklist

1. Backend projects Hypercard widget/card lifecycle as dedicated V2 kinds.
2. Frontend maps dedicated kinds without tool_result customKind fallback.
3. Registry seams exist for normalizers and renderers.
4. Inventory app uses explicit bootstrap registration rather than inline type switches.
5. Hydration/replay equivalence test passes for widget/card entities.
6. Legacy widget/card customKind code path is removed.
7. HC-53 docs/tasks/changelog/diary updated to TimelineEntityV2 model and tutorial references.

## Open Questions

1. Should Hypercard payloads also use `entity.typed` Any alongside `props` for stronger runtime decode guarantees, or keep `props`-only for first cutover?
2. Should status lifecycle remain separate (`kind=status`) or be embedded in widget/card phase rendering only?
3. Which package should own shared frontend registries in hypercard engine to maximize cross-app reuse while minimizing coupling?

## References

1. `pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md`
2. `pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md`
3. `pinocchio/pkg/webchat/timeline_projector.go`
4. `pinocchio/cmd/web-chat/web/src/sem/registry.ts`
5. `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
