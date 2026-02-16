---
Title: Diary
Ticket: HC-036-TIMELINE-DURABLE-PERSISTENCE
Status: active
Topics:
    - chat
    - backend
    - sqlite
    - timeline
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/store/sqlite.go
      Note: Target file for timeline durability schema/storage changes.
ExternalSources: []
Summary: Running diary for durable timeline persistence and replay implementation.
LastUpdated: 2026-02-16T13:26:00-05:00
WhatFor: Tracks concrete implementation steps and validation outcomes for HC-036.
WhenToUse: Read before resuming work or reviewing replay decisions.
---

# Diary

## Step 1: Documentation Re-baseline

1. Replaced template plan with concrete schema/storage/replay implementation plan.
2. Replaced placeholder tasks with detailed phased checklist and restart/hydration validation gates.
3. Captured dependency inputs from HC-035 event normalization and outputs for HC-038 frontend hydration.

Next coding step:

1. Design and implement timeline schema migrations in the existing SQLite store layer.

## Step 2: Durable Timeline Store and Hydration Implemented

1. Added durable timeline schema to SQLite:
   - `timeline_conversations`
   - `timeline_messages`
   - `timeline_events`
   - supporting indexes.
2. Implemented storage APIs:
   - `UpsertTimelineMessage`
   - `AppendTimelineEvent`
   - `GetTimelineSnapshot`
   - bounded pruning for events/messages.
3. Wired backend runtime so all message lifecycle updates and SEM events persist via SQLite.
4. Updated `/api/timeline` to read from durable snapshot store (with `since_seq` and `limit` support).

Validation:

1. `GOWORK=off go test ./...` passed.
2. `scripts/smoke-sem-timeline.sh` passed with non-zero event/message counts and monotonic `lastSeq`.
3. Browser refresh preserved and rehydrated chat timeline.

Commit:

1. `2780008` - durable timeline schema + storage + endpoint integration.

## Step 3: Timeline Persistence Rebased onto Pinocchio Stores

1. Removed duplicated local timeline persistence path:
   - deleted `go-inventory-chat/internal/store/timeline.go`,
   - removed timeline migration tables from `internal/store/sqlite.go`.
2. Rewired runtime persistence to Pinocchio stores:
   - `chatstore.SQLiteTimelineStore` for projection state,
   - `chatstore.SQLiteTurnStore` for turn snapshots.
3. Confirmed frontend hydration contract remained functional after store swap by validating `/api/timeline` response consumption in the inventory app.

Validation:

1. `GOWORK=off go test ./...` passed after store deletion/rewire.
2. Browser E2E still reconstructed conversation state and rendered artifacts after refresh.
