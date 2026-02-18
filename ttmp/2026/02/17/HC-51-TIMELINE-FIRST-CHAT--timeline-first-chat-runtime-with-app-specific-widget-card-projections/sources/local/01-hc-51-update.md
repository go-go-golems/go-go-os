---
Title: HC-51 expert review import
Ticket: HC-51-TIMELINE-FIRST-CHAT
Status: active
Topics:
    - frontend
    - architecture
    - chat
    - state-management
    - timeline
DocType: reference
Intent: snapshot
Owners: []
RelatedFiles: []
ExternalSources:
    - /tmp/hc-51-update.md
Summary: Imported expert review guidance used to revise HC-51 architecture plan toward strict Pinocchio alignment.
LastUpdated: 2026-02-18T15:22:00Z
WhatFor: Preserve the exact reviewed guidance text that informed the HC-51 post-review rewrite.
WhenToUse: Use when auditing why HC-51 architecture decisions changed after expert review.
---

Got it — you’re asking for a stricter, *Pinocchio‑style* model:

* **All SEM frames** go through **one** frontend projection pipeline: `SEM event → (entity create/update ops) → timeline entity store`.
* The backend runs the **same conceptual projection** (timeline projector + custom timeline handlers) so that what’s persisted and re-hydrated is the same entity model.
* **The EventViewer is not part of the projection** — it just shows **raw SEM**.
* **Artifacts/cards are not “side channels”** (no “timeline widget message”, no “generated cards/widgets panels” masquerading as chat messages). They are simply **timeline entities** (usually `tool_result` + `customKind`) with open/edit actions.

That does simplify HC‑51 *a lot*, and it also implies we should “cut over” hard: delete the UI‑payload/chatSlice pipeline and replace it with a timeline entity pipeline.

Below is the redesign I’d do for HC‑51.

---

# HC‑51 redesign: single SEM → entity projection (frontend), mirrored by backend projector

## The end state

### Data model

A chat window **is the timeline**: a single ordered list of **entities**.

Core entity kinds (same as Pinocchio web-chat):

* `message`
* `tool_call`
* `tool_result`
* `status` (and/or `log`)

Hypercard artifacts/cards:

* still `tool_result`
* distinguished by `props.customKind` (e.g. `hypercard.widget.v1`, `hypercard.card.v2`)
* “Open” and “Edit code” are **actions on that entity**, not separate messages/panels.

### Flow

**Every** incoming SEM envelope follows the same path:

```
WS frame
  -> emit raw event to eventBus (EventViewer)
  -> semRegistry.handle(envelope, ctx)
      -> dispatch timelineSlice add/upsert/rekey ops
      -> optional side-effects (mostly user-action driven; see below)
  -> UI renders timeline entities
```

Hydration is just “apply the snapshot entities into the same store”, like Pinocchio.

---

# 1) Canonical store: timeline entities, normalized

### Keep this in Redux

Yes: timeline entities should live in Redux. This is the core runtime truth.

### Per-conversation state (Hypercard needs this)

Pinocchio’s web-chat is single-conversation. Hypercard desktop can have multiple chat windows, so the state needs a `convId` dimension:

```ts
type TimelineEntity = {
  id: string;
  kind: string;
  createdAt: number;
  updatedAt?: number;

  // IMPORTANT: keep version as string (uint64 from protojson)
  version?: string;

  props: any;
};

type ConversationTimeline = {
  byId: Record<string, TimelineEntity>;
  order: string[];
};

type TimelineState = {
  conversations: Record<string, ConversationTimeline>;
};
```

### Version / ordering rule

Pinocchio uses `number` for version; your backend uses `uint64` and emits values around ~1e18. In JS that’s not safely representable as a `number`.

So in HC‑51 I would:

* store `version` as a **decimal string**
* compare using `BigInt()` when you need to ignore stale upserts

```ts
function isNewer(incoming?: string, existing?: string): boolean {
  if (!incoming) return false;
  if (!existing) return true;
  try { return BigInt(incoming) > BigInt(existing); } catch { return true; }
}
```

This matters for reconciling `timeline.upsert` and avoiding “stale snapshot overwrote live delta”.

---

# 2) Single SEM registry + handlers (Pinocchio pattern)

You already have the reference implementation in:

* `pinocchio/cmd/web-chat/web/src/sem/registry.ts`
* `pinocchio/cmd/web-chat/web/src/sem/timelineMapper.ts`

HC‑51 should **port that structure** into `@hypercard/engine` (or into a shared `packages/webchat-core` if you prefer), with two Hypercard-specific changes:

1. handlers receive a `convId` in context
2. timeline entities go into the per-conversation timeline slice

### The registry API (same shape)

```ts
type SemEnvelope = { sem: true; event: SemEvent };
type SemEvent = { type: string; id: string; data?: unknown; seq?: number; stream_id?: string };

type SemContext = { convId: string; now: () => number };

type Handler = (ev: SemEvent, ctx: SemContext, dispatch: AppDispatch) => void;
```

### Minimal handler set (the “single path”)

You want *everything* to go through this path. That means: even if some events don’t create entities, they still pass through the registry (and are ignored if no handler exists).

Implement these handlers (mirrors Pinocchio + your backend):

#### `timeline.upsert` (canonical)

* decode `TimelineUpsertV1` JSON
* map `entity` snapshot → `TimelineEntity`
* set `entity.version = data.version` (string)
* `dispatch(upsertEntity({convId, entity}))`

This guarantees the frontend converges to backend’s canonical persisted truth.

#### `llm.start` / `llm.delta` / `llm.final`

Same as Pinocchio: create/update a `message` entity with `props.role`, `props.content`, `props.streaming`.

#### `tool.start` / `tool.delta` / `tool.done`

Same as Pinocchio: create/update a `tool_call` entity.

#### `tool.result`

Same as Pinocchio: create/update `tool_result`.

* if `customKind` present → `id = ${ev.id}:custom`
* else → `id = ${ev.id}:result`

> Note: Your **hypercard.widget.v1 / hypercard.card.v2** events are *not* emitted as `tool.result` today; they’re separate SEM event types, but the backend projects them into timeline `tool_result` entities and emits `timeline.upsert`. That’s fine — the frontend doesn’t need special casing if it trusts `timeline.upsert` for those.

#### Optional: `log`

Same as Pinocchio.

### Hypercard custom SEM events

Your backend emits raw SEM event types like:

* `hypercard.widget.start`, `.update`, `.error`
* `hypercard.card.start`, `.update`, `.error`
* and “ready” forms: `hypercard.widget.v1`, `hypercard.card.v2`

And **the backend already mirrors them into timeline entities** via `RegisterTimelineHandler(...)` in:

* `go-inventory-chat/internal/pinoweb/hypercard_events.go`

So you have two valid choices:

**A) “Strict canonical”: do not project these raw events on the frontend at all.**
Let the backend projector produce `status` / `tool_result` entities and your UI only changes when `timeline.upsert` arrives. This has the strongest “mirrored” guarantee (frontend never re-implements hypercard projections).

**B) “Immediate UI”: also add frontend handlers for these event types** that produce the same entities (`:status`, `:result`).
Then `timeline.upsert` reconciles.

Given your stated goal (“mirrored and unified”), I recommend **A** as the default, unless you’re seeing unacceptable latency between `hypercard.*` and the corresponding `timeline.upsert`.

---

# 3) Rendering: timeline entities, not “synthetic messages”

This is where we delete the whole HC‑50 “timeline widget message” pattern.

## Recommended UI shape (closest to Pinocchio)

Add a new engine component conceptually like Pinocchio’s ChatTimeline:

* `TimelineChatWindow`

  * takes `entities: TimelineEntity[]`
  * takes an `entityRendererRegistry`
  * takes composer props (`onSend`, `isStreaming`, suggestions, etc.)
  * renders one row per entity, with a bubble/card renderer based on kind

You can still keep your existing `ChatWindow` as a lower-level “shell” if you want, but the mental model should be entity-first.

## Renderers you need in Hypercard

* `message` → text bubble
* `tool_call` → tool call card (args, progress)
* `tool_result` →

  * **generic** tool result card
  * **hypercard.widget.v1** tool result card (parse JSON, show title/template, “Open artifact” button)
  * **hypercard.card.v2** tool result card (parse JSON, show “Open”, plus “Edit code” if present)
* `status` → small status/info row
* `log` → log row/card if desired

### “Artifacts and cards are just entities”

This is satisfied by:

* they appear as `tool_result` entities
* their “open/edit” behaviors are simply renderer actions

---

# 4) Opening artifacts/cards: entity action → window open

You already have correct primitives in engine:

* `buildArtifactOpenWindowPayload(...)`
* `openWindow(...)`
* `registerRuntimeCard(...)`
* `openRuntimeCardCodeEditor(...)`

In HC‑51, the renderer for a hypercard artifact/card entity should:

1. Parse the entity payload
   For `tool_result` entities, Pinocchio stores the `result` as `resultRaw` in protobuf and maps it to `props.result` (string). For Hypercard entities projected by the backend, you’ll get the raw JSON string in `props.result`.

2. Extract:

   * `artifactId`
   * `template` / widgetType
   * `title`
   * for cards: `card.id`, `card.code`

3. On “Open”:

   * if it’s a runtime card:

     * `registerRuntimeCard(cardId, code)` (so the plugin session can render it)
   * build payload with `buildArtifactOpenWindowPayload({ artifactId, template, runtimeCardId: cardId, ... })`
   * `dispatch(openWindow(payload))`

4. On “Edit code”:

   * `openRuntimeCardCodeEditor(dispatch, cardId, code)`

That keeps the “artifact is an entity” truth while still supporting Hypercard’s template/runtime-card workflows.

---

# 5) What about the existing artifacts slice?

This is the only potential tension with “artifacts are just entities”:

Your inventory plugin bundle currently reads artifacts via `domains(globalState).artifacts.byId[...]` (it’s literally in `apps/inventory/src/domain/pluginBundle.vm.js`).

So you have two options:

### Option 1: Keep `artifactsSlice`, but make it a *derived index* from timeline entities

* Canonical truth: timeline entity store
* Derived cache: artifacts slice updated whenever you upsert a `tool_result` entity with `customKind` in `{hypercard.widget.v1, hypercard.card.v2}`

Pros:

* minimal changes to plugin cards
* artifact windows keep working exactly

Cons:

* duplication (but it’s explicitly a projection/index, not “another truth”)

### Option 2: Cutover plugins to read artifacts from the timeline domain

* expose `domains.timeline` (or similar) to plugin runtime
* update the plugin bundle to find the right tool_result entity and parse payload

Pros:

* truly “artifact only exists as an entity”
* removes artifacts slice

Cons:

* requires touching plugin code + host integration (bigger)

Given your “cutover is fine” stance, option 2 is viable — but it’s a bigger blast radius than the core HC‑51 goal. If you want the shortest HC‑51 that still matches your new principle, I’d do **Option 1 now**, and schedule Option 2 as a follow-up once timeline-first chat is stable.

---

# 6) Transport: copy Pinocchio’s wsManager behavior

Your current `InventoryWebChatClient` is doing a more ad-hoc version of this. HC‑51 should just port the Pinocchio semantics:

* connect WS
* buffer events until hydrated
* `GET /api/timeline?conv_id=...`
* apply snapshot entities into timeline store
* replay buffered frames sorted by seq/stream_id
* then apply live events directly

Two important tweaks for Hypercard:

1. **Preserve `seq` + `stream_id` on the envelope type**
   Your current TS type drops them. For event viewer + debugging + replay ordering, keep them.

2. **Don’t sort by lossy `seq:number` if you can avoid it**
   If `stream_id` exists, it’s safer to sort by it (it’s a string like `"1707053365123-0"`).
   If only `seq` exists, treat it as best-effort for sorting buffered frames.

---

# 7) Concrete cutover list (what gets deleted / replaced)

### Delete (or stop using)

* `apps/inventory/src/features/chat/chatSlice.ts` **message + timeline widget message machinery**

  * round ID helpers
  * synthetic “timeline widget message”
  * “Generated Cards/Widgets panel messages”
  * timeline widget item reducers

* engine “timeline widget” components that were only there to visualize the non-entity timeline lane:

  * `packages/engine/src/hypercard-chat/widgets/TimelineWidget.tsx`
  * `packages/engine/src/hypercard-chat/widgets/ArtifactPanelWidgets.tsx`
    (unless you want them as *entity renderers*; but they shouldn’t be driven by a separate timeline-item model anymore)

### Add

In `@hypercard/engine` (or new package):

* `hypercard-chat/timeline/timelineSlice.ts` (Pinocchio-like, per convId)
* `hypercard-chat/sem/registry.ts` (Pinocchio-like)
* `hypercard-chat/sem/timelineMapper.ts` (Pinocchio-like)
* `hypercard-chat/ws/wsManager.ts` (Pinocchio-like, per convId)
* `hypercard-chat/ui/TimelineChatWindow.tsx` (entity-first renderer + composer)

In `apps/inventory`:

* replace InventoryChatWindow orchestration with:

  * `useConversationSession(convId)` that calls wsManager and connects projection to store
  * select `selectTimelineEntities(convId)`
  * render via `TimelineChatWindow` with hypercard renderers

### Keep as-is

* Event viewer:

  * your HC‑50 eventBus changes are good
  * just ensure the WS receive path always calls `emitConversationEvent(convId, envelope)` before projection

---

# 8) How this satisfies your “single path” requirement

* There is exactly **one** projection mechanism: the sem registry and its handlers.
* Both live WS events and hydrated snapshot entities are applied into the **same normalized timeline store**.
* Artifacts/cards are not “special UI constructs”; they’re timeline entities rendered with custom renderers and actions.
* The event viewer is explicitly **not** part of projection; it just shows raw envelopes.

---

