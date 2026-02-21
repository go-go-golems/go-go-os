---
Title: QOL Improvements Implementation Analysis
Ticket: HC-01-QOL-IMPROVEMENTS
Status: active
Topics:
    - frontend
    - chat
    - debugging
    - windowing
    - ux
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: App-level chat/event-viewer window payloads
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.tsx
      Note: Event viewer scroll behavior
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/eventBus.ts
      Note: Conversation event bus semantics and lack of replay history
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/state/selectors.ts
      Note: Conversation token selectors and missing cached-token selector
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.ts
      Note: Pre-hydrate transport buffering behavior
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowTitleBar.tsx
      Note: Title rendering path causing duplicate icon/title emoji
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Top-level icon/card open behavior and dedupeKey usage
    - Path: 2026-02-12--hypercard-react/packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Reducer dedupe primitive and open/focus semantics
    - Path: 2026-02-12--hypercard-react/packages/engine/src/diagnostics/diagnosticsStore.ts
      Note: Shows ring-buffer usage limited to redux/FPS diagnostics
    - Path: 2026-02-12--hypercard-react/packages/engine/src/diagnostics/ringBuffer.ts
      Note: Clarifies ring-buffer scope (diagnostics telemetry
ExternalSources: []
Summary: Implementation analysis for seven chat/windowing quality-of-life improvements in HyperCard React.
LastUpdated: 2026-02-21T17:22:00-05:00
WhatFor: Give an implementation-ready plan (with evidence and tradeoffs) for event viewer, chat footer, and desktop windowing polish items.
WhenToUse: Use when implementing HC-01-QOL-IMPROVEMENTS or onboarding developers to these subsystems.
---



# QOL Improvements Implementation Analysis

## Executive Summary

This ticket analyzes seven requested quality-of-life improvements in `2026-02-12--hypercard-react` and groups them into three subsystem tracks:

1. **Event viewer behavior and ergonomics**
   - Scroll behavior currently forces follow-mode when new events arrive.
   - Payload copy-to-clipboard is missing.
   - Viewer cannot replay events emitted before subscription.
2. **Chat window metadata visibility**
   - Conversation cached-token totals are tracked but not surfaced in UI summary.
   - Conversation ID is available in component props but not easy to copy.
3. **Desktop windowing UX consistency**
   - Card/icon launches currently dedupe to one window per card by default.
   - Title bars can show duplicate emojis because both `icon` and `title` carry emoji prefixes.

The highest-risk change is **multi-window policy for top-level card icons** because it affects default desktop command behavior and can alter long-standing interaction expectations.

The highest-leverage low-risk changes are:

- Event viewer copy action
- Event viewer buffered-history replay
- Conversation ID copy in chat header
- Emoji dedupe cleanup

---

## Problem Statement

The current UI already has the right architecture pieces (conversation-scoped chat state, desktop windowing reducer, event viewer component), but there are targeted usability gaps that create friction during debugging and multi-window workflows.

The request is to produce one implementation-ready analysis ticket that a new intern can execute without prior codebase knowledge.

Requested improvements:

1. Scrolling back in debug event viewer jumps to end when new events arrive.
2. Add copy-to-clipboard on event payload in event viewer.
3. Display cached tokens (if available) in chat footer.
4. Allow opening multiple windows for same top-level desktop icon/card.
5. Remove double emojis in window titles.
6. Show potentially already buffered events in event viewer.
7. Add conversation ID to clipboard from window header.

---

## Scope, Goals, and Non-Goals

### Goals

- Keep all changes additive and understandable.
- Preserve existing architecture boundaries (chat runtime, event bus, windowing reducer).
- Add tests for behavior that changes.

### Non-Goals

- Re-architecting chat transport (`WsManager`) or timeline projection semantics.
- Full redesign of desktop command model.
- Changing back-end token accounting.

---

## Current Architecture (Intern Primer)

### 1. Desktop/windowing stack

- `useDesktopShellController` orchestrates icon/menu commands and opens windows.
  - Startup home window: `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:179`
  - Card-open helper: `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:323`
- `windowingSlice` owns open/focus/close and dedupe behavior.
  - Dedupe check: `packages/engine/src/desktop/core/state/windowingSlice.ts:30`
- Window title rendering happens in:
  - `packages/engine/src/components/shell/windowing/WindowSurface.tsx:52`
  - `packages/engine/src/components/shell/windowing/WindowTitleBar.tsx:28`

### 2. Chat runtime and state

- `ChatConversationWindow` binds Redux selectors + runtime hook and renders `ChatWindow`.
  - Main container: `packages/engine/src/chat/components/ChatConversationWindow.tsx:76`
- Conversation usage is tracked in chat session state.
  - `conversationCachedTokens`: `packages/engine/src/chat/state/chatSessionSlice.ts:66`
- LLM metadata is converted to usage deltas in SEM handlers.
  - Usage extraction/delta: `packages/engine/src/chat/sem/semRegistry.ts:126`
  - `llm.final` adds totals: `packages/engine/src/chat/sem/semRegistry.ts:439`

### 3. Event viewer and event bus

- Viewer component: `packages/engine/src/chat/debug/EventViewerWindow.tsx:35`
- Event bus emits conversation-scoped events from websocket envelopes.
  - Emit path: `packages/engine/src/chat/runtime/conversationManager.ts:37`
  - Bus: `packages/engine/src/chat/debug/eventBus.ts:61`
- WebSocket manager buffers raw frames until hydrate completes.
  - Buffered queue: `packages/engine/src/chat/ws/wsManager.ts:91`
  - Push-before-hydrated: `packages/engine/src/chat/ws/wsManager.ts:205`
  - Replay after hydrate: `packages/engine/src/chat/ws/wsManager.ts:338`

---

## Issue-by-Issue Analysis

## 1) Event Viewer Scroll Jumps Back To End

### What user experiences

When reviewing earlier events, new incoming events move the viewport back to the end.

### Evidence in code

- Follow mode is controlled by `autoScroll`, default `true`: `packages/engine/src/chat/debug/EventViewerWindow.tsx:43`
- On every entry-count change, component calls `scrollIntoView` if `autoScroll` is true: `packages/engine/src/chat/debug/EventViewerWindow.tsx:64`
- There is no scroll-position detection to automatically disable follow mode when user manually scrolls up.

### Root cause

The component treats follow mode as an explicit toggle only; manual scroll does not influence it.

### Recommended implementation

Add a **near-bottom detector** and auto-switch behavior:

1. Add `onScroll` handler on log container.
2. Compute `distanceFromBottom = scrollHeight - (scrollTop + clientHeight)`.
3. If distance exceeds threshold (e.g. 32 px), set `autoScroll` false.
4. If user scrolls back near bottom and explicitly re-enables follow, resume auto-scroll.

Optional UX improvement:

- Rename button text from `Pinned/Free` to `Follow/Paused` for clarity.

### Files to change

- `packages/engine/src/chat/debug/EventViewerWindow.tsx`

### Tests to add/update

- Add component tests (or lightweight behavior tests) validating:
  - Auto-scroll when at bottom.
  - No auto-scroll after manual upward scroll.
  - Re-enable follow resumes auto-scroll.

### Risks

- Very low functional risk; mainly UX semantics.

---

## 2) Copy Event Payload to Clipboard

### What user experiences

Payload can be read but not copied quickly from event viewer.

### Evidence in code

- Expanded payload only renders `SyntaxHighlight`: `packages/engine/src/chat/debug/EventViewerWindow.tsx:193`
- No clipboard utility or copy action exists in engine/app code (repo search showed none).

### Root cause

Missing interaction control for payload export.

### Recommended implementation

Add payload actions in expanded row:

1. `Copy YAML` button using existing `toYaml(...)` output.
2. Optional `Copy JSON` button for raw payload serialization.
3. Use `navigator.clipboard.writeText` with fallback (temporary `<textarea>` + `document.execCommand('copy')`) if needed.
4. Show quick feedback state (`Copied`, `Copy failed`).

### Files to change

- `packages/engine/src/chat/debug/EventViewerWindow.tsx`
- Optional new helper: `packages/engine/src/chat/debug/clipboard.ts`

### Tests to add/update

- Unit test for clipboard helper fallback behavior.
- Viewer test for copy callback triggered with expected YAML/JSON.

### Risks

- Browser permission differences for clipboard APIs.
- Need graceful fallback messaging.

---

## 3) Display Cached Tokens in Header Totals and Footer

### What user experiences

Cached-token info is partly available per turn, but the header total does not include cached usage today.

### Evidence in code

- Conversation cached tokens are stored: `packages/engine/src/chat/state/chatSessionSlice.ts:66`
- Conversation usage deltas include cached tokens: `packages/engine/src/chat/sem/semRegistry.ts:147`
- Existing selector only exposes input+output total: `packages/engine/src/chat/state/selectors.ts:119`
- `ChatConversationWindow` passes only that total into header token pill: `packages/engine/src/chat/components/ChatConversationWindow.tsx:109`
- `StatsFooter` already displays per-turn cache fields (`Cache`, `CacheWrite`) when present: `packages/engine/src/chat/components/StatsFooter.tsx:47`

### Root cause

Conversation cached totals are tracked in session state but excluded from the header total selector, and footer cache presentation is only partial.

### Recommended implementation

Align token semantics by scope:

1. **Header = conversation totals**
   - Update total selector so header token count includes cached totals.
   - Preferred behavior: `conversationTotal = input + output + cached`.
   - Keep header compact (single number) because it is an at-a-glance total.
2. **Footer = last message/turn stats**
   - Keep per-turn cache fields in footer (`Cache`, `CacheWrite`) and add `CacheRead` when present so last-message cache behavior is explicit.
   - Footer remains the detailed diagnostics area for message-level stats.

Suggested selector/API shape:

- Add `selectConversationCachedTokens(state, convId)` for direct access.
- Add `selectConversationTotalTokensIncludingCache(state, convId)` (or change existing selector semantics with corresponding test updates).

### Files to change

- `packages/engine/src/chat/state/selectors.ts`
- `packages/engine/src/chat/components/ChatConversationWindow.tsx`
- `packages/engine/src/chat/components/StatsFooter.tsx`
- `packages/engine/src/chat/state/selectors.test.ts`

### Tests to add/update

- Selector tests for cached-token selector and updated header total semantics.
- Footer render tests for per-turn cache fields (`Cache`, `CacheWrite`, `CacheRead`) when present.

### Risks

- Low; mostly semantics/wording.
- Changing `selectConversationTotalTokens` behavior may impact any downstream code/tests that assumed input+output-only totals.

---

## 4) Allow Multiple Windows For Same Top-Level Icon/Card

### What user experiences

Clicking the same top-level card/icon focuses existing window instead of opening another one.

### Evidence in code

- Dedupe behavior in reducer: `packages/engine/src/desktop/core/state/windowingSlice.ts:30`
- Card open helper always passes `dedupeKey: cardId`: `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:338`
- Startup home also uses `dedupeKey: stack.homeCard`: `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:197`
- Unit tests codify current dedupe expectation:
  - `packages/engine/src/__tests__/windowing.test.ts:133`
  - no-dedupe behavior also exists and is valid: `packages/engine/src/__tests__/windowing.test.ts:148`

### Root cause

Controller-level payload construction opts into dedupe for all card launches.

### Recommended implementation

#### Preferred plan

Introduce explicit open policy at controller command layer:

- `openCardWindow(cardId, options?: { dedupe?: boolean })`
- For top-level icon/menu card opens: call with `dedupe: false`.
- Keep startup-home dedupe as-is (or separate startup key) to avoid accidental duplicate on init path.

This preserves flexibility for future commands that still want focus-existing behavior.

#### Simpler alternative (acceptable if fast path needed)

- Remove `dedupeKey` from standard card open payloads entirely.
- Keep reducer logic unchanged.

### Files to change

- `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
- Potentially `packages/engine/src/components/shell/windowing/desktopContributions.ts` (if command context signature changes)

### Tests to add/update

- Add/adjust controller-level tests (or story behavior assertions) ensuring repeated icon open creates distinct windows.
- Keep reducer dedupe tests; they remain valid as primitive behavior.

### Risks

- Behavior change may surprise users who expected “focus existing”.
- More open windows can increase clutter/perf if abused.

---

## 5) Remove Double Emojis in Window Titles

### What user experiences

Some windows show duplicated leading emoji in title bars.

### Evidence in code

- App payloads often include emoji in both `title` and `icon`:
  - Chat: `apps/inventory/src/App.tsx:35` and `apps/inventory/src/App.tsx:36`
  - Event viewer: `apps/inventory/src/App.tsx:103` and `apps/inventory/src/App.tsx:104`
- Title bar always prepends icon string before title: `packages/engine/src/components/shell/windowing/WindowTitleBar.tsx:29`

### Root cause

Presentation layer assumes `title` is plain text, but some payloads embed icon glyphs directly.

### Recommended implementation

Two-layer fix (robust):

1. **Data hygiene**: normalize app payload titles to text-only in `App.tsx`.
   - e.g. `'Inventory Chat'` instead of `'💬 Inventory Chat'`.
2. **Defensive rendering**: in `WindowTitleBar`, avoid rendering duplicate prefix when title already starts with same icon.

This prevents regressions from future payloads.

### Files to change

- `apps/inventory/src/App.tsx`
- `packages/engine/src/components/shell/windowing/WindowTitleBar.tsx`

### Tests to add/update

- Title bar unit test for icon+title dedupe behavior.
- Optional snapshot/story verification for inventory windows.

### Risks

- Very low.

---

## 6) Show Potentially Already Buffered Events in Event Viewer

### What user experiences

If event viewer opens after conversation already emitted events, early events may be missing.

### Evidence in code

- Event bus only delivers to active listeners; it exits early if none exist: `packages/engine/src/chat/debug/eventBus.ts:62`
- `subscribeConversationEvents` only registers callback and does not replay prior events: `packages/engine/src/chat/debug/eventBus.ts:88`
- Event bus tests cover delivery/isolation/unsubscribe only; no replay semantics: `packages/engine/src/chat/debug/eventBus.test.ts:12`
- `WsManager` buffers raw frames pre-hydrate and replays to SEM timeline later: `packages/engine/src/chat/ws/wsManager.ts:205` and `packages/engine/src/chat/ws/wsManager.ts:338`
- Conversation manager emits envelopes to event bus even before hydrate completion: `packages/engine/src/chat/runtime/conversationManager.ts:37`

Clarification about existing buffering:

- There **is** a reusable ring-buffer implementation in the repo, but it is for diagnostics telemetry (`packages/engine/src/diagnostics/ringBuffer.ts:1`, used by `packages/engine/src/diagnostics/diagnosticsStore.ts:14`), not chat event viewer history.
- `EventViewerWindow` has only local bounded state (`MAX_ENTRIES = 500`) while mounted: `packages/engine/src/chat/debug/EventViewerWindow.tsx:7`.
- `WsManager.buffered` is a temporary pre-hydrate queue, not a persistent debug history: `packages/engine/src/chat/ws/wsManager.ts:91`.

### Root cause

Transport and diagnostics have their own buffers, but the chat debug event bus has no retained per-conversation history for late subscribers.

### Recommended implementation

Add conversation-scoped retained history in event bus (ring-style cap):

1. New `historyMap: Map<string, EventLogEntry[]>` with cap (e.g. 500 or 1000).
2. `emitConversationEvent` should append to history **regardless of listener count**.
3. Add API:
   - `getConversationEvents(convId, options?)`
   - Or extend `subscribeConversationEvents(convId, callback, { replay: true | n })`
4. `EventViewerWindow` initializes from bus history when no explicit `initialEntries` were provided.
5. `Clear` should clear local view and optionally clear bus history for that conversation.

Implementation note:

- Reusing `diagnostics/ringBuffer.ts` is possible, but a small local capped-array implementation in `eventBus.ts` is also acceptable if we want to avoid cross-subsystem coupling.

### Files to change

- `packages/engine/src/chat/debug/eventBus.ts`
- `packages/engine/src/chat/debug/EventViewerWindow.tsx`
- `packages/engine/src/chat/debug/eventBus.test.ts`

### Tests to add/update

- Replay-on-subscribe test.
- History cap pruning test.
- Clear-history behavior test (if implemented).

### Risks

- Memory growth if cap not enforced.
- Clear semantics need clear UX when multiple viewers are open.

---

## 7) Add Conversation ID Copy from Window Header

### What user experiences

Conversation ID exists but is not quickly copyable from the chat window UI.

### Evidence in code

- `InventoryChatAssistantWindow` has `convId` and already renders custom header actions: `apps/inventory/src/App.tsx:125`
- Current header actions include only `Events` and `Debug` buttons: `apps/inventory/src/App.tsx:138`
- `ChatConversationWindow` accepts `headerActions` slot: `packages/engine/src/chat/components/ChatConversationWindow.tsx:36`

### Root cause

Missing UI action and clipboard wiring in header action slot.

### Recommended implementation

Add a lightweight `Copy Conv ID` action in existing header actions:

1. Add button near `Events` with tooltip showing full ID.
2. Copy full `convId` to clipboard.
3. Optional short success state (`Copied`) for 1-2 seconds.

Optional extension:

- Move this into reusable ChatConversationWindow prop if other apps need it.

### Files to change

- `apps/inventory/src/App.tsx`
- Optional shared utility as in Issue #2.

### Tests to add/update

- App-level interaction test (or story/play test) verifying clipboard call with `convId`.

### Risks

- Low; straightforward UI enhancement.

---

## Design Decisions

1. **Keep reducer primitives unchanged where possible**
   - `windowingSlice` dedupe logic remains a primitive; behavior policy lives at call site.
2. **Treat debug event stream as a first-class timeline for observers**
   - Late viewer openings should not lose already-seen transport events.
3. **Prefer additive diagnostics in footer over overloaded header counters**
   - Cached-token context belongs in detailed stats line.

---

## Alternatives Considered

### Event history replay location

- **Option A (recommended):** ring buffer in `eventBus`.
  - Pro: aligns with viewer subscription API.
  - Con: duplicates some timeline info.
- **Option B:** read from timeline store only.
  - Pro: no extra memory map.
  - Con: loses non-timeline/debug-only envelope details.

### Multi-window behavior

- **Option A (recommended):** command-layer policy to open new for top-level icons/cards.
- **Option B:** global removal of dedupe usage.
  - Faster, but less controllable for future commands.

### Emoji cleanup

- **Option A (recommended):** clean payload titles + defensive titlebar sanitizer.
- **Option B:** payload cleanup only.
  - Works short-term but can regress when new payloads include emoji titles.

---

## Implementation Plan

## Phase 1 (Low-risk, high-leverage)

1. Event viewer: payload copy action.
2. Event bus: retained history + replay API.
3. Event viewer: initialize from retained history.
4. Token metrics: include cached in header total and keep cache details in footer last-message stats.
5. Conversation ID copy button in chat header.
6. Emoji dedupe cleanup.

## Phase 2 (UX behavior)

1. Event viewer follow-mode auto-disable on manual scroll-up.
2. Improve follow-mode button labels/state.

## Phase 3 (Windowing behavior change)

1. Introduce open policy for card/icon launches.
2. Switch top-level icon/card commands to open-new behavior.
3. Add/update tests and story scenarios for repeated opens.

---

## Validation Checklist

1. Event viewer opened late shows recent prior events.
2. Scrolling up in viewer does not snap back on new events unless follow is re-enabled.
3. Clicking payload copy copies YAML/JSON and shows feedback.
4. Header token total includes cached tokens.
5. Footer shows last-message cache stats when available.
6. Repeated opening of same card icon creates separate windows/sessions.
7. Window title bar shows a single emoji prefix.
8. Header action copies full conversation ID.

---

## Open Questions

1. For event history clear: should clear affect only local viewer state or shared per-conversation bus history?
2. For multi-window policy: should menu command `window.open.card.*` also open new always, or should there be separate `focus existing` command?
3. For header wording: should the label remain `tok` or become explicit (for example `total tok`) now that cache is included?

---

## References

- `packages/engine/src/chat/debug/EventViewerWindow.tsx:35`
- `packages/engine/src/chat/debug/EventViewerWindow.tsx:7`
- `packages/engine/src/chat/debug/eventBus.ts:61`
- `packages/engine/src/chat/debug/eventBus.test.ts:12`
- `packages/engine/src/chat/runtime/conversationManager.ts:37`
- `packages/engine/src/chat/ws/wsManager.ts:205`
- `packages/engine/src/chat/ws/wsManager.ts:338`
- `packages/engine/src/diagnostics/ringBuffer.ts:1`
- `packages/engine/src/diagnostics/diagnosticsStore.ts:14`
- `packages/engine/src/chat/components/ChatConversationWindow.tsx:76`
- `packages/engine/src/components/widgets/ChatWindow.tsx:89`
- `packages/engine/src/chat/components/StatsFooter.tsx:39`
- `packages/engine/src/chat/state/chatSessionSlice.ts:66`
- `packages/engine/src/chat/state/selectors.ts:119`
- `packages/engine/src/chat/sem/semRegistry.ts:126`
- `packages/engine/src/chat/sem/semRegistry.ts:439`
- `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:323`
- `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:338`
- `packages/engine/src/desktop/core/state/windowingSlice.ts:27`
- `packages/engine/src/__tests__/windowing.test.ts:133`
- `packages/engine/src/__tests__/windowing.test.ts:148`
- `packages/engine/src/components/shell/windowing/WindowSurface.tsx:52`
- `packages/engine/src/components/shell/windowing/WindowTitleBar.tsx:29`
- `apps/inventory/src/App.tsx:31`
- `apps/inventory/src/App.tsx:99`
- `apps/inventory/src/App.tsx:125`
