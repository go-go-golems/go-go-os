---
Title: Diary
Ticket: HC-038-FRONTEND-WEBCHAT-CUTOVER
Status: active
Topics:
    - chat
    - frontend
    - timeline
    - ux
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/InventoryChatAssistantWindow.tsx
      Note: Primary orchestration component for frontend cutover.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/protocol.ts
      Note: Stream parser and hydration implementation.
ExternalSources: []
Summary: Running diary for frontend cutover and end-to-end UX stabilization.
LastUpdated: 2026-02-16T13:31:00-05:00
WhatFor: Tracks implementation steps and validation evidence for HC-038.
WhenToUse: Read before continuing frontend cutover work or reviewing behavior changes.
---

# Diary

## Step 1: Documentation Re-baseline

1. Replaced template implementation plan with concrete frontend cutover architecture.
2. Added detailed phased tasks for hydration, stream projection, artifact rendering, action handling, and UX hardening.
3. Captured dependencies on HC-036 durable timeline and HC-037 validation gate.

Next coding step:

1. Finalize SEM-only protocol and hydration flow in `apps/inventory/src/chat/protocol.ts` after backend refactors land.

## Step 2: Frontend Cutover Completed

1. Extended frontend protocol types to consume proposal metadata (`dedupeKey`, `version`, `policy`).
2. Updated chat window proposal cache mapping to carry enriched proposal metadata through create-card path.
3. Hardened create-card flow through updated `cardInjector.ts` validation logic and signature dedupe markers.
4. Verified end-to-end UI flow in browser:
   - prompt submission,
   - SEM stream projection,
   - report/table rendering,
   - create-card action opens generated card window.

Validation:

1. `npm exec -w apps/inventory tsc -b` passed.
2. `npm run -w apps/inventory build` passed.
3. Playwright MCP browser smoke passed against live tmux backend + Vite.

Commit:

1. `1bc60d3` - frontend cutover and action-path hardening.

## Step 3: Pinocchio Contract Frontend Cutover Landed

1. Replaced frontend transport contract in `apps/inventory/src/chat/protocol.ts`:
   - removed `POST /api/chat/completions` + `streamUrl`,
   - added `POST /chat`,
   - added websocket attach for `GET /ws?conv_id=...`,
   - added timeline hydration/entity parsing for `GET /api/timeline?conv_id=...`.
2. Rewrote `InventoryChatAssistantWindow.tsx` state flow:
   - hydration + live upsert entity model,
   - message projection from timeline entities,
   - tool result payload projection into report/table/card blocks,
   - structured-tag extraction fallback path (`<hypercard:widget|card|actions:1>`).
3. Restored actionable UI controls from fallback runtime by parsing and rendering `hypercard:actions` payloads.

Validation:

1. `npm exec -w apps/inventory tsc -b` passed.
2. Browser E2E (Playwright MCP) passed:
   - query submission,
   - report/table rendering,
   - `Create Saved Card` action execution,
   - generated saved card window verification.
