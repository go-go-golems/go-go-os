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

- [ ] HC58-IMPL-01 Runtime core scaffold:
  `packages/engine/src/hypercard-chat/conversation/runtimeCore.ts` (new), symbols to add:
  `ConversationRuntimeState`, `ConversationMutation`, `createConversationRuntime`, `applyConversationMutations`
- [ ] HC58-IMPL-02 Structured stream channels:
  `runtimeCore.ts` (new) + `packages/engine/src/hypercard-chat/sem/types.ts`, symbols:
  `stream.open`, `stream.apply`, `stream.finalize`, `stream.error`, `StreamFragment`
- [ ] HC58-IMPL-03 Alias/canonical identity map:
  `runtimeCore.ts` (new) + `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`, symbols:
  `aliasToCanonical`, `resolveCanonicalId`, integrate with existing `rekeyEntity`
- [ ] HC58-IMPL-04 Transaction apply path:
  `runtimeCore.ts` (new) + `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`, symbols:
  `applyMutationTransaction`, one-commit reducer semantics for correlated mutations
- [ ] HC58-IMPL-05 Manager-owned lifecycle:
  `packages/engine/src/hypercard-chat/conversation/manager.ts` (new), symbols:
  `ConversationManager`, `getRuntime(conversationId)`, `claimConnection()`, `release()`
- [ ] HC58-IMPL-06 Move socket ownership off hooks:
  `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`,
  replace hook-owned `createClient/connect/close` flow with manager subscription symbols
- [ ] HC58-IMPL-07 Runtime SEM handler migration:
  `packages/engine/src/hypercard-chat/sem/registry.ts`,
  move generic meta handling (`llm.start`, `llm.delta`, `llm.final`, `ws.error`) into runtime-owned mutation handlers
- [ ] HC58-IMPL-08 Inventory adapter narrowing:
  `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`, keep only domain side effects:
  `createInventoryArtifactProjectionAdapter`, remove generic metadata responsibilities
- [ ] HC58-IMPL-09 Runtime selector/hooks API:
  `packages/engine/src/hypercard-chat/conversation/selectors.ts` (new), symbols:
  `useConversationConnection`, `useTimelineIds`, `useTimelineEntity`, `useStreamChannel`, `useMeta`
- [ ] HC58-IMPL-10 Inventory migration to runtime selectors:
  `apps/inventory/src/features/chat/InventoryChatWindow.tsx` + `apps/inventory/src/features/chat/chatSlice.ts`,
  remove app-owned runtime meta (`connectionStatus`, `lastError`, `modelName`, turn/stream stats)
- [ ] HC58-IMPL-11 Timeline-native view cutover:
  add `packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx` (new),
  route timeline UI through runtime selectors instead of wrapper chain
- [ ] HC58-IMPL-12 Remove wrapper chain:
  remove/retire `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`,
  `packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx`,
  `packages/engine/src/components/widgets/ChatWindow.tsx` from timeline runtime path
- [ ] HC58-IMPL-13 Exports/API cleanup:
  `packages/engine/src/hypercard-chat/index.ts`, `packages/engine/src/index.ts`,
  remove stale exports tied to deleted wrappers
- [ ] HC58-IMPL-14 Unit test coverage:
  add tests around reducer/runtime symbols:
  alias resolution, version precedence, structured stream apply/finalize, transaction atomicity
- [ ] HC58-IMPL-15 Integration test coverage:
  duplicate replay, out-of-order frame handling (`event.seq`, `event.stream_id`),
  reconnect hydration reconciliation in runtime connection path
- [ ] HC58-IMPL-16 Multi-window shared-connection test:
  assert two windows on one conversation share a single manager-owned transport claim
- [ ] HC58-IMPL-17 Story/docs alignment:
  update runtime stories/docs to new manager + timeline-native symbols and removed wrapper APIs
- [ ] HC58-IMPL-18 Final validation gate:
  `npm run typecheck` + focused runtime/inventory tests + regression smoke for inventory chat window
- [ ] HC58-IMPL-19 Diary/changelog discipline:
  append per-phase diary entries with commit hashes and update changelog each completed task
