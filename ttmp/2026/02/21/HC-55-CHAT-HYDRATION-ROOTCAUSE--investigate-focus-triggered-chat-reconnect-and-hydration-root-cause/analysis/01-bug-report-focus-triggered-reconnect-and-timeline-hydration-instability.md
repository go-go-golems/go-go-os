---
Title: 'Bug report: focus-triggered reconnect and timeline hydration instability'
Ticket: HC-55-CHAT-HYDRATION-ROOTCAUSE
Status: active
Topics:
    - chat
    - debugging
    - frontend
    - ux
    - architecture
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/App.tsx
      Note: Chat window identity and appKey to convId mapping in inventory app
    - Path: apps/inventory/src/main.tsx
      Note: StrictMode context for development remount interpretation
    - Path: go-inventory-chat/cmd/hypercard-inventory-server/main.go
      Note: Route wiring for /ws and /api/timeline in inventory app
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Hypercard SEM mappings and timeline handler coverage gaps
    - Path: packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Starter suggestions are frontend-injected entities
    - Path: packages/engine/src/chat/runtime/conversationManager.ts
      Note: Refcount session manager for websocket lifecycle
    - Path: packages/engine/src/chat/runtime/useConversation.ts
      Note: Connect and disconnect lifecycle wiring on mount and cleanup
    - Path: packages/engine/src/chat/sem/semRegistry.ts
      Note: timeline.upsert and direct llm/tool SEM handlers on frontend
    - Path: packages/engine/src/chat/sem/timelineMapper.ts
      Note: Snapshot mapping assigns one version to all entities
    - Path: packages/engine/src/chat/state/timelineSlice.ts
      Note: Merge and version guard semantics that affect ordering
    - Path: packages/engine/src/chat/ws/wsManager.ts
      Note: Hydration fetch, buffered replay, and snapshot merge path
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_memory.go
      Note: In-memory store mirrors SQLite ordering semantics
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go
      Note: Snapshot ordering and per-entity version persistence semantics
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/webchat/conversation.go
      Note: Fan-out callback sends SEM to websocket, ring buffer, and projector
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/webchat/http/api.go
      Note: Timeline HTTP handler behavior and query params
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/webchat/sem_buffer.go
      Note: Ring buffer stores all SEM frames up to capacity
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/webchat/timeline_projector.go
      Note: Server-side projection from SEM frames to timeline entities
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/webchat/timeline_service.go
      Note: Snapshot service delegates to timeline store
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/proto/sem/timeline/transport.proto
      Note: Timeline proto contract lacks per-entity version in snapshot
ExternalSources: []
Summary: Deep bug report and handoff for focus-triggered reconnect/hydration instability, now expanded with full Go vs frontend timeline-path analysis, ordering semantics, and discrepancy matrix.
LastUpdated: 2026-02-22T00:00:00Z
WhatFor: Root-cause and permanently fix unintended reconnect/hydrate behavior and timeline instability when focusing chat windows.
WhenToUse: Use when onboarding to this bug, validating reconnect lifecycle behavior, or aligning Go and frontend timeline semantics.
---


# Bug Report: Focus-Triggered Reconnect and Timeline Hydration Instability

## 1. Executive Summary

The user observed that focusing the chat window can reorder timeline entities and make the UI appear to "bounce". The concrete before/after exports show:

- `suggestions:starter` present before focus and missing after focus.
- Hypercard status/widget entities moving earlier in timeline order after focus.
- Several entities sharing the same version after focus.

The crucial finding is that there are two timeline paths feeding the frontend state:

1. Live SEM stream over websocket.
2. Hydration snapshot from `/api/timeline`.

Those paths do not currently enforce a single canonical ordering contract. After hydrate, ordering is driven by backend snapshot semantics (entity last update version), while live rendering is effectively insertion-order on the client. That mismatch explains the reorder.

## 2. User Repro and Why It Is Credible

The user provided full exported timeline YAML before and after focus for the same conversation (`648bf4db-b742-4f1e-9408-604f5cf1a5a9`). The export model is built directly from current Redux timeline state (`packages/engine/src/chat/debug/timelineDebugModel.ts:122`), so the diffs represent actual frontend store state transitions rather than display-only sorting.

In the after snapshot, message/widget/status entities are present but order changes to:

1. user
2. status
3. widget
4. thinking
5. assistant

That pattern matches backend snapshot ordering by per-entity last-write version, not initial insertion order.

## 3. End-to-End Architecture: Two Timeline Paths

## 3.1 Transport and Route Wiring (Go Inventory Chat)

`go-inventory-chat` exposes both live and hydration surfaces:

- `/ws` mounted via `webhttp.NewWSHandler(...)` (`go-inventory-chat/cmd/hypercard-inventory-server/main.go:131`).
- `/api/timeline` mounted via `webhttp.NewTimelineHandler(...)` (`go-inventory-chat/cmd/hypercard-inventory-server/main.go:136`).

So the chat frontend can receive timeline state from both websocket SEM and timeline HTTP snapshot.

## 3.2 Path A: Live SEM Stream -> Frontend Timeline

### Backend fan-out behavior

For each SEM frame in a conversation, backend callback does all three operations (`../pinocchio/pkg/webchat/conversation.go:333`, `../pinocchio/pkg/webchat/conversation.go:336`, `../pinocchio/pkg/webchat/conversation.go:339`):

1. Broadcast frame to websocket pool.
2. Add frame to per-conversation ring buffer (`semBuf`).
3. Apply frame to timeline projector (`timelineProj.ApplySemFrame`).

This means projection is happening continuously on backend while the same raw SEM frames stream live to frontend.

### Frontend live handling

- Frontend websocket receives SEM envelopes (`packages/engine/src/chat/ws/wsManager.ts:196`).
- `handleSem(...)` dispatches handler logic (`packages/engine/src/chat/sem/semRegistry.ts:79`).
- Frontend processes both:
  - raw event handlers (`llm.*`, `tool.*`, `hypercard.*`)
  - projected `timeline.upsert` events (`packages/engine/src/chat/sem/semRegistry.ts:413`).

So the frontend effectively sees dual projection input: direct semantic handlers plus server projection upserts.

## 3.3 Path B: Hydration Snapshot -> Frontend Timeline

### Backend hydration read path

- HTTP handler parses `conv_id`, optional `since_version`, optional `limit` (`../pinocchio/pkg/webchat/http/api.go:217`, `../pinocchio/pkg/webchat/http/api.go:223`).
- `TimelineService.Snapshot(...)` delegates directly to store (`../pinocchio/pkg/webchat/timeline_service.go:21`).
- Store returns entities sorted by projection version semantics.

### Frontend hydration apply path

- `WsManager.hydrate` fetches `/api/timeline?conv_id=...` (`packages/engine/src/chat/ws/wsManager.ts:289`).
- Snapshot entities are mapped and merged into Redux via `mergeSnapshot` (`packages/engine/src/chat/ws/wsManager.ts:53`, `packages/engine/src/chat/ws/wsManager.ts:61`).
- Buffered websocket frames are replayed after hydrate, sorted by sequence (`packages/engine/src/chat/ws/wsManager.ts:336`).

## 4. Ordering Semantics That Cause Reorder

## 4.1 Backend entity version semantics are "last write", not "first appearance"

SQLite upsert updates `timeline_entities.version = excluded.version` on every upsert (`../pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go:350`, `../pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go:353`).

Hydration full snapshot then orders by `version ASC, entity_id ASC` (`../pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go:417`, `../pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go:422`).

Implication: if a message is updated later (for example streaming finalization), it can be sorted after entities that were created later but finalized earlier.

In-memory store intentionally mirrors this behavior (`../pinocchio/pkg/persistence/chatstore/timeline_store_memory.go:17`, `../pinocchio/pkg/persistence/chatstore/timeline_store_memory.go:234`).

## 4.2 Frontend timeline order is insertion-order with version-gated updates

Frontend state keeps:

- `byId` map
- `order` array

and only appends to `order` on first appearance (`packages/engine/src/chat/state/timelineSlice.ts:80`, `packages/engine/src/chat/state/timelineSlice.ts:82`). Existing entities are updated in place.

So live order reflects local first-seen timing, while hydrated order reflects backend version ordering. This is the core mismatch.

## 4.3 Hydrated versions collapse to one snapshot version

`TimelineSnapshotV2` carries one top-level `version` and not per-entity versions (`../pinocchio/proto/sem/timeline/transport.proto:36`, `../pinocchio/proto/sem/timeline/transport.proto:38`, `../pinocchio/proto/sem/timeline/transport.proto:40`).

Frontend mapper sets each hydrated entity version to that same snapshot version (`packages/engine/src/chat/ws/wsManager.ts:58`, `packages/engine/src/chat/sem/timelineMapper.ts:164`, `packages/engine/src/chat/sem/timelineMapper.ts:170`).

This explains the observed "all versions aligned" behavior after hydration.

## 5. Suggestions Discrepancy (Expected with Current Contracts)

## 5.1 Starter suggestions are frontend-generated

`ChatConversationWindow` injects `suggestions:starter` locally when timeline is empty (`packages/engine/src/chat/components/ChatConversationWindow.tsx:114`, `packages/engine/src/chat/components/ChatConversationWindow.tsx:122`).

These are not persisted by backend timeline projection by default.

## 5.2 Hypercard suggestions are emitted as SEM, but not projected server-side in go-inventory-chat

Inventory app maps suggestions into SEM events (`hypercard.suggestions.start/update/v1`) (`go-inventory-chat/internal/pinoweb/hypercard_events.go:213`, `go-inventory-chat/internal/pinoweb/hypercard_events.go:233`).

But `registerHypercardTimelineHandlers()` only registers status and result projection handlers for widget/card families and no suggestions handler (`go-inventory-chat/internal/pinoweb/hypercard_events.go:300`, `go-inventory-chat/internal/pinoweb/hypercard_events.go:356`, `go-inventory-chat/internal/pinoweb/hypercard_events.go:372`).

Implication: suggestions can exist in live frontend state but be absent from `/api/timeline` hydration payload.

## 6. Are Go and Frontend Using Different Projections?

Yes, in practice there are overlapping but not identical projection paths:

1. Backend canonical projector (`TimelineProjector`) emits persisted entities and `timeline.upsert`.
2. Frontend sem handlers also project raw `llm.*`, `tool.*`, `hypercard.*` directly.

Because both can upsert the same logical timeline, arrival order and handler coverage can diverge transiently.

Example:

- Hypercard widget raw SEM can upsert `hypercard_widget` directly on frontend (`packages/engine/src/hypercard/timeline/hypercardWidget.tsx:54`).
- Backend also projects to timeline and emits `timeline.upsert`, which frontend consumes (`packages/engine/src/chat/sem/semRegistry.ts:413`).

This duality is useful for resilience but increases ordering and reconciliation complexity.

## 7. Ring Buffer Clarification (User Question #6)

There is a ring buffer and it stores all SEM frames passed through conversation callback, not just high-frequency events:

- Buffer add is unconditional in stream callback (`../pinocchio/pkg/webchat/conversation.go:336`).
- Buffer implementation stores every frame up to max (default 1000) (`../pinocchio/pkg/webchat/sem_buffer.go:15`, `../pinocchio/pkg/webchat/sem_buffer.go:22`, `../pinocchio/pkg/webchat/sem_buffer.go:33`).

But it is currently used for debug APIs, not hydration snapshot reads:

- Debug route reads `conv.semBuf.Snapshot()` (`../pinocchio/pkg/webchat/router_debug_routes.go:299`, `../pinocchio/pkg/webchat/router_debug_routes.go:304`).
- Hydration path reads timeline store via `/api/timeline`, not this ring buffer.

## 8. Why Focus Can Trigger Visible Reorder

Focus handler itself only dispatches window focus (`packages/engine/src/components/shell/windowing/WindowSurface.tsx:47`, `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:247`), and window surfaces are keyed by stable `window.id` (`packages/engine/src/components/shell/windowing/WindowLayer.tsx:27`).

If focus leads to a reconnect in a repro, likely sequence is:

1. Chat subtree remount or session teardown occurs (root cause still under investigation).
2. `useConversation` cleanup calls disconnect (`packages/engine/src/chat/runtime/useConversation.ts:54`, `packages/engine/src/chat/runtime/useConversation.ts:56`).
3. Reconnect runs hydrate path (`packages/engine/src/chat/runtime/useConversation.ts:32`, `packages/engine/src/chat/ws/wsManager.ts:238`).
4. Hydration snapshot re-applies backend ordering semantics.

Current merge mitigation prevents destructive clear, but ordering differences can still surface when entities are first introduced from snapshot ordering.

## 9. Concrete Interpretation of User Before/After Export

Given the sample timestamps/versions:

- status updated around `1771721162083...`
- widget around `1771721162086...`
- thinking around `1771721162226...`
- assistant around `1771721162227...`

The post-focus order `status -> widget -> thinking -> assistant` matches backend `ORDER BY version ASC` semantics for current entity versions, which supports the hydration-order explanation.

## 10. Contract Gaps to Resolve

1. Canonical timeline ordering contract is not explicit.
2. Suggestions persistence contract is split (frontend local vs backend projected).
3. Snapshot payload has no per-entity version field.
4. Frontend runs dual projection sources concurrently.

Without explicit contract, intermittent reorder and entity-shape drift are expected under reconnect/hydrate scenarios.

## 11. Recommended Fix Strategy (Intern-Ready)

## 11.1 Decide canonical ordering first

Choose one:

- A. Chronological first-seen order (stable for UX), or
- B. Last-update order (backend version order).

If A: backend needs persistent first-seen ordering key in snapshot entities and frontend should respect it.
If B: frontend should converge fully to backend-projected `timeline.upsert` and minimize direct-sem projection side effects.

## 11.2 Unify projection source-of-truth

Prefer server projection as source-of-truth for persisted timeline, and keep direct frontend handlers only for explicitly ephemeral UI states.

## 11.3 Resolve suggestions contract

Choose one:

- Persist suggestions in backend projection (add timeline handlers for `hypercard.suggestions.*`), or
- Mark suggestions as intentionally local/ephemeral and explicitly exclude from persisted timeline/debug expectations.

## 11.4 Improve snapshot version fidelity

If feasible, extend snapshot entity model to include per-entity projected version so frontend does not flatten all hydrated entities to one version.

## 12. Investigation Plan (Root Cause of Focus-Reconnect Trigger)

1. Instrument mount/unmount/connect/disconnect/hydrate counts in:
   - `apps/inventory/src/App.tsx`
   - `packages/engine/src/chat/runtime/useConversation.ts`
   - `packages/engine/src/chat/runtime/conversationManager.ts`
   - `packages/engine/src/chat/ws/wsManager.ts`
2. Repro in:
   - dev with StrictMode
   - dev without StrictMode
   - production build preview
3. Confirm whether focus causes remount or if another lifecycle event triggers reconnect.
4. After lifecycle root cause is fixed, validate ordering remains stable across focus cycles.

## 13. Acceptance Criteria to Close HC-55

1. Root cause of focus-associated reconnect confirmed with instrumentation evidence.
2. Canonical ordering contract documented and implemented consistently.
3. Suggestions contract documented (persisted vs ephemeral) and implemented consistently.
4. Hydration no longer causes reorder surprises for canonical UX entities.
5. Regression tests cover reconnect/hydrate and timeline-order stability.

## 14. Immediate Intern Checklist

1. Reproduce with logs and collect sequence: focus -> lifecycle -> hydrate -> order delta.
2. Compare live timeline.upsert order vs `/api/timeline` order for same conversation/version.
3. Decide and document canonical ordering contract before code changes.
4. Implement projection contract updates with tests.
5. Re-export before/after YAML and verify no unexpected reorder under repeated focus changes.

## 15. Related Prior Work

Mitigation ticket:

- `HC-54-CHAT-FOCUS-TIMELINE-ORDER`
- code commit: `1f63ce0679738d05e7c88074e4c1dd07caceb8c5`
- docs commit: `83a6df1e456a4ec22372250b83cc753854b76275`

This HC-55 document now includes backend and frontend timeline-path specifics needed for the true root-cause fix rather than mitigation-only behavior.
