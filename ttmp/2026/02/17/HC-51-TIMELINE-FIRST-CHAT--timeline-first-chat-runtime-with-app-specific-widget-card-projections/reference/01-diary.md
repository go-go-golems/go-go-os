---
Title: Diary
Ticket: HC-51-TIMELINE-FIRST-CHAT
Status: active
Topics:
    - frontend
    - architecture
    - chat
    - state-management
    - timeline
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../pinocchio/pkg/doc/topics/webchat-sem-and-ui.md
      Note: Pinocchio alignment reference reviewed during post-review pass
    - Path: ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/changelog.md
      Note: |-
        Ticket-level activity log updated after writing and uploading docs.
        Changelog entries recorded for planning and upload milestones
    - Path: ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md
      Note: |-
        Main implementation plan produced during this session.
        Primary plan document produced during diary session
    - Path: ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/sources/local/01-hc-51-update.md
      Note: Imported review source analyzed in Step 5
    - Path: ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/tasks.md
      Note: |-
        Task tracking for scope requested in this session.
        Task checklist updated during session
ExternalSources: []
Summary: Step-by-step diary for initial HC-51 planning, post-review Pinocchio alignment rewrite, and reMarkable publication runs.
LastUpdated: 2026-02-18T15:44:00Z
WhatFor: Preserve implementation narrative and reproducible command history for HC-51 planning work.
WhenToUse: Use to understand what was done, what decisions were made, and how outputs were generated.
---



# Diary

## Goal

Capture the complete planning workflow for HC-51, including ticket scaffolding, architecture analysis, document production, and reMarkable publication.

## Step 1: Validate workspace context and locate the active repository

I started by validating the filesystem context because the first command attempts failed with "not a git repository" and missing `ttmp` paths. This happened because the top-level workspace contains multiple repos, and HC tickets for this workstream live under `2026-02-12--hypercard-react`.

Once I confirmed the active repo location and existing HC-51 ticket path, I switched all subsequent commands to run in the correct working directory.

### Prompt Context

**User prompt (verbatim):** "yes it does. Create a new ticket and write a detailed implementation plan, especially with pseudocode and timeline diagrams explaining how things fit together. Use a detailed style, with prose paragraphs and bullet point lists and such. 5+ pages. Upload to remarkable when done. Keep a diary as you go."

**Assistant interpretation:** Create or continue a new ticket for timeline-first chat architecture, produce a long implementation plan document with diagrams/pseudocode, upload it to reMarkable, and keep a detailed activity diary.

**Inferred user intent:** Produce onboarding-grade architecture guidance with concrete execution details and preserve a reliable audit trail of planning work.

**Commit (code):** N/A

### What I did

- Ran `pwd`, `git status --short`, and `ls` checks.
- Determined that `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat` is a meta workspace, not the git repo root for HC docs.
- Located git repos with `find ... -name .git`.
- Switched to `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react`.
- Verified HC-51 exists under `ttmp/2026/02/17/...`.

### Why

Correct repository and ticket paths were prerequisites for writing docs, updating tasks, and running `docmgr` commands safely.

### What worked

- Fast filesystem probing identified the actual repo root and the expected ticket directory.

### What didn't work

- Initial `git status` in parent workspace failed with:
  - `fatal: not a git repository (or any of the parent directories): .git`
- Initial `ls ttmp/2026/02/17` in wrong directory failed with:
  - `No such file or directory`

### What I learned

This multi-repo workspace requires explicit `workdir` on commands to avoid false failures and accidental operations outside the intended repository.

### What was tricky to build

The main sharp edge was context ambiguity across nested repos. Symptoms were generic CLI errors that looked like missing ticket data. Resolution was to enumerate repository roots and pin all commands to the active repo path.

### What warrants a second pair of eyes

N/A for this step.

### What should be done in the future

Add a quick repository-path sanity check at the start of every ticket session in multi-repo workspaces.

### Code review instructions

- Verify commands were run against `2026-02-12--hypercard-react`.
- Confirm this ticket path exists and is updated:
  - `ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections`

### Technical details

Commands used:

```bash
find /home/manuel/workspaces/2026-02-14 -maxdepth 4 -name .git
ls -la /home/manuel/workspaces/2026-02-14/hypercard-add-webchat
git status --short  # rerun in repo workdir
```

## Step 2: Produce the 5+ page implementation plan with contracts, pseudocode, and diagrams

I replaced the draft implementation plan with a complete, detailed document. The final document defines the timeline-first architecture target, hard boundaries, event/effect/projection contracts, sequence and timeline diagrams, and phased implementation workstreams with acceptance criteria.

The plan explicitly preserves current behavior goals (including event viewer behavior) while changing architecture ownership boundaries.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Deliver the full architecture plan as a long-form design doc with concrete implementation-level detail.

**Inferred user intent:** Enable a new developer to pick up implementation from a single document without relying on tribal context.

**Commit (code):** N/A

### What I did

- Opened existing draft plan doc.
- Rewrote document content end-to-end with:
  - current-state analysis and boundary problems,
  - target layer model and hard boundary rules,
  - event flow comparisons,
  - mermaid sequence diagrams and textual timeline diagrams,
  - TypeScript pseudocode contracts for timeline entities, sem handlers, runtime effects, projection plugins, selectors,
  - migration workstreams A-F with file-level guidance,
  - risk matrix, open questions, cutover policy, and deliverables checklist.
- Verified word count:
  - `wc -w .../01-implementation-plan...md` => `2728` words.

### Why

The user requested a detailed 5+ page implementation plan. The content was expanded to exceed that requirement and to make implementation sequencing unambiguous.

### What worked

- Existing HC-50 references and Pinocchio references provided concrete structure for the architecture proposal.
- Keeping strict layer terminology improved clarity for the widget vs projection discussion.

### What didn't work

- Prior draft had an incomplete/malformed bullet line in one section; rewriting the file removed that issue.

### What I learned

A clear split between timeline truth, projection policy, and renderer execution resolves most of the confusion around where new event-render types should live.

### What was tricky to build

The challenging part was writing contracts that preserve current behavior (artifact runtime, event debug stream, inline blocks) without reintroducing app-specific semantics into core reducers. The solution was an explicit runtime effect lane and plugin-driven projection API.

### What warrants a second pair of eyes

- Contract naming and exact folder placement for core timeline modules vs projection modules.
- Whether projection runner should remain selector-time only or support memoized precompute.

### What should be done in the future

After implementation starts, create fixture parity tests that compare old behavior snapshots to plugin-based projection outputs before deleting legacy code paths.

### Code review instructions

Start with:

- `ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md`

Validation:

```bash
wc -w ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md
```

### Technical details

Key pseudocode sections included:

- `TimelineEntity`/`TimelineState` contracts,
- `SemRegistry` and `SemHandlerResult` contracts,
- projection plugin interfaces and runner,
- `useConversationSession` orchestration pseudocode,
- runtime effect executor pseudocode,
- map projection plugin example.

## Step 3: Task bookkeeping, ticket metadata updates, and publication prep

I created concrete ticket tasks and prepared the workspace for publication by aligning the task list with the requested scope.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Track work items in ticket form as part of the deliverable.

**Inferred user intent:** Ensure the ticket has structured, visible execution state and not only a standalone document.

**Commit (code):** N/A

### What I did

- Added tasks with `docmgr task add`:
  - ticket creation and initialization,
  - 5+ page plan with pseudocode/diagrams,
  - diary maintenance,
  - file relation/changelog metadata updates,
  - reMarkable upload and verification.
- Verified task list contents.

### Why

This keeps deliverables operationally trackable and supports continuation by another developer.

### What worked

- `docmgr task add` updated `tasks.md` directly and consistently.

### What didn't work

- `docmgr task list` initially surfaced only early tasks in output view; direct file inspection was used to confirm full list.

### What I learned

Direct file verification is still useful for sanity checks even when ticket CLI reports success.

### What was tricky to build

No deep technical blockers here; the only nuance was ensuring task wording maps directly to requested outputs.

### What warrants a second pair of eyes

N/A.

### What should be done in the future

Remove placeholder boilerplate task lines immediately in new tickets to avoid noise.

### Code review instructions

Check:

- `ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/tasks.md`

### Technical details

Commands used:

```bash
docmgr task add --ticket HC-51-TIMELINE-FIRST-CHAT --text "..."
docmgr task list --ticket HC-51-TIMELINE-FIRST-CHAT
sed -n '1,260p' ttmp/.../tasks.md
```

## Step 4: Upload to reMarkable and verify remote presence

I executed the full reMarkable publication flow after drafting the implementation plan. The upload succeeded and the file was verified in the expected remote ticket folder.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Publish the completed plan to reMarkable as part of the ticket workflow.

**Inferred user intent:** Have the design doc available on reMarkable for reading/review outside the local repo.

**Commit (code):** N/A

### What I did

- Confirmed CLI availability with `remarquee status`.
- Ran dry-run upload for the implementation plan document.
- Performed real upload to `/ai/2026/02/17/HC-51-TIMELINE-FIRST-CHAT`.
- Verified remote presence with `remarquee cloud ls ... --long --non-interactive`.

### Why

This provides a reproducible, low-risk publication flow and confirms end-state.

### What worked

- `remarquee status` returned `remarquee: ok`.
- Dry-run completed with expected PDF conversion + target path.
- Upload completed with:
  - `OK: uploaded 01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.pdf -> /ai/2026/02/17/HC-51-TIMELINE-FIRST-CHAT`
- Verification returned:
  - `[f] 01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries`

### What didn't work

- No failures in this step.

### What I learned

Using dry-run first is reliable for validating pandoc conversion and remote routing before performing the actual upload.

### What was tricky to build

The only nuance was using the full absolute local path to avoid ambiguity in a multi-repo workspace.

### What warrants a second pair of eyes

N/A.

### What should be done in the future

If additional HC-51 docs are produced, upload them into the same remote ticket directory for a single review location.

### Code review instructions

Validate publication with:

```bash
remarquee cloud ls /ai/2026/02/17/HC-51-TIMELINE-FIRST-CHAT --long --non-interactive
```

### Technical details

Executed commands:

```bash
remarquee status
remarquee upload md --dry-run /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md --remote-dir /ai/2026/02/17/HC-51-TIMELINE-FIRST-CHAT
remarquee upload md /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md --remote-dir /ai/2026/02/17/HC-51-TIMELINE-FIRST-CHAT
remarquee cloud ls /ai/2026/02/17/HC-51-TIMELINE-FIRST-CHAT --long --non-interactive
```

## Step 5: Post-review alignment pass with imported expert guidance

The user provided a reviewed update and requested a deeper alignment with Pinocchio’s canonical SEM/timeline architecture. I treated this as a strict design correction pass, not incremental wording edits, and revalidated recommendations directly against both Pinocchio source and the current HyperCard implementation.

I imported the review document into the ticket sources, then compared its claims against concrete files in `pinocchio/cmd/web-chat`, `pinocchio/pkg/doc/topics`, and the current inventory chat stack. The resulting design doc rewrite reflects those verified constraints with explicit hard-cutover actions.

### Prompt Context

**User prompt (verbatim):** "Ok, I had this reviewed by our expert who came back with some serious suggestions, especially around aligning this more with pinocchio/pkg/doc/topics/webchat-sem-and-ui.md and the way pinocchio/cmd/web-chat does things. Import the file /tmp/hc-51-update.md using `docmgr import file --file ... --ticket HC-51-TIMELINE-FIRST-CHAT` and read it very carefully, the analyze the codebase and validate that you understand what it means, and update the design document in depth with the new information, and upload it to remarkable."

**Assistant interpretation:** Import the external review note into HC-51, deeply validate it against source code and docs, then substantially rewrite the implementation plan to match Pinocchio architecture and upload the revised output.

**Inferred user intent:** Reduce architecture drift and enforce a single canonical projection model so implementation does not continue on a partially aligned design path.

**Commit (code):** N/A

### What I did

- Imported source document:
  - `docmgr import file --file /tmp/hc-51-update.md --ticket HC-51-TIMELINE-FIRST-CHAT`
- Read and analyzed imported source:
  - `ttmp/.../sources/local/01-hc-51-update.md`
- Read Pinocchio architecture topic and implementation references:
  - `pinocchio/pkg/doc/topics/webchat-sem-and-ui.md`
  - `pinocchio/cmd/web-chat/web/src/sem/registry.ts`
  - `pinocchio/cmd/web-chat/web/src/sem/timelineMapper.ts`
  - `pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts`
  - `pinocchio/cmd/web-chat/web/src/ws/wsManager.ts`
- Audited current HyperCard implementation:
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - `apps/inventory/src/features/chat/webchatClient.ts`
  - `packages/engine/src/hypercard-chat/artifacts/*`
  - `go-inventory-chat/internal/pinoweb/hypercard_events.go`
- Rewrote HC-51 design doc in depth with post-review architecture:
  - strict single path `SEM -> entity ops -> timeline store`
  - explicit EventViewer raw-only invariants
  - backend/frontend mirror rules for timeline projector ownership
  - hard-cutover deletion list for synthetic widget-message pipeline
  - revised workstreams and pseudocode
- Uploaded revised doc to reMarkable and verified remote path:
  - `/ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT`
  - `/ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT-UPDATED` (latest)

### Why

The imported review identified a correctness issue in architecture direction: keeping mixed projection paths and synthetic UI state structures would preserve the same drift problems HC-51 is meant to remove.

### What worked

- Imported source handling via docmgr worked exactly as expected and updated ticket source metadata.
- File-by-file validation against Pinocchio + HyperCard made it possible to rewrite the plan with concrete, defensible cutover actions.
- ReMarkable upload and cloud verification succeeded for the revised document.

### What didn't work

- The prior assistant turn was interrupted (`turn_aborted`), so I re-ran context validation and command flow to ensure no partial assumptions remained.
- First verification command for the latest upload path failed due path matching:
  - `Error: no matches for 'HC-51-TIMELINE-FIRST-CHAT-UPDATED'`
  - resolved by querying parent folder and retrying with a trailing slash path.

### What I learned

The strongest alignment point is not just “use similar handlers,” but “enforce one canonical projection path and make all other representations explicitly derived.” That single rule resolves most architecture ambiguity.

### What was tricky to build

The tricky part was balancing strict canonical timeline ownership with the plugin runtime’s current dependence on `domains.artifacts`. The solution in the updated plan is explicit: keep `artifactsSlice` only as a derived index in HC-51, then plan a later plugin-domain migration.

### What warrants a second pair of eyes

- Decision to default to strict backend-canonical handling for `hypercard.*` events (via `timeline.upsert`) rather than dual projection.
- Version handling contract (`uint64` -> string/bigint compare) in timeline reducers.

### What should be done in the future

After implementation begins, add fixture parity tests from real SEM logs to guarantee that hard cutover behavior matches expected timeline rendering before deleting remaining legacy code.

### Code review instructions

Start here:

- `ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md`

Then verify imported source and references:

- `ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/sources/local/01-hc-51-update.md`
- `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/topics/webchat-sem-and-ui.md`

Validate upload:

```bash
remarquee cloud ls /ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT-UPDATED/ --long --non-interactive
```

### Technical details

Key commands executed:

```bash
docmgr import file --file /tmp/hc-51-update.md --ticket HC-51-TIMELINE-FIRST-CHAT
sed -n '1,220p' ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/sources/local/01-hc-51-update.md
sed -n '1,240p' /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/topics/webchat-sem-and-ui.md
sed -n '1,260p' /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/sem/registry.ts
sed -n '1,260p' /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/ws/wsManager.ts
sed -n '281,640p' apps/inventory/src/features/chat/InventoryChatWindow.tsx
sed -n '1,320p' apps/inventory/src/features/chat/chatSlice.ts
remarquee upload md /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md --remote-dir /ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT
remarquee cloud ls /ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT --long --non-interactive
remarquee upload md /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-51-TIMELINE-FIRST-CHAT--timeline-first-chat-runtime-with-app-specific-widget-card-projections/design-doc/01-implementation-plan-timeline-first-chat-runtime-and-projection-boundaries.md --remote-dir /ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT-UPDATED
remarquee cloud ls /ai/2026/02/18 --long --non-interactive
remarquee cloud ls /ai/2026/02/18/HC-51-TIMELINE-FIRST-CHAT-UPDATED/ --long --non-interactive
```

## Step 6: Implement timeline core + SEM registry foundation (Impl A1/A2/B1)

This step begins the actual HC-51 implementation (not only planning). I first expanded ticket tasks with concrete implementation workstreams, then implemented the engine-level foundation for timeline-first state and SEM routing.

The completed code introduces conversation-scoped timeline storage, safe version handling for uint64-like values, and a default SEM registry that maps events into timeline entity operations.

### Prompt Context

**User prompt (verbatim):** "Now add detailed tasks to the ticket to implement the updated plan, and work on them one by one, committing as you go, and keeping a detailed diary."

**Assistant interpretation:** Convert HC-51 from planning to execution by creating implementation tasks, then implement each in order with incremental commits and diary updates.

**Inferred user intent:** Drive the architecture plan into concrete code with traceable progress and disciplined commit granularity.

**Commit (code):** `a6d375a` — "feat(hypercard-chat): add timeline core and sem registry foundation"

### What I did

- Added detailed implementation tasks to `tasks.md` (Impl A1..F2).
- Implemented new timeline core modules in engine:
  - `packages/engine/src/hypercard-chat/timeline/types.ts`
  - `packages/engine/src/hypercard-chat/timeline/version.ts`
  - `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`
  - `packages/engine/src/hypercard-chat/timeline/selectors.ts`
- Implemented SEM foundation modules:
  - `packages/engine/src/hypercard-chat/sem/types.ts`
  - `packages/engine/src/hypercard-chat/sem/timelineMapper.ts`
  - `packages/engine/src/hypercard-chat/sem/registry.ts`
- Added focused tests:
  - `packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts`
  - `packages/engine/src/hypercard-chat/sem/registry.test.ts`
- Updated exports:
  - `packages/engine/src/hypercard-chat/index.ts`
  - `packages/engine/src/hypercard-chat/types.ts` (seq/stream_id retention)
- Ran focused validation:
  - `npx vitest run packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts packages/engine/src/hypercard-chat/sem/registry.test.ts`

### Why

This is the minimum viable foundation required before transport/session and UI cutover work:

- timeline state operations must exist first,
- SEM handlers must produce entity ops consistently,
- version-safe merge behavior must be explicit before hydration/replay integration.

### What worked

- Focused tests for the new modules passed (7/7).
- Commit successfully captures the first implementation slice with clear boundaries.
- Task tracking now reflects implementation milestones rather than only planning artifacts.

### What didn't work

- Full engine typecheck currently fails due existing Storybook typing errors unrelated to this step (missing `args` in multiple `ChatWindow*.stories.tsx` files).
- This did not block targeted module tests, but it does block a clean full `npm run typecheck -w packages/engine` run.

### What I learned

Keeping the first implementation commit strictly foundational (timeline + registry + tests) made the cutover path clearer and reduced risk before touching inventory runtime wiring.

### What was tricky to build

The key tricky area was mapping heterogeneous `timeline.upsert` payload shapes (flat oneof fields vs snapshot case/value forms) without pulling in protobuf runtime dependencies. I handled this by building a mapper that accepts both flattened and case/value snapshot layouts.

### What warrants a second pair of eyes

- `timelineMapper` payload normalization assumptions for `tool_result` and oneof variants.
- `timelineSlice` merge semantics around versioned vs non-versioned upserts.

### What should be done in the future

Proceed to transport/session integration (`Impl C1/C2`) so raw event ingress + hydrate/buffer/replay semantics are routed through this registry in app runtime.

### Code review instructions

Start with:

- `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`
- `packages/engine/src/hypercard-chat/sem/registry.ts`
- `packages/engine/src/hypercard-chat/sem/timelineMapper.ts`

Then verify tests:

```bash
npx vitest run packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts packages/engine/src/hypercard-chat/sem/registry.test.ts
```

### Technical details

Commands run in this step:

```bash
docmgr task add --ticket HC-51-TIMELINE-FIRST-CHAT --text "[Impl A1] ..."
docmgr task add --ticket HC-51-TIMELINE-FIRST-CHAT --text "[Impl B1] ..."
docmgr task add --ticket HC-51-TIMELINE-FIRST-CHAT --text "[Impl A2] ..."
npm run typecheck -w packages/engine
npx vitest run packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts packages/engine/src/hypercard-chat/sem/registry.test.ts
git commit -m "feat(hypercard-chat): add timeline core and sem registry foundation"
docmgr task check --ticket HC-51-TIMELINE-FIRST-CHAT --id 9,10,11
```

## Step 7: Implement session transport hydrate/buffer/replay and raw ingress hook (Impl C1/C2)

This step introduced the transport/session behavior needed for timeline-first projection flow. I upgraded `InventoryWebChatClient` to own hydration and buffered replay sequencing, and wired raw envelope emission before projection in `InventoryChatWindow`.

This keeps EventViewer decoupled from projection while moving runtime behavior closer to Pinocchio’s ws manager model.

### Prompt Context

**User prompt (verbatim):** (see Step 6)

**Assistant interpretation:** Continue implementation tasks in order, commit each block, and keep detailed diary records.

**Inferred user intent:** Ensure transport/event ingestion semantics are corrected before deeper store/UI cutover.

**Commit (code):** `984659e` — "feat(inventory-chat): add hydrate-buffer-replay session flow and raw ingress emission"

### What I did

- Refactored `apps/inventory/src/features/chat/webchatClient.ts`:
  - retained `seq` and `stream_id` in envelope type,
  - added buffering while hydration is pending,
  - added snapshot hydration callback (`onSnapshot`),
  - added deterministic replay ordering (`sortBufferedEnvelopes`) preferring `stream_id`, then `seq`.
- Added `onRawEnvelope` callback in client handlers to enforce raw ingress hook.
- Updated `apps/inventory/src/features/chat/InventoryChatWindow.tsx`:
  - emit raw events via `onRawEnvelope` before projection,
  - hydrate timeline from client `onSnapshot` callback,
  - remove manual bootstrap fetch path in component effect.
- Added focused test coverage:
  - `apps/inventory/src/features/chat/webchatClient.test.ts`.

### Why

This is a prerequisite for strict projection architecture:

- ingress event emission must be independent of projection,
- live/hydrated convergence should occur inside one session manager path,
- component-level ad-hoc bootstrap logic must start shrinking.

### What worked

- Focused test command passed for new/changed transport behavior:
  - `npx vitest run apps/inventory/src/features/chat/webchatClient.test.ts ...`
- Session flow changes integrate cleanly with existing `onSemEnvelope` call path.

### What didn't work

- Full `npm run build -w apps/inventory` still fails due pre-existing Storybook type errors in engine `ChatWindow*.stories.tsx` requiring `args` fields.
- This is unrelated to the session-manager modifications but blocks full workspace green checks.

### What I learned

Moving hydration and replay into the transport client immediately simplifies `InventoryChatWindow` lifecycle logic and makes future D2 replacement easier.

### What was tricky to build

The main nuance was ordering policy under mixed metadata quality (`stream_id` sometimes present, sometimes absent). The implemented comparator now uses `stream_id` first and falls back to bigint-compatible `seq` parsing.

### What warrants a second pair of eyes

- Replay ordering assumptions in `sortBufferedEnvelopes` for mixed stream-id/seq scenarios.
- Whether malformed envelopes should be dropped vs emitted raw with explicit error markers.

### What should be done in the future

Proceed with D1/D2 to remove dependence on `chatSlice` projection writes and wire registry-based timeline entity operations directly.

### Code review instructions

Start with:

- `apps/inventory/src/features/chat/webchatClient.ts`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/webchatClient.test.ts`

Run focused tests:

```bash
npx vitest run apps/inventory/src/features/chat/webchatClient.test.ts
```

### Technical details

Commands run:

```bash
npx vitest run apps/inventory/src/features/chat/webchatClient.test.ts packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts packages/engine/src/hypercard-chat/sem/registry.test.ts
npm run build -w apps/inventory
git commit -m "feat(inventory-chat): add hydrate-buffer-replay session flow and raw ingress emission"
docmgr task check --ticket HC-51-TIMELINE-FIRST-CHAT --id 12,13
```

## Step 8: Cut over chat runtime rendering to timeline entities (Impl D1/D2/E1)

This step moved the app runtime off message-centric reducer projection and onto timeline entities projected through the SEM registry.

**Commit (code):** `63e3a54` — "feat(inventory-chat): cut over chat rendering to timeline entity projection"

### What I did

- Wired `timeline` reducer into inventory store alongside existing slices.
- Switched `InventoryChatWindow` rendering to `selectTimelineEntities` + `mapTimelineEntityToMessage`.
- Replaced runtime event-switch projection with registry-driven projection:
  - `semRegistry.handle(...)`
  - `applySemTimelineOps(...)`
- Added snapshot hydration through synthetic `timeline.upsert` envelopes fed through the same registry path.
- Preserved artifact extraction/indexing (`extractArtifactUpsertFromSem` + `upsertArtifact`) and runtime card registration.
- Kept EventViewer raw stream ingress independent from projection path.

### Why

D1/D2/E1 are the structural cutover tasks that make timeline entities canonical. Once this landed, the app no longer depended on the legacy synthetic widget-message shaping path for normal rendering.

### What worked

- Chat UI rendered timeline entities correctly in place of legacy `chat.messages` population.
- Artifact/card runtime flow remained intact after projection cutover.

### What didn't work

- Legacy reducer code/tests were still present, so F1 cleanup was still required to complete hard-cutover consistency.

### What warrants review

- Entity-to-`ChatWindowMessage` mapping assumptions in `mapTimelineEntityToMessage` for non-message entities.
- Hydration path (`timeline snapshot -> synthetic timeline.upsert -> registry`) for deterministic replay correctness.

### Technical details

Commands used during this step:

```bash
npx vitest run apps/inventory/src/features/chat/*.test.ts
npx vitest run packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts packages/engine/src/hypercard-chat/sem/registry.test.ts
git commit -m "feat(inventory-chat): cut over chat rendering to timeline entity projection"
```

## Step 9: Remove legacy synthetic widget-message reducer path and complete validation (Impl F1/F2)

This step finished the hard cutover by deleting old reducer responsibilities and replacing stale tests/selectors with timeline-first metadata expectations.

**Commit (code):** `5141d98` — "refactor(inventory-chat): hard-cutover chat slice to timeline-first metadata"

### What I changed

- Simplified `apps/inventory/src/features/chat/chatSlice.ts` to metadata-only responsibilities:
  - removed legacy message/timeline-widget reducers (`queueUserPrompt`, `applyLLM*`, `upsert*Panel*`, etc.),
  - retained connection/suggestion/model/stats/stream meta handling only.
- Updated `apps/inventory/src/features/chat/selectors.ts` to remove stale message/stream selectors tied to removed state.
- Rewrote `apps/inventory/src/features/chat/chatSlice.test.ts` to cover the new contract (metadata, suggestions normalization, stream stats lifecycle, conversation isolation).
- Tightened typing for SEM ops dispatch path:
  - `packages/engine/src/hypercard-chat/sem/registry.ts` now accepts `Dispatch<UnknownAction>`.
  - `InventoryChatWindow` helper signatures now use `Dispatch<UnknownAction>`.

### Validation runbook and results

Executed:

```bash
npx vitest run apps/inventory/src/features/chat/chatSlice.test.ts
npx vitest run apps/inventory/src/features/chat/*.test.ts
npx vitest run packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts packages/engine/src/hypercard-chat/sem/registry.test.ts
npx tsc -p apps/inventory/tsconfig.json --pretty false
npm run typecheck
```

Results:

- Focused tests: passing (`8 files / 33 tests`).
- Inventory TS compile: passing (`npx tsc -p apps/inventory/tsconfig.json`).
- Root `npm run typecheck`: still failing due pre-existing Storybook typing errors requiring explicit `args` in multiple engine `ChatWindow*.stories.tsx` stories (unrelated to HC-51 runtime cutover).

### Why this matters

This removes the remaining dual-state ambiguity. Timeline entities are now the canonical render source, while chat slice stores only transport/session metadata and UX hints.

### Review guidance

Review in this order:

- `apps/inventory/src/features/chat/chatSlice.ts`
- `apps/inventory/src/features/chat/selectors.ts`
- `apps/inventory/src/features/chat/chatSlice.test.ts`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `packages/engine/src/hypercard-chat/sem/registry.ts`

Then run the validation commands above.
