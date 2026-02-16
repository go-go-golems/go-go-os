# Tasks

## Documentation Baseline

- [x] Replace template implementation document with concrete durability/replay plan.
- [x] Replace placeholder tasks with phased execution checklist.
- [ ] Keep diary/changelog updated during implementation.

## Phase 1: SQLite Timeline Schema

- [ ] Add `conversations` table migration.
- [ ] Add `messages` table migration.
- [ ] Add `events` table migration.
- [ ] Add indexes for `conversation_id`, `message_id`, and `seq`.
- [ ] Add retention-cleanup query helpers.
- [ ] Add migration tests.

## Phase 2: Storage API Layer

- [ ] Add storage API to append normalized SEM event rows.
- [ ] Add storage API to upsert message lifecycle state.
- [ ] Add storage API to fetch timeline by conversation.
- [ ] Add storage API to fetch timeline after sequence offset.
- [ ] Add storage API to fetch proposal artifacts for cache rebuild.

## Phase 3: Runtime Integration

- [ ] Persist user-message start events.
- [ ] Persist token events.
- [ ] Persist artifact events.
- [ ] Persist error events.
- [ ] Persist done events.
- [ ] Persist message status transitions atomically.
- [ ] Ensure idempotency for duplicate write attempts.

## Phase 4: Hydration and Replay Endpoint

- [ ] Add `after_seq` query support.
- [ ] Add pagination/limit support.
- [ ] Guarantee sorted deterministic return order.
- [ ] Include payload metadata needed by frontend proposal cache.
- [ ] Add endpoint tests for empty/history-heavy conversations.

## Phase 5: Reconnect and Consistency

- [ ] Define and implement reconnect flow contract.
- [ ] Ensure monotonic sequence continuity across restarts.
- [ ] Prevent duplicate action application after replay.
- [ ] Add restart scenario integration test.

## Phase 6: Interleaved Validation

- [ ] Run `gofmt` after each edit cluster.
- [ ] Run `GOWORK=off go test ./...` after each phase.
- [ ] Run CLI hydration smoke with existing conversation.
- [ ] Restart backend and verify conversation continuity.
- [ ] Verify create-card proposal cache rebuild from hydrated artifacts.

## Phase 7: Commit and Ticket Hygiene

- [ ] Commit schema/storage phase.
- [ ] Commit runtime integration phase.
- [ ] Commit hydration/replay/reconnect phase.
- [ ] Update changelog with commit SHAs and command evidence.
- [ ] Update diary with failures/fixes and test output notes.
- [ ] Update HC-033 and HC-038 references after completion.

## Completion Gate

- [ ] Timeline state survives backend restart.
- [ ] Hydration endpoint supports deterministic replay and incremental catch-up.
- [ ] Frontend can reconstruct full conversation and proposal cache from durable store.
- [ ] Test and smoke checks pass.
