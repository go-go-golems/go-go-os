# Tasks

## Current Truth (Epic-Level)

- [x] Created HC-033 and imported `sources/local/webchat-hyper-integration.md`.
- [x] Validated imported assumptions against `hypercard-react`, `pinocchio`, and `geppetto`.
- [x] Split implementation into execution tickets HC-034 through HC-038.
- [x] Added first-pass docs/diaries for HC-034 through HC-038.
- [ ] Complete code implementation across HC-034 through HC-038.
- [ ] Close HC-033 only after all child tickets are complete and validated.

## Orchestration and Governance

- [x] Record pivot decision: reuse Pinocchio/Geppetto components; do not duplicate framework internals.
- [ ] Keep HC-033 design doc aligned with child-ticket status after each major merge.
- [ ] Enforce honest task state across all tickets (no pre-checking implementation tasks).
- [ ] Keep diary updates flowing in each active ticket as implementation progresses.
- [ ] Capture commit SHAs under the owning ticket changelog (commit-as-you-go discipline).

## Child Ticket Dependency Graph

- [ ] HC-034 runtime foundation must land before HC-035 extraction wrappers.
- [ ] HC-034 and HC-035 must land before HC-036 durable timeline persistence.
- [ ] HC-034 and HC-035 provide inputs for HC-037 DSL generation and validation gate.
- [ ] HC-034, HC-035, and HC-036 feed HC-038 frontend cutover and UX stabilization.

## Validation and Release Gate

- [ ] Backend: `GOWORK=off go test ./...` for `go-inventory-chat`.
- [ ] Frontend: `npm exec -w apps/inventory tsc -b`.
- [ ] Frontend build: `npm run -w apps/inventory build`.
- [ ] End-to-end smoke in tmux: backend + Vite + browser chat flow.
- [ ] Confirm no legacy frame compatibility paths remain in backend or frontend.
- [ ] Upload updated ticket bundle to reMarkable after each major milestone.

## Completion Criteria

- [ ] HC-034 complete and merged.
- [ ] HC-035 complete and merged.
- [ ] HC-036 complete and merged.
- [ ] HC-037 complete and merged.
- [ ] HC-038 complete and merged.
- [ ] HC-033 changelog and diary summarize final architecture and test evidence.
