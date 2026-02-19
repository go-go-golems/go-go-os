# Tasks

## TODO

- [x] Add tasks here

- [x] Validate proposal against current engine/inventory runtime implementation
- [x] Close HC-57 and create HC-58 ticket workspace
- [x] Import and review /tmp/chat-runtime-chatgpt-pro.md source
- [x] Write corrected detailed analysis and maintain diary in HC-58
- [x] Add concrete inventory chatSlice extraction details and remove-suggestions policy
- [x] Remove projectionMode/timeline-upsert-only gating from runtime and callers
- [x] Create detailed HC-58 implementation task breakdown for code phase
- [x] Simplify projected connection hook path after projectionMode removal
- [x] Run typecheck/tests for HC-58 touched surfaces
- [x] Update runtime stories and inventory integration for no-gating path
- [x] Update HC-58 diary/changelog and commit each phase

## Implementation Backlog (Up Front)

- [ ] Add runtime core module with conversation-scoped state container and reducer entrypoint
- [ ] Introduce structured stream-channel state (`stream.open/apply/finalize/error`) in runtime reducer
- [ ] Add canonical/alias ID map handling in runtime state and mutation pipeline
- [ ] Add transaction/batched mutation apply path to avoid transient inconsistent intermediate UI state
- [ ] Move transport lifecycle ownership from hook-local clients to manager-owned runtime instances
- [ ] Implement `ConversationManager` with per-conversation runtime cache and connection claim/release refcount
- [ ] Refactor `useProjectedChatConnection` into subscription-only usage over manager/runtime instead of owning sockets
- [ ] Port generic metadata projection (`llm.start/delta/final`, `ws.error`) from inventory adapters into runtime-core handlers
- [ ] Keep inventory adapters only for domain-side effects (artifact/runtime-card projection), remove generic runtime concerns
- [ ] Expose selector/hook API for runtime consumers (`connection`, `timeline`, `streams`, `meta`)
- [ ] Add timeline-native conversation view path and wire inventory to consume runtime selectors directly
- [ ] Remove `TimelineChatRuntimeWindow -> TimelineChatWindow -> ChatWindow` chain from primary timeline chat path
- [ ] Delete wrapper-only runtime exports and stale API surface after timeline-native cutover
- [ ] Remove inventory `chatSlice` runtime metadata ownership (`connectionStatus`, `lastError`, model/stats, stream counters)
- [ ] Add reducer unit tests for alias resolution, version precedence, structured stream updates, and transaction semantics
- [ ] Add runtime integration tests for duplicate envelope replay, out-of-order frame handling, and reconnect hydration reconciliation
- [ ] Add multi-window conversation test (two windows, one conversation, one shared connection) and verify claim/release behavior
- [ ] Update stories/docs to reflect runtime manager + timeline-native APIs and removed legacy wrappers
- [ ] Run final typecheck and targeted runtime/inventory test suites for cutover readiness
- [ ] Update HC-58 diary/changelog with commit-by-commit trace for each implementation phase
