---
Title: 'Analysis: chat timeline raw debug tree with copy and export'
Ticket: HC-53-CHAT-TIMELINE-DEBUG
Status: active
Topics:
    - chat
    - debugging
    - frontend
    - ux
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Window launch and header action integration point for new timeline debug window
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.tsx
      Note: Existing debug UI patterns for copy and YAML export flows
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/SyntaxHighlight.tsx
      Note: Reusable debug rendering component for payload/code blocks
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/clipboard.ts
      Note: Reusable clipboard helper for entity and conversation copy actions
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/yamlFormat.ts
      Note: Reusable YAML formatter used by debug exports
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.ts
      Note: Maps transport timeline entities into frontend timeline entity payloads
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/state/selectors.ts
      Note: Selector layer for accessing conversation timeline in UI
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.ts
      Note: Canonical conversation timeline state shape and reducer semantics
ExternalSources: []
Summary: Analysis for adding a chat timeline debug view with expandable structured tree inspection, per-entity copy actions, and conversation-level YAML export.
LastUpdated: 2026-02-21T18:40:00-05:00
WhatFor: Define exactly what to implement so timeline debugging can be exported and shared immediately.
WhenToUse: Use when implementing or reviewing chat timeline debug tooling in the HyperCard inventory app.
---


# Analysis: chat timeline raw debug tree with copy and export

## Executive Summary

This ticket adds a dedicated debug view for the chat timeline state (not only SEM event stream). The new view should let operators inspect raw timeline data as an expandable tree, copy an individual timeline entity payload, copy the entire conversation timeline snapshot, and export the full conversation snapshot to YAML.

The implementation can reuse existing debug utilities (`copyTextToClipboard`, `toYaml`, `SyntaxHighlight`) and existing window-launch patterns already used by `EventViewerWindow`. The main new work is a timeline-state projection model and a new debug UI component that renders deep nested objects in a readable, collapsible structure.

## Problem Statement

Current debugging support is strong for event stream diagnostics (`EventViewerWindow`) but weak for state diagnostics:

- `EventViewerWindow` shows incoming SEM/event envelopes, not the actual post-reducer `timeline` state.
- When timeline rendering looks wrong, we need the exact state in `timeline.byConvId[convId]` to debug ordering, version gating, merged props, and hidden entities.
- There is no one-click way to copy:
  - one specific timeline entity ("widget") as raw structured data,
  - the whole conversation timeline state,
  - or export the conversation to a YAML file for async debugging.

Result: diagnosis is slower and usually requires manual devtools spelunking and ad-hoc copy/paste.

## Current System Map

### Chat timeline state source

The canonical state lives in Redux:

- `timeline.byConvId[convId].order: string[]`
- `timeline.byConvId[convId].byId: Record<string, TimelineEntity>`

Primary files:

- `packages/engine/src/chat/state/timelineSlice.ts`
- `packages/engine/src/chat/state/selectors.ts`

### Existing debug surfaces

- `EventViewerWindow` (event stream, payload copy, YAML export):
  - `packages/engine/src/chat/debug/EventViewerWindow.tsx`
- Clipboard helper:
  - `packages/engine/src/chat/debug/clipboard.ts`
- YAML formatter:
  - `packages/engine/src/chat/debug/yamlFormat.ts`
- Syntax highlighter for code/YAML blocks:
  - `packages/engine/src/chat/debug/SyntaxHighlight.tsx`

### Window launch integration pattern

Inventory app already opens chat/event debug windows by `appKey` and window payload builders:

- `apps/inventory/src/App.tsx`

This should be reused for a new timeline-debug window type.

## Proposed Solution

Add a new `TimelineDebugWindow` focused on raw timeline state for one conversation.

### Functional requirements

1. Show raw conversation timeline state as expandable structured tree.
2. Per entity row/card:
- Copy entity payload to clipboard.
- Optional quick YAML preview.
3. Conversation-level actions:
- Copy entire conversation timeline snapshot.
- Export entire conversation timeline snapshot to YAML file.
4. Keep the view read-only.

### Data contract for the debug window

Build an explicit export/view model from Redux state at render-time:

```yaml
conversationId: <convId>
exportedAt: <iso>
summary:
  entityCount: <n>
  orderCount: <n>
  kinds:
    message: <n>
    tool_call: <n>
    ...
timeline:
  order: [...]
  entities:
    - id: <entity-id>
      orderIndex: <i>
      kind: <kind>
      createdAt: <ms>
      updatedAt: <ms|null>
      version: <number|null>
      props: <raw props object>
  byId: <optional exact map mirror for fidelity>
```

Recommendation: include `entities[]` as the primary operator-facing shape (stable, readable), and optionally include `byId` in full export for exact fidelity.

### UI layout recommendation

Top toolbar:

- `Copy Conversation`
- `Export YAML`
- optional `Refresh` (if we later move to manual snapshot mode)
- small summary counters

Body split:

- Left: entity list (`id`, `kind`, `index`, timestamp)
- Right: expandable structured tree for selected entity or whole conversation

Entity row actions:

- `Copy Entity`
- optional `Copy Entity Props`

Use `SyntaxHighlight` for fallback YAML block and/or for raw snippet panel.

## Structured Tree Rendering Strategy

Add a small recursive component for object/array traversal.

Suggested component:

- `packages/engine/src/chat/debug/StructuredDataTree.tsx`

Behavior:

- Expand/collapse each object/array node.
- Inline scalar rendering for primitives.
- Stable key path labels (`timeline.entities[3].props.content`).
- Max-depth guard and cycle guard in case non-plain objects appear.

Why not only YAML text:

- YAML text is good for export but poor for interactive drilling into nested branches.
- Expandable tree is faster for identifying malformed fields.

## Clipboard and Export Flows

### Clipboard

Reuse existing helper:

- `copyTextToClipboard(...)` from `packages/engine/src/chat/debug/clipboard.ts`

Add helper builders:

- `buildEntityYamlForCopy(entity, index, convId)`
- `buildConversationYamlForCopy(snapshot)`

### Export to YAML

Mirror `EventViewerWindow` download pattern:

- build YAML string with `toYaml(...)`
- create `Blob`
- create object URL
- trigger download via temporary anchor

File naming proposal:

- `timeline-<convId-safe>-<timestamp>.yaml`

### Serialization safety

Because timeline `props` are `unknown`, add sanitization before export/copy:

- handle cycles (`[Circular]` marker)
- handle non-JSON types (`Date`, `BigInt`, functions) conservatively
- keep structure and keys stable

## Integration Plan (Inventory App)

### Window payload and routing

In `apps/inventory/src/App.tsx`:

- add `buildTimelineDebugWindowPayload(convId)`
- add `appKey` route: `timeline-debug:<convId>`
- render `TimelineDebugWindow` for that `appKey`

### Entry points

- Add header action in `InventoryChatAssistantWindow` near `Events` and `Copy Conv ID`:
  - e.g. `🧱 Timeline`
- Optionally add menu command and desktop icon command, same style as `debug.event-viewer`.

## Detailed Implementation Plan

1. Build timeline snapshot helpers.
- File: `packages/engine/src/chat/debug/timelineDebugModel.ts`
- Inputs: `state.timeline.byConvId[convId]`
- Outputs: normalized snapshot with summary and ordered entities.

2. Build structured tree component.
- File: `packages/engine/src/chat/debug/StructuredDataTree.tsx`
- Recursive node UI with local expand-state map keyed by path.

3. Build `TimelineDebugWindow` component.
- File: `packages/engine/src/chat/debug/TimelineDebugWindow.tsx`
- Pull conversation state via `useSelector`.
- Wire copy/export actions.
- Show selected entity + full conversation tree.

4. Wire window launch in inventory app.
- File: `apps/inventory/src/App.tsx`
- Add payload builder, render route, header button, optional command/menu item.

5. Testing.
- model helper tests (snapshot shaping + sanitization):
  - `packages/engine/src/chat/debug/timelineDebugModel.test.ts`
- tree rendering tests (expand/collapse + scalar rendering):
  - `packages/engine/src/chat/debug/StructuredDataTree.test.tsx` (if jsdom setup exists) or helper-level tests
- export naming/content tests:
  - `packages/engine/src/chat/debug/TimelineDebugWindow.test.ts`

6. Storybook and manual validation.
- Story: `packages/engine/src/components/widgets/TimelineDebugWindow.stories.tsx` (or chat debug stories folder)
- Validate large payload rendering and copy/export UX.

## Design Decisions

### Decision 1: Separate window, not merged into Event Viewer

- Decision: create a dedicated timeline-state debug window.
- Rationale: event stream and reducer state are different debugging targets with different mental models.

### Decision 2: Reuse existing clipboard/YAML helpers

- Decision: reuse `copyTextToClipboard` and `toYaml` instead of new utility stack.
- Rationale: keeps behavior consistent across debug tools and reduces maintenance.

### Decision 3: Export full conversation snapshot by default

- Decision: export should capture the full conversation timeline snapshot, not only selected entity.
- Rationale: easier async support handoff; no hidden dependency on operator selection state.

### Decision 4: Keep read-only and local-first

- Decision: no mutation or replay controls in this ticket.
- Rationale: reduce risk; this ticket is for inspection/export only.

## Alternatives Considered

### Alternative A: Add a "timeline" tab inside `EventViewerWindow`

Rejected for now.

- Pros: fewer windows.
- Cons: overloaded UI, mixed concerns, larger component complexity.

### Alternative B: Add only conversation YAML text view (no tree)

Rejected.

- Pros: very quick to implement.
- Cons: poor navigation of nested fields, slower operator workflow.

### Alternative C: Depend on browser devtools only

Rejected.

- Pros: zero app code.
- Cons: not shareable with non-dev users, no one-click export/copy.

## Risks and Mitigations

1. Large timelines cause slow render.
- Mitigation: lazy-expand tree nodes; do not auto-expand deep branches.

2. Non-serializable props break export.
- Mitigation: sanitize with cycle/type guards before YAML conversion.

3. UI clutter in chat header.
- Mitigation: keep concise button label and optionally move to menu in small layouts.

4. Drift between rendered timeline and exported snapshot.
- Mitigation: derive both from same snapshot helper in one place.

## Validation Checklist

- Can open timeline debug view from chat window.
- Can inspect nested `props` for an entity with expand/collapse.
- `Copy Entity` copies expected YAML.
- `Copy Conversation` copies full snapshot YAML.
- `Export YAML` downloads file with expected name and schema.
- Works with empty conversation, suggestions-only, and mixed entity kinds.

## Open Questions

1. Should conversation export include `chatSession` metrics alongside `timeline`?
2. Should we include hidden/suppressed entities exactly as in store (including suggestions), or provide a toggle (`all` vs `renderable only`)?
3. Should export default to YAML only, or expose JSON as a second format in this ticket?

## References

- `apps/inventory/src/App.tsx`
- `packages/engine/src/chat/state/timelineSlice.ts`
- `packages/engine/src/chat/state/selectors.ts`
- `packages/engine/src/chat/debug/EventViewerWindow.tsx`
- `packages/engine/src/chat/debug/clipboard.ts`
- `packages/engine/src/chat/debug/yamlFormat.ts`
- `packages/engine/src/chat/debug/SyntaxHighlight.tsx`
- `packages/engine/src/chat/sem/timelineMapper.ts`
