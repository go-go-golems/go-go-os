# Tasks

## Current Truth (Epic-Level)

- [x] Created HC-033 and imported `sources/local/webchat-hyper-integration.md`.
- [x] Validated imported assumptions against `hypercard-react`, `pinocchio`, and `geppetto`.
- [x] Split implementation into execution tickets HC-034 through HC-038.
- [x] Added first-pass docs/diaries for HC-034 through HC-038.
- [x] Complete code implementation across HC-034 through HC-038.
- [x] Close HC-033 only after all child tickets are complete and validated.

## Orchestration and Governance

- [x] Record pivot decision: reuse Pinocchio/Geppetto components; do not duplicate framework internals.
- [x] Keep HC-033 design doc aligned with child-ticket status after each major merge.
- [x] Enforce honest task state across all tickets (no pre-checking implementation tasks).
- [x] Keep diary updates flowing in each active ticket as implementation progresses.
- [x] Capture commit SHAs under the owning ticket changelog (commit-as-you-go discipline).

## Child Ticket Dependency Graph

- [x] HC-034 runtime foundation must land before HC-035 extraction wrappers.
- [x] HC-034 and HC-035 must land before HC-036 durable timeline persistence.
- [x] HC-034 and HC-035 provide inputs for HC-037 DSL generation and validation gate.
- [x] HC-034, HC-035, and HC-036 feed HC-038 frontend cutover and UX stabilization.

## Validation and Release Gate

- [x] Backend: `GOWORK=off go test ./...` for `go-inventory-chat`.
- [x] Frontend: `npm exec -w apps/inventory tsc -b`.
- [x] Frontend build: `npm run -w apps/inventory build`.
- [x] End-to-end smoke in tmux: backend + Vite + browser chat flow.
- [x] Confirm no legacy frame compatibility paths remain in backend or frontend.
- [x] Upload updated ticket bundle to reMarkable after each major milestone.

## Completion Criteria

- [x] HC-034 complete and merged.
- [x] HC-035 complete and merged.
- [x] HC-036 complete and merged.
- [x] HC-037 complete and merged.
- [x] HC-038 complete and merged.
- [x] HC-033 changelog and diary summarize final architecture and test evidence.
