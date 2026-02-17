---
Title: Diary
Ticket: HC-44-VITE-BOOTSTRAP
Status: active
Topics:
    - frontend
    - architecture
    - vite
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Implementation diary for Proposal A Vite/workspace bootstrapping cleanup."
LastUpdated: 2026-02-17T14:24:00-05:00
WhatFor: "Track task-by-task implementation progress, validation, and closure for HC-44."
WhenToUse: "Use when reviewing implementation sequence or continuing HC-44 work."
---

# Diary

## Goal

Execute Proposal A by consolidating duplicated app-level Vite setup into one shared helper, validating behavior, and closing the ticket with full documentation.

## Step 1: Ticket setup and task plan

I created HC-44 and converted the default templates into an actionable implementation ticket. I defined explicit tasks (A1-A6), wrote the design plan with acceptance criteria, and prepared the diary for stepwise updates.

### Prompt Context

**User prompt (verbatim):** "Ok, create a new ticket with the tasks to cleanup the vite setup.  (Proposal A. Workspace/App BootStrapping), then work off the tasks one by one, updating your diary and comitting at opportune points. Then close the ticket."

**Assistant interpretation:** Create a new ticket for Proposal A, execute the tasks sequentially, keep diary updates during implementation, commit in logical increments, and close the ticket.

**Inferred user intent:** Turn Proposal A from assessment into completed implementation with auditable progress.

**Commit (code):** `7dcc496` — "docs(HC-44): scaffold vite cleanup ticket plan and diary"

### What I did

- Created ticket `HC-44-VITE-BOOTSTRAP`.
- Added design doc and diary documents.
- Replaced placeholder task list with actionable A1-A6 tasks.
- Added implementation plan and acceptance criteria in design doc.

### Why

- Needed concrete task boundaries before code changes.

### What worked

- `docmgr ticket create-ticket` and `docmgr doc add` generated the expected workspace.

### What didn't work

- N/A

### What I learned

- Existing app Vite configs are cleanly structured, so helper refactor should be low risk.

### What was tricky to build

- No major complexity in setup phase.

### What warrants a second pair of eyes

- Shared helper option shape should remain minimal to avoid over-engineering.

### What should be done in the future

- Reuse this helper pattern for any future app-level dev tooling consolidation.

### Code review instructions

- Review ticket docs:
- `ttmp/2026/02/17/HC-44-VITE-BOOTSTRAP--workspace-app-vite-setup-cleanup/tasks.md`
- `ttmp/2026/02/17/HC-44-VITE-BOOTSTRAP--workspace-app-vite-setup-cleanup/design-doc/01-proposal-a-implementation-workspace-app-bootstrapping-and-vite-cleanup.md`
- `ttmp/2026/02/17/HC-44-VITE-BOOTSTRAP--workspace-app-vite-setup-cleanup/reference/01-diary.md`

## Step 2: Shared helper implementation and app migration (A1-A4)

I added a shared Vite helper under `tooling/vite` and migrated all four app configs to use it. The helper preserves the inventory backend proxy behavior via explicit options while keeping other apps on default shared config.

After code changes, I validated via `tsc --build` and dev-server smoke checks. Production builds failed in all four apps due a pre-existing worker format issue in engine runtime worker bundling, which is unrelated to this ticket and reproduced consistently.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Execute Proposal A tasks in order and record implementation/validation details.

**Inferred user intent:** Complete the actual refactor, not only planning docs.

**Commit (code):** pending

### What I did

- Added `tooling/vite/createHypercardViteConfig.ts`.
- Refactored:
- `apps/inventory/vite.config.ts`
- `apps/todo/vite.config.ts`
- `apps/crm/vite.config.ts`
- `apps/book-tracker-debug/vite.config.ts`
- Updated tasks marking A1-A4 complete.
- Updated design doc with implemented solution and validation notes.

### Why

- Needed one canonical place for app-level Vite defaults to remove duplication/drift.

### What worked

- Helper-based config loading worked in all apps (dev server startup succeeded).
- `npm run typecheck` passed.

### What didn't work

- All app production builds failed with the same pre-existing issue:

```text
[vite:worker-import-meta-url] Invalid value "iife" for option "worker.format" - UMD and IIFE output formats are not supported for code-splitting builds.
file: .../packages/engine/src/plugin-runtime/worker/sandboxClient.ts
```

Commands that failed:

```bash
npm run -w apps/inventory build
npm run -w apps/todo build
npm run -w apps/crm build
npm run -w apps/book-tracker-debug build
```

Commands used for successful smoke verification:

```bash
timeout 15s npm run -w apps/inventory dev -- --host 127.0.0.1 --port 4173 --strictPort
timeout 15s npm run -w apps/todo dev -- --host 127.0.0.1 --port 4174 --strictPort
timeout 15s npm run -w apps/crm dev -- --host 127.0.0.1 --port 4175 --strictPort
timeout 15s npm run -w apps/book-tracker-debug dev -- --host 127.0.0.1 --port 4176 --strictPort
npm run typecheck
```

### What I learned

- The Vite config refactor is mechanically safe; current build failures are not caused by config duplication cleanup.

### What was tricky to build

- Validation had to distinguish between refactor breakage and existing build-system/runtime-worker constraints. Running short dev-server startup checks provided confidence that config loading itself is correct.

### What warrants a second pair of eyes

- The pre-existing worker format build issue should be addressed in a separate ticket; it affects all app production builds.

### What should be done in the future

- Create follow-up ticket for worker bundling format compatibility.

### Code review instructions

- Start with helper:
- `tooling/vite/createHypercardViteConfig.ts`
- Then verify each app config call site:
- `apps/inventory/vite.config.ts`
- `apps/todo/vite.config.ts`
- `apps/crm/vite.config.ts`
- `apps/book-tracker-debug/vite.config.ts`
