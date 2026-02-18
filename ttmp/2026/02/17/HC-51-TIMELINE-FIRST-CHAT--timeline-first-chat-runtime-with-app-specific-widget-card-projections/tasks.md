# Tasks

## TODO

- [x] Create HC-51 ticket workspace and initialize docs
- [x] Write 5+ page implementation plan with pseudocode and timeline/sequence diagrams
- [x] Maintain detailed diary for investigation and planning work
- [x] Relate implementation files and update changelog/index metadata
- [x] Upload implementation plan document to reMarkable and verify cloud path
- [x] Upload revised HC-51 implementation plan to reMarkable and verify remote path
- [x] Revise HC-51 implementation plan in depth to align with strict Pinocchio SEM->timeline architecture and hard-cutover scope
- [x] Import expert review document (/tmp/hc-51-update.md) into HC-51 sources and validate recommendations against Pinocchio docs/code
- [x] [Impl A1] Add conversation-scoped timeline core slice in engine (entities byId/order per convId, version as string)
- [x] [Impl B1] Add SEM envelope/registry contracts in engine and default handlers (timeline.upsert + llm/tool/log/ws.error)
- [x] [Impl A2] Add timeline selectors and safe version comparator using BigInt semantics
- [ ] [Impl C2] Ensure EventViewer raw-envelope emission happens at transport ingress before projection
- [ ] [Impl C1] Add conversation session transport manager with hydrate-buffer-replay flow and seq/stream_id retention
- [ ] [Impl D1] Refactor inventory store wiring to use timeline reducer and new chat runtime path
- [ ] [Impl E1] Keep artifacts slice as derived index from timeline tool_result custom kinds and preserve open/edit actions
- [ ] [Impl D2] Replace InventoryChatWindow event switch with registry-driven timeline entity handling and entity-first rendering
- [ ] [Impl F1] Remove legacy synthetic timeline widget-message path from runtime and update affected stories/tests
- [ ] [Impl F2] Run typecheck/tests, fix regressions, and update HC-51 diary/changelog per commit step
