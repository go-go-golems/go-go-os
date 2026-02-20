---
Title: Diary
Ticket: HC-01-EXTRACT-WEBCHAT
Status: active
Topics: []
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/sem/registry.ts
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/sem/timelineMapper.ts
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/ws/wsManager.ts
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
    - Path: apps/inventory/src/features/chat/chatSlice.ts
    - Path: apps/inventory/src/features/chat/timelineProjection.ts
    - Path: apps/inventory/src/features/chat/webchatClient.ts
    - Path: packages/engine/src/components/widgets/ChatWindow.tsx
    - Path: packages/engine/src/index.ts
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/changelog.md
      Note: Recorded plan direction change
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/design-doc/01-implementation-plan-extract-webchat-to-engine.md
      Note: Updated Phase 4 direction to renderer-only ChatWindow
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/tasks.md
      Note: Aligned task 4.1 with renderer-only conversion
ExternalSources: []
Summary: Implementation diary for HC-01 webchat extraction from inventory app into engine package
LastUpdated: 2026-02-20T00:00:00Z
WhatFor: Track exploration, decisions, and implementation progress
WhenToUse: Reference during implementation and code review
---


# Diary

## Goal

Track the exploration, planning, and implementation of extracting the webchat subsystem from `apps/inventory/src/features/chat/` into `packages/engine/src/chat/` and `packages/engine/src/hypercard/`, aligning with the pinocchio web-chat architecture (SEM registry, timeline entities, renderer registry).

---

## Step 1: Codebase Exploration and Architecture Mapping

Explored all three codebases in parallel to understand the current state and map the refactoring surface. The goal was to verify the ChatGPT Pro analysis against actual code, identify precise file/symbol references, and discover any discrepancies or additional considerations the analysis missed.

The exploration confirmed the analysis is accurate in its high-level assessment. The inventory chat code is a self-contained 22-file subsystem under `apps/inventory/src/features/chat/` that implements its own bespoke SEM handling, timeline projection, and message rendering -- all of which duplicate (less cleanly) what pinocchio already implements via `semRegistry`, `timelineSlice`, `wsManager`, and `rendererRegistry`.

### Prompt Context

**User prompt (verbatim):** "Work on docmgr ticket HC-01-EXTRACT-WEBCHAT which we are going to use to cleanup up the hypercard / inventory app. We have an analysis and refactoring plan provided by our esteemed colleague in Read the chatgpt pro analysis document in the ticket. Then inspect the codebase and create an implementation plan document that contains more detail, references to files and symbols. Store the implementation plan (which should not contain actual code) into the ticket, and create tasks in the ticket to implement it. Keep a diary as you explore the codebase and write the doc."

**Assistant interpretation:** Read the ChatGPT Pro refactoring plan, explore all three codebases (inventory chat, engine package, pinocchio web-chat), then produce a detailed implementation plan with file/symbol references and create docmgr tasks.

**Inferred user intent:** Get a concrete, actionable implementation plan that bridges the gap between the high-level ChatGPT Pro analysis and actual code changes, with trackable tasks.

### What I did

1. Read all ticket documents: `index.md`, `README.md`, `tasks.md`, `changelog.md`, and `sources/local/chatgpt-pro-webchat-cleanup.md`
2. Explored `apps/inventory/src/features/chat/` (22 files) -- mapped every export, import, Redux slice, component, and SEM handler
3. Explored `packages/engine/src/` -- mapped store factory, ChatWindow component, windowing adapter pattern, barrel exports
4. Located pinocchio source at `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/` (accessible via go.work)
5. Read pinocchio key files: `sem/registry.ts`, `ws/wsManager.ts`, `webchat/rendererRegistry.ts`, `sem/timelineMapper.ts`, `sem/timelinePropsRegistry.ts`, `store/timelineSlice.ts`, `webchat/types.ts`
6. Read inventory store setup (`apps/inventory/src/app/store.ts`) and App.tsx window routing

### Why

Need precise file paths, symbol names, state shapes, and architectural patterns to produce an implementation plan that can be followed without ambiguity.

### What worked

- Parallel exploration of all three codebases gave a complete picture quickly
- The ChatGPT Pro analysis maps accurately to actual code -- file names and module boundaries are correct
- Pinocchio source is directly accessible in the workspace via go.work, making copy/adapt feasible

### What didn't work

- N/A (exploration phase only)

### What I learned

**Inventory chat architecture (current):**
- `chatSlice.ts` (627 lines) is the central state manager with `ConversationState` keyed by `conversationId`. It stores: `messages: ChatWindowMessage[]`, `connectionStatus`, `isStreaming`, `suggestions`, `modelName`, `currentTurnStats`, and three inline widget arrays per round (timeline, cards, widgets)
- `InventoryChatWindow.tsx` (778 lines) is the monolithic orchestrator: owns WS lifecycle, SEM dispatch (big `if/else` chain in `onSemEnvelope`), artifact extraction, runtime card registration, timeline snapshot hydration, and inline widget rendering
- `webchatClient.ts` is a simple WS + fetch client with no buffering, no seq tracking, no hydration gating
- `timelineProjection.ts` handles `timeline.upsert` by parsing entity kinds (tool_call, status, tool_result) into `TimelineWidgetItem` updates
- `artifactRuntime.ts` extracts artifact records from SEM events and builds window open payloads

**Pinocchio web-chat architecture (target):**
- `sem/registry.ts` -- clean handler map with `registerSem(type, handler)` + `handleSem(envelope, dispatch)`. All handlers use protobuf decode (`@bufbuild/protobuf`) and dispatch `timelineSlice.actions.upsertEntity/addEntity`
- `ws/wsManager.ts` -- robust WS with nonce-based connection identity, hydration gating (buffers WS frames until HTTP snapshot applied), seq-based dedup, and protobuf snapshot decode
- `store/timelineSlice.ts` -- entities stored as `{ byId, order }` with version-gated upserts (incoming version < existing version = skip). Single-conversation scoped (needs adaptation)
- `webchat/rendererRegistry.ts` -- simple `builtinRenderers` map + `extensionRenderers` Map, resolved via `resolveTimelineRenderers()`. Renderers are `React.ComponentType<{ e: RenderEntity }>`
- `sem/timelinePropsRegistry.ts` -- extensible props normalizer per entity kind
- `webchat/types.ts` -- `RenderEntity = { id, kind, props, createdAt, updatedAt? }` is the universal render contract

**Engine package (destination):**
- `ChatWindow.tsx` renders `ChatWindowMessage[]` with `renderWidget` callback for inline widgets. This needs to evolve to render `RenderEntity[]` via a renderer registry
- `createAppStore()` accepts domain reducers, already supports chat and artifacts as app-level slices
- Windowing uses an adapter chain pattern (`WindowContentAdapter`) that is conceptually similar to the renderer registry
- Barrel exports are comprehensive; new chat modules just need to be added to `index.ts`

**Key discrepancies / additions to the ChatGPT Pro analysis:**
1. The analysis mentions `pinocchio/.../sem/semRegistry.ts` but the actual file is `sem/registry.ts` (no "sem" prefix)
2. The analysis doesn't mention that pinocchio's `wsManager` has a sophisticated nonce-based connection identity system and seq-based buffered replay -- this is a significant piece of robustness the inventory client lacks entirely
3. The `chatSlice` stores inline widgets in three separate arrays per round (`timelineWidgetItems`, `cardPanelItems`, `widgetPanelItems`) within each message. This "widget-per-round" pattern needs careful rethinking when moving to entity-based timeline
4. The analysis correctly identifies that pinocchio's timeline is single-conversation. The conversation-scoping adaptation is the single biggest structural change needed
5. Pinocchio uses `@bufbuild/protobuf` for SEM decode; inventory uses raw JSON field extraction (`semHelpers.ts`). The plan needs to decide: adopt protobuf decode in engine or keep JSON extraction? Both work since the backend emits JSON over WS

### What was tricky to build

N/A (exploration only)

### What warrants a second pair of eyes

1. **Conversation-scoped timeline state**: The adaptation from pinocchio's global `{ byId, order }` to `{ byConvId: { [id]: { byId, order } } }` affects every selector and every SEM handler's dispatch call. This is the riskiest structural change.
2. **Entity identity convergence**: Inventory uses `tool:${toolId}`, `widget:${itemId}`, `card:${itemId}` while pinocchio uses `ev.id` or `${ev.id}:result`. The timeline.upsert reconciliation depends on these converging.
3. **ChatWindow API change**: Moving from `messages: ChatWindowMessage[]` to `entities: RenderEntity[]` is a breaking change to the widget. Need to decide: new component, or backwards-compatible dual mode?

### What should be done in the future

- Write detailed implementation plan with file-level change specifications
- Create docmgr tasks for each implementation step
- Decide on protobuf vs JSON extraction strategy

### Code review instructions

No code changes in this step. Review the exploration findings above against the codebase to verify accuracy.

### Technical details

**Inventory chat file inventory (22 files):**
```
apps/inventory/src/features/chat/
  chatSlice.ts              (627 loc, Redux slice, 20+ actions)
  InventoryChatWindow.tsx   (778 loc, monolithic orchestrator)
  timelineProjection.ts     (213 loc, SEM -> timeline item mapping)
  InventoryTimelineWidget.tsx (270 loc, timeline display component)
  InventoryArtifactPanelWidgets.tsx (235 loc, card/widget panels)
  EventViewerWindow.tsx     (223 loc, debug event viewer)
  RuntimeCardDebugWindow.tsx (206 loc, runtime card debugger)
  webchatClient.ts          (199 loc, WS + HTTP client)
  CodeEditorWindow.tsx      (185 loc, CodeMirror editor)
  artifactRuntime.ts        (150 loc, artifact extraction)
  eventBus.ts               (107 loc, per-conv event pub/sub)
  artifactsSlice.ts         (94 loc, Redux slice)
  utils/SyntaxHighlight.tsx (86 loc, code highlighting)
  utils/yamlFormat.ts       (87 loc, JSON->YAML display)
  semHelpers.ts             (69 loc, field extraction utils)
  selectors.ts              (46 loc, Redux selectors)
  editorLaunch.ts           (41 loc, editor window launcher)
  artifactsSelectors.ts     (15 loc, Redux selectors)
  + 4 test files, 7 story files
```

**Pinocchio key type: TimelineEntity**
```typescript
// pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts
type TimelineEntity = {
  id: string; kind: string; createdAt: number;
  updatedAt?: number; version?: number; props: any;
};
```

**Pinocchio key type: RenderEntity**
```typescript
// pinocchio/cmd/web-chat/web/src/webchat/types.ts
type RenderEntity = {
  id: string; kind: string; props: any;
  createdAt: number; updatedAt?: number;
};
```

**Inventory store wiring (apps/inventory/src/app/store.ts):**
```typescript
createAppStore({
  inventory: inventoryReducer,
  sales: salesReducer,
  artifacts: artifactsReducer,  // from features/chat/artifactsSlice
  chat: chatReducer,            // from features/chat/chatSlice
});
```

**Inventory window routing (apps/inventory/src/App.tsx):**
```
inventory-chat:{convId}  -> InventoryChatWindow
event-viewer:{convId}    -> EventViewerWindow
runtime-card-debug       -> RuntimeCardDebugWindow
code-editor:{cardId}     -> CodeEditorWindow
redux-perf-debug         -> ReduxPerfWindow
```

---

## Step 2: Implementation Plan and Task Creation

Wrote a comprehensive implementation plan document (`design-doc/01-implementation-plan-extract-webchat-to-engine.md`) with 8 phases, 6 architectural decisions, and precise file/symbol references mapping every inventory file to its engine destination. Also created 45 granular tasks in `tasks.md` organized by phase.

The plan captures decisions the ChatGPT Pro analysis left as options: SemContext approach (Option A), conversation-scoped state, new ChatConversationWindow (rather than breaking ChatWindow API), protobuf decode in engine, and the entity identity convergence strategy. Each phase is designed to land independently with a working system.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Produce the implementation plan and task list as docmgr artifacts.

**Inferred user intent:** Have a reviewable, actionable plan with trackable tasks before any code is written.

### What I did

1. Created design-doc via `docmgr doc add --doc-type design-doc --title "Implementation Plan: Extract Webchat to Engine"`
2. Wrote 8-phase implementation plan with:
   - 6 key architectural decisions with rationale
   - Precise source -> target file mappings for every module
   - Symbol-level references (function names, type names, line numbers)
   - Verification criteria for each phase
3. Created 45 granular tasks in `tasks.md` organized by phase
4. Updated diary with this step

### Why

The ChatGPT Pro analysis provides a good high-level roadmap but lacks the precision needed to start coding: no exact file paths to pinocchio source, no line numbers, no symbol names, and several decisions left as open options. This plan resolves all of those.

### What worked

- The three-codebase exploration in Step 1 provided all the context needed to write the plan without going back to read more files
- docmgr's document structure (design-doc, reference, tasks) maps well to the artifacts needed

### What didn't work

N/A

### What I learned

- The plan has 45 tasks across 8 phases. Phases 1-2 (foundation) are the highest risk since they establish the conversation-scoped timeline pattern that everything else builds on.
- Phase 7 (delete inventory chat) is the most satisfying but depends on all prior phases.
- The open questions (proto ownership, module registration timing, CodeMirror bundle weight) should be resolved before starting Phase 3.

### What was tricky to build

The implementation plan needed to balance two tensions: (1) following pinocchio's architecture closely enough to converge, and (2) adapting it for hypercard's multi-conversation requirement. The conversation-scoping adaptation touches nearly every copied file and cannot be deferred.

### What warrants a second pair of eyes

The 6 architectural decisions should be reviewed before implementation begins, especially Decision 3 (ChatWindow slot extension vs new component) since it affects the engine's public API.

### What should be done in the future

Begin Phase 1 implementation.

### Code review instructions

No code in this step. Review the implementation plan at `design-doc/01-implementation-plan-extract-webchat-to-engine.md` and the task list at `tasks.md`.

---

## Step 3: Phase 4 Plan Direction Change (Renderer-Only ChatWindow)

Updated the implementation plan direction for Phase 4 so `ChatWindow` no longer keeps any legacy message rendering path. This turns `ChatWindow` into a pure shell component while message behavior is preserved in timeline renderers, especially `MessageRenderer`.

The change was applied directly to both the design doc and task list to keep execution unambiguous before coding continues. This avoids a dual-mode migration and enforces the entity-first architecture from this point onward.

### Prompt Context

**User prompt (verbatim):** "Update the plan for phase 4 to remove all the existings messages functionality from ChatWindow, and instead to preserve the functionality in the MessageRenderer and other renderers."

**Assistant interpretation:** Revise the implementation plan and tasks so Phase 4 removes message-mode `ChatWindow` behavior and relies entirely on renderer modules.

**Inferred user intent:** Eliminate mixed architecture complexity and ensure a single rendering path based on timeline entities and renderer registry.

### What I did

1. Updated Decision 3 in `design-doc/01-implementation-plan-extract-webchat-to-engine.md` to explicitly remove `messages` mode from `ChatWindow`
2. Rewrote the Phase 4 section title/goal to "Renderer-Only Conversion"
3. Updated the Phase 4 step breakdown to require `timelineContent` and remove backwards-compatibility shims
4. Updated task **4.1** in `tasks.md` to reflect the renderer-only conversion
5. Added changelog entry for this plan update

### Why

Keeping both legacy message rendering and entity rendering in `ChatWindow` would duplicate behavior and create two codepaths to test and maintain. The renderer-only direction keeps ownership clear: shell in `ChatWindow`, content behavior in renderers.

### What worked

- The plan/task changes were localized to Decision 3 and Phase 4, so the update was fast and unambiguous
- Existing Phase 3 renderer tasks already capture most needed behavior migration, so no extra phase was required

### What didn't work

- N/A

### What I learned

- The original plan still carried a backwards-compatibility assumption from the pre-change direction
- Converting this at the plan level now is lower risk than changing direction mid-implementation in Phase 4

### What was tricky to build

The tricky part was preserving the same UX behaviors (role labels, streaming cursor, thinking state) while removing the component that currently renders them. The mitigation is to make those behaviors explicit acceptance criteria for `MessageRenderer` and the renderer registry path.

### What warrants a second pair of eyes

- Review that all Phase 4 wording now consistently removes legacy `messages` mode
- Confirm Phase 3 renderer tasks are sufficient to preserve current ChatWindow behavior without hidden coupling

### What should be done in the future

- Keep implementing Phase 1 tasks in order, then carry this renderer-only constraint into Phase 3/4 code changes

### Code review instructions

- Review `design-doc/01-implementation-plan-extract-webchat-to-engine.md` (Decision 3 + Phase 4)
- Review `tasks.md` task **4.1** and Phase 4 heading
- Review `changelog.md` latest entry for decision traceability

### Technical details

- Decision rename: from "ChatWindow Slot Extension" to renderer-only conversion
- API direction: remove `messages` prop path, require `timelineContent: ReactNode`
- Behavior ownership: message rendering logic moves into `MessageRenderer` and companion renderers
