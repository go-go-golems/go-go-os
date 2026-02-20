---
Title: TimelineChatRuntimeWindow API Surface Review (Developer Experience)
Ticket: HC-57-TIMELINE-CHAT-RUNTIME-API-SURFACE-REVIEW
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - webchat
    - timeline
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: |-
        Only production integration site and best signal for developer ergonomics.
        Production consumer ergonomics and intent
    - Path: packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx
      Note: |-
        Contract story and secondary usage site.
        Story consumer and contract demonstration
    - Path: packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx
      Note: |-
        Presentation props inherited by TimelineChatRuntimeWindow.
        Inherited presentation props and runtime/view boundary
    - Path: packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts
      Note: |-
        Projection and adapter pipeline semantics affecting API behavior.
        Projection and adapter pipeline contract
    - Path: packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx
      Note: |-
        Primary API surface under review.
        Primary API surface and implementation
    - Path: packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts
      Note: |-
        Connection lifecycle implementation used by TimelineChatRuntimeWindow.
        Connection/filtering and adapter execution semantics
ExternalSources: []
Summary: In-depth analysis of TimelineChatRuntimeWindow API design, usage intent, implementation behavior, and developer-facing improvements.
LastUpdated: 2026-02-19T16:18:00-05:00
WhatFor: Provide an actionable API design review to guide a potential HC-58+ refactor of runtime ergonomics.
WhenToUse: Use when evaluating TimelineChatRuntimeWindow adoption, proposing API changes, or planning a v2 runtime abstraction.
---


# TimelineChatRuntimeWindow API Surface Review (Developer Experience)

## Executive Summary

`TimelineChatRuntimeWindow` successfully centralizes runtime responsibilities that previously lived in app code, but its current API surface is crowded and mixes four concerns: transport/projection wiring, timeline render synthesis, widget-pack lifecycle, and end-user ChatWindow presentation props.

From a developer-consumer perspective, the component currently feels like a "do everything" orchestration entry point. It works, but it is cognitively expensive to adopt correctly and has a few subtle behavioral traps (especially projection filtering semantics, callback stability expectations, and implicit widget registration side effects).

The main recommendation is to split the surface into explicit groups (or layers) and introduce a hook-first runtime API, while keeping `TimelineChatRuntimeWindow` as a convenience wrapper for simple integrations.

## Problem Statement

HC-56 introduced `TimelineChatRuntimeWindow` as the new shared runtime seam. The immediate architecture goal was achieved, but the integration API now asks callers to provide infrastructure, runtime policies, and UI-level props in one object.

The ticket request for HC-57 is to evaluate:

1. what the API currently contains,
2. how it is used,
3. what each piece appears to intend,
4. how it is implemented,
5. what can be improved from the perspective of a developer using the component.

## Current API Surface

`TimelineChatRuntimeWindowProps` currently combines:

1. Runtime infrastructure inputs
- `conversationId`
- `dispatch`
- `timelineEntities`
- `semRegistry`
- `createClient`
- `adapters?`

2. Runtime policy controls
- `projectionMode?` (`all-events` | `timeline-upsert-only`)
- `shouldProjectEnvelope?`

3. Host integration callbacks (via `hostActions?`)
- artifact interaction: `onOpenArtifact`, `onEditCard`
- debug/ops callbacks: `onEmitRawEnvelope`, `onConnectionStatus`, `onConnectionError`

4. Rendering configuration
- `widgetNamespace?`
- `debug?`

5. Full ChatWindow presentation props (inherited via `Omit<...>`)
- `onSend`
- `title`, `subtitle`, `placeholder`
- `suggestions`, `showSuggestionsAlways`
- `headerActions`, `footer`

Net effect: this single component acts as both runtime controller and presentational shell adapter.

## How It Is Used Today

Observed call sites in codebase:

1. Production usage: `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- single real integration
- creates `semRegistry`, projection adapters, client factory, host action callbacks, and all UI props
- passes `projectionMode="timeline-upsert-only"`

2. Story usage: `packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx`
- no-op client
- static timeline entities
- focused on visual/runtime contract behavior

There are currently no additional app integrations, meaning API design feedback is mostly from one concrete consumer path.

## Intent of the Different Pieces

Inferred intent from implementation and usage:

1. `createClient` + `useProjectedChatConnection`
- intent: keep transport pluggable and app-owned, runtime-owned lifecycle.

2. `semRegistry` + `adapters`
- intent: keep projection pipeline extensible and app-domain side effects configurable.

3. `projectionMode` + `shouldProjectEnvelope`
- intent: support hard-cut upsert-only mode and custom filtering policies.

4. `hostActions`
- intent: isolate app-specific business actions (artifact/card operations) from generic runtime.

5. `widgetNamespace` + implicit `registerHypercardWidgetPack`
- intent: enforce explicit renderer ownership, while making registration automatic for runtime consumers.

6. inherited `TimelineChatWindow` props
- intent: avoid creating a second “view props” type and keep wrapper usage direct.

These intents are reasonable individually; the issue is concentration in one prop shape.

## Implementation Review

Implementation behavior in `timelineChatRuntime.tsx`:

1. Widget pack lifecycle
- registers pack on mount via `registerHypercardWidgetPack({ namespace })`
- unregisters on unmount or namespace change
- this is convenient but side-effectful and hidden from caller.

2. Projection policy
- effective predicate blocks non-`timeline.upsert` when `projectionMode` is `timeline-upsert-only`
- then optionally applies `shouldProjectEnvelope`
- in skip path, adapters are still run with empty projected ops (via `useProjectedChatConnection` -> `runProjectionAdapters`).

3. Streaming derivation
- `isStreaming` inferred from passed `timelineEntities` each render.

4. Rendering bridge
- constructs `widgetRenderContext` from `debug` and selected `hostActions`
- forwards to `TimelineChatWindow`.

Notable hidden coupling:

1. `timelineEntities` is caller-provided, but runtime connection/projection is internal.
2. Caller must already know where and how to select entities, which partially weakens “single runtime seam” discoverability.
3. Chat metadata callbacks (`onConnectionStatus`, `onConnectionError`) are grouped with artifact actions in one object despite distinct concern boundaries.

## Developer Experience Findings

### Strengths

1. Clear defaulting for namespace and projection mode.
2. One component can fully wire a chat runtime quickly.
3. Works with app-specific transport and adapters without patching engine code.
4. Preserves separation between engine runtime and app business actions.

### Friction Points

1. Surface area overload
- developers must understand transport, projection, adapter, widget, and view layers simultaneously.

2. Prop model obscurity via `Omit<...>`
- inherited props are convenient but hide contract shape in docs/intellisense unless jumping between files.

3. Mixed-concern callback bag (`hostActions`)
- artifact actions, debug envelope taps, and connection lifecycle callbacks are conceptually different.

4. Subtle projection semantics
- when projection is skipped, adapters still run with `projected.ops=[]`; this is correct for HC-56 but non-obvious.

5. Stability requirements not obvious
- `createClient` identity changes reconnect sockets because effect depends on it.
- this requires `useCallback` discipline by consumers.

6. Implicit global-ish side effects
- widget renderer registration happens automatically in component lifecycle, not by explicit host call.

7. Consumer must provide external state selection anyway
- requiring `timelineEntities` means this is not a fully self-contained runtime container.

## Alternatives Considered (for API evolution)

### Alternative A: Keep API as-is, improve docs only

Pros:
1. no breaking changes
2. lowest engineering cost

Cons:
1. crowded ergonomics remain
2. advanced usage pitfalls remain easy to miss

Verdict: good short-term patch, not sufficient long-term.

### Alternative B: Grouped prop objects in same component

Example:

```ts
<TimelineChatRuntimeWindow
  runtime={{ conversationId, dispatch, semRegistry, createClient, adapters }}
  projection={{ mode: 'timeline-upsert-only', shouldProjectEnvelope }}
  host={{ onOpenArtifact, onEditCard, onEmitRawEnvelope, onConnectionStatus, onConnectionError }}
  view={{ onSend, title, subtitle, suggestions, footer, headerActions }}
  widgets={{ namespace: 'inventory', debug }}
  timeline={{ entities }}
/>
```

Pros:
1. preserves single component
2. improves discoverability by concern

Cons:
1. still combines control + view in one wrapper
2. migration churn without deeper architecture improvement

Verdict: moderate improvement; useful as intermediate step.

### Alternative C: Hook-first runtime API + thin component wrapper (recommended)

Introduce:

1. `useTimelineChatRuntime(config)`
- handles transport/projection/widget lifecycle
- returns `{ isStreaming, widgetRenderContext, connectionState, emitSend }` or similar

2. `TimelineChatRuntimeView`
- takes already-prepared runtime state + `timelineEntities` + view props

3. Keep `TimelineChatRuntimeWindow` as convenience wrapper implemented on top of (1)+(2)

Pros:
1. separates control plane from view plane
2. easier testing of runtime behavior independent of UI
3. clearer extension surface for advanced integrations

Cons:
1. larger refactor
2. needs migration guidance and staged adoption

Verdict: strongest developer-facing design for long-term reuse.

## Recommended Direction

### Recommendation 1: Formalize concern groups

Even before a hook split, define explicit top-level groups in types and docs:

1. `RuntimeConfig`
2. `ProjectionConfig`
3. `HostActions`
4. `WidgetConfig`
5. `ViewProps`

This reduces accidental coupling and improves docs generation.

### Recommendation 2: Make projection behavior explicit in naming

Current behavior is correct but subtle. Add explicit mode vocabulary such as:

1. `mode: 'project-all'`
2. `mode: 'project-upserts-run-adapters'`

or keep existing names but document adapter behavior inline in type comments.

### Recommendation 3: Separate host action subdomains

Split `hostActions` into:

1. `artifactActions` (`onOpenArtifact`, `onEditCard`)
2. `connectionCallbacks` (`onConnectionStatus`, `onConnectionError`)
3. `debugCallbacks` (`onEmitRawEnvelope`)

This reduces “bag of callbacks” ambiguity and clarifies intent.

### Recommendation 4: Offer an explicit widget registration policy option

Expose a policy switch (or explicit registration callback) so hosts can choose between:

1. automatic registration (current behavior)
2. externally managed registration lifecycle.

### Recommendation 5: Publish “minimal integration” and “advanced integration” examples

From a consumer perspective, the most missing artifact is clear entry guidance.
Provide two copy/paste examples:

1. minimal app host
2. advanced host with custom filtering and adapter behaviors.

## Proposed v2 Sketch (Developer-Oriented)

```ts
interface TimelineRuntimeConfig {
  conversationId: string;
  dispatch: Dispatch<UnknownAction>;
  semRegistry: SemRegistry;
  createClient: ProjectedChatClientFactory;
  adapters?: ProjectionPipelineAdapter[];
}

interface TimelineProjectionConfig {
  mode?: 'project-all' | 'project-upserts-run-adapters';
  shouldProjectEnvelope?: (envelope: SemEnvelope) => boolean;
}

interface TimelineHostConfig {
  artifactActions?: {
    onOpenArtifact?: (item: TimelineWidgetItem) => void;
    onEditCard?: (item: TimelineWidgetItem) => void;
  };
  connectionCallbacks?: {
    onStatus?: (status: string) => void;
    onError?: (message: string) => void;
  };
  debugCallbacks?: {
    onRawEnvelope?: (envelope: SemEnvelope) => void;
  };
}

interface TimelineWidgetConfig {
  namespace?: string;
  debug?: boolean;
  registration?: 'auto' | 'external';
}
```

## Implementation Plan

### Phase 1: Clarify and stabilize current API (non-breaking)

1. Add dense TSDoc comments to each `TimelineChatRuntimeWindowProps` field.
2. Document projection skip/adapters-run behavior in code and guide.
3. Add lint/test guard for `createClient` stability in examples.

### Phase 2: Introduce grouped config types (soft migration)

1. Add new grouped-prop overload or parallel component (`TimelineChatRuntimeWindowV2`).
2. Keep old prop shape with deprecation comments.

### Phase 3: Introduce hook-first runtime

1. Add `useTimelineChatRuntime`.
2. Rebuild convenience wrapper using hook + view composition.
3. Migrate inventory as reference consumer.

### Phase 4: Cleanup

1. Remove deprecated prop shape after migration window.
2. Update storybook and docs to only v2 patterns.

## Open Questions

1. Should runtime own `timelineEntities` selection to reduce consumer burden, or should state ownership remain caller-only?
2. Should automatic widget registration remain default, or should explicit registration be mandatory for predictability?
3. Do we expect multiple app consumers soon? If yes, API hardening should be prioritized before further adoption.
4. Should connection status/error callbacks remain pass-through hooks, or should runtime expose typed connection state directly?

## References

- `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
- `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
- `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
- `packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx`
- `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx`
- `packages/engine/docs/chat-window-timeline-first-guide.md`
