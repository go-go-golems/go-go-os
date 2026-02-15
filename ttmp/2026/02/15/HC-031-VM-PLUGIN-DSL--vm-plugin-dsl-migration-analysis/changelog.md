# Changelog

## 2026-02-15

- Initial workspace created


## 2026-02-15

Created HC-031 ticket docs, imported `/tmp/plugin-hypercard-dsl.md`, and mapped both runtime architectures (`vm-system/frontend` plugin runtime and current HyperCard card DSL runtime) with file-level evidence and migration impact metrics.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/sources/local/plugin-hypercard-dsl.md — Imported proposal source used as migration baseline
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/vm-system/frontend/packages/plugin-runtime/src/runtimeService.ts — Real plugin VM bootstrap and execution contract analyzed
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/vm-system/frontend/packages/plugin-runtime/src/redux-adapter/store.ts — Capability and dispatch timeline model analyzed
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/cards/runtime.ts — Legacy DSL resolver/action runtime analyzed for removal


## 2026-02-15

Published full HC-031 design document with no-backwards-compat rip-out strategy for `Act/Ev/Sel` DSL and dedicated Storybook integration plan.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md — Primary 7+ page analysis deliverable
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md — Detailed work log with command-level evidence
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Updated task tracking for analysis and publication


## 2026-02-15

Completed ticket hygiene and publication flow: ran `docmgr doctor` (resolved unknown topics + source frontmatter issue, one intentional warning remains for imported source filename numeric prefix) and uploaded final PDF to reMarkable.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/vocabulary.yaml — Added `dsl` and `frontend` topics used by HC-031
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/sources/local/plugin-hypercard-dsl.md — Added frontmatter for doctor compatibility
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked T7/T8 complete

### Publication

- Uploaded: `01-vm-plugin-dsl-migration-and-storybook-integration-analysis.pdf`
- Remote directory: `/ai/2026/02/15/HC-031-VM-PLUGIN-DSL`
- Verification: `remarquee cloud ls /ai/2026/02/15/HC-031-VM-PLUGIN-DSL --long --non-interactive`


## 2026-02-15

Closed the earlier vm-system test execution gap by installing `../vm-system/frontend` dependencies and running plugin-runtime integration tests successfully.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/vm-system/frontend/package.json — Workspace where dependencies were installed and tests executed
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/vm-system/frontend/packages/plugin-runtime/src/runtimeService.integration.test.ts — Integration test suite executed (6 passing tests)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md — Step 6 with exact commands and outcomes

### Validation

- `pnpm --dir ../vm-system/frontend install` — success
- `pnpm --dir ../vm-system/frontend exec vitest run --config vitest.integration.config.ts packages/plugin-runtime/src/runtimeService.integration.test.ts` — pass (1 file, 6 tests)
- `pnpm --dir ../vm-system/frontend test:integration` — pass


## 2026-02-15

Expanded HC-031 execution planning into a phased hard-cutover backlog (A-G) with explicit runtime migration scope, legacy DSL deletion tasks, and test gates including tmux process checks and Playwright smoke validation.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Added detailed hard-cutover execution phases and validation checkpoints
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md — Added Step 7 describing planning expansion and rationale


## 2026-02-15

Implemented HC-031 Phase A runtime foundation in engine with QuickJS-backed plugin runtime modules, worker transport, schema validators, integration tests, and package exports. Fixed transitional typecheck issues (export symbol collision + worker pending typing) and completed Phase A validation.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/runtimeService.ts — Added session-scoped QuickJS runtime service (`loadStackBundle/renderCard/eventCard/disposeSession`)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/contracts.ts — Added engine-native worker/runtime contracts and intent schema types
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/worker/runtime.worker.ts — Added worker request handler wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/worker/sandboxClient.ts — Added host-side worker client transport
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/runtimeService.integration.test.ts — Added runtime integration coverage for load/render/event/dispose/timeout
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/index.ts — Exported plugin-runtime modules at package root
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/package.json — Added `quickjs-emscripten` dependency
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked `A1..A6` complete
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md — Added Step 8 implementation log and validation details

### Validation

- `npm run test -w packages/engine` — pass (`8` files, `102` tests)
- `npm run typecheck -w packages/engine` — pass (after resolving initial TS2308/TS2322 issues)
- `npm run build -w packages/engine` — pass

### Commit

- `c92c26b` — `feat(engine): add plugin runtime foundation (Phase A)`


## 2026-02-15

Implemented HC-031 Phase B host-state layer: `pluginCardRuntime` Redux slice with capability-gated intent ingestion, outcome timeline, and domain/system/nav pending intent queues. Wired reducer into `createAppStore` and added reducer tests for routing and lifecycle cleanup.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts — New runtime host-state reducer and intent ingestion pipeline
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts — Domain/system capability authorization logic
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/pluginCardRuntime/selectors.ts — Selectors for sessions, card/session state, timeline, and pending queues
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts — Added `pluginCardRuntime` reducer to default app store
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/__tests__/plugin-card-runtime.test.ts — Added reducer behavior coverage for applied/denied/ignored and nav/system routing
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked B1-B5 complete

### Validation

- `npm run test -w packages/engine` — pass (`9` files, `105` tests)
- `npm run typecheck -w packages/engine` — pass
- `npm run build -w packages/engine` — pass

### Commit

- `583fe38` — `feat(engine): add plugin card runtime redux slice (Phase B)`
