# Tasks

## Documentation Baseline

- [x] Replace template implementation document with concrete durability/replay plan.
- [x] Replace placeholder tasks with phased execution checklist.
- [x] Keep diary/changelog updated during implementation.

## Phase 1: SQLite Timeline Schema

- [x] Add `conversations` table migration.
- [x] Add `messages` table migration.
- [x] Add `events` table migration.
- [x] Add indexes for `conversation_id`, `message_id`, and `seq`.
- [x] Add retention-cleanup query helpers.
- [x] Add migration tests.

## Phase 2: Storage API Layer

- [x] Add storage API to append normalized SEM event rows.
- [x] Add storage API to upsert message lifecycle state.
- [x] Add storage API to fetch timeline by conversation.
- [x] Add storage API to fetch timeline after sequence offset.
- [x] Add storage API to fetch proposal artifacts for cache rebuild.

## Phase 3: Runtime Integration

- [x] Persist user-message start events.
- [x] Persist token events.
- [x] Persist artifact events.
- [x] Persist error events.
- [x] Persist done events.
- [x] Persist message status transitions atomically.
- [x] Ensure idempotency for duplicate write attempts.

## Phase 4: Hydration and Replay Endpoint

- [x] Add `after_seq` query support.
- [x] Add pagination/limit support.
- [x] Guarantee sorted deterministic return order.
- [x] Include payload metadata needed by frontend proposal cache.
- [x] Add endpoint tests for empty/history-heavy conversations.

## Phase 5: Reconnect and Consistency

- [x] Define and implement reconnect flow contract.
- [x] Ensure monotonic sequence continuity across restarts.
- [x] Prevent duplicate action application after replay.
- [x] Add restart scenario integration test.

## Phase 6: Interleaved Validation

- [x] Run `gofmt` after each edit cluster.
- [x] Run `GOWORK=off go test ./...` after each phase.
- [x] Run CLI hydration smoke with existing conversation.
- [x] Restart backend and verify conversation continuity.
- [x] Verify create-card proposal cache rebuild from hydrated artifacts.

## Phase 7: Commit and Ticket Hygiene

- [x] Commit schema/storage phase.
- [x] Commit runtime integration phase.
- [x] Commit hydration/replay/reconnect phase.
- [x] Update changelog with commit SHAs and command evidence.
- [x] Update diary with failures/fixes and test output notes.
- [x] Update HC-033 and HC-038 references after completion.

## Completion Gate

- [x] Timeline state survives backend restart.
- [x] Hydration endpoint supports deterministic replay and incremental catch-up.
- [x] Frontend can reconstruct full conversation and proposal cache from durable store.
- [x] Test and smoke checks pass.

## Phase 8: De-duplicate to Pinocchio Timeline/Turn Stores

- [x] Remove custom timeline table migration from inventory SQLite schema.
- [x] Delete local custom timeline storage API (`internal/store/timeline.go`).
- [x] Wire backend to Pinocchio `chatstore.SQLiteTimelineStore`.
- [x] Wire backend to Pinocchio `chatstore.SQLiteTurnStore`.
- [x] Keep frontend hydration working against Pinocchio timeline snapshot payload.
