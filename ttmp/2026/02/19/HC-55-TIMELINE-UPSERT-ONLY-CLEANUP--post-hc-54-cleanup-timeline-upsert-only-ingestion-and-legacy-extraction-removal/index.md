---
Title: 'Post-HC-54 cleanup: timeline.upsert-only ingestion and legacy extraction removal'
Ticket: HC-55-TIMELINE-UPSERT-ONLY-CLEANUP
Status: active
Topics:
    - chat
    - timeline
    - cleanup
    - architecture
    - frontend
    - backend
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Inventory chat orchestration still controls timeline.upsert filtering behavior
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts
      Note: Inventory adapter path where direct raw-event extraction assumptions may remain
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/artifacts/artifactRuntime.ts
      Note: Shared artifact extraction logic containing direct hypercard ready-event branches
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts
      Note: Reusable projection orchestration hook to keep as canonical integration seam
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/tasks.md
      Note: Source ticket whose follow-up cleanup is tracked in HC-55
ExternalSources: []
Summary: Follow-up cleanup ticket to enforce timeline.upsert-only ingestion in Inventory and remove residual direct raw-event artifact extraction paths after HC-54 cutover.
LastUpdated: 2026-02-19T21:10:00-05:00
WhatFor: Track the final cleanup pass that removes post-cutover dual-path assumptions and keeps timeline entities as the single source of truth.
WhenToUse: Use when implementing/remediating remaining inventory chat adapter and extraction paths after HC-54.
---

# Post-HC-54 cleanup: timeline.upsert-only ingestion and legacy extraction removal

## Overview

HC-55 is a targeted follow-up to HC-54. HC-54 delivered dedicated timeline kinds and reusable chat runtime, but a cleanup pass is still needed to enforce canonical `timeline.upsert`-only ingestion in inventory and remove residual direct raw-event artifact extraction paths.

This ticket is intentionally narrow:

1. remove timeline-upsert bypass behavior in inventory ingestion
2. remove redundant direct `hypercard.widget.v1` / `hypercard.card.v2` extraction dependence
3. validate with strict regression and legacy-path scans

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- chat
- timeline
- cleanup
- architecture
- frontend
- backend

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
