---
Title: Diary
Ticket: HC-46-STORYBOOK-CLEANUP
Status: active
Topics:
    - frontend
    - storybook
    - cleanup
    - ux
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Implementation diary for HC-46 Storybook cleanup execution."
LastUpdated: 2026-02-17T16:18:00-05:00
WhatFor: "Capture step-by-step implementation details, validation, and commit trace for Storybook cleanup and reorganization."
WhenToUse: "Use when reviewing HC-46 implementation progress or continuing execution work."
---

# Diary

## Goal

Capture the implementation path for HC-46 Storybook cleanup, including concrete code moves, title taxonomy cutover, validation commands, and commit anchors.

## Step 1: Storybook Ownership Cutover + IA Normalization Baseline

I executed the first implementation slice for HC-46: move Storybook configuration ownership to repo root, reorganize app story files into feature/app directories, and hard-cut over story titles to package-aligned hierarchy (`Apps/*`, `Packages/*`).

This step intentionally does not include monolithic story splitting yet; it establishes the structural baseline so follow-on refactors can happen against stable ownership and naming policy.

### Prompt Context

**User prompt (verbatim):** "alright, implement the ticket, commit as you go and keep a diary."

**Assistant interpretation:** Execute HC-46 implementation tasks directly, make incremental commits, and maintain a detailed ongoing diary in-ticket.

**Inferred user intent:** Turn the HC-46 plan into real code cleanup with auditable progress, not just planning docs.

### What I did

- Moved Storybook config from inventory-local path to root-owned path:
  - `apps/inventory/.storybook/main.ts` -> `.storybook/main.ts`
  - `apps/inventory/.storybook/preview.ts` -> `.storybook/preview.ts`
- Reworked Storybook source registration to package/app prefixes in `.storybook/main.ts`:
  - `Apps/Inventory`, `Apps/Todo`, `Apps/Crm`, `Apps/BookTrackerDebug`, `Packages/Engine`
- Added Storybook tree ordering in `.storybook/preview.ts` using `parameters.options.storySort`.
- Reorganized app stories out of flat `src/stories` buckets:
  - `apps/inventory/src/app/stories/*`
  - `apps/inventory/src/features/chat/stories/*`
  - `apps/todo/src/app/stories/*`
  - `apps/crm/src/app/stories/*`
  - `apps/book-tracker-debug/src/app/stories/*`
- Updated moved story import paths to match new locations.
- Updated Storybook scripts:
  - root `package.json`
  - `apps/inventory/package.json` with `--config-dir ../../.storybook`
- Updated app story smoke test paths:
  - `packages/engine/src/__tests__/storybook-app-smoke.test.ts`
- Hard-cutover normalized all story titles to package-aligned hierarchy.

### Why

- Tasks 5/6/7/9/10 require an explicit package-first Storybook IA, hard-cut title normalization, app story file reorganization, and ownership clarity.

### What worked

- `git mv` preserved clean rename history for story file reorganizations.
- Canonical title normalization landed across all 42 story files.
- Validation passed:
  - `npm run typecheck`
  - `npm run -w packages/engine test`

### What didn't work

- N/A in this step.

### What I learned

- The fastest stable cutover path is to move ownership and file layout first, then tackle monolith splitting and CI checks in subsequent slices.

### What was tricky to build

- Updating moved story imports required careful per-file path adjustments because app stories moved to two distinct depths (`src/app/stories` and `src/features/chat/stories`).

### What warrants a second pair of eyes

- Confirm final Storybook navigation shape in UI after title + `titlePrefix` cutover (tree should start with `Apps` and `Packages`).

### What should be done in the future

- Split oversized story monoliths (`ChatWindow`, desktop/windowing stories).
- Add taxonomy and placement drift checks and CI integration.
- Add Storybook maintainer guide.

### Code review instructions

- Start with ownership and config:
  - `.storybook/main.ts`
  - `.storybook/preview.ts`
  - `package.json`
  - `apps/inventory/package.json`
- Review reorg examples:
  - `apps/inventory/src/app/stories/FullApp.stories.tsx`
  - `apps/inventory/src/features/chat/stories/EventViewer.stories.tsx`
  - `apps/todo/src/app/stories/TodoApp.stories.tsx`
- Verify smoke coverage path updates:
  - `packages/engine/src/__tests__/storybook-app-smoke.test.ts`

### Technical details

- Canonical title convention now follows owner-first taxonomy:
  - `Apps/<AppName>/...`
  - `Packages/Engine/...`
