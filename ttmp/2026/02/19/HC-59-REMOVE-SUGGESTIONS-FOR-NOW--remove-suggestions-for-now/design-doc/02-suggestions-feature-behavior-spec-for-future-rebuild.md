---
Title: Suggestions Feature Behavior Spec (For Future Rebuild)
Ticket: HC-59-REMOVE-SUGGESTIONS-FOR-NOW
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - inventory
    - cleanup
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
      Note: Current canonical state/reducer semantics for suggestions
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts
      Note: Current event-to-suggestion update mapping from SEM envelopes
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Current usage and send-path interaction with suggestions
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Primary UI rendering and gating behavior for suggestions
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatView.tsx
      Note: Legacy/simple suggestions display behavior
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/StreamingChatView.tsx
      Note: Streaming-aware suggestions display behavior
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/event-viewer/eventBus.ts
      Note: Event summary behavior for suggestion event types
ExternalSources: []
Summary: Behavioral specification of the current suggestions feature so it can be recreated cleanly after runtime cleanup.
LastUpdated: 2026-02-19T17:57:16.160156149-05:00
WhatFor: Preserve exact feature behavior while HC-59 removes suggestions temporarily.
WhenToUse: Use when designing the post-cleanup reintroduction of suggestions.
---

# Suggestions Feature Behavior Spec (For Future Rebuild)

## Executive Summary
This document captures the current suggestions feature as behavior, not implementation, so it can be rebuilt after runtime cleanup.

Current behavior combines:
1. conversation-scoped suggestion state in inventory Redux (`chatSlice`),
2. server-driven updates from `hypercard.suggestions.*` events,
3. UI chip rendering in chat components with visibility gating rules,
4. click-to-send interaction that routes through the same send path as typed prompts.

HC-59 removes this feature temporarily. This spec is the reference to recreate it later without inheriting old architectural coupling.

## Problem Statement
Suggestions are being removed now to simplify runtime refactor work, but product behavior should not be lost. Without a behavior-level spec, future reimplementation risks semantic drift (different visibility rules, merge/replace handling, or inconsistent event mapping).

We need a single document that defines:
- user-visible behavior,
- event and state semantics,
- interaction rules,
- acceptance tests for future reintroduction.

## Proposed Solution
Recreate suggestions later as a runtime-owned, timeline-compatible feature with the same external behavior listed below.

### Feature Contract (Behavior)
1. Suggestions are conversation-scoped.
2. Suggestions are strings shown as chips.
3. Clicking a suggestion submits that text as a prompt.
4. Suggestions may be seeded locally and updated by server events.
5. UI can choose conditional visibility or always-visible mode.

### Data Model Semantics (Current Behavior Baseline)
From `apps/inventory/src/features/chat/chatSlice.ts`:
1. Default list on new conversation and on reset:
- `Show current inventory status`
- `What items are low stock?`
- `Summarize today sales`
2. Max list size: `8`.
3. Normalization:
- trim each value,
- drop empty strings,
- case-insensitive de-duplication (first occurrence wins),
- preserve insertion order of surviving values.
4. Update modes:
- `replaceSuggestions`: overwrite with normalized incoming list,
- `mergeSuggestions`: append incoming list and then normalize/de-duplicate.

### Event-Driven Behavior (Current Baseline)
From `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`:
1. `hypercard.suggestions.start` and `hypercard.suggestions.update`:
- parse `data.suggestions` as string array,
- if non-empty, merge into existing list.
2. `hypercard.suggestions.v1`:
- parse `data.suggestions`,
- if non-empty, replace current list.
3. Invalid/missing suggestion payload:
- no state change.

### Send-Path Interaction
From `apps/inventory/src/features/chat/InventoryChatWindow.tsx`:
1. On send (manual or suggestion chip), prompt text is trimmed.
2. Empty prompt is ignored.
3. While streaming, send is blocked.
4. Current behavior clears suggestions immediately before submitting prompt.
5. Submit failures surface via stream error state.

### Rendering and Visibility Rules
Current renderers:
- `ChatWindow`: `packages/engine/src/components/widgets/ChatWindow.tsx`
- `ChatView`: `packages/engine/src/components/widgets/ChatView.tsx`
- `StreamingChatView`: `packages/engine/src/components/widgets/StreamingChatView.tsx`

Rules:
1. `ChatWindow` shows chips when:
- list is non-empty, and
- either `showSuggestionsAlways=true`, or
- conversation is empty/near-empty (`isEmpty || messages.length <= 1`) and not streaming.
2. `ChatView` shows chips only when `messages.length <= 1`.
3. `StreamingChatView` shows chips only when `messages.length <= 1` and `!isStreaming`.

Interaction:
1. Each chip click calls the same `send()` path as typed input.
2. Chip text is used verbatim as prompt input.

### Styling/Instrumentation Baseline
1. Suggestions container uses `data-part="chat-suggestions"`.
2. Base style lives in `packages/engine/src/theme/desktop/chat.css`.
3. Event viewer summary labels `hypercard.suggestions*` as `"suggestions"` in `eventBus.ts`.

## Design Decisions
1. Behavior-first capture.
- Reason: future architecture should change internals while preserving external expectations.

2. Preserve current semantics as baseline, not mandate.
- Reason: this is a reconstruction reference; the rebuilt system may improve internals as long as intentional behavior changes are documented.

3. Keep explicit event mapping semantics in spec.
- Reason: merge-vs-replace behavior materially changes what users see.

## Alternatives Considered
1. Keep only source code references.
- Rejected: code will change during cleanup; behavior intent becomes hard to recover quickly.

2. Capture only UI screenshots/story output.
- Rejected: does not preserve reducer/event semantics needed for deterministic rebuild.

3. Rebuild from memory after cleanup.
- Rejected: high risk of inconsistent merge/replace and visibility logic.

## Implementation Plan
This section is for future reintroduction work (not HC-59 removal).

### Phase A: Runtime-level design
1. Define runtime-owned suggestion state keyed by conversation.
2. Define event handlers for `hypercard.suggestions.start|update|v1` with explicit merge/replace semantics.
3. Define max-size and normalization policy (reuse or intentionally revise this spec).

### Phase B: UI reintegration
1. Add suggestions props/selectors to the new timeline-native chat view.
2. Reintroduce chip rendering with explicit visibility mode:
- `contextual` (near-empty + not streaming),
- `always`.
3. Ensure chip click dispatches through standard send pipeline.

### Phase C: Validation
1. Unit tests for normalization, cap, and merge/replace.
2. Integration tests for event-driven updates.
3. UI tests for visibility gating and click-to-send.

### Rebuild Acceptance Criteria
1. Suggestions stay conversation-scoped.
2. Merge/replace event behavior matches documented contract (or documented intentional delta).
3. UI gating behavior is deterministic and tested.
4. Streaming state suppresses contextual suggestions.
5. Suggestions no longer require app-specific slice ownership.

## Open Questions
1. Should future suggestions support structured items (label + action payload) instead of plain strings?
2. Should “clear on send” be preserved, delayed, or removed?
3. Should dedupe remain case-insensitive in all locales?
4. Should suggestion events be standardized at runtime layer rather than app adapter layer?

## References
- `ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/design-doc/01-implementation-plan-remove-suggestions-for-now.md`
- `apps/inventory/src/features/chat/chatSlice.ts`
- `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `packages/engine/src/components/widgets/ChatWindow.tsx`
- `packages/engine/src/components/widgets/StreamingChatView.tsx`
