# Tasks

## Documentation Baseline

- [x] Replace template implementation document with concrete Pinocchio-first plan.
- [x] Replace placeholder task list with exhaustive execution checklist.
- [x] Keep diary/changelog updated after each implementation cluster.

## Phase 1: Remove Duplicated Runtime Framework

- [x] Snapshot current backend behavior with a smoke script before refactor.
- [x] Delete `go-inventory-chat/internal/app/runtime.go`.
- [x] Delete `go-inventory-chat/internal/app/stream_bus.go`.
- [x] Delete `go-inventory-chat/internal/app/sem.go`.
- [x] Delete `go-inventory-chat/internal/app/connection_pool.go`.
- [x] Delete `go-inventory-chat/internal/app/timeline_memory.go`.
- [x] Delete `go-inventory-chat/internal/app/helpers.go`.
- [x] Delete `go-inventory-chat/internal/app/conversation.go`.
- [x] Remove now-broken imports/usages from `go-inventory-chat/internal/app/server.go`.
- [x] Confirm no remaining references to deleted files with `rg`.

## Phase 2: Runtime Composer Adapter

- [x] Add inventory runtime composer adapter package (thin adapter around planner/store).
- [x] Implement resolver/context wiring expected by webchat handlers.
- [x] Ensure conversation/message identity flow is preserved through adapter.
- [x] Ensure sink wrapper support is available for HC-035.
- [x] Ensure timeline hook support is available for HC-036.

## Phase 3: Router and Endpoint Wiring

- [x] Wire `POST /api/chat/completions` using Pinocchio-style handler.
- [x] Wire `GET /ws` using Pinocchio-style websocket handler.
- [x] Wire `GET /api/timeline` using Pinocchio-style timeline handler.
- [x] Keep `GET /healthz` operational.
- [x] Keep CORS behavior compatible with inventory Vite dev host.

## Phase 4: Middleware Chain

- [x] Add request-id middleware.
- [x] Add panic recovery middleware.
- [x] Add structured request logging middleware.
- [x] Add sink-wrapper middleware extension point (for HC-035).
- [x] Add timeline-store middleware extension point (for HC-036).
- [x] Validate middleware ordering and context propagation.

## Phase 5: Interleaved Validation

- [x] Run `gofmt` after each backend edit cluster.
- [x] Run `GOWORK=off go test ./...` after each major phase.
- [x] Run manual `POST /api/chat/completions` smoke.
- [x] Run manual websocket SEM stream smoke.
- [x] Run `GET /api/timeline` smoke.
- [x] Confirm stream contract remains SEM-only.

## Phase 6: Commit and Ticket Hygiene

- [x] Commit cleanup phase.
- [x] Commit runtime composer/router phase.
- [x] Commit middleware phase.
- [x] Update HC-034 changelog with each commit SHA and validation results.
- [x] Update HC-034 diary with command history and failure notes.
- [x] Update HC-033 orchestration status after HC-034 completion.

## Completion Gate

- [x] No duplicated runtime-framework files remain in `go-inventory-chat/internal/app`.
- [x] Backend uses Pinocchio-style composition and handlers.
- [x] Middleware chain hooks are in place for HC-035 and HC-036.
- [x] All validation checks pass.

## Phase 7: Pinocchio Contract Realignment

- [x] Remove legacy queued `message_id/stream_url` wrapper transport from backend.
- [x] Rewire backend to app-owned Pinocchio `POST /chat` + `GET /ws?conv_id=...`.
- [x] Add Geppetto runtime composition with provider/model/API-key flags.
- [x] Add deterministic planner fallback engine for no-key development runs.
- [x] Register inventory tool in Pinocchio tool registry (`inventory_query`).
- [x] Replace duplicated local timeline implementation with Pinocchio timeline/turn stores.
- [x] Revalidate backend with `GOWORK=off go test ./...`.
