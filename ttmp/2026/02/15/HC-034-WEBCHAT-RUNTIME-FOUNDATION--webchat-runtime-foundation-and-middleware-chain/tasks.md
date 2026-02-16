# Tasks

## Documentation Baseline

- [x] Replace template implementation document with concrete Pinocchio-first plan.
- [x] Replace placeholder task list with exhaustive execution checklist.
- [ ] Keep diary/changelog updated after each implementation cluster.

## Phase 1: Remove Duplicated Runtime Framework

- [ ] Snapshot current backend behavior with a smoke script before refactor.
- [ ] Delete `go-inventory-chat/internal/app/runtime.go`.
- [ ] Delete `go-inventory-chat/internal/app/stream_bus.go`.
- [ ] Delete `go-inventory-chat/internal/app/sem.go`.
- [ ] Delete `go-inventory-chat/internal/app/connection_pool.go`.
- [ ] Delete `go-inventory-chat/internal/app/timeline_memory.go`.
- [ ] Delete `go-inventory-chat/internal/app/helpers.go`.
- [ ] Delete `go-inventory-chat/internal/app/conversation.go`.
- [ ] Remove now-broken imports/usages from `go-inventory-chat/internal/app/server.go`.
- [ ] Confirm no remaining references to deleted files with `rg`.

## Phase 2: Runtime Composer Adapter

- [ ] Add inventory runtime composer adapter package (thin adapter around planner/store).
- [ ] Implement resolver/context wiring expected by webchat handlers.
- [ ] Ensure conversation/message identity flow is preserved through adapter.
- [ ] Ensure sink wrapper support is available for HC-035.
- [ ] Ensure timeline hook support is available for HC-036.

## Phase 3: Router and Endpoint Wiring

- [ ] Wire `POST /api/chat/completions` using Pinocchio-style handler.
- [ ] Wire `GET /ws` using Pinocchio-style websocket handler.
- [ ] Wire `GET /api/timeline` using Pinocchio-style timeline handler.
- [ ] Keep `GET /healthz` operational.
- [ ] Keep CORS behavior compatible with inventory Vite dev host.

## Phase 4: Middleware Chain

- [ ] Add request-id middleware.
- [ ] Add panic recovery middleware.
- [ ] Add structured request logging middleware.
- [ ] Add sink-wrapper middleware extension point (for HC-035).
- [ ] Add timeline-store middleware extension point (for HC-036).
- [ ] Validate middleware ordering and context propagation.

## Phase 5: Interleaved Validation

- [ ] Run `gofmt` after each backend edit cluster.
- [ ] Run `GOWORK=off go test ./...` after each major phase.
- [ ] Run manual `POST /api/chat/completions` smoke.
- [ ] Run manual websocket SEM stream smoke.
- [ ] Run `GET /api/timeline` smoke.
- [ ] Confirm stream contract remains SEM-only.

## Phase 6: Commit and Ticket Hygiene

- [ ] Commit cleanup phase.
- [ ] Commit runtime composer/router phase.
- [ ] Commit middleware phase.
- [ ] Update HC-034 changelog with each commit SHA and validation results.
- [ ] Update HC-034 diary with command history and failure notes.
- [ ] Update HC-033 orchestration status after HC-034 completion.

## Completion Gate

- [ ] No duplicated runtime-framework files remain in `go-inventory-chat/internal/app`.
- [ ] Backend uses Pinocchio-style composition and handlers.
- [ ] Middleware chain hooks are in place for HC-035 and HC-036.
- [ ] All validation checks pass.
