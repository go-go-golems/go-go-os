---
Title: Diary
Ticket: HC-034-WEBCHAT-RUNTIME-FOUNDATION
Status: active
Topics:
    - chat
    - backend
    - go
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/app/server.go
      Note: Primary backend file targeted by HC-034 refactor.
    - Path: pinocchio/cmd/web-chat/main.go
      Note: Reference wiring pattern for this ticket.
ExternalSources: []
Summary: Running implementation diary for backend runtime foundation refactor.
LastUpdated: 2026-02-16T13:22:00-05:00
WhatFor: Logs concrete implementation actions, failures, and validation evidence.
WhenToUse: Read before continuing HC-034 work or reviewing implementation decisions.
---

# Diary

## Step 1: Documentation Re-baseline

### Prompt context

User requested implementation documents and task lists be updated across tickets.

### What changed

1. Replaced HC-034 template plan with a concrete Pinocchio-first implementation plan.
2. Replaced placeholder `tasks.md` with phased, exhaustive tasks.
3. Added this diary scaffold to capture ongoing implementation details.

### Why

1. Existing docs were template-only and not executable.
2. HC-034 is the first code ticket and must provide accurate dependency inputs for HC-035 and HC-036.

### Next implementation action

1. Start code cleanup by removing duplicated runtime-framework files from `go-inventory-chat/internal/app`.

## Step 2: Runtime Foundation Implemented

1. Deleted duplicated runtime-framework files from `go-inventory-chat/internal/app`:
   - `runtime.go`
   - `stream_bus.go`
   - `sem.go`
   - `connection_pool.go`
   - `timeline_memory.go`
   - `helpers.go`
   - `conversation.go`
2. Rebuilt `go-inventory-chat/internal/app/server.go` to use:
   - explicit HTTP middleware chain (`recovery`, request logging),
   - planner middleware chain hooks,
   - single transport surface for `/api/chat/completions`, `/chat`, `/ws`, `/api/timeline`.
3. Kept stream contract SEM-only and removed legacy fallback branching.
4. Wired backend composition through `ServerOptions` with explicit timeline store dependency.

Validation:

1. `GOWORK=off go test ./...` passed.
2. Runtime smoke script and browser E2E both passed after refactor.

Commit:

1. `2780008` - `feat(hc-034..036): rebuild backend runtime with middleware and durable timeline`

## Step 3: Realignment to Pinocchio App-Owned Contract

1. Replaced the custom queued backend transport with Pinocchio app-owned handlers:
   - `POST /chat`
   - `GET /ws?conv_id=...`
   - `GET /api/timeline?conv_id=...`
2. Added Geppetto runtime composition in `go-inventory-chat/internal/app/server.go`:
   - provider/model/api-key configuration,
   - runtime fingerprinting,
   - runtime-key/override handling.
3. Added deterministic fallback engine for development (`--llm-enabled=false` or missing API key), publishing standard LLM SEM events and preserving artifact/card proposal payloads via structured tags.
4. Registered `inventory_query` as a Pinocchio tool factory and routed tool execution to existing planner/store logic.
5. Removed duplicated local timeline persistence implementation:
   - deleted `go-inventory-chat/internal/store/timeline.go`,
   - removed `timeline_*` schema tables from `internal/store/sqlite.go`.
6. Added Pinocchio timeline and turn SQLite store wiring in `cmd/inventory-chat/main.go`.

Validation:

1. `GOWORK=off go test ./...` passed.
2. Browser E2E (Playwright) against tmux backend+frontend passed:
   - prompt submission,
   - report/table rendering,
   - card proposal + create-card action,
   - generated saved card window opening.
