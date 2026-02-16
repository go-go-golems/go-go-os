---
Title: Diary
Ticket: HC-035-ARTIFACT-EXTRACTION-SEM
Status: active
Topics:
    - chat
    - backend
    - sem
    - extraction
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: Extraction wrapper primitive referenced by this ticket.
ExternalSources: []
Summary: Running diary for structured artifact extraction and SEM translation work.
LastUpdated: 2026-02-16T13:24:00-05:00
WhatFor: Captures implementation trail and validation evidence for HC-035.
WhenToUse: Read before continuing HC-035 work or reviewing design decisions.
---

# Diary

## Step 1: Documentation Re-baseline

1. Replaced template implementation plan with concrete extraction and SEM translation architecture.
2. Added an exhaustive phased task list including schema, wrapper integration, validation, and replay integrity.
3. Captured dependencies on HC-034 middleware hooks and HC-036 persistence requirements.

Next coding step:

1. Start SEM event struct + codec registration implementation once HC-034 sink hooks are in place.

## Step 2: Structured Extraction and Validation Middleware Implemented

1. Added planner middleware chain in backend runtime flow.
2. Implemented `StructuredExtractionMiddleware`:
   - parses `<hypercard:widget:1>{...}</hypercard:widget:1>` and `<hypercard:card:1>{...}</hypercard:card:1>` blocks,
   - converts structured blocks into deterministic artifact payloads.
3. Implemented `ArtifactValidationMiddleware`:
   - validates widget payload contract (`report-view`, `data-table`),
   - validates card proposal contract (`cardId`, DSL presence, forbidden token checks),
   - filters invalid artifacts and records rejection details in assistant text.
4. Kept SEM event envelope output stable (`chat.message.token`, `chat.message.artifact`, `chat.message.done`, `chat.message.error`).

Validation:

1. `GOWORK=off go test ./...` passed.
2. CLI smokes confirmed artifact event classes and payloads.

Commit:

1. `2780008` - backend middleware/extraction implementation.
