# Tasks

## Documentation Baseline

- [x] Replace template implementation document with detailed reports/tables + full card DSL plan.
- [x] Replace placeholder tasks with exhaustive phased checklist.
- [ ] Keep diary/changelog updated with each implementation batch.

## Phase 1: Report/Table Artifact Schema

- [ ] Define and document `report-view` schema fields.
- [ ] Define and document `data-table` schema fields.
- [ ] Implement backend schema validators for report/table payloads.
- [ ] Add unit tests for valid/invalid report payloads.
- [ ] Add unit tests for valid/invalid table payloads.

## Phase 2: Deterministic Card DSL Generation

- [ ] Implement low-stock saved card DSL template generator.
- [ ] Implement sales summary card DSL template generator.
- [ ] Implement valuation snapshot card DSL template generator.
- [ ] Emit full `card-proposal` payload with metadata/code/version/signature.
- [ ] Add deterministic `proposal_id` strategy.

## Phase 3: Validation Gate

- [ ] Validate required metadata fields (`card_id`, `title`, `icon`).
- [ ] Validate DSL source presence and shape.
- [ ] Validate DSL parseability/sanity before injection.
- [ ] Validate action payload references existing proposal IDs.
- [ ] Validate duplicate guards by `card_id`.
- [ ] Validate duplicate guards by proposal signature/hash.
- [ ] Emit deterministic validation errors to chat timeline.

## Phase 4: Frontend Injector Integration

- [ ] Integrate gate checks into `create-card` action flow.
- [ ] Ensure successful apply updates stack card metadata.
- [ ] Ensure successful apply appends define-card code to plugin bundle.
- [ ] Ensure injected card window opens after apply.
- [ ] Ensure failures produce clear system-feedback messages.

## Phase 5: Interleaved Validation

- [ ] Run backend tests after each generation/gate phase.
- [ ] Run frontend typecheck after injector integration updates.
- [ ] Manually verify report/table render in chat.
- [ ] Manually verify create-card happy path.
- [ ] Manually verify malformed-proposal rejection path.
- [ ] Manually verify duplicate-card rejection path.

## Phase 6: Commit and Ticket Hygiene

- [ ] Commit artifact schema phase.
- [ ] Commit DSL generation phase.
- [ ] Commit validation gate + injector phase.
- [ ] Update changelog with commit SHAs and smoke/test results.
- [ ] Update diary with payload examples and failure cases.
- [ ] Update HC-033 and HC-038 references after completion.

## Completion Gate

- [ ] Reports and tables are generated with stable schema contracts.
- [ ] Full card DSL proposals are generated for supported inventory intents.
- [ ] Validation gate blocks malformed/duplicate proposals before injection.
- [ ] Create-card flow is deterministic and test-verified.
