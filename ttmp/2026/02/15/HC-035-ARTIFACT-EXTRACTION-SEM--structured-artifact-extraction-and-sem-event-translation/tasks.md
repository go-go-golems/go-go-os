# Tasks

## Documentation Baseline

- [x] Replace template implementation document with concrete extraction/SEM plan.
- [x] Replace placeholder task list with phased execution checklist.
- [x] Keep diary/changelog updated with each implementation commit.

## Phase 1: SEM Event Schema and Codec Setup

- [x] Define typed SEM payload structs for user/token/artifact/done/error.
- [x] Add event-type constants and normalize naming conventions.
- [x] Register event factories/codecs via Geppetto registry APIs.
- [x] Add encode/decode unit tests for each event type.
- [x] Add unknown-event and decode-failure unit tests.

## Phase 2: Structured Extraction Wrapper

- [x] Add extraction wrapper around runtime sink using Geppetto filtering sink primitives.
- [x] Implement extraction for `widget` artifacts.
- [x] Implement extraction for `card-proposal` artifacts.
- [x] Implement extraction for follow-up action payloads.
- [x] Wire wrapper through HC-034 middleware/sink hook.

## Phase 3: Validation and Error Translation

- [x] Add schema validation for `report-view` widget payload.
- [x] Add schema validation for `data-table` widget payload.
- [x] Add schema validation for `card-proposal` payload.
- [x] Add schema validation for action payload arrays.
- [x] Emit `chat.message.error` events with diagnostic metadata on validation failure.
- [x] Ensure malformed payloads do not leak into timeline store.

## Phase 4: Sequence and Context Integrity

- [x] Ensure each translated event includes `conversation_id`.
- [x] Ensure each translated event includes `message_id`.
- [x] Ensure each translated event carries monotonic `seq`.
- [x] Ensure timestamp normalization for replay ordering.
- [x] Add tests for sequence continuity during mixed token/artifact streams.

## Phase 5: Interleaved Validation

- [x] Run `gofmt` after each edit cluster.
- [x] Run `GOWORK=off go test ./...` after each phase.
- [x] Run extraction smoke for happy path.
- [x] Run extraction smoke for malformed artifact path.
- [x] Verify frontend parser compatibility with produced SEM payloads.

## Phase 6: Commit and Ticket Hygiene

- [x] Commit schema/codec phase.
- [x] Commit extraction wrapper phase.
- [x] Commit validation/error phase.
- [x] Update changelog with commit SHAs and validation outputs.
- [x] Update diary with command trails, failures, and fixes.
- [x] Update HC-033 status after HC-035 completion.

## Completion Gate

- [x] Structured extraction wrapper is active in runtime sink chain.
- [x] Artifact and action payloads are validated and translated deterministically.
- [x] SEM events are replay-safe and sequence-consistent.
- [x] Test and smoke checks pass.
