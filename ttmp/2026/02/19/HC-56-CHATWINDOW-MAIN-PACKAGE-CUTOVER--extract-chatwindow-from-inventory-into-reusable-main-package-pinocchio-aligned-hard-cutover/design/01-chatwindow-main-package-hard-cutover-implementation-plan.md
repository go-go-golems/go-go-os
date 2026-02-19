---
Title: HC-56 Implementation Plan - Extract ChatWindow Runtime to Reusable Main Package (Hard Cutover)
Ticket: HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - webchat
    - timeline
    - cleanup
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/01-regression-analysis-and-restoration-plan-rich-timeline-projections.md
      Note: Root-cause timeline for rich widget regression and recovered behavior requirements
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/02-generic-chatwindow-and-hypercard-renderer-pack-architecture.md
      Note: Architecture proposal for reusable runtime and renderer-pack extraction
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md
      Note: Canonical HC-53 playbook with V2/open-kind and registration invariants
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/design/01-clean-cutover-implementation-plan-timelineentityv2.md
      Note: Completed hard-cut sequence and acceptance criteria reused here
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/ttmp/2026/02/19/01-pinocchio-webchat-flow-custom-renderers-and-widget-switching.md
      Note: Pinocchio architecture reference for extensible renderer and projection registration
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/01-building-a-middleware-with-renderer.md
      Note: Foundation tutorial for feature module registration and renderer dispatch
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md
      Note: End-to-end tutorial for backend/frontend custom timeline kind integration
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md
      Note: Canonical standalone chat shell design for websocket, hydration, and timeline rendering
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/02-webchat-getting-started.md
      Note: Quickstart for bootstrapping webchat routes and frontend wiring
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/03-thirdparty-webchat-playbook.md
      Note: Embedding/integration playbook for reusable chat UI consumption outside cmd/web-chat
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/ws/wsManager.ts
      Note: Websocket lifecycle, hydration ordering, and replay buffering reference
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/sem/registry.ts
      Note: Default SEM registration and timeline.upsert ingestion reference
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/sem/timelineMapper.ts
      Note: Entity normalization contract from SEM upsert payloads to frontend timeline entities
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx
      Note: Main chat shell composition and runtime initialization ordering
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/webchat/components/Timeline.tsx
      Note: Timeline render loop and entity-card dispatch behavior reference
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts
      Note: Generic renderer registration API for custom timeline entities
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts
      Note: Kind-normalizer registry for custom timeline entity props
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Inventory integration host where reusable runtime extraction boundary starts
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts
      Note: Current app-owned adapters to split into generic and app-only seams
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx
      Note: Existing reusable render shell and primary target for further extraction/generalization
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts
      Note: TimelineEntity-to-ChatWindowMessage synthesis to formalize as reusable policy module
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts
      Note: Current projected connection hook to evolve into app-agnostic runtime connector
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts
      Note: Registry seam for renderer dispatch and extensible widget ownership
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx
      Note: Self-contained Hypercard widget pack bootstrap pattern to preserve and harden
ExternalSources: []
Summary: Deep technical implementation specification for hard-cut extraction of inventory chat runtime into a reusable package, including API contracts, lifecycle flow, migration steps, test matrix, and strict legacy deletion gates.
LastUpdated: 2026-02-19T23:36:00-05:00
WhatFor: Provide an implementation-grade, no-backcompat blueprint for ChatWindow runtime extraction and reusable module ownership.
WhenToUse: Use while implementing HC-56 and during architecture/code review to verify strict cutover compliance and prevent reintroduction of inventory-local orchestration.
---

# HC-56 Implementation Plan - Extract ChatWindow Runtime to Reusable Main Package (Hard Cutover)

## 1. Executive Intent and Hard Constraints

HC-56 is a clean-cut extraction ticket. The desired end state is not "another layer on top of inventory chat", it is a strict ownership transfer where reusable chat runtime behavior lives in shared package code and inventory is only a host adapter.

The required final architecture aligns with pinocchio `cmd/web-chat` patterns:

1. explicit bootstrap registration for extension points,
2. timeline-upsert-driven durable UI state,
3. renderer dispatch through registries,
4. app-owned business callbacks isolated at the integration boundary.

Non-negotiable constraints:

1. no compatibility path for old inventory-owned runtime glue,
2. no feature flags that preserve dual behavior,
3. no hidden registration via side effects,
4. no fallback to "tool_result/customKind" hacks for Hypercard widget/card rendering,
5. no direct raw websocket-to-UI rendering shortcuts.

This document intentionally specifies file-level changes, API-level contracts, sequencing, validation gates, and grep-level deletion checks so implementation can be executed without architectural drift.

## 2. Current Architecture Baseline (As of 2026-02-20)

### 2.1 Current runtime composition

In practical terms the system already has partial extraction:

1. `TimelineChatWindow` (`packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx`) renders timeline-derived messages in `ChatWindow`.
2. `useProjectedChatConnection` (`packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`) wires client callbacks to projection pipeline.
3. `buildTimelineDisplayMessages` (`packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts`) synthesizes inline widget messages per round.
4. `inlineWidgetRegistry` (`packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts`) supports kind-based renderer registration.
5. `registerHypercardWidgetPack` (`packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`) provides a pack bootstrap pattern.

Inventory still owns orchestration responsibility:

1. constructing client via `InventoryWebChatClient`,
2. selecting timeline entities and metadata,
3. binding adapter list (`createChatMetaProjectionAdapter`, `createInventoryArtifactProjectionAdapter`),
4. binding domain actions (artifact open, card edit, event viewer).

This means extraction is partially done but not yet cleanly factored as a stable reusable main package API.

### 2.2 End-to-end signal path today

```text
WS frame
  -> InventoryWebChatClient
  -> useProjectedChatConnection(onEnvelope)
  -> projectSemEnvelope
  -> SemRegistry.handle
  -> timelineSlice upsert/add
  -> projection adapters side effects
  -> selectTimelineEntities
  -> buildTimelineDisplayMessages
  -> renderInlineWidget(widget.type)
  -> Hypercard widget renderer
```

The technical issue is not capability. The issue is boundary discipline and API composition.

### 2.3 What remains coupled

Residual coupling points that HC-56 must remove:

1. inventory component performs runtime composition directly instead of consuming a reusable runtime factory/provider,
2. app-level adapter wiring is not split into generic vs app-only contracts,
3. widget namespace/registration semantics are embedded in app component lifecycle,
4. storybook/test surface is split across app paths instead of package-owned contract stories.

## 3. Design Principles for the Extraction

The extraction should follow these engineering principles.

### 3.1 Layered boundaries

Use four explicit layers:

1. Transport layer: websocket client + prompt submission.
2. Projection layer: SEM to timeline ops and adapter side effects.
3. Presentation synthesis layer: timeline entities to ChatWindow messages.
4. Rendering layer: message blocks and widget registry dispatch.

No layer should skip the previous one.

### 3.2 Explicit extension points

Borrowing from pinocchio, every extension point must be explicit and composable:

1. timeline props normalizers by `kind`,
2. inline widget renderers by `type`,
3. projection adapters by `onEnvelope(ctx)` pipeline,
4. runtime bootstrap composed in one host-level function.

### 3.3 Contract-first APIs

Public reusable interfaces must be defined before moving files. Implementation can change, contracts should not.

### 3.4 Deterministic replay parity

Hydration, buffered replay, and live frames must produce equivalent UI state.

### 3.5 Delete as we cut over

Once new package path is active, old app path must be deleted in same ticket.

### 3.6 Pinocchio ChatWindow Reference Set

For ChatWindow extraction work specifically, the primary reference implementation is `pinocchio/cmd/web-chat/web`. Use this subset in order:

1. `pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md`
2. `pinocchio/pkg/doc/tutorials/02-webchat-getting-started.md`
3. `pinocchio/pkg/doc/tutorials/03-thirdparty-webchat-playbook.md`
4. `pinocchio/cmd/web-chat/web/src/ws/wsManager.ts`
5. `pinocchio/cmd/web-chat/web/src/sem/registry.ts`
6. `pinocchio/cmd/web-chat/web/src/sem/timelineMapper.ts`
7. `pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx`
8. `pinocchio/cmd/web-chat/web/src/webchat/components/Timeline.tsx`
9. `pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts`
10. `pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts`

Mapping to HC-56 work:

1. transport + hydration lifecycle: `wsManager.ts`,
2. event projection setup: `sem/registry.ts` + `sem/timelineMapper.ts`,
3. chat shell composition: `webchat/ChatWidget.tsx`,
4. timeline render and card switch behavior: `webchat/components/Timeline.tsx`,
5. extension registration seams: `webchat/rendererRegistry.ts` + `sem/timelinePropsRegistry.ts`.

## 4. Target Architecture (Detailed)

### 4.1 Package-level modules

Define reusable runtime entry module in engine package (name can be adapted to existing export style):

1. `createTimelineChatRuntime(config)` for host composition,
2. `TimelineChatRuntimeProvider` or equivalent hook wrapper for React integration,
3. stable callback interfaces for host actions.

The module can reuse existing primitives (`TimelineChatWindow`, `useProjectedChatConnection`, `projectSemEnvelope`) but it must consolidate orchestration into one reusable API.

### 4.2 Proposed runtime contract

```ts
export interface TimelineChatRuntimeHostActions {
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
  onEditCard?: (item: TimelineWidgetItem) => void;
  onEmitRawEnvelope?: (envelope: SemEnvelope) => void;
  onConnectionStatus?: (status: string) => void;
  onConnectionError?: (message: string) => void;
}

export interface TimelineChatRuntimeConfig {
  conversationId: string;
  createClient: ProjectedChatClientFactory;
  semRegistry: SemRegistry;
  adapters?: ProjectionPipelineAdapter[];
  widgetNamespace?: string;
  hostActions?: TimelineChatRuntimeHostActions;
  shouldProjectEnvelope?: (envelope: SemEnvelope) => boolean;
}

export interface TimelineChatRuntimeBindings {
  connect: () => void;
  close: () => void;
  render: (props: TimelineChatRenderProps) => ReactNode;
}
```

Goal: inventory should assemble config and consume runtime bindings, not implement orchestration logic directly.

### 4.3 Widget pack contract

Existing `registerHypercardWidgetPack` is close to final shape. Harden it into strict reusable form:

1. idempotent registration semantics,
2. explicit namespace collision behavior,
3. exported unregister helper for tests,
4. typed render context contract.

Proposed additions:

```ts
export interface HypercardWidgetPackRegistration {
  namespace: string;
  unregister: () => void;
}

export function registerHypercardWidgetPack(
  options?: RegisterHypercardWidgetPackOptions,
): HypercardWidgetPackRegistration;
```

This mirrors pinocchio's explicit register/unregister test ergonomics.

### 4.4 Display synthesis contract

`buildTimelineDisplayMessages` should become policy-driven and reusable:

1. max items and labels configurable,
2. grouping strategy injectable,
3. non-widget fallback behavior explicit.

Proposed options extension:

```ts
export interface TimelineDisplayMessagesOptions {
  widgetNamespace?: string;
  maxTimelineItems?: number;
  maxPanelItems?: number;
  roundLabel?: (round: number) => string;
  includeFallbackSystemRows?: boolean;
}
```

This avoids inventory branding/hardcoding in generic runtime.

## 5. Detailed Data Flow and Lifecycle

### 5.1 Live websocket lifecycle

```text
InventoryHost
  -> createClient(handlers)
  -> useProjectedChatConnection
      -> client.connect()
      -> onRawEnvelope(envelope) [optional diagnostics]
      -> onEnvelope(envelope)
          -> shouldProjectEnvelope?
          -> projectSemEnvelope
              -> semRegistry.handle
              -> applySemTimelineOps
              -> adapters.onEnvelope
```

Technical invariants:

1. `onRawEnvelope` must never mutate timeline state directly.
2. `shouldProjectEnvelope` defaults to true; inventory can ignore `timeline.upsert` if hydration path already handles it.
3. adapter side effects must be deterministic and idempotent for repeated upserts.

### 5.2 Hydration and replay

`hydrateTimelineSnapshot` already creates synthetic `timeline.upsert` envelopes per entity. The runtime integration must ensure:

1. hydration runs before user-facing connection status switches to "ready" for replay-sensitive UIs,
2. buffered frames processed in seq order,
3. no duplicate side effects from hydration plus live replay (adapter idempotency requirement).

### 5.3 Message synthesis path

`TimelineEntity[] -> ChatWindowMessage[]` flow should remain centralized in one module:

1. convert canonical message kinds directly,
2. convert timeline-mappable non-message entities through `formatTimelineEntity`,
3. bucket by round and panel group,
4. emit synthetic widget messages once per group per round,
5. inject items sorted by `updatedAt` descending with cap.

Algorithm pseudocode (current behavior, formalized):

```pseudo
activeRound = 0
for entity in timelineEntities:
  if entity.kind == message:
    msg = mapTimelineEntityToMessage(entity)
    if msg.role == user: activeRound++
    output.push(msg)
    continue

  item = timelineWidgetItemFromEntity(entity)
  if item exists:
    group = groupFor(item.kind)
    roundBucket[activeRound][group][item.id] = item
    ensureWidgetMessageExists(group, activeRound)
    continue

  output.push(mapTimelineEntityToMessage(entity))

for each widgetMessage:
  attach sorted bucket items with group-specific max cap
```

This logic should be treated as policy module with dedicated unit tests.

### 5.4 Renderer dispatch path

```text
ChatWindowMessage.content[kind=widget]
  -> renderWidget(widget)
  -> renderInlineWidget(widget, context)
  -> resolveInlineWidgetRenderer(widget.type)
  -> registered renderer
```

Contract requirements:

1. unknown widget type returns `null` and does not throw,
2. renderer receives typed context and should degrade gracefully when callbacks missing,
3. registration order should be deterministic when duplicate type keys are attempted.

## 6. File-by-File Cutover Plan

This section lists concrete operations and expected ownership after each step.

### 6.1 Runtime orchestration extraction

Primary files:

1. `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
2. `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
3. `packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx`
4. `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`

Actions:

1. move orchestration-specific glue from inventory component into engine runtime composition helper,
2. keep inventory-specific window management callbacks in app layer,
3. expose composition function through engine index exports.

### 6.2 Display synthesis modularization

Primary files:

1. `packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts`
2. `packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.test.ts`

Actions:

1. formalize options for labeling and caps,
2. add tests for round boundaries, cap limits, and stable sorting,
3. remove any inventory-specific constant naming from defaults (if present).

### 6.3 Registry and pack hardening

Primary files:

1. `packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts`
2. `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`
3. `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.test.ts`

Actions:

1. add idempotent registration handling and unregister closures,
2. test namespace isolation (`inventory`, `hypercard`, custom namespace),
3. verify no cross-test leakage by explicit clear/unregister usage.

### 6.4 Inventory host simplification

Primary files:

1. `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
2. `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`
3. `apps/inventory/src/features/chat/selectors.ts`

Actions:

1. preserve selectors and domain callbacks,
2. remove projection orchestration internals now provided by runtime package,
3. keep only adapter registration and host action binding.

### 6.5 Storybook extraction coverage

Primary files:

1. `apps/inventory/src/features/chat/stories/TimelineChatWindow.stories.tsx`
2. `apps/inventory/src/features/chat/stories/InventoryTimelineWidget.stories.tsx`
3. `apps/inventory/src/features/chat/stories/InventoryArtifactPanelWidgets.stories.tsx`
4. `packages/engine/src/components/widgets/ChatWindow.stories.tsx`
5. `packages/engine/src/components/widgets/ChatWindow.widgets.stories.tsx`

Actions:

1. create package-owned stories for extracted runtime components and renderer pack components,
2. leave app-only stories only for host callback integrations,
3. ensure story args demonstrate registration bootstrap order.

## 7. Migration Sequence with Commit Strategy

Use incremental commits that preserve bisectability and avoid mixed ownership in one change.

### Commit 1: runtime contracts and exports

1. add/adjust reusable runtime public interfaces,
2. export surfaces in engine package,
3. no behavior changes yet.

Acceptance:

1. typecheck passes with no consumer migration.

### Commit 2: runtime orchestration move

1. move orchestration logic into runtime module,
2. adapt inventory to call runtime API.

Acceptance:

1. functional parity in local manual smoke: send prompt, see stream, see timeline widgets.

### Commit 3: display synthesis policy hardening

1. make options and policy explicit,
2. add expanded tests.

Acceptance:

1. test suite covers round grouping, caps, fallback rows.

### Commit 4: widget registry/pack hardening

1. implement idempotent registration/unregister semantics,
2. update tests.

Acceptance:

1. registration tests pass and no duplicate renderer side effects.

### Commit 5: storybook relocation and docs

1. add package-level stories,
2. trim app stories to host-only demos,
3. update docs/comments.

Acceptance:

1. stories build and render.

### Commit 6: legacy deletion sweep

1. remove obsolete app-owned runtime helpers,
2. remove dead exports and tests.

Acceptance:

1. grep gates pass (see Section 10).

## 8. Testing and Validation Matrix

### 8.1 Unit tests (must pass)

Frontend package tests:

1. `packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.test.ts`
2. `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.test.ts`
3. `packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.test.ts`
4. `packages/engine/src/hypercard-chat/sem/timelineMapper.test.ts`
5. `packages/engine/src/hypercard-chat/sem/registry.test.ts`

App integration tests:

1. `apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts`
2. `apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts`
3. `apps/inventory/src/features/chat/webchatClient.test.ts`

### 8.2 Behavioral smoke checklist

1. open inventory app,
2. submit prompt,
3. observe `llm.start` then streaming deltas and final,
4. trigger tool call and verify timeline panel row appears,
5. trigger generated widget/card and verify panel rows and actions,
6. refresh page and verify hydrated timeline reproduces same UI blocks,
7. reopen conversation and verify ordering parity.

### 8.3 Regression-focused cases

1. long runs with > max items per group should truncate deterministically,
2. repeated upserts for same `item.id` should update, not duplicate,
3. unknown widget types should not break message render,
4. missing host callbacks should render read-only components without throw.

### 8.4 Type safety gates

1. `pnpm -r typecheck` (or workspace equivalent),
2. compile-time checks for exported API contracts,
3. no `any` leaks introduced in runtime public interfaces.

## 9. Storybook Contract Requirements

Storybook is part of architecture verification, not optional cosmetics.

Required stories:

1. `TimelineChatWindow` basic message-only timeline,
2. timeline with registered Hypercard pack widgets,
3. timeline debug mode (message id/status badges),
4. host callbacks wired (open/edit actions),
5. unknown widget type fallback.

Each story should pin deterministic fixture data and avoid runtime websocket dependencies.

## 10. Legacy Deletion Gates (No Backcompat)

HC-56 is incomplete unless all gates below pass.

### 10.1 Static grep gates

Run these checks before merge:

```bash
rg "legacy|compat|fallback" apps/inventory/src/features/chat packages/engine/src/hypercard-chat
rg "tool_result\.customKind|customKind.*widget|customKind.*card" apps/inventory/src/features/chat packages/engine/src/hypercard-chat
rg "inventory\.timeline|inventory\.widgets|inventory\.cards" apps/inventory/src/features/chat
```

Expected outcome:

1. no active compatibility branches in runtime ownership code,
2. no inventory-only widget namespace assumptions outside app bootstrap,
3. no customKind-based Hypercard widget/card route in active code.

### 10.2 Ownership grep gates

```bash
rg "projectSemEnvelope\(|useProjectedChatConnection\(" apps/inventory/src/features/chat
```

Expected outcome:

1. usage from inventory should be through new reusable integration seam, not bespoke orchestration blocks.

### 10.3 File deletion/retention checklist

Delete:

1. any obsolete inventory runtime helper files superseded by reusable modules,
2. tests that only validate removed legacy behavior.

Retain:

1. inventory-specific domain adapters and callbacks,
2. engine runtime primitives and registries as shared ownership.

## 11. Risk Analysis and Mitigations

### 11.1 Risk: hidden behavior regressions in message synthesis

Cause:

1. moving `buildTimelineDisplayMessages` behavior while changing API.

Mitigation:

1. snapshot tests for canonical fixtures,
2. explicit round/group fixture coverage,
3. no algorithm changes during first extraction pass.

### 11.2 Risk: adapter double-processing on hydration/replay

Cause:

1. adapters fire on both hydration envelopes and live envelopes.

Mitigation:

1. make adapter side effects idempotent by key,
2. add tests with repeated identical upserts.

### 11.3 Risk: registry collisions between namespaces

Cause:

1. multiple pack registrations on same widget type.

Mitigation:

1. enforce namespace normalization,
2. provide unregister handles,
3. document duplicate registration semantics.

### 11.4 Risk: storybook drifting from runtime reality

Cause:

1. story fixtures not using same registration flow.

Mitigation:

1. each story should explicitly run pack bootstrap in setup,
2. keep fixtures under package test/story shared helpers.

## 12. Implementation Checklist by Step

### Step A: contract freeze

1. finalize runtime public interfaces,
2. document no-backcompat in ticket tasks and PR description,
3. add TODO markers at old call sites to remove in later commit.

### Step B: move orchestration

1. create reusable runtime composition helper,
2. migrate inventory to helper,
3. keep behavior exact.

### Step C: harden synthesis and registry

1. add options and tests for display synthesis,
2. add registration lifecycle support.

### Step D: storybook and docs

1. add package stories,
2. update inline developer docs for bootstrap order.

### Step E: legacy deletion and validation

1. remove obsolete code,
2. run full test/typecheck/story checks,
3. run grep gates.

## 13. Definition of Done

HC-56 is done only when all conditions are true:

1. inventory no longer owns chat runtime orchestration internals,
2. reusable package exposes stable runtime composition API,
3. Hypercard renderer pack is fully self-contained and bootstrap-registered,
4. storybook covers extracted component contracts,
5. no compatibility paths remain,
6. hydration/replay/live parity validated,
7. tests and typechecks pass.

## 14. Reference Mapping by Workstream

Use this map to avoid re-reading all docs repeatedly.

Workstream: architecture boundaries

1. HC-53 design-doc 02
2. pinocchio `01-pinocchio-webchat-flow-custom-renderers-and-widget-switching.md`

Workstream: event-to-widget timeline behavior

1. HC-53 design-doc 01
2. HC-53 design-doc 03
3. `packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts`

Workstream: registration model

1. pinocchio tutorial 01
2. pinocchio tutorial 04
3. `packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts`
4. `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`

Workstream: standalone shell wiring

1. pinocchio tutorial 05
2. pinocchio tutorial 02
3. `pinocchio/cmd/web-chat/web/src/ws/wsManager.ts`
4. `pinocchio/cmd/web-chat/web/src/sem/registry.ts`
5. `pinocchio/cmd/web-chat/web/src/sem/timelineMapper.ts`
6. `pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx`
7. `pinocchio/cmd/web-chat/web/src/webchat/components/Timeline.tsx`
8. `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
9. `apps/inventory/src/features/chat/InventoryChatWindow.tsx`

Workstream: reusable renderer + props registration

1. pinocchio tutorial 03
2. `pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts`
3. `pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts`
4. `packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts`
5. `packages/engine/src/hypercard-chat/sem/timelinePropsRegistry.ts`

## 15. Practical Implementation Notes

1. Prefer `git mv` for any renderer file movement to preserve style and history tracking.
2. Keep first migration behavior-preserving; optimize only after parity tests pass.
3. Treat `TimelineChatWindow` as shell and avoid adding app concerns there.
4. Keep host callbacks optional and null-safe.
5. Keep docs synchronized with actual filenames to avoid stale implementation drift.
