# Tasks

## Documentation Baseline

- [x] Replace template implementation document with concrete frontend cutover plan.
- [x] Replace placeholder tasks with phased execution checklist.
- [x] Keep diary/changelog updated with implementation and validation evidence.

## Phase 1: Protocol and Hydration

- [x] Lock frontend stream parser to SEM-only contract.
- [x] Remove any remaining legacy parser branches.
- [x] Finalize hydration request/response mapping.
- [x] Hydrate transcript on startup before live stream begins.
- [x] Handle missing/invalid conversation IDs gracefully.

## Phase 2: Stream Projection and Message State

- [x] Finalize token event projection into in-progress assistant messages.
- [x] Finalize artifact event projection into chat content blocks.
- [x] Finalize done/error event projection into message terminal state.
- [x] Ensure sequence ordering is respected in UI projection.
- [x] Ensure duplicate event delivery does not duplicate rendered blocks.

## Phase 3: Artifact Rendering and Proposal Cache

- [x] Finalize `report-view` rendering behavior.
- [x] Finalize `data-table` rendering behavior.
- [x] Rebuild proposal cache from hydrated artifact history.
- [x] Keep cache updated from live artifact stream.
- [x] Add fallback rendering path for unknown artifact types.

## Phase 4: Action Handling

- [x] Finalize `open-card` action behavior.
- [x] Finalize `prefill` action behavior.
- [x] Integrate `create-card` flow with HC-037 validation gate.
- [x] Ensure action completion produces deterministic system feedback.
- [x] Ensure duplicate create-card attempts are blocked cleanly.

## Phase 5: UX Hardening

- [x] Add backend-unavailable UI feedback and retry affordance.
- [x] Guard against malformed SEM payload crashes.
- [x] Verify React StrictMode startup behavior.
- [x] Verify page refresh preserves hydrated timeline and proposal cache.
- [x] Verify backend restart + reload flow remains functional.

## Phase 6: Interleaved Validation

- [x] Run `npm exec -w apps/inventory tsc -b` after each phase.
- [x] Run browser smoke for each major milestone.
- [x] Run tmux real test: backend + Vite + chat flow.
- [x] Run `npm run -w apps/inventory build` before completion.
- [x] Verify final flow for report/table rendering and create-card actions.

## Phase 7: Commit and Ticket Hygiene

- [x] Commit protocol/hydration phase.
- [x] Commit rendering/cache phase.
- [x] Commit action/UX hardening phase.
- [x] Update changelog with commit SHAs and verification outcomes.
- [x] Update diary with command trails and issue/fix notes.
- [x] Update HC-033 status when complete.

## Completion Gate

- [x] Frontend runs entirely on SEM-only backend stream contract.
- [x] Hydration and live stream projection are stable and deterministic.
- [x] Report/table artifacts and create-card actions work end-to-end.
- [x] Typecheck/build/smoke validations pass.

## Phase 8: Contract Cutover to Pinocchio `/chat` + Timeline Entities

- [x] Remove `/api/chat/completions` + `streamUrl` client assumptions from `protocol.ts`.
- [x] Switch prompt submission to `POST /chat`.
- [x] Switch websocket attach to `GET /ws?conv_id=...`.
- [x] Switch hydration shape to Pinocchio timeline snapshot (`convId`, `version`, `entities`).
- [x] Add timeline entity upsert projection (`timeline.upsert`) into chat message state.
- [x] Parse structured hypercard tags from assistant messages for fallback-runtime compatibility.
- [x] Render action buttons from parsed `hypercard:actions` payloads.
- [x] Validate create-card path after cutover with browser E2E.
