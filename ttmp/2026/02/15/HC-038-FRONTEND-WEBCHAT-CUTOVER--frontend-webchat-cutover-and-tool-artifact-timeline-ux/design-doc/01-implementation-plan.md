---
Title: Implementation Plan
Ticket: HC-038-FRONTEND-WEBCHAT-CUTOVER
Status: active
Topics:
    - chat
    - frontend
    - timeline
    - ux
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Chat app-window entrypoint and desktop integration.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/InventoryChatAssistantWindow.tsx
      Note: Main chat UI orchestration component.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/protocol.ts
      Note: SEM stream parser and hydration client.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/cardInjector.ts
      Note: Create-card action handling and runtime mutation path.
ExternalSources: []
Summary: Finalize frontend web-chat cutover around SEM-only streams, hydration, artifact rendering, and create-card UX.
LastUpdated: 2026-02-16T13:31:00-05:00
WhatFor: Defines frontend cutover work needed after backend/runtime tickets land.
WhenToUse: Use while implementing HC-038 and validating end-to-end inventory chat UX.
---

# Implementation Plan

## Executive Summary

HC-038 completes frontend cutover from legacy/local assistant behavior to full backend web-chat behavior with:

1. SEM-only stream handling
2. startup hydration and replay
3. artifact rendering for reports/tables
4. create-card action orchestration with clear feedback

No backward compatibility path is required.

## Problem Statement

Without final cutover and UX hardening:

1. chat behavior remains partially coupled to interim paths
2. hydration and stream reconnection can drift
3. report/table and create-card experiences become fragile

## Proposed Solution

### 1) Lock protocol and lifecycle

1. Ensure frontend parser accepts only SEM contract.
2. Ensure hydration runs before first live stream subscription.
3. Ensure reconnection flow avoids duplicate UI mutations.

### 2) Stabilize message and artifact rendering

1. Normalize event-to-UI projection for tokens/artifacts/done/errors.
2. Render report/table artifacts consistently.
3. Maintain proposal cache from hydrated timeline + live stream.

### 3) Stabilize action execution

1. Handle `open-card`, `prefill`, and `create-card` deterministically.
2. Show clear system feedback on success/failure.
3. Enforce dedupe behavior on repeated create-card events.

### 4) End-to-end UX and build verification

1. Validate dev flow with tmux (backend + Vite + browser).
2. Validate production typecheck/build.
3. Validate resilient behavior across page refresh and backend restart.

## Design Decisions

1. App-window chat remains primary UX surface.
Reason: clean host-owned orchestration boundary.

2. SEM-only parser; no legacy parsing branches.
Reason: simpler and aligns with project greenfield direction.

3. Hydration-first startup flow.
Reason: prevents transcript loss and proposal cache gaps.

4. Keep feedback visible inside chat timeline.
Reason: operators need explicit outcomes for create-card and error paths.

## Alternatives Considered

### Alternative A: Keep legacy assistant card as primary UI

Rejected because backend/tooling workflows need host-level chat orchestration.

### Alternative B: Hydrate lazily after opening websocket

Rejected due race conditions and duplicate or out-of-order message projection.

### Alternative C: Move action handling fully to backend

Rejected because runtime card injection mutates host-side stack/plugin runtime.

## Implementation Plan

### Phase 1: Protocol and hydration lock

1. Finalize SEM event parser and event-type dispatch.
2. Finalize hydration request/response mapping to `ChatWindowMessage`.
3. Implement reconnect flow using last known timeline state.

### Phase 2: Artifact rendering and cache rebuild

1. Ensure report/table artifacts render after hydration and live stream.
2. Rebuild proposal cache from hydrated artifact history.
3. Ensure live artifact stream updates the same cache.

### Phase 3: Action routing and feedback

1. Finalize `open-card` behavior.
2. Finalize `prefill` behavior.
3. Finalize `create-card` behavior with HC-037 validation gate.
4. Add consistent success/error system timeline messages.

### Phase 4: UX hardening

1. Handle malformed event payloads gracefully.
2. Handle missing conversation/session IDs gracefully.
3. Handle backend unavailable/retry UX.
4. Verify StrictMode behavior in development.

### Phase 5: Interleaved validation

1. `npm exec -w apps/inventory tsc -b` after each frontend phase.
2. Browser smoke after each major integration change.
3. tmux real-run test for stream/hydration/actions.
4. `npm run -w apps/inventory build` before completion.

### Phase 6: Documentation and closure

1. Update tasks, diary, and changelog with validation evidence.
2. Add final UX runbook notes for local operators.
3. Update HC-033 completion status once all child tickets are done.

## Open Questions

1. Whether chat window should auto-open on every app launch or remain user-triggered.
2. Whether to persist UI-only view preferences (expanded widgets, column sorting) in this ticket or defer.

## References

1. `2026-02-12--hypercard-react/apps/inventory/src/chat/InventoryChatAssistantWindow.tsx`
2. `2026-02-12--hypercard-react/apps/inventory/src/chat/protocol.ts`
3. `2026-02-12--hypercard-react/apps/inventory/src/chat/cardInjector.ts`
