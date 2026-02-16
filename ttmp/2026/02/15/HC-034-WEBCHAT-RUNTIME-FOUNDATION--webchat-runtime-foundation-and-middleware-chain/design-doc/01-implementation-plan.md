---
Title: Implementation Plan
Ticket: HC-034-WEBCHAT-RUNTIME-FOUNDATION
Status: active
Topics:
    - chat
    - backend
    - go
    - architecture
    - middleware
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/app/server.go
      Note: Existing backend surface to refactor into Pinocchio-style composition.
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/app/runtime.go
      Note: Duplicated runtime framework file to remove.
    - Path: pinocchio/cmd/web-chat/main.go
      Note: Canonical web-chat command wiring to mirror.
    - Path: pinocchio/pkg/webchat/router.go
      Note: Router composition and runtime composer integration.
    - Path: pinocchio/pkg/webchat/http/api.go
      Note: API handlers and resolver interfaces.
ExternalSources: []
Summary: Rebuild backend runtime foundation using Pinocchio webchat composition and middleware patterns, removing duplicated framework code from go-inventory-chat.
LastUpdated: 2026-02-16T13:22:00-05:00
WhatFor: Defines the backend foundation work required before artifact extraction, durable timeline, and frontend cutover.
WhenToUse: Use this document while implementing or reviewing HC-034.
---

# Implementation Plan

## Executive Summary

HC-034 establishes the backend foundation for the inventory web-chat stack by reusing Pinocchio webchat architecture rather than maintaining parallel custom framework code in `go-inventory-chat/internal/app`.

This ticket is responsible for:

1. Removing duplicated runtime framework files.
2. Re-wiring the backend around Pinocchio-style router/handler/composer patterns.
3. Introducing middleware chain points that later tickets can extend.

No backward compatibility layer is required for legacy stream frames.

## Problem Statement

The current backend drifted into custom runtime scaffolding that duplicates existing Pinocchio primitives. That creates maintenance overhead, inconsistent behavior, and blocks clean integration of SEM extraction, durable timelines, and frontend cutover tasks.

## Proposed Solution

### 1) Delete duplicated framework internals

Remove custom internal framework files in `go-inventory-chat/internal/app` that replicate bus/runtime/timeline functionality already available through Pinocchio/Geppetto composition patterns.

### 2) Implement app-owned command wiring with Pinocchio webchat pattern

Use the same shape as `pinocchio/cmd/web-chat/main.go`:

1. Build app-owned handlers for chat, ws, and timeline.
2. Use a runtime composer adapter specific to inventory planner/store.
3. Use `webchat.NewRouter(...)` style composition for endpoint registration.

### 3) Define middleware chain contracts

Introduce clear middleware points for:

1. Request metadata (request ID, conversation ID normalization).
2. Logging and panic recovery.
3. Event sink wrapping (for HC-035 extraction wrappers).
4. Timeline persistence handoff hooks (for HC-036 durable store).

### 4) Keep transport SEM-only

All WS stream payloads remain SEM-only. No fallback frame parser/writer should survive this refactor.

## Design Decisions

1. Pinocchio-first reuse over bespoke implementation.
Reason: lower risk, less code, better parity with known-good web-chat stack.

2. Thin adapters in `go-inventory-chat` instead of framework forks.
Reason: inventory backend owns business logic, not infrastructure duplication.

3. Explicit middleware chain now, even if some middleware is stubbed.
Reason: later tickets need insertion points without another router rewrite.

4. No backward compatibility for old frames.
Reason: user requested greenfield behavior for this project.

## Alternatives Considered

### Alternative A: Keep custom runtime framework and iterate

Rejected because it duplicates Pinocchio behavior and increases long-term divergence.

### Alternative B: Import full Pinocchio command code directly without adaptation

Rejected because inventory planner/store contracts still require app-specific wiring.

### Alternative C: Delay middleware chain until later tickets

Rejected because HC-035 and HC-036 depend on stable insertion points now.

## Implementation Plan

### Phase 1: Baseline and cleanup

1. Snapshot current backend behavior with smoke test commands.
2. Remove duplicated files in `go-inventory-chat/internal/app`:
   - `runtime.go`
   - `stream_bus.go`
   - `sem.go`
   - `connection_pool.go`
   - `timeline_memory.go`
   - `helpers.go`
   - `conversation.go`
3. Simplify `server.go` to delegate to Pinocchio-style composition.

### Phase 2: Runtime composer adapter

1. Add inventory runtime composer adapter package (for planner/store integration).
2. Build resolver interfaces expected by webchat HTTP handlers.
3. Ensure runtime artifacts contain conversation ID, message ID, and sink wiring.

### Phase 3: Router and handlers

1. Register `POST /api/chat/completions`.
2. Register `GET /ws`.
3. Register `GET /api/timeline`.
4. Keep `GET /healthz`.
5. Keep CORS consistent with inventory frontend dev server.

### Phase 4: Middleware chain

1. Add request-ID middleware.
2. Add panic recovery middleware.
3. Add structured logging middleware.
4. Add sink-wrapper middleware hook for HC-035.
5. Add timeline-store middleware hook for HC-036.

### Phase 5: Validation (interleaved)

1. `gofmt` after each code cluster.
2. `GOWORK=off go test ./...` after each cluster.
3. Manual POST+WS smoke after router and composer changes.
4. Timeline endpoint smoke after middleware wiring.

### Phase 6: Documentation and handoff

1. Update HC-034 tasks, diary, and changelog with command evidence.
2. Relate changed files in ticket docs.
3. Handoff integration points to HC-035 and HC-036.

## Open Questions

1. Whether middleware chain should use standard `net/http` wrappers only, or include explicit typed middleware contracts for runtime/sink context.
2. Whether request tracing should start with simple UUID-only logs or wire into broader observability now.

## References

1. `pinocchio/cmd/web-chat/main.go`
2. `pinocchio/pkg/webchat/router.go`
3. `pinocchio/pkg/webchat/http/api.go`
4. `geppetto/pkg/events/chat-events.go`
