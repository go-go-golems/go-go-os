---
Title: Validated Architecture and Implementation Plan
Ticket: HC-033-ADD-WEBCHAT-INTEGRATION
Status: active
Topics:
    - chat
    - backend
    - sqlite
    - go
    - architecture
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/app/server.go
      Note: Current backend integration point that must be refactored to Pinocchio-style composition.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/protocol.ts
      Note: Frontend protocol parser and hydration client.
    - Path: pinocchio/cmd/web-chat/main.go
      Note: Canonical app-owned web-chat wiring reference.
    - Path: pinocchio/pkg/webchat/router.go
      Note: Runtime composer and event routing reference implementation.
    - Path: geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: Structured extraction wrapper reference for artifact extraction.
ExternalSources: []
Summary: Epic-level validated plan for inventory webchat integration, split into HC-034..HC-038 with a hard pivot to reuse Pinocchio/Geppetto components and remove duplicated framework code.
LastUpdated: 2026-02-16T13:20:00-05:00
WhatFor: Master architecture and sequencing document for HC-033 orchestration.
WhenToUse: Use this doc to track what is in scope for the epic and what is delegated to child tickets.
---

# Validated Architecture and Implementation Plan

## Executive Summary

The imported design remains directionally correct, but implementation must follow one hard constraint:

1. Reuse Pinocchio and Geppetto primitives whenever possible.
2. Remove duplicated backend framework code introduced in `go-inventory-chat/internal/app`.
3. Keep no backward-compatibility path for legacy frames in this new project.

HC-033 now acts as an orchestration epic. Delivery is split across:

1. HC-034: runtime foundation and middleware chain.
2. HC-035: structured artifact extraction + SEM translation.
3. HC-036: durable timeline persistence and replay.
4. HC-037: report/table artifacts and full card DSL generation gate.
5. HC-038: frontend cutover and end-to-end UX stabilization.

## Reality Check Against Code

### Confirmed in repository

1. Inventory frontend already has app-window chat integration scaffolding.
2. `go-inventory-chat` module exists with planner/store/server layers.
3. Ticket decomposition HC-034..HC-038 exists on disk.

### Not acceptable in current backend state

1. `go-inventory-chat/internal/app` currently contains duplicated custom runtime framework files.
2. `go-inventory-chat/internal/app/server.go` diverged from Pinocchio webchat composition patterns.
3. Task state in HC-033 previously over-reported completion and must be treated as invalid.

## Architecture Direction (Locked)

1. Keep app-owned endpoint wiring and resolver logic in `go-inventory-chat` command layer.
2. Use Pinocchio webchat router/handler patterns for chat, ws, and timeline endpoints.
3. Use Geppetto event + structured sink primitives for artifact extraction and translation.
4. Persist timeline data in SQLite so hydration/replay survives process restart.
5. Keep frontend on SEM-only stream parsing and timeline hydration.
6. Keep no compatibility layer for legacy transport frames.

## Implementation Decomposition

### HC-034 Runtime Foundation

1. Remove duplicated internal runtime framework files in `go-inventory-chat/internal/app`.
2. Rebuild backend around Pinocchio webchat composition patterns.
3. Add middleware chain hooks for request metadata, tracing, and sink wrapping.

### HC-035 Artifact Extraction + SEM

1. Implement structured extraction wrapper using Geppetto filtering sink.
2. Translate extracted artifacts into typed SEM events.
3. Ensure frontend artifact payloads remain deterministic and parseable.

### HC-036 Durable Timeline

1. Replace in-memory-only timeline projection with SQLite persistence.
2. Implement replay/hydration by conversation ID and sequence window.
3. Add reconnection semantics for websocket consumers.

### HC-037 Reports/Tables + Full Card DSL

1. Expand planner/tool outputs for report/table artifacts.
2. Add full card DSL generation pipeline for create-card actions.
3. Add validation gate before runtime injection.

### HC-038 Frontend Cutover

1. Finalize frontend chat protocol around SEM and hydration.
2. Integrate action handling and proposal cache with durable timeline.
3. Validate end-to-end flow in tmux-driven real runs.

## Cross-Cutting Rules

1. Commit incrementally during implementation.
2. Update each ticket’s `design-doc`, `tasks.md`, `reference/01-diary.md`, and `changelog.md` continuously.
3. Interleave tests while implementing, not at the end.
4. Keep all task checkboxes honest.

## Open Questions

1. Whether timeline retention should be count-based, age-based, or both.
2. Whether generated card DSL should support post-create edits in chat immediately or in a follow-up ticket.
3. Exact storage strategy for proposal source text and validation diagnostics.

## References

1. `sources/local/webchat-hyper-integration.md`
2. `ttmp/2026/02/15/HC-034-WEBCHAT-RUNTIME-FOUNDATION--webchat-runtime-foundation-and-middleware-chain/design-doc/01-implementation-plan.md`
3. `ttmp/2026/02/15/HC-035-ARTIFACT-EXTRACTION-SEM--structured-artifact-extraction-and-sem-event-translation/design-doc/01-implementation-plan.md`
4. `ttmp/2026/02/15/HC-036-TIMELINE-DURABLE-PERSISTENCE--durable-timeline-store-and-conversation-replay/design-doc/01-implementation-plan.md`
5. `ttmp/2026/02/15/HC-037-CARD-DSL-GENERATION-GATE--full-card-dsl-generation-and-injection-validation-gate/design-doc/01-implementation-plan.md`
6. `ttmp/2026/02/15/HC-038-FRONTEND-WEBCHAT-CUTOVER--frontend-webchat-cutover-and-tool-artifact-timeline-ux/design-doc/01-implementation-plan.md`
