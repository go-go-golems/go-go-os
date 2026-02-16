---
Title: Implementation Plan
Ticket: HC-037-CARD-DSL-GENERATION-GATE
Status: active
Topics:
    - chat
    - frontend
    - backend
    - dsl
    - reports
    - tables
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/chat/planner.go
      Note: Planner output and artifact generation source.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/cardInjector.ts
      Note: Runtime injection path and dedupe checks.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.vm.js
      Note: Plugin bundle injection target for generated DSL.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts
      Note: Host card metadata to update for generated cards.
ExternalSources: []
Summary: Implement report/table artifact generation and full card DSL generation with a validation gate before runtime injection.
LastUpdated: 2026-02-16T13:29:00-05:00
WhatFor: Defines how generated cards and artifacts are produced, validated, and safely applied.
WhenToUse: Use while implementing HC-037 or reviewing generated-card pipeline behavior.
---

# Implementation Plan

## Executive Summary

HC-037 is the content-generation layer:

1. Expand report/table artifact generation for inventory chat.
2. Generate full card DSL payloads for runtime card creation.
3. Add a validation gate before `create-card` injection.

Policy hardening can be deferred, but structural validation and deterministic generation are in scope now.

## Problem Statement

Generated reports and cards currently lack a formal, validated pipeline. Without a generation gate:

1. Artifacts can be inconsistent between turns.
2. Generated card DSL can fail at runtime.
3. Frontend `create-card` behavior can be non-deterministic.

## Proposed Solution

### 1) Structured report/table generation

Standardize planner outputs for:

1. `report-view` summaries (headline metrics, status badges, recommendation text)
2. `data-table` payloads (column definitions, row arrays, deterministic ordering)

### 2) Full card DSL generation contract

Generate full card proposal payload including:

1. card metadata (`card_id`, `title`, `icon`, `description`)
2. plugin DSL source (`defineCard(...)` compatible function/object)
3. optional handlers (`openReport`, `refresh`, `filter`) for report cards
4. display hints (default dimensions, launch behavior)

### 3) Validation gate before injection

Before applying `create-card`:

1. parse and sanity-check generated DSL payload structure
2. verify required fields and deterministic IDs
3. block duplicate IDs and duplicate signature payloads
4. surface explicit error message to chat timeline if validation fails

### 4) Deterministic generation paths

Use deterministic templates for common inventory cards:

1. low-stock report card
2. sales summary card
3. valuation snapshot card

This keeps output stable while still allowing rich card creation.

## Design Decisions

1. Full card DSL generation is in scope for this ticket.
Reason: user explicitly prioritized this capability.

2. Structural validation is required even if full policy checks are deferred.
Reason: prevents runtime breakage and invalid card injection.

3. Deterministic templates first, free-form generation later.
Reason: reliable local testing and predictable UX.

4. Reuse existing card injector host+bundle dual update path.
Reason: aligns with existing runtime architecture in inventory app.

## Alternatives Considered

### Alternative A: Only emit report widgets, no generated cards

Rejected because create-card from chat is a core product goal.

### Alternative B: Inject DSL directly without validation

Rejected due high runtime failure risk and difficult debugging.

### Alternative C: Generate host metadata only, no plugin DSL

Rejected because plugin cards require VM render/handler definitions.

## Implementation Plan

### Phase 1: Artifact schema stabilization

1. Finalize `report-view` schema fields.
2. Finalize `data-table` schema fields.
3. Add schema helpers and validation tests.

### Phase 2: Card DSL proposal generation

1. Add deterministic DSL templates per report type.
2. Emit full `card-proposal` payload with metadata + code + signature.
3. Add proposal versioning to support evolution.

### Phase 3: Validation gate implementation

1. Validate required card metadata fields.
2. Validate DSL body type and parseability.
3. Validate action payload references existing proposal IDs.
4. Validate duplicate guards (`card_id`, proposal signature).

### Phase 4: Injector integration

1. Integrate validation gate into frontend `create-card` flow.
2. Ensure successful apply updates both stack metadata and plugin bundle code.
3. Ensure failures emit deterministic system feedback messages.

### Phase 5: Interleaved validation

1. Backend tests for artifact/card proposal generation.
2. Frontend tests for validation gate + injector integration.
3. Manual chat flow smoke for:
   - report/table rendering
   - create-card success
   - duplicate prevention
   - malformed proposal rejection

### Phase 6: Documentation and handoff

1. Document generated payload examples in diary.
2. Document gate failure reasons and user-facing messages.
3. Provide finalized payload contracts to HC-038 frontend rendering.

## Open Questions

1. Whether generated cards should include filter/edit handlers at launch or ship read-only first.
2. Whether proposal signatures should include normalized AST hash or source-text hash for dedupe.

## References

1. `2026-02-12--hypercard-react/go-inventory-chat/internal/chat/planner.go`
2. `2026-02-12--hypercard-react/apps/inventory/src/chat/cardInjector.ts`
3. `2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.vm.js`
