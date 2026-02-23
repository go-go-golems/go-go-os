---
Title: Focus-triggered timeline reorder bug analysis
Ticket: HC-54-CHAT-FOCUS-TIMELINE-ORDER
Status: active
Topics:
    - chat
    - debugging
    - frontend
    - ux
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/chat/state/timelineSlice.test.ts
      Note: Reducer regression coverage for order preservation and local entity retention
    - Path: packages/engine/src/chat/state/timelineSlice.ts
      Note: Reducer semantics for applySnapshot vs mergeSnapshot and version-aware upsert
    - Path: packages/engine/src/chat/ws/wsManager.test.ts
      Note: Hydration regression coverage for focus/reconnect behavior
    - Path: packages/engine/src/chat/ws/wsManager.ts
      Note: Hydrate path that previously cleared timeline and now merges snapshot entities
ExternalSources: []
Summary: Focus/reconnect hydration was replacing local timeline state, which reordered entities and dropped local-only suggestion entries; fix is to merge snapshot entities non-destructively.
LastUpdated: 2026-02-22T00:00:00Z
WhatFor: Debug and permanently fix focus-triggered timeline reorder/loss in chat conversation timeline.
WhenToUse: Use when investigating timeline order instability, reconnect hydration behavior, or entity loss after focus/window lifecycle changes.
---


# Focus-Triggered Timeline Reorder Bug Analysis

## Problem Statement

When the chat window regains focus, the rendered conversation timeline can reorder itself and lose some entities (notably starter suggestions). The observed symptom from the user export was:

- Before focus: `suggestions -> user -> thinking -> assistant -> widget -> status`
- After focus: `user -> status -> widget -> thinking -> assistant`
- `suggestions:starter` disappeared
- multiple entities were stamped with the same version after the focus cycle

This behavior makes debugging difficult and can visually "bounce" hypercard widgets upward in the timeline.

## Reproduction Signals

1. Have an active conversation containing starter suggestions, user message, assistant/thinking messages, and widget/status entities.
2. Change focus away and back to the chat window (or otherwise trigger lifecycle reconnect).
3. Export the timeline before/after using the debug tools.
4. Observe order shifts and potential suggestion loss.

## Root Cause

The reconnect hydration flow in `WsManager.hydrate()` performed a destructive reset:

1. Dispatch `timelineSlice.actions.clearConversation({ convId })`.
2. Fetch `/api/timeline` snapshot.
3. Dispatch `applySnapshot`, replacing `byId` and `order` entirely with server snapshot entities.

Why this causes the bug:

- `clearConversation` removes local entities that may not exist in the server snapshot (starter suggestions are a common local-only case).
- `applySnapshot` replaces `order` with snapshot iteration order, which can differ from the client’s established visual order.
- On each hydrate, all mapped entities were tagged with snapshot version, creating apparent version convergence in exports.

## Fix Strategy

Adopt non-destructive hydration merge semantics:

1. Keep existing conversation timeline state during hydrate.
2. Merge snapshot entities into existing timeline by ID.
3. Preserve existing order for entities already present.
4. Append only new snapshot entities that are not currently in order.
5. Keep version gating semantics for stale/in-order updates.

## Implementation Plan

1. Add a reusable internal `upsertConversationEntity()` helper to centralize version-aware merge behavior.
2. Keep `upsertEntity` reducer behavior by delegating to that helper.
3. Add `mergeSnapshot` reducer that upserts snapshot entities without replacing whole conversation state.
4. Update `WsManager` snapshot apply path to call `mergeSnapshot`.
5. Remove `clearConversation` call from hydration.
6. Add regression tests for reducer + websocket hydration behavior.

## Validation Plan

1. Unit test `timelineSlice.mergeSnapshot`: existing order remains stable, missing local entity remains, new snapshot entity appends.
2. Unit test `WsManager` hydrate merge: pre-seeded conversation order survives hydrate and new snapshot entities append.
3. Manual confirmation in UI: focus chat window repeatedly and verify no timeline bounce/reorder.

## Risk Notes

- If server intentionally expects hard replacement semantics, stale entities may persist longer on client. For this bug class, preserving local debugability and order stability is preferred.
- Merge semantics rely on version gating. If backend sends non-monotonic versions, stale merges should still be ignored by existing reducer logic.

## Follow-up

- If hard replacement is needed for special cases, add an explicit forced-reset mode instead of using it on every reconnect hydrate.
- Consider tracking hydrate origin (`initial` vs `reconnect`) for richer telemetry.
