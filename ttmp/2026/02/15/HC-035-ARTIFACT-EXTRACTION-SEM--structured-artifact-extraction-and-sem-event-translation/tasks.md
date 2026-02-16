# Tasks

## Documentation Baseline

- [x] Replace template implementation document with concrete extraction/SEM plan.
- [x] Replace placeholder task list with phased execution checklist.
- [ ] Keep diary/changelog updated with each implementation commit.

## Phase 1: SEM Event Schema and Codec Setup

- [ ] Define typed SEM payload structs for user/token/artifact/done/error.
- [ ] Add event-type constants and normalize naming conventions.
- [ ] Register event factories/codecs via Geppetto registry APIs.
- [ ] Add encode/decode unit tests for each event type.
- [ ] Add unknown-event and decode-failure unit tests.

## Phase 2: Structured Extraction Wrapper

- [ ] Add extraction wrapper around runtime sink using Geppetto filtering sink primitives.
- [ ] Implement extraction for `widget` artifacts.
- [ ] Implement extraction for `card-proposal` artifacts.
- [ ] Implement extraction for follow-up action payloads.
- [ ] Wire wrapper through HC-034 middleware/sink hook.

## Phase 3: Validation and Error Translation

- [ ] Add schema validation for `report-view` widget payload.
- [ ] Add schema validation for `data-table` widget payload.
- [ ] Add schema validation for `card-proposal` payload.
- [ ] Add schema validation for action payload arrays.
- [ ] Emit `chat.message.error` events with diagnostic metadata on validation failure.
- [ ] Ensure malformed payloads do not leak into timeline store.

## Phase 4: Sequence and Context Integrity

- [ ] Ensure each translated event includes `conversation_id`.
- [ ] Ensure each translated event includes `message_id`.
- [ ] Ensure each translated event carries monotonic `seq`.
- [ ] Ensure timestamp normalization for replay ordering.
- [ ] Add tests for sequence continuity during mixed token/artifact streams.

## Phase 5: Interleaved Validation

- [ ] Run `gofmt` after each edit cluster.
- [ ] Run `GOWORK=off go test ./...` after each phase.
- [ ] Run extraction smoke for happy path.
- [ ] Run extraction smoke for malformed artifact path.
- [ ] Verify frontend parser compatibility with produced SEM payloads.

## Phase 6: Commit and Ticket Hygiene

- [ ] Commit schema/codec phase.
- [ ] Commit extraction wrapper phase.
- [ ] Commit validation/error phase.
- [ ] Update changelog with commit SHAs and validation outputs.
- [ ] Update diary with command trails, failures, and fixes.
- [ ] Update HC-033 status after HC-035 completion.

## Completion Gate

- [ ] Structured extraction wrapper is active in runtime sink chain.
- [ ] Artifact and action payloads are validated and translated deterministically.
- [ ] SEM events are replay-safe and sequence-consistent.
- [ ] Test and smoke checks pass.
