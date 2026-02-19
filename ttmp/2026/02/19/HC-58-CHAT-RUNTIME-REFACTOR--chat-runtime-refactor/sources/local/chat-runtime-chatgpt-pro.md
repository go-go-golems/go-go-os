---
Title: Imported External Analysis - Chat Runtime (ChatGPT Pro)
Ticket: HC-58-CHAT-RUNTIME-REFACTOR
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
    - developer-experience
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources:
    - file:/tmp/chat-runtime-chatgpt-pro.md
Summary: Imported external proposal used as input for HC-58 analysis.
LastUpdated: 2026-02-19T17:22:58.109823143-05:00
WhatFor: Preserve original source proposal text inside ticket workspace.
WhenToUse: Use when reviewing the exact imported proposal that HC-58 critiques.
---

Below is a clean-slate design that hits your stated goals:

* **Conversation management is headless** and independent of any chat window UI.
* **Multiple chat windows can run simultaneously** (same conversation or different conversations) with *different rerender profiles*.
* **Developers can register widgets + timeline behavior** via a high‑level “kit” API, without touching the messy connection/projection plumbing.
* **No projection modes**: we always ingest *both* raw SEM (llm.*, tool.*, etc.) and timeline.upsert, and we rely on **idempotent merge-by-ID + version precedence** (Pinocchio model). Where IDs differ, we solve it with an explicit **canonical/alias** mechanism instead of “drop a stream”.

I’ll describe the architecture and APIs as if this is a small set of packages/modules inside hypercard-react, but it’s adaptable to your current code shape.

---

## 1) The core split: “Conversation Runtime” vs “Chat Windows”

### Conversation Runtime (headless)

Responsible for:

* owning the websocket/client lifecycle (connect/reconnect/close)
* ingesting envelopes (raw SEM + timeline.upsert)
* running SEM handlers (projection) to produce timeline mutations
* applying mutations into a normalized timeline store (merge-by-ID, version precedence)
* running adapters/side effects (telemetry, artifact plumbing, etc.)
* exposing a subscription API with **fine-grained selectors** so different UIs rerender differently

**No React. No widgets. No rendering.**

### Chat Windows (UI)

Responsible for:

* choosing what to render (timeline list, compact list, transcript-only list, debug raw SEM view)
* choosing rerender policy (live streaming vs final-only vs throttled)
* choosing widget registry (per window, per app, per conversation, etc.)
* composing header/footer/composer controls

**No connection/projection complexity.**

---

## 2) Conversation Runtime: single shared instance per conversation ID

### Why this matters for “multiple windows at once”

Right now, tying connection lifecycle to a single component mount makes “two windows for same conversation” awkward (double connects, competing handlers, etc.).

Instead:

* There is exactly **one runtime per conversationId** (per manager).
* Many windows can subscribe.
* The runtime reference-counts “connection claims” so it connects once and disconnects when the last claim goes away (or stays alive per policy).

---

## 3) The data model that enables “Pinocchio-style” no-modes ingestion

### State shape (normalized + split streaming)

Key trick for rerender control: **timeline entities (stable) are separate from streaming text (high-frequency)**.

```ts
type ConversationState = {
  connection: {
    status: 'idle' | 'connecting' | 'connected' | 'closed' | 'error';
    error?: unknown;
  };

  // Optional ring-buffer: useful for EventViewer/debug windows
  raw: {
    envelopes: Envelope[];          // maybe bounded
    byId?: Record<string, Envelope>;
  };

  timeline: {
    ids: string[];                  // ordered list of canonical IDs
    entities: Record<string, TimelineEntity>;
    aliasToCanonical: Record<string, string>; // solves ID mismatch duplicates
  };

  streaming: {
    // high-frequency updates live here (llm.delta)
    textByEntityId: Record<string, string>;
    isStreamingByEntityId: Record<string, boolean>;
  };

  meta: Record<string, unknown>;    // counters, token stats, etc.
};
```

### Why split `streaming` from `timeline.entities`

Because it directly enables:

* Window A (“live chat”) subscribes to `streaming.textByEntityId[msgId]` and rerenders every delta.
* Window B (“transcript view”) never subscribes to streaming; it only reads the final content from timeline entity → **no rerender spam** even while streaming happens.

This is the cleanest way to get “different rerender profiles at the same time” without hacks like projection modes.

---

## 4) Ingestion pipeline (no projection modes)

Everything that arrives gets processed. Always.

### Phases

1. **Ingest**

* append envelope to `raw.envelopes` (optional/bounded)
* run adapters that want raw traffic visibility

2. **Translate / Project**

* run SEM handlers (registry) to produce mutations
* timeline.upsert is treated as just another SEM event type that produces `timeline.upsert(entity)` mutation

3. **Reduce**

* apply mutations into store (merge-by-ID, alias resolution, version precedence)

4. **Post-commit**

* adapters get `(envelope, projectionResult, newState, prevState)` if they want it

### Mutations API (internal)

The runtime doesn’t expose “dispatch Redux actions”; it exposes a small set of **conversation mutations**:

```ts
type Mutation =
  | { type: 'timeline/upsert', entity: TimelineEntity }
  | { type: 'timeline/remove', id: string }
  | { type: 'streaming/append', entityId: string, delta: string }
  | { type: 'streaming/finalize', entityId: string }
  | { type: 'meta/patch', patch: Record<string, unknown> };
```

Projection (SEM handlers) produces mutations, reducers apply them.

---

## 5) Dedup + merge rules: reducer-level, Pinocchio-style

### Canonical ID resolution (solves “IDs differ between paths” caveat)

Pinocchio works because IDs tend to match. Your design shouldn’t *assume* they match.

So: every timeline entity can optionally carry:

* `canonicalId?: string` (preferred)
* or `aliases?: string[]`
* or `sourceEventId?: string` (raw SEM id that this entity corresponds to)

Reducer logic:

```ts
function canonicalizeId(
  state: ConversationState,
  entity: TimelineEntity
): string {
  const candidate =
    entity.canonicalId ??
    entity.sourceEventId ??     // if you standardize this, great
    entity.id;

  return state.timeline.aliasToCanonical[candidate] ?? candidate;
}

function recordAliases(state, canonicalId, entity) {
  for (const a of entity.aliases ?? []) state.timeline.aliasToCanonical[a] = canonicalId;
  if (entity.id !== canonicalId) state.timeline.aliasToCanonical[entity.id] = canonicalId;
  if (entity.sourceEventId) state.timeline.aliasToCanonical[entity.sourceEventId] = canonicalId;
}
```

### Merge precedence

Borrow Pinocchio’s “version wins when present” concept:

* If both have `version`: keep higher version (or merge, but higher version fields win).
* If one has `version`: treat versioned one as authoritative.
* Otherwise: merge shallowly, preferring “more complete” content (e.g., final text beats partial).

```ts
function mergeEntity(prev: TimelineEntity | undefined, next: TimelineEntity): TimelineEntity {
  if (!prev) return next;

  const pv = prev.version;
  const nv = next.version;

  if (pv != null && nv != null) {
    return nv >= pv ? { ...prev, ...next } : { ...next, ...prev };
  }
  if (nv != null) return { ...prev, ...next };
  if (pv != null) return { ...next, ...prev };

  // no versions: pick “final” fields if present
  return {
    ...prev,
    ...next,
    content: pickMoreCompleteContent(prev.content, next.content),
  };
}
```

This is the reducer-level dedup story that makes “no projection modes” viable.

---

## 6) The extension system: Kits (runtime behavior + widgets)

You want this to be the **clean DX hook** for developers:

> “Register my widgets and timeline behavior without writing the messy complicated part.”

### Split runtime plugins from UI widget packs (but bundle them as a Kit)

A **ConversationKit** can bundle:

* **runtime behavior**: SEM handlers, merge customizations, adapters
* **UI widgets**: how to render the timeline entities

```ts
type ConversationKit = {
  id: string;

  runtime?: {
    sem?: (reg: SemHandlerRegistry) => void;
    adapters?: ConversationAdapter[];
    timeline?: {
      merge?: (prev: TimelineEntity | undefined, next: TimelineEntity) => TimelineEntity;
      orderKey?: (entity: TimelineEntity) => number | string; // optional
    };
  };

  widgets?: WidgetPack;
};
```

### SemHandlerRegistry (developer-facing)

Instead of having app code touch “SemRegistry + timeline ops + adapter effects” directly, give a clean registry:

```ts
type SemHandlerContext = {
  envelope: Envelope;
  emit: (m: Mutation) => void;

  timeline: {
    upsert: (e: TimelineEntity) => void;
    remove: (id: string) => void;
  };

  streaming: {
    append: (entityId: string, delta: string) => void;
    finalize: (entityId: string) => void;
  };

  meta: {
    patch: (p: Record<string, unknown>) => void;
  };
};

type SemHandlerRegistry = {
  on: (type: string, handler: (ctx: SemHandlerContext, event: any) => void) => void;
  // sugar helpers:
  onLlmStart?: ...
  onLlmDelta?: ...
  onTimelineUpsert?: ...
};
```

Runtime ships with a **core kit** that registers the default llm/tool/timeline.upsert semantics so most apps add only domain handlers.

### WidgetPack (UI-facing)

Per window (or app), you compose widget packs:

```ts
type WidgetPack = {
  id: string;
  register: (reg: WidgetRegistry) => void;
};

type WidgetRegistry = {
  widget: <TEntity extends TimelineEntity>(
    type: TEntity['type'],
    renderer: React.ComponentType<{ entityId: string; conversationId: string }>
  ) => void;

  fallback: (renderer: React.ComponentType<...>) => void;
};
```

Crucially: **Widget registration is not a global side-effect**.
Each ChatWindow can have its own `WidgetRegistry`, so you can render the same entity differently in different windows.

---

## 7) ConversationManager: lifecycle + sharing + refcounted connection claims

### Manager responsibilities

* cache runtimes by conversationId
* install kits idempotently (by kit id)
* reference-count “connect claims”
* expose runtime access to hooks/components

```ts
type ConversationManager = {
  getRuntime(conversationId: string): ConversationRuntime;
  installKits(conversationId: string, kits: ConversationKit[]): void;

  claimConnection(conversationId: string): () => void; // returns release()
};
```

### React integration

* `<ConversationManagerProvider manager={...} />`
* `useConversationRuntime(conversationId, { kits })`
* `useConversationConnection(conversationId, { enabled: true })`

Now any number of windows can:

* share runtime state
* connect once
* subscribe to slices they care about

---

## 8) Rerender control: selectors + per-entity subscriptions

To make rerenders predictable and cheap:

### Expose hooks that subscribe to small slices

Examples:

```ts
useConnectionStatus(conversationId)

useTimelineEntityIds(conversationId)          // stable array, changes only on insert/remove/reorder
useTimelineEntity(conversationId, entityId)   // rerenders only when that entity changes
useStreamingText(conversationId, entityId)    // rerenders only on delta
useIsStreaming(conversationId, entityId)
useRawEnvelopes(conversationId)               // for debug viewer
```

Under the hood you implement these via `useSyncExternalStoreWithSelector` (or equivalent) so selection is stable and isolated.

### How this enables “two windows, different rerenders”

* Window A (live): list renders entities and each message subscribes to streaming text.
* Window B (final-only): list renders entities but message does not subscribe to streaming text.

Both are connected to the same runtime; only A rerenders per delta.

---

## 9) The reusable ChatWindow UI design

### Don’t make a “RuntimeWindow” that mixes concerns

Instead, the base reusable UI is a **shell + list renderer**.

Recommended component split:

* `ChatWindowShell` – header/footer/composer layout (pure UI)
* `TimelineMessageList` – renders ordered entity IDs (virtualized if needed)
* `TimelineMessage` – per-entity renderer using WidgetRegistry
* optional `EventStreamPanel` – raw SEM viewer, dev tool

`TimelineChatWindow` becomes a convenience composition:

```tsx
<TimelineChatWindow
  conversationId="c1"
  widgets={[coreWidgets, inventoryWidgets]}
  streamingMode="live" // or "finalOnly"
  header={<...>}
  footer={<...>}
/>
```

Internally it:

* claims connection
* builds a widget registry (from packs)
* renders `ChatWindowShell + TimelineMessageList`

### Multiple windows simultaneously

```tsx
<TimelineChatWindow conversationId="c1" streamingMode="live" />
<TimelineChatWindow conversationId="c1" streamingMode="finalOnly" />
<RawEventViewer conversationId="c1" />
```

No duplicated connections. Different rerender profiles.

---

## 10) What replaces “projection modes”

Nothing.

You always:

* ingest raw SEM
* ingest timeline.upsert
* run projection (SEM handlers)
* reducer merges idempotently by canonical ID + version precedence

The only knobs you keep are UI knobs:

* **streamingMode** (live vs finalOnly vs throttled)
* debug logging/buffering policy for raw envelopes
* connection lifetime policy (disconnect on no subscribers vs keepAlive)

Those knobs don’t change correctness; they change UX/perf.

---

## 11) How developers register “timeline behavior” cleanly

### Example: domain kit

```ts
export const inventoryKit: ConversationKit = {
  id: 'inventory',

  runtime: {
    sem(reg) {
      reg.on('inventory.item.updated', (ctx, ev) => {
        ctx.timeline.upsert({
          id: ev.itemId,
          type: 'inventory.item',
          version: ev.version,
          occurredAt: ev.ts,
          data: ev.item,
        });
      });
    },

    adapters: [
      (ctx) => { /* token stats, analytics, artifact sync */ }
    ],
  },

  widgets: {
    id: 'inventory.widgets',
    register(reg) {
      reg.widget('inventory.item', InventoryItemWidget);
    }
  }
};
```

App code:

```tsx
<TimelineChatWindow conversationId="c1" kits={[coreKit, inventoryKit]} />
```

That’s it. No dealing with connection hooks, sem registries, projection filters, widget pack global registration, etc.

---

## 12) Practical migration from current `TimelineChatRuntimeWindow`

You can do this incrementally:

1. **Extract runtime headless core** from `useProjectedChatConnection` logic

   * move connection + envelope ingestion + sem registry execution into a runtime object
   * keep current SemRegistry handlers as the “core kit”

2. **Implement canonical merge reducer** (version precedence + alias map)

   * remove projectionMode usage
   * make timeline.upsert and llm.* projection both always apply

3. **Build `ConversationManager` + refcounted connection claims**

   * update current runtime window wrapper to use manager
   * now multiple windows won’t double connect

4. **Introduce widget packs as per-window registries**

   * remove implicit global registry mutation from the runtime layer
   * keep a convenience `DefaultHypercardWidgetsPack`

5. Keep `TimelineChatRuntimeWindow` as a compatibility wrapper temporarily:

   * internally it just mounts `TimelineChatWindow` with default kits/packs
   * deprecated but still supported

---

## 13) The one place you *do* want a contract with backend

To make “no modes” robust, pick one canonical identity strategy and standardize it:

* Best: **use the SEM event id as the timeline entity id** (Pinocchio ideal case).
* If that’s not possible: require timeline.upsert payloads to carry `sourceEventId` or `canonicalId` so the client can alias-dedupe reliably.

If you do that, you no longer need “drop one stream” safety valves.

---

## Summary

The design I’d ship:

* **ConversationRuntime**: headless, shared per conversation, always ingests both streams.
* **ConversationManager**: caches runtimes, installs kits, refcounts connection.
* **Kits**: the only thing most developers touch (register SEM→timeline behavior + optional widgets/adapters).
* **Reducer-level dedup**: merge-by-canonical-ID + version precedence + alias map.
* **Split streaming state**: enables multiple windows with different rerender profiles without correctness hacks.
* **Per-window widget registries**: no global side effects; different windows can render differently.

If you want, I can follow up with a concrete TypeScript interface file layout (e.g. `conversation/runtime.ts`, `conversation/kit.ts`, `conversation/react/*.ts`, `ui/chat-window/*.tsx`) that maps closely onto your existing hypercard engine pieces so it’s obvious where each current file migrates.
