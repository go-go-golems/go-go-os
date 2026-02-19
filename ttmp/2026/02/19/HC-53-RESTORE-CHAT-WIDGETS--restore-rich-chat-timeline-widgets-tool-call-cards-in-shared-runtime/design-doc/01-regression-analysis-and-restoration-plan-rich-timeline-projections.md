---
Title: 'Regression analysis and restoration plan: rich timeline projections'
Ticket: HC-53-RESTORE-CHAT-WIDGETS
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts
      Note: |-
        Regression tests for formatTimelineEntity mapping parity with timeline.upsert mapper
        Regression coverage for formatTimelineEntity mapping parity
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: |-
        Inventory chat window orchestration; restored renderWidget wiring and timeline display synthesis usage
        Restored ChatWindow renderWidget wiring and rich display message source
    - Path: apps/inventory/src/features/chat/runtime/timelineEntityRenderer.test.ts
      Note: |-
        Regression tests for per-round inline widget/card/timeline message synthesis
        Regression coverage for restored rich widget timeline behavior
    - Path: apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts
      Note: |-
        New timeline-entity to rich per-round widget message projection
        Introduced per-round TimelineEntity to inline widget message synthesis
    - Path: packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts
      Note: |-
        Shared formatTimelineEntity bridge from projected TimelineEntity into TimelineItemUpdate
        Added shared TimelineEntity formatter bridge for projection parity
ExternalSources: []
Summary: Deep analysis of when rich chat timeline widgets were removed during timeline-first extraction and how they were restored in the shared SEM projection architecture.
LastUpdated: 2026-02-19T08:00:00-05:00
WhatFor: Explain regression timeline and restoration architecture for rich chat timeline rendering
WhenToUse: Use when debugging chat projection behavior, reviewing HC-53 changes, or extending rich timeline/widget rendering
---


# Regression analysis and restoration plan: rich timeline projections

## Executive Summary

Between `5daf495` and current `HEAD`, rich inline chat widgets (run timeline panel, generated widgets panel, generated cards panel) were not removed in one single change; they were first made legacy by architectural direction, then functionally removed by state-model and rendering cutovers.

The critical regression point is `5141d98` (`refactor(inventory-chat): hard-cutover chat slice to timeline-first metadata`), which deleted the reducer-managed per-round widget message construction (including `inventory.timeline`, `inventory.widgets`, and `inventory.cards` message blocks). The visible symptom was amplified by `63e3a54` (`feat(inventory-chat): cut over chat rendering to timeline entity projection`), which replaced content-block rendering with `mapTimelineEntityToMessage` string output and removed `renderWidget` integration from `ChatWindow` usage.

The restoration implemented in HC-53 does not roll back to the old monolithic chat slice. Instead, it keeps timeline-first architecture and SEM projection as source of truth, then reintroduces rich UI by synthesizing inline widget messages from projected timeline entities at render time. Tool calls are no longer only “Tool X running/done” strings; they become structured `TimelineWidgetItem`s in round-scoped timeline widget cards, with raw payloads preserved for expandable debugging. Widget/card results again map to generated widget/card panels with artifact open/edit actions.

## Problem Statement

### User-visible regression

Observed behavior after extraction into shared engine/desktop packages:

1. Tool-call lifecycle output degraded from rich timeline rows to plain system strings.
2. Hypercard widget/card results rendered as simplified strings rather than interactive panel widgets.
3. Chat timeline no longer showed round-scoped inline widgets (`Run Timeline`, `Generated Widgets`, `Generated Cards`).
4. Expando metadata/raw payload visibility moved out of primary chat view experience.

### Why this matters

The rich timeline presentation is not cosmetic. It is operationally important because:

1. It compresses many SEM events into stable, upsertable rows keyed by tool/widget/card identity.
2. It preserves debug affordances (args/result payload inspection) without requiring separate debug windows.
3. It provides direct “Open artifact” / “Edit runtime card” affordances in context.
4. It maintains conversational chronology by associating generated artifacts with user turn rounds.

Without this layer, users receive less actionable, noisier, and less inspectable feedback, especially during multi-tool orchestration.

## Regression Timeline (Commit Archaeology)

### Baseline (`5daf495`, 2026-02-17T14:18:17-05:00)

`5daf495` predates chat runtime extraction changes. The inventory chat implementation still contained hand-authored, reducer-managed rich widget logic:

1. `chatSlice` owned `messages` with structured `content` blocks.
2. Per-round helper IDs existed (`timelineWidgetMessageId`, `cardPanelMessageId`, `widgetPanelMessageId`).
3. Reducers upserted `TimelineWidgetItem`s and mutated inline widget props.
4. `InventoryChatWindow` supplied `renderWidget` for `inventory.timeline` / `inventory.widgets` / `inventory.cards`.

### Engine extraction and SEM foundation (non-breaking to rich UI)

1. `a7ed70f` moved artifact/timeline tooling to engine package.
2. `a6d375a` introduced timeline core + SEM registry.
3. `984659e` added hydration/buffer replay flow.

These commits established new primitives but did not yet fully remove the rich rendering experience.

### Rendering cutover introduction (`63e3a54`, 2026-02-19T10:57:57+01:00)

`63e3a54` changed display source from chat-slice message list to timeline entities (`selectTimelineEntitiesForConversation`) and introduced `mapTimelineEntityToMessage` string rendering.

Important behavioral changes:

1. Non-message timeline entities (tool/status/tool_result/log) were flattened into plain text system messages.
2. `renderWidget` integration was removed from `ChatWindow` call site.
3. Rich widget blocks were not synthesized from timeline entities.

At this point, even if SEM events were complete, the UI path to render widgets in chat was gone.

### Structural deletion of old rich mechanism (`5141d98`, 2026-02-19T11:26:18+01:00)

`5141d98` removed the last fallback mechanism:

1. Deleted `messages`, `isStreaming`, `currentRoundId` from `chatSlice` conversation state.
2. Deleted `upsertTimelineItem`, `upsertWidgetPanelItem`, `upsertCardPanelItem` reducers.
3. Deleted helper functions that guaranteed per-round widget message blocks.
4. Reduced chat slice to metadata-only state (connection/suggestions/stats/errors).

This commit is where rich widget capability was substantively removed as a maintained behavior.

### Projection modularization preserved string-only output (`7784bd4`, `794ab77`)

1. `7784bd4` extracted projection adapters and moved entity mapping to `runtime/timelineEntityRenderer.ts`.
2. `794ab77` improved custom-kind prefixes for widget/card string rendering and registry behavior.

These improved projection hygiene, but the rendering remained text-first and not widget-first.

## Root Cause Analysis

The regression came from a mismatch between architectural migration and UI projection parity.

### Migration intent was valid

The move from ad-hoc local reducers to timeline-first projection is correct for maintainability and shared runtime reuse.

### Parity gap

During migration, the team retained semantic data (timeline entities + custom kinds) but dropped the transformation layer that rebuilt rich inline widget chat blocks.

### Precise gap location

The lost layer is not in transport or backend SEM events. It is in frontend projection-to-view adaptation:

1. We had `SemEnvelope -> TimelineEntity`.
2. We lacked `TimelineEntity[] -> ChatWindowMessage[] (with structured widget content blocks)`.

The old app had this implicitly in reducer mutation logic. The new architecture needed an explicit adapter stage; this stage was absent until HC-53.

## Proposed Solution

### Design goals

1. Keep timeline-first and shared SEM projection architecture.
2. Avoid reintroducing old reducer-heavy state mutation model.
3. Restore rich widget/card/tool timeline behavior in chat UI.
4. Preserve artifact open/edit affordances.
5. Keep projection logic testable and deterministic.

### Implemented architecture

#### 1) Shared formatter bridge in engine

Added `formatTimelineEntity(entity: TimelineEntity)` in `packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts`.

This maps projected timeline entities (tool_call, status, tool_result) into `TimelineItemUpdate` using existing `formatTimelineUpsert` semantics to avoid drift between hydrated `timeline.upsert` and live projected entity behavior.

#### 2) Rich display synthesis in inventory runtime

Implemented `buildTimelineDisplayMessages(timelineEntities)` in `apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts`.

Behavior:

1. Walks projected timeline entities in timeline order.
2. Tracks active round (incremented on user messages).
3. Converts non-message entities via `formatTimelineEntity` into `TimelineWidgetItem` rows.
4. Buckets rows by round + panel group:
   - `timeline` for tool/timeline rows
   - `widgets` for hypercard widget lifecycle results
   - `cards` for hypercard card lifecycle results
5. Emits synthetic system messages containing widget content blocks:
   - `inventory.timeline` -> `Run Timeline (round N / Previous Session)`
   - `inventory.widgets` -> `Generated Widgets (...)`
   - `inventory.cards` -> `Generated Cards (...)`
6. Maintains upsert semantics by item ID and sorts by `updatedAt` descending.

#### 3) Restore ChatWindow inline widget rendering

In `apps/inventory/src/features/chat/InventoryChatWindow.tsx`:

1. Switched message source from `timelineEntities.map(mapTimelineEntityToMessage)` to `buildTimelineDisplayMessages(timelineEntities)`.
2. Restored `renderWidget` callback and wiring into `<ChatWindow renderWidget={...} />`.
3. Wired widget renderer to:
   - `InventoryTimelineWidget`
   - `InventoryGeneratedWidgetPanel`
   - `InventoryCardPanelWidget`
4. Reattached artifact actions:
   - `buildArtifactOpenWindowPayload` + `openWindow`
   - `openRuntimeCardCodeEditor` for generated runtime cards.

### Why this fits the new architecture

1. Timeline store remains source of truth.
2. Chat slice stays metadata-only (no revert to old reducer model).
3. Rich rendering becomes pure projection/view adapter logic.
4. Shared engine owns canonical entity->item semantics; app owns app-specific panel wiring/actions.

## Design Decisions

### Decision 1: Do not reintroduce old `chatSlice` widget reducers

Rationale:

1. Would duplicate timeline source-of-truth data.
2. Would re-open sync divergence risks between timeline and chat message state.
3. Contradicts timeline-first migration direction.

### Decision 2: Add `formatTimelineEntity` in engine instead of duplicating parser logic in app

Rationale:

1. Guarantees parity with existing timeline-upsert conversion behavior.
2. Keeps semantically sensitive mapping logic centralized.
3. Reduces app-level drift when SEM payloads evolve.

### Decision 3: Keep `renderWidget` app-local

Rationale:

1. Artifact actions are app-contextual (open inventory artifact windows, card editor integration).
2. Shared engine should not hardcode inventory runtime store assumptions.

### Decision 4: Round projection as render-time derivation

Rationale:

1. No extra persisted state required.
2. Deterministic from timeline event order.
3. Supports “Previous Session” for pre-user replay/hydrated items.

## Alternatives Considered

### Alternative A: Full rollback to pre-timeline `chatSlice` message model

Rejected:

1. Regresses architecture simplification.
2. Reintroduces state duplication and reducer complexity.
3. Harder to keep in sync with shared engine timeline semantics.

### Alternative B: Keep text-only rendering and rely on Event Viewer for details

Rejected:

1. Loses in-context UX and actionability.
2. Fails parity with expected tool/widget/card chat workflow.
3. Increases cognitive load for routine operations.

### Alternative C: Move all widget-render synthesis into shared engine UI layer

Deferred:

1. Engine can provide neutral conversion primitives (`formatTimelineEntity`) now.
2. Final widget composition remains app-specific due artifact/card action wiring.
3. Future generic hook is possible after additional app-agnostic abstraction work.

## Implementation Plan

### Completed in HC-53

1. Added `formatTimelineEntity` bridge in engine timeline projection utilities.
2. Implemented per-round rich widget message synthesis from timeline entities.
3. Restored inline widget rendering in inventory chat window.
4. Re-wired artifact open/edit flows for restored panel widgets.
5. Added regression tests for:
   - timeline-entity custom kind mapping
   - per-round widget/card/timeline synthesis behavior
6. Validated with:
   - `npx vitest run apps/inventory/src/features/chat/runtime/timelineEntityRenderer.test.ts apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts`
   - `npm run typecheck`

### Follow-up (optional, future)

1. Promote `buildTimelineDisplayMessages` pattern into an engine-level configurable helper for multi-app reuse.
2. Add end-to-end Storybook/interaction tests that assert rich widget rendering from realistic SEM event streams.
3. Consider replay/hydration mode parity defaults (`hydrate: true/false`) depending on desired startup behavior.

## Open Questions

1. Should round segmentation include explicit server-side round IDs instead of deriving from user-message boundaries?
2. Should generic status/log entities remain textual alongside widget panels, or be fully folded into timeline widget rows?
3. Should `formatTimelineEntity` eventually absorb richer typing for `tool_result.result` payload contracts?

## References

1. `5daf495` — baseline before timeline-first and slice hard-cutover.
2. `63e3a54` — introduced timeline-entity text mapping + removed inline widget render path.
3. `5141d98` — removed reducer-managed rich widget/card timeline message infrastructure.
4. `7784bd4` / `794ab77` — modularized projection and improved custom-kind handling, but remained string-render focused.

## Detailed Commit Matrix

This matrix records the high-signal commits between `5daf495` and `HEAD` that changed chat projection behavior, with focus on whether each commit preserved, degraded, or restored rich timeline widget behavior.

### Commit-by-commit impact

1. `cf09373` (`refactor(inventory-chat): centralize shared sem parsing helpers`)
   - Nature: internal helper cleanup.
   - Behavior impact: neutral.
   - Rich timeline/widget parity impact: none.
2. `a7ed70f` (`feat(HC-50): hard-cutover chat artifact tooling into engine subsystem`)
   - Nature: extraction into shared engine package.
   - Behavior impact: mostly neutral but changed ownership boundaries.
   - Rich timeline/widget parity impact: latent risk introduced (adapter responsibilities moved).
3. `a6d375a` (`feat(hypercard-chat): add timeline core and sem registry foundation`)
   - Nature: timeline store + SEM abstraction.
   - Behavior impact: enabled normalized entity projection path.
   - Rich timeline/widget parity impact: not inherently regressive, but created migration step where parity layer needed explicit port.
4. `984659e` (`feat(inventory-chat): add hydrate-buffer-replay session flow and raw ingress emission`)
   - Nature: replay/hydration handling.
   - Behavior impact: better ordering and debug capture.
   - Rich timeline/widget parity impact: neutral/positive infrastructure-wise.
5. `63e3a54` (`feat(inventory-chat): cut over chat rendering to timeline entity projection`)
   - Nature: rendering model cutover.
   - Behavior impact: major.
   - Rich timeline/widget parity impact: degraded output to text-only for tool/status/result entities; removed `renderWidget` use.
6. `5141d98` (`refactor(inventory-chat): hard-cutover chat slice to timeline-first metadata`)
   - Nature: structural hard-cutover of chat slice.
   - Behavior impact: removed message/widget reducers and round tracking.
   - Rich timeline/widget parity impact: capability effectively removed.
7. `7784bd4` (`feat(chat-runtime): add pluggable projection adapters for inventory chat`)
   - Nature: projection modularization.
   - Behavior impact: cleaner runtime layering.
   - Rich timeline/widget parity impact: still text-only display (no rich synthesis).
8. `794ab77` (`fix(chat-projection): handle hypercard widget/card SEM events and ignore timeline.upsert`)
   - Nature: projection correctness fix.
   - Behavior impact: better custom-kind mapping.
   - Rich timeline/widget parity impact: strings improved, rich widgets still absent.
9. `5f02377` (`engine: support llm.thinking.summary ...`)
   - Nature: additional event type support.
   - Behavior impact: unrelated to widget panel restoration.
   - Rich timeline/widget parity impact: neutral.

### Conclusion from matrix

The regression was introduced by architecture migration steps where view-layer synthesis parity was omitted. No evidence suggests backend event schema removed data required for rich rendering; the missing piece was conversion + rendering assembly in frontend runtime.

## Dataflow Mapping Before vs After HC-53

### Pre-regression rich path (historical)

1. SEM events entered `InventoryChatWindow` and were interpreted ad hoc.
2. Reducers in `chatSlice` mutated `messages` with structured widget content blocks.
3. `ChatWindow` rendered these blocks via `renderWidget` callback.
4. Widget components (`InventoryTimelineWidget`, panel widgets) surfaced tool/widget/card status and artifact actions.

### Regressed path before HC-53

1. SEM events projected into timeline entities via registry/pipeline.
2. UI mapped each entity to plain text message (`mapTimelineEntityToMessage`).
3. `renderWidget` was absent from chat callsite.
4. Tool/widget/card lifecycle semantics were visually flattened.

### Restored path in HC-53

1. SEM events projected into timeline entities (unchanged, timeline-first).
2. `formatTimelineEntity` bridges timeline entity shape into canonical timeline item semantics.
3. `buildTimelineDisplayMessages` synthesizes round-scoped inline widget messages at render time.
4. `ChatWindow` renders structured blocks through restored `renderWidget` callback.
5. Artifact open/edit capabilities reattached using artifact runtime metadata.

### Why this is an architectural improvement over historical implementation

1. Source-of-truth remains singular (timeline store).
2. View synthesis is pure and deterministic from timeline entities.
3. No mutable duplication of message content and timeline rows in separate reducers.
4. Canonical semantic mapping for tool/status/result is shared in engine utilities.

## File-Level Diff Narrative

### `apps/inventory/src/features/chat/InventoryChatWindow.tsx`

- Before HC-53 (current pre-fix state):
  - Display path: `timelineEntities -> mapTimelineEntityToMessage -> text`.
  - No inline widget rendering callback provided to `ChatWindow`.
- After HC-53:
  - Display path: `timelineEntities -> buildTimelineDisplayMessages -> mixed text + widget blocks`.
  - `renderWidget` restored and wired to timeline/card/widget panel components.
  - Artifact open/edit logic moved into callback-driven widget rendering path.

### `apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts`

- Added new central behavior:
  - Round inference from user messages.
  - Grouped upsert maps for timeline/widgets/cards.
  - Synthetic rich messages with stable IDs (`...-rN`).
  - Metadata-preserving `TimelineWidgetItem` generation from timeline entities.

### `packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts`

- Added `formatTimelineEntity`:
  - Adapts projected entity shape (`entity.kind`, `entity.props`) to existing `formatTimelineUpsert` semantics.
  - Ensures one mapping policy for both hydrated `timeline.upsert` payloads and live projected entities.

## Behavioral Guarantees Added by HC-53

1. **Round-scoped widget containers are deterministic**
   - Events before first user message map to `Previous Session`.
   - Each user message increments round bucket target.
2. **Upsert semantics preserved**
   - Rows update by ID, not append-only duplicates.
   - Latest status/detail is reflected for same tool/widget/card identity.
3. **Tool-call visibility restored in structured form**
   - Tool args/results appear in timeline rows with raw payload metadata.
4. **Hypercard custom-kind results route to correct panel**
   - `hypercard.widget.v1` => generated widget panel
   - `hypercard.card.v2` => generated card panel
5. **Actionability restored**
   - Artifact open window path restored.
   - Runtime card code editor launch restored for generated cards.

## Risk Assessment

### Functional risks

1. Round inference may differ from historical reducer `currentRoundId` behavior in unusual stream order scenarios.
2. Very large sessions may stress in-memory sorting each render; capped list sizes mitigate growth per panel.
3. If future event contracts change field names in projected props, `formatTimelineEntity` must be updated to preserve parity.

### Mitigations

1. Added tests for round-0/round-1 behavior and custom-kind mappings.
2. Capped panel item counts (`24` for timeline, `16` for panel groups).
3. Shared formatter centralizes schema adaptation in one location.

## Validation Playbook

Use this sequence to verify behavior during review:

1. Run targeted tests:
   - `npx vitest run apps/inventory/src/features/chat/runtime/timelineEntityRenderer.test.ts apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts`
2. Run typecheck:
   - `npm run typecheck`
3. Manual UI verification (recommended):
   - open inventory app chat window
   - run a prompt that triggers tool call + widget/card generation
   - verify:
     - `Run Timeline (round N)` appears
     - `Generated Widgets (...)` and/or `Generated Cards (...)` appears
     - `Open` button launches artifact window
     - `Edit` button appears for generated cards with runtime card code
4. Debug verification:
   - toggle debug mode in chat header
   - confirm message IDs/status still prepended without destroying widget content blocks.

## Extension Guidance

If this behavior should become cross-app framework behavior, the next extraction step should be:

1. Move `buildTimelineDisplayMessages` to engine as a configurable adapter builder.
2. Keep app hooks for artifact action resolution and widget renderer composition.
3. Add engine-level contract tests for multi-round segmentation and mixed custom-kind streams.

This would keep shared semantics centralized while allowing app-level affordances to stay pluggable.
