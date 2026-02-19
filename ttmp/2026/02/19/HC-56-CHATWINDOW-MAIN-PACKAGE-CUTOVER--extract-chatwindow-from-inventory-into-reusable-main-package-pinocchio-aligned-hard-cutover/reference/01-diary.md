---
Title: Diary
Ticket: HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - webchat
    - timeline
    - cleanup
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: |-
        Inventory host cutover to consume shared runtime instead of owning projection lifecycle.
        Step 1 host integration cutover (commit 09dee0a)
    - Path: packages/engine/src/components/widgets/HypercardArtifactPanelWidgets.stories.tsx
      Note: Step 2 package story ownership move (commit f183e9f)
    - Path: packages/engine/src/components/widgets/HypercardTimelineWidget.stories.tsx
      Note: Step 2 package story ownership move (commit f183e9f)
    - Path: packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx
      Note: Step 2 runtime seam story contract coverage (commit f183e9f)
    - Path: packages/engine/src/components/widgets/TimelineChatWindow.stories.tsx
      Note: Step 2 package story ownership move (commit f183e9f)
    - Path: packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx
      Note: |-
        New shared runtime boundary that owns connection/projection wiring and TimelineChatWindow composition.
        Step 1 shared runtime boundary (commit 09dee0a)
    - Path: packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx
      Note: |-
        Renderer pack lifecycle hardening with idempotent registration and explicit unregistration.
        Step 1 registration lifecycle hardening (commit 09dee0a)
    - Path: ttmp/2026/02/19/HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER--extract-chatwindow-from-inventory-into-reusable-main-package-pinocchio-aligned-hard-cutover/design/01-chatwindow-main-package-hard-cutover-implementation-plan.md
      Note: Step 3 deletion-policy and story ownership finalization
    - Path: ttmp/2026/02/19/HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER--extract-chatwindow-from-inventory-into-reusable-main-package-pinocchio-aligned-hard-cutover/tasks.md
      Note: Step 3 task closure evidence
ExternalSources: []
Summary: Step-by-step implementation log for HC-56 execution, including commits, validations, risks, and follow-ups.
LastUpdated: 2026-02-19T15:56:00-05:00
WhatFor: Provide a continuation-safe implementation record for the HC-56 hard cutover workstream.
WhenToUse: Use while implementing or reviewing HC-56 changes and commit-by-commit task completion.
---




# Diary

## Goal

Track the HC-56 hard cutover from inventory-owned chat orchestration to a reusable engine runtime, with commit checkpoints, validation evidence, and explicit risk notes.

## Step 1: Introduce shared runtime boundary and cut inventory over to host role

I implemented the first HC-56 cutover checkpoint by creating a reusable runtime boundary in `@hypercard/engine` and rewiring inventory to consume that boundary. This moves connection/projection/wiring concerns out of the app component and into shared package code.

The step intentionally preserves existing feature behavior while enforcing architecture ownership transfer. Inventory now binds domain callbacks and UI concerns, while the runtime package owns lifecycle orchestration.

### Prompt Context

**User prompt (verbatim):** "Work on docmgr ticket HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER . Keep a frequent diary. 

As you work through the tasks, commit at opportune intervals and check the tasks off."

**Assistant interpretation:** Execute HC-56 implementation tasks end-to-end, update ticket docs continuously, and commit in staged checkpoints.

**Inferred user intent:** Complete the technical cutover while leaving a high-quality execution trail (tasks/changelog/diary) that can be audited.

**Commit (code):** `09dee0a` — "Extract shared timeline chat runtime and host cutover"

### What I did

- Added `TimelineChatRuntimeWindow` in `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx` as a reusable runtime entry point.
- Added explicit host callbacks (`onOpenArtifact`, `onEditCard`, raw envelope/status/error hooks) and projection mode (`timeline-upsert-only` vs `all-events`).
- Updated runtime ingestion flow so adapters can still run when projection is intentionally skipped:
  - added `runProjectionAdapters` in `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
  - used it from `useProjectedChatConnection` skip path.
- Hardened widget pack registration lifecycle in `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`:
  - idempotent namespace registration
  - ref-counted unregistration handle
  - explicit `unregisterHypercardWidgetPack` helper.
- Updated widget-pack tests in `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.test.ts`.
- Rewired `apps/inventory/src/features/chat/InventoryChatWindow.tsx` to consume `TimelineChatRuntimeWindow`, remove direct `useProjectedChatConnection` ownership, and keep only host/business callbacks.
- Exported new runtime surface through `packages/engine/src/hypercard-chat/index.ts`.

### Why

- HC-56 requires strict ownership transfer: reusable runtime in engine, app as host adapter.
- Upsert-only projection mode enforces timeline durability as the primary UI source while preserving adapter side effects needed for stats/suggestions/artifacts.

### What worked

- `npm run typecheck -w packages/engine`
- `npx tsc -p apps/inventory/tsconfig.json --noEmit`
- `npx vitest run packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.test.ts packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.test.ts apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts`

### What didn't work

- Initial inventory typecheck failed because `TimelineChatRuntimeWindow` export had not propagated at first run:
  - command: `npx tsc -p apps/inventory/tsconfig.json --noEmit`
  - error: `TS2724: '@hypercard/engine' has no exported member named 'TimelineChatRuntimeWindow'.`
- Resolution: confirmed barrel exports and reran after dependency graph refresh; typecheck passed.

### What I learned

- Adapter side effects must be decoupled from projection eligibility; otherwise upsert-only filtering silently drops metadata workflows.
- Runtime boundary extraction is safest when host callbacks are explicit and typed before moving orchestration.

### What was tricky to build

- Tricky point: upsert-only projection conflicts with llm/tool side-effect adapters if skip paths short-circuit everything.
- Symptom: metadata/adapters would not execute for filtered envelopes.
- Approach: added `runProjectionAdapters(...)` and called it from the skip branch in `useProjectedChatConnection`, passing an empty projected result.

### What warrants a second pair of eyes

- Verify that `projectionMode="timeline-upsert-only"` aligns with backend event guarantees in all environments.
- Review ref-count semantics in widget pack registration for correctness under multiple mounting/unmounting hosts.

### What should be done in the future

- Complete remaining HC-56 items: package-owned story contracts, legacy story/helper cleanup, final grep gates, and full task closeout.

### Code review instructions

- Start with `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`.
- Then inspect integration in `apps/inventory/src/features/chat/InventoryChatWindow.tsx`.
- Validate adapter skip-path behavior in `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts` and `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`.
- Re-run:
  - `npm run typecheck -w packages/engine`
  - `npx tsc -p apps/inventory/tsconfig.json --noEmit`
  - `npx vitest run packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.test.ts packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.test.ts apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts`

### Technical details

- New projection mode contract:
  - `all-events`: project all envelopes.
  - `timeline-upsert-only`: project only `timeline.upsert`; adapters still execute for non-projected envelopes.
- Widget pack registration contract:
  - `registerHypercardWidgetPack(...)` now returns `{ namespace, unregister }`.
  - duplicate namespace registrations are idempotent with ref counting.

## Step 2: Move extracted chat/widget stories into engine package and add runtime contract story

I moved component-level chat/widget stories from `apps/inventory` to `packages/engine` so ownership matches the HC-56 runtime extraction boundary. This removes duplicate app-story surfaces for engine-owned components.

I also added a dedicated `TimelineChatRuntimeWindow` story to exercise the new runtime seam with explicit host callbacks and unknown-widget fallback coverage.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Continue executing open HC-56 tasks with staged commits and keep implementation diary updates frequent.

**Inferred user intent:** Finish architecture and documentation cutover while preserving reviewability through incremental evidence.

**Commit (code):** `f183e9f` — "Move chat stories into engine and add runtime story contracts"

### What I did

- Moved story ownership from app to engine package:
  - `apps/inventory/src/features/chat/stories/TimelineChatWindow.stories.tsx` -> `packages/engine/src/components/widgets/TimelineChatWindow.stories.tsx`
  - `apps/inventory/src/features/chat/stories/InventoryTimelineWidget.stories.tsx` -> `packages/engine/src/components/widgets/HypercardTimelineWidget.stories.tsx`
  - `apps/inventory/src/features/chat/stories/InventoryArtifactPanelWidgets.stories.tsx` -> `packages/engine/src/components/widgets/HypercardArtifactPanelWidgets.stories.tsx`
- Added `packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx`.
- Updated moved stories to engine-local imports and `Engine/Widgets/*` taxonomy titles.
- Added runtime story variants:
  - default contract
  - debug mode
  - unknown widget fallback.

### Why

- Story ownership needed to match runtime/module ownership after the extraction.
- HC-56 storybook contract requires runtime + renderer-pack coverage at package boundary.

### What worked

- `npm run storybook:check`
- `npm run typecheck -w packages/engine`
- `npx tsc -p apps/inventory/tsconfig.json --noEmit`

### What didn't work

- N/A

### What I learned

- Story taxonomy checks are a strong guardrail for architectural ownership drift when extracting shared UI/runtime modules.

### What was tricky to build

- Tricky point: ensuring moved stories still render correctly without importing through `@hypercard/engine` from inside engine package story files.
- Symptom: potential circular/self-package resolution ambiguity.
- Approach: switched moved stories to direct relative imports from `packages/engine/src` internals.

### What warrants a second pair of eyes

- Confirm that all remaining `Apps/Inventory/Chat/*` stories are truly host/app-specific and not package-owned duplicates.

### What should be done in the future

- Finalize ticket docs (plan/deletion policy/checklist), run validation gates, and close remaining bookkeeping tasks.

### Code review instructions

- Review story moves and titles in:
  - `packages/engine/src/components/widgets/TimelineChatWindow.stories.tsx`
  - `packages/engine/src/components/widgets/HypercardTimelineWidget.stories.tsx`
  - `packages/engine/src/components/widgets/HypercardArtifactPanelWidgets.stories.tsx`
  - `packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx`
- Validate:
  - `npm run storybook:check`
  - `npm run typecheck -w packages/engine`
  - `npx tsc -p apps/inventory/tsconfig.json --noEmit`

### Technical details

- Story taxonomy now places extracted chat runtime/widget stories under `Engine/Widgets/*` to match package ownership.
- Runtime seam story avoids websocket dependencies by using a no-op client and fixture timeline entities.

## Step 3: Run validation gates, finalize deletion policy docs, and close checklist

I ran the HC-56 validation matrix commands and grep gates, then completed the remaining ticket checklist items. I also updated the implementation plan to reflect final story ownership paths and explicit deletion targets for the hard cutover.

This step was focused on closure quality: proving runtime/story cutover correctness and leaving the ticket docs aligned with actual file ownership and migration outcomes.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Finish task closure with validation evidence and keep diary/task/changelog synchronization current.

**Inferred user intent:** End the ticket with clear completion proof, not just code changes.

### What I did

- Ran validation commands:
  - `npm run storybook:check`
  - `npm run typecheck -w packages/engine`
  - `npx tsc -p apps/inventory/tsconfig.json --noEmit`
  - `npx vitest run apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts apps/inventory/src/features/chat/webchatClient.test.ts packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.test.ts packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.test.ts packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.test.ts packages/engine/src/hypercard-chat/sem/registry.test.ts packages/engine/src/hypercard-chat/sem/timelineMapper.test.ts`
- Ran grep gates and reviewed results:
  - ownership gate (`projectSemEnvelope` / `useProjectedChatConnection`) passes in runtime code path; remaining hits are test-only.
  - custom-kind legacy route grep has no active-code hits.
  - `legacy|compat|fallback` grep matches only generic fallback naming (`fallbackPrefix`, generated fallback IDs) and test fixture labels, not compatibility branches.
- Updated HC-56 design plan with final story file targets and explicit file deletion checklist.
- Checked off remaining tasks: `1,5,7,8,9` (all tasks now complete).

### Why

- Validation and explicit deletion policy are required for no-backcompat cutover confidence.
- Task closure must be tied to concrete command evidence and grep outputs.

### What worked

- Storybook taxonomy check passed (`49` story files).
- Engine and inventory typechecks passed.
- All targeted runtime/projection/widget tests passed (`7` files / `27` tests).
- `docmgr task check` reports full checklist completion.

### What didn't work

- N/A

### What I learned

- Grep gates should be interpreted with path/test context; broad keywords like `fallback` are useful but need manual triage to avoid false positives.

### What was tricky to build

- Tricky point: enforcing strict no-backcompat checks without over-flagging legitimate fallback variables and test fixtures.
- Symptom: broad regex results produced non-actionable hits.
- Approach: re-ran grep with test exclusions and manually classified residual hits as non-compatibility naming.

### What warrants a second pair of eyes

- Final reviewer should independently run the same grep gates and confirm no app-owned orchestration logic leaked back into inventory runtime code.

### What should be done in the future

- Optional: run full workspace test/build matrix (`npm run test`, full storybook build) before release cut if CI policy requires broader coverage than ticket-local validation.

### Code review instructions

- Start with updated ticket artifacts:
  - `ttmp/2026/02/19/HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER--extract-chatwindow-from-inventory-into-reusable-main-package-pinocchio-aligned-hard-cutover/tasks.md`
  - `ttmp/2026/02/19/HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER--extract-chatwindow-from-inventory-into-reusable-main-package-pinocchio-aligned-hard-cutover/design/01-chatwindow-main-package-hard-cutover-implementation-plan.md`
  - `ttmp/2026/02/19/HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER--extract-chatwindow-from-inventory-into-reusable-main-package-pinocchio-aligned-hard-cutover/changelog.md`
- Re-run the validation commands listed above and compare outputs.

### Technical details

- Remaining grep hits for `legacy|compat|fallback` are non-compatibility identifiers (`fallback` ID generation / naming) and do not represent dual-path runtime behavior.
- Ticket checklist now reflects complete hard-cut progress (all nine implementation tasks checked).
