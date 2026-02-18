---
Title: Timeline-first chat runtime with app-specific widget/card projections
Ticket: HC-51-TIMELINE-FIRST-CHAT
Status: active
Topics:
    - frontend
    - architecture
    - chat
    - state-management
    - timeline
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources:
    - local:01-hc-51-update.md
Summary: Ticket for HC-51 timeline-first chat architecture planning, including post-review Pinocchio alignment rewrite and reMarkable publication.
LastUpdated: 2026-02-18T15:27:00Z
WhatFor: Track, revise, and publish the HC-51 architecture plan with strict Pinocchio-aligned SEM->timeline contracts.
WhenToUse: Use when implementing HC-51 cutover work and when onboarding developers to the finalized architecture direction.
---


# Timeline-first chat runtime with app-specific widget/card projections

## Overview

HC-51 captures the architecture plan for moving HyperCard chat to a timeline-first runtime model. After expert review, the implementation plan was rewritten to enforce strict Pinocchio-style semantics: single SEM->entity projection path, raw-only EventViewer, and hard cutover away from synthetic timeline widget-message reducers.

## Key Links

- Implementation plan:
  - `design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md`
- Detailed diary:
  - `reference/01-diary.md`
- Task checklist:
  - `tasks.md`
- Uploaded reMarkable path:
  - `/ai/2026/02/17/HC-51-TIMELINE-FIRST-CHAT`
- Revised upload path:
  - `/ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT`
- Latest upload path:
  - `/ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT-UPDATED`

## Status

Current status: **active**

Deliverable status:

- 5+ page implementation plan complete
- post-review implementation plan rewrite complete
- pseudocode and sequence/timeline diagrams included
- diary recorded
- reMarkable uploads completed and verified (initial + revised)

## Topics

- frontend
- architecture
- chat
- state-management
- timeline

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
