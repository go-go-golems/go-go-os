# Tasks

## Documentation Baseline

- [x] Replace template implementation document with detailed reports/tables + full card DSL plan.
- [x] Replace placeholder tasks with exhaustive phased checklist.
- [x] Keep diary/changelog updated with each implementation batch.

## Phase 1: Report/Table Artifact Schema

- [x] Define and document `report-view` schema fields.
- [x] Define and document `data-table` schema fields.
- [x] Implement backend schema validators for report/table payloads.
- [x] Add unit tests for valid/invalid report payloads.
- [x] Add unit tests for valid/invalid table payloads.

## Phase 2: Deterministic Card DSL Generation

- [x] Implement low-stock saved card DSL template generator.
- [x] Implement sales summary card DSL template generator.
- [x] Implement valuation snapshot card DSL template generator.
- [x] Emit full `card-proposal` payload with metadata/code/version/signature.
- [x] Add deterministic `proposal_id` strategy.

## Phase 3: Validation Gate

- [x] Validate required metadata fields (`card_id`, `title`, `icon`).
- [x] Validate DSL source presence and shape.
- [x] Validate DSL parseability/sanity before injection.
- [x] Validate action payload references existing proposal IDs.
- [x] Validate duplicate guards by `card_id`.
- [x] Validate duplicate guards by proposal signature/hash.
- [x] Emit deterministic validation errors to chat timeline.

## Phase 4: Frontend Injector Integration

- [x] Integrate gate checks into `create-card` action flow.
- [x] Ensure successful apply updates stack card metadata.
- [x] Ensure successful apply appends define-card code to plugin bundle.
- [x] Ensure injected card window opens after apply.
- [x] Ensure failures produce clear system-feedback messages.

## Phase 5: Interleaved Validation

- [x] Run backend tests after each generation/gate phase.
- [x] Run frontend typecheck after injector integration updates.
- [x] Manually verify report/table render in chat.
- [x] Manually verify create-card happy path.
- [x] Manually verify malformed-proposal rejection path.
- [x] Manually verify duplicate-card rejection path.

## Phase 6: Commit and Ticket Hygiene

- [x] Commit artifact schema phase.
- [x] Commit DSL generation phase.
- [x] Commit validation gate + injector phase.
- [x] Update changelog with commit SHAs and smoke/test results.
- [x] Update diary with payload examples and failure cases.
- [x] Update HC-033 and HC-038 references after completion.

## Completion Gate

- [x] Reports and tables are generated with stable schema contracts.
- [x] Full card DSL proposals are generated for supported inventory intents.
- [x] Validation gate blocks malformed/duplicate proposals before injection.
- [x] Create-card flow is deterministic and test-verified.
