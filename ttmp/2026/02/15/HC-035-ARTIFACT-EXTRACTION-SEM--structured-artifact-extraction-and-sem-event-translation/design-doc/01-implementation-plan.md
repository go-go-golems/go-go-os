---
Title: Implementation Plan
Ticket: HC-035-ARTIFACT-EXTRACTION-SEM
Status: active
Topics:
    - chat
    - backend
    - go
    - sem
    - extraction
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: Structured extraction wrapper primitive.
    - Path: geppetto/pkg/events/chat-events.go
      Note: Event decode/encode support for typed events.
    - Path: geppetto/pkg/events/registry.go
      Note: Event factory/codec registration.
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/chat/planner.go
      Note: Planner output source that will feed extraction and translation.
ExternalSources: []
Summary: Implement structured artifact extraction and translation into typed SEM events without custom duplicated event frameworks.
LastUpdated: 2026-02-16T13:24:00-05:00
WhatFor: Defines extraction and SEM translation implementation details for inventory chat.
WhenToUse: Use during HC-035 implementation and review.
---

# Implementation Plan

## Executive Summary

HC-035 adds the structured extraction layer between planner output and websocket event emission. The objective is deterministic artifact extraction (reports/tables/card proposals) and consistent SEM translation for frontend consumers.

The implementation should reuse Geppetto structured sink/event registry primitives and avoid inventing a parallel extractor protocol.

## Problem Statement

Current backend emission is planner-centric and not yet formalized as a robust extraction pipeline. Without extraction and translation consistency:

1. Artifact payloads can drift in format.
2. Frontend parsing becomes brittle.
3. Timeline persistence and replay will be harder to keep stable.

## Proposed Solution

### 1) Introduce structured extraction wrapper

Wrap runtime event sink with Geppetto-style filtering/extraction middleware that recognizes and extracts structured payload blocks for:

1. `widget` artifacts (`report-view`, `data-table`)
2. `card-proposal` artifacts (full DSL payload + metadata)
3. follow-up actions (open-card, prefill, create-card)

### 2) Translate extraction outputs into typed SEM events

Define typed SEM events and codecs for:

1. `chat.message.user`
2. `chat.message.token`
3. `chat.message.artifact`
4. `chat.message.done`
5. `chat.message.error`

Register factories/codecs via Geppetto registry APIs.

### 3) Enforce deterministic payload validation

Before emission:

1. Validate artifact shape against expected schema.
2. Attach stable `artifact_id` and `message_id` references.
3. Reject malformed payloads with explicit error SEM events.

### 4) Keep sequence and conversation context intact

Each emitted event carries:

1. `conversation_id`
2. monotonic `seq`
3. `message_id`
4. event timestamp

## Design Decisions

1. Use wrapper-based extraction rather than parser logic in business handlers.
Reason: keeps planner logic separate from transport/event concerns.

2. Register event decoders centrally.
Reason: supports timeline replay and future shared schemas.

3. Treat malformed artifacts as explicit errors, not silent drops.
Reason: easier debugging and safer action execution.

## Alternatives Considered

### Alternative A: Emit raw planner objects directly

Rejected because raw objects are not stable enough for durable replay contracts.

### Alternative B: Parse artifacts in frontend only

Rejected because backend should own semantic guarantees and validation.

### Alternative C: Build a custom extractor framework in `go-inventory-chat`

Rejected because Geppetto already provides the primitives needed.

## Implementation Plan

### Phase 1: Event model and registry setup

1. Define SEM event payload structs for artifact/token/done/error paths.
2. Register event factories/codecs with Geppetto registry.
3. Add serializer/deserializer coverage tests.

### Phase 2: Extraction wrapper integration

1. Add sink wrapper that performs structured extraction.
2. Add typed translation from extraction outputs to SEM payloads.
3. Integrate wrapper into HC-034 middleware chain insertion point.

### Phase 3: Validation layer

1. Add schema checks for widget artifacts.
2. Add schema checks for card-proposal artifacts.
3. Add schema checks for action payloads.
4. Emit `chat.message.error` on validation failure with diagnostics.

### Phase 4: Transport and replay compatibility

1. Ensure WS stream emits only translated SEM events.
2. Ensure timeline persistence (HC-036) can store translated events without lossy re-encoding.
3. Ensure frontend parser contract remains stable.

### Phase 5: Interleaved validation

1. `gofmt` after each edit cluster.
2. `GOWORK=off go test ./...` after each phase.
3. CLI smoke for extraction success path.
4. CLI smoke for malformed artifact failure path.
5. Verify sequence continuity under artifact-heavy responses.

### Phase 6: Documentation and handoff

1. Update tasks, diary, and changelog with command evidence.
2. Document schema examples for HC-038 frontend integration.
3. Document persistence expectations for HC-036.

## Open Questions

1. Whether to persist raw source blocks alongside normalized artifact payloads.
2. Whether one or multiple artifact events should be emitted for composite payloads.

## References

1. `geppetto/pkg/events/structuredsink/filtering_sink.go`
2. `geppetto/pkg/events/chat-events.go`
3. `geppetto/pkg/events/registry.go`
4. `pinocchio/pkg/webchat/router.go`
