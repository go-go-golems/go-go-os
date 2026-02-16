# Tasks

## Documentation Baseline

- [x] Replace template implementation document with concrete frontend cutover plan.
- [x] Replace placeholder tasks with phased execution checklist.
- [ ] Keep diary/changelog updated with implementation and validation evidence.

## Phase 1: Protocol and Hydration

- [ ] Lock frontend stream parser to SEM-only contract.
- [ ] Remove any remaining legacy parser branches.
- [ ] Finalize hydration request/response mapping.
- [ ] Hydrate transcript on startup before live stream begins.
- [ ] Handle missing/invalid conversation IDs gracefully.

## Phase 2: Stream Projection and Message State

- [ ] Finalize token event projection into in-progress assistant messages.
- [ ] Finalize artifact event projection into chat content blocks.
- [ ] Finalize done/error event projection into message terminal state.
- [ ] Ensure sequence ordering is respected in UI projection.
- [ ] Ensure duplicate event delivery does not duplicate rendered blocks.

## Phase 3: Artifact Rendering and Proposal Cache

- [ ] Finalize `report-view` rendering behavior.
- [ ] Finalize `data-table` rendering behavior.
- [ ] Rebuild proposal cache from hydrated artifact history.
- [ ] Keep cache updated from live artifact stream.
- [ ] Add fallback rendering path for unknown artifact types.

## Phase 4: Action Handling

- [ ] Finalize `open-card` action behavior.
- [ ] Finalize `prefill` action behavior.
- [ ] Integrate `create-card` flow with HC-037 validation gate.
- [ ] Ensure action completion produces deterministic system feedback.
- [ ] Ensure duplicate create-card attempts are blocked cleanly.

## Phase 5: UX Hardening

- [ ] Add backend-unavailable UI feedback and retry affordance.
- [ ] Guard against malformed SEM payload crashes.
- [ ] Verify React StrictMode startup behavior.
- [ ] Verify page refresh preserves hydrated timeline and proposal cache.
- [ ] Verify backend restart + reload flow remains functional.

## Phase 6: Interleaved Validation

- [ ] Run `npm exec -w apps/inventory tsc -b` after each phase.
- [ ] Run browser smoke for each major milestone.
- [ ] Run tmux real test: backend + Vite + chat flow.
- [ ] Run `npm run -w apps/inventory build` before completion.
- [ ] Verify final flow for report/table rendering and create-card actions.

## Phase 7: Commit and Ticket Hygiene

- [ ] Commit protocol/hydration phase.
- [ ] Commit rendering/cache phase.
- [ ] Commit action/UX hardening phase.
- [ ] Update changelog with commit SHAs and verification outcomes.
- [ ] Update diary with command trails and issue/fix notes.
- [ ] Update HC-033 status when complete.

## Completion Gate

- [ ] Frontend runs entirely on SEM-only backend stream contract.
- [ ] Hydration and live stream projection are stable and deterministic.
- [ ] Report/table artifacts and create-card actions work end-to-end.
- [ ] Typecheck/build/smoke validations pass.
