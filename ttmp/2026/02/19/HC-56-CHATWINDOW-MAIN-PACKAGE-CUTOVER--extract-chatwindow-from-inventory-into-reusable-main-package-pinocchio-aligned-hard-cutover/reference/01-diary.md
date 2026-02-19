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
    - Path: packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx
      Note: |-
        New shared runtime boundary that owns connection/projection wiring and TimelineChatWindow composition.
        Step 1 shared runtime boundary (commit 09dee0a)
    - Path: packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx
      Note: |-
        Renderer pack lifecycle hardening with idempotent registration and explicit unregistration.
        Step 1 registration lifecycle hardening (commit 09dee0a)
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
