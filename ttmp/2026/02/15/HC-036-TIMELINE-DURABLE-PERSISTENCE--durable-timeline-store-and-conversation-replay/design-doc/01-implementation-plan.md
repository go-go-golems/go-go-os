---
Title: Implementation Plan
Ticket: HC-036-TIMELINE-DURABLE-PERSISTENCE
Status: active
Topics:
    - chat
    - backend
    - sqlite
    - timeline
    - replay
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/store/sqlite.go
      Note: Existing SQLite layer to extend for timeline durability.
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/app/server.go
      Note: Timeline endpoint and stream integration point.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/protocol.ts
      Note: Frontend hydration consumer.
ExternalSources: []
Summary: Implement durable timeline persistence and replay semantics for conversation hydration and websocket reconnection.
LastUpdated: 2026-02-16T13:26:00-05:00
WhatFor: Defines schema, persistence behavior, replay contracts, and hydration sequencing for HC-036.
WhenToUse: Use while implementing or reviewing timeline durability work.
---

# Implementation Plan

## Executive Summary

HC-036 moves timeline projection from volatile memory to durable SQLite storage so chat history survives backend restarts and can be replayed deterministically.

This ticket also standardizes hydration and reconnect semantics used by frontend chat state.

## Problem Statement

Without durable timeline persistence:

1. Hydration fails after backend restart.
2. Proposal/action history is lost, breaking create-card workflows.
3. Debugging and replay are inconsistent.

## Proposed Solution

### 1) Add timeline persistence schema

Add SQLite tables for:

1. conversations
2. messages
3. events
4. artifacts/actions (if separated from events for queryability)

Use stable keys: `conversation_id`, `message_id`, and monotonic `seq`.

### 2) Persist during stream emission

During runtime processing:

1. persist user message start
2. persist token/artifact/error/done events
3. update message completion status atomically

### 3) Implement replay and hydration API contract

Hydration endpoint should support:

1. full conversation replay
2. optional `after_seq` for incremental catch-up
3. bounded page size

### 4) Ensure reconnect-safe websocket behavior

On reconnect, frontend hydrates timeline first, then resumes stream from latest known state.

## Design Decisions

1. SQLite persistence in same service process.
Reason: simplest reliable option for local development and deterministic tests.

2. Sequence-first ordering model.
Reason: strict ordering is required for reliable replay and UI reconstruction.

3. Persist normalized SEM events, not only raw transport payloads.
Reason: avoids future parser drift and supports richer query/debug tooling.

4. Keep compatibility scope limited to current project format.
Reason: no backward compatibility is required for this new project.

## Alternatives Considered

### Alternative A: Keep in-memory timeline with periodic dump

Rejected due data loss risk and complex crash recovery semantics.

### Alternative B: Persist only final assistant messages

Rejected because artifacts/actions and progressive stream details are needed for replay and debugging.

### Alternative C: Introduce external database/service now

Rejected for unnecessary complexity at current scope.

## Implementation Plan

### Phase 1: Schema and storage APIs

1. Define timeline schema migrations.
2. Add storage APIs for append event, upsert message state, read conversation timeline.
3. Add retention controls (max events/messages per conversation).

### Phase 2: Runtime write path integration

1. Persist each translated SEM event from HC-035 pipeline.
2. Persist message lifecycle transitions (`streaming`, `complete`, `error`).
3. Ensure writes are transactional where needed.

### Phase 3: Hydration/replay endpoint updates

1. Add query parameters for `conversation_id`, optional `after_seq`, optional limits.
2. Return deterministic order and stable shape for frontend reconstruction.
3. Include metadata fields needed for proposal cache rebuild.

### Phase 4: Reconnect and consistency

1. Define backend behavior when websocket reconnect occurs mid-turn.
2. Ensure no duplicate `done` action application on replay.
3. Ensure sequence numbers remain monotonic across restarts.

### Phase 5: Interleaved validation

1. `gofmt` after each cluster.
2. `GOWORK=off go test ./...` after each phase.
3. Restart backend and verify hydration continuity.
4. Verify proposal cache reconstruction from hydrated artifacts.
5. Verify large conversation pagination behavior.

### Phase 6: Documentation and handoff

1. Update ticket docs and changelog with schema and API details.
2. Provide frontend integration notes to HC-038.
3. Update HC-033 orchestration status.

## Open Questions

1. Whether token-level events should all be retained or compacted after completion.
2. Desired default retention values for local/dev use.
3. Whether artifact payload denormalization is needed for query performance now.

## References

1. `2026-02-12--hypercard-react/go-inventory-chat/internal/store/sqlite.go`
2. `2026-02-12--hypercard-react/apps/inventory/src/chat/protocol.ts`
3. `pinocchio/pkg/webchat/http/api.go`
