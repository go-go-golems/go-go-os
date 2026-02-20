---
Title: Diary
Ticket: HC-52-CUSTOMKIND-KIND-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - cleanup
    - frontend
    - backend
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Observed customKind origin captured in investigation diary
    - Path: packages/engine/src/chat/sem/timelineMapper.ts
      Note: Observed remap behavior captured in investigation diary
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T18:58:31.341515985-05:00
WhatFor: ""
WhenToUse: ""
---


# Diary

## Goal

Capture investigation and planning steps for decommissioning `tool_result.customKind` remap in favor of first-class hypercard timeline kinds.

## Step 1: Ticket Setup and Migration Analysis Draft

This step established a dedicated cleanup ticket so long-term kind-contract work is decoupled from the immediate artifact-open hotfix. The objective was to capture the migration as an explicit phased plan rather than ad-hoc follow-up notes.

The analysis focused on concrete producer/consumer paths currently responsible for routing hypercard artifacts: backend timeline projector emits `tool_result` with `customKind`, and frontend `timelineMapper` remaps that shape to hypercard renderers. This became the baseline for a future hard cutover.

### Prompt Context

**User prompt (verbatim):** "ok, make a ticket for this cleanup away from custom_kind and write a detailed implementation plan and analysis in that ticket, for later. 

Then, fix the short term bug for opening the artifacts."

**Assistant interpretation:** Create a separate ticket with a complete migration design for removing `customKind` indirection, then proceed with the immediate artifact-open fix under current cleanup work.

**Inferred user intent:** Separate strategic refactor planning from tactical production bugfixing so progress is unblocked now while preserving a rigorous long-term path.

### What I did
- Created ticket `HC-52-CUSTOMKIND-KIND-CUTOVER`.
- Added a design doc with:
  - current-state architecture analysis,
  - rationale for first-class `kind` contract,
  - phased migration plan including compatibility window and removal criteria.
- Added implementation tasks `C1`..`C8` in `tasks.md`.

### Why
- The `customKind` approach introduces semantic indirection and increases breakage risk in replay/upsert paths.
- A dedicated ticket prevents scope collision with immediate HC-02 bug fixes.

### What worked
- `docmgr` ticket creation and document scaffolding worked without vocabulary/frontmatter issues.
- Design scope could be expressed without changing protobuf schemas.

### What didn't work
- N/A

### What I learned
- Current `TimelineEntityV2` model already allows this migration because `kind` is an open string and `props` is flexible.

### What was tricky to build
- Separating long-term contract cleanup from active bug triage while keeping both traceable required creating a new ticket before changing runtime code.

### What warrants a second pair of eyes
- Proposed compatibility window length and replay guarantees for old sessions.
- Final canonical kind naming policy (`hypercard.widget.v1` in UI state vs alias mapping).

### What should be done in the future
- Execute tasks `C1`..`C8` in the new ticket and remove legacy remap after soak.

### Code review instructions
- Read `tasks.md` and design doc in the new ticket.
- Confirm migration phases are independently deployable and reversible.

### Technical details
- Current backend origin of `customKind`: `go-inventory-chat/internal/pinoweb/hypercard_events.go`.
- Current frontend remap point: `packages/engine/src/chat/sem/timelineMapper.ts`.

## Related

- `../design-doc/01-customkind-decommission-plan-and-kind-cutover-analysis.md`
