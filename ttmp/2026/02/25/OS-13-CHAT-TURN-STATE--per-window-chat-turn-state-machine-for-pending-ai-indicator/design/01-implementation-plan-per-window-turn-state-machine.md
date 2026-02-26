---
Title: 'Implementation plan: per-window turn state machine'
Ticket: OS-13-CHAT-TURN-STATE
Status: active
Topics:
    - chat
    - frontend
    - ux
    - debugging
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Chat window wiring point for pending indicator behavior.
    - Path: /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/widgets/ChatWindow.tsx
      Note: UI renderer for pending AI placeholder row.
    - Path: /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/state/timelineSlice.ts
      Note: Timeline state shape used for message append detection.
ExternalSources: []
Summary: Short implementation plan for replacing ad-hoc pending-spinner logic with a per-window turn lifecycle state machine.
LastUpdated: 2026-02-25T14:00:00-05:00
WhatFor: Define clean behavior and execution steps before implementation.
WhenToUse: Use when implementing or reviewing pending AI indicator behavior in chat windows.
---

# Implementation Plan: Per-window Turn State Machine

## Desired behavior

1. User submits a prompt.
2. Do not show `AI: ...` immediately.
3. Wait until the submitted user message is appended to the timeline.
4. Then show `AI: ...` as a stop-gap.
5. Keep it visible until first AI-side timeline signal arrives.
6. Remove it on terminal error.

## Scope

- Per-window behavior: each `ChatConversationWindow` instance owns its own state machine.
- No global cross-window pending state.
- Remove superseded heuristic logic.

## State machine

- `idle`
- `waiting_for_user_append`
- `waiting_for_ai_signal`
- `ai_active`
- `error`

### Transition rules

1. `idle -> waiting_for_user_append` on submit.
2. `waiting_for_user_append -> waiting_for_ai_signal` when matching post-submit user message appears in timeline.
3. `waiting_for_ai_signal -> ai_active` when first AI-side timeline entry appears.
4. Any non-idle -> `error` on send/connect error.
5. `ai_active -> idle` when turn completes.

## Matching strategy

- Track baseline timeline length at submit.
- Detect user append in post-baseline entities only.
- Detect AI signal in post-user-append entities only.
- Ignore timestamps as ordering truth source.

## Implementation tasks

1. Build a dedicated hook (`usePendingAiTurn`) with reducer/state transitions.
2. Wire `ChatConversationWindow` to `showPendingResponseSpinner` based on machine phase.
3. Remove legacy awaiting heuristics.
4. Add tests for user-append gate, AI-signal clear, and non-regression scenarios.
5. Validate and update docs.
