---
Title: Diary
Ticket: OS-14-CONTEXT-ACTION-CONTRACT-HARDENING
Status: active
Topics:
    - architecture
    - desktop
    - frontend
    - menus
    - windowing
    - ux
    - debugging
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.ts
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.test.ts
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
    - Path: packages/engine/src/theme/desktop/primitives.css
    - Path: packages/engine/docs/desktop-menu-runtime-authoring.md
    - Path: apps/inventory/src/launcher/renderInventoryApp.tsx
    - Path: apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx
ExternalSources: []
Summary: Implementation diary for OS-14 precedence, layering, and debug/docs hardening work.
LastUpdated: 2026-02-26T09:30:00-05:00
WhatFor: Chronological record of OS-14 implementation work, validation results, and unresolved verification gaps.
WhenToUse: Use when reviewing implementation intent, reproducing validation, or continuing OS-14 from the latest completed code commit.
---

# Diary

## Goal

Track exactly what changed for OS-14, why it changed, what validated cleanly, what failed/noised, and what remains open so follow-up work can continue without ambiguity.

## Step 1: Implement Week-One Context Action Hardening

This step implemented the three week-one priorities from the OS-14 plan: precedence fallback hardening, context-menu layering hardening, and context-action docs/debug hardening. I also included pending in-window inventory-folder icon context-menu routing work already staged in the branch so behavior and tests move together.

The implementation was completed as code commit `ff3f787`, then documented here with exact command outcomes and unresolved validation noise to avoid re-debugging the same path.

### Prompt Context

**User prompt (verbatim):** "alright, implement, cmomit, write diary"

**Assistant interpretation:** Implement the OS-14 fixes now, make a real git commit with code changes, and produce a detailed diary entry.

**Inferred user intent:** Stop planning and ship concrete stabilization work with traceable documentation and commit history.

**Commit (code):** `ff3f787` — "Harden context-action fallback resolution and menu layering"

### What I did

- Implemented context target fallback degradation in `resolveContextActionPrecedenceKeys`:
  - add `widgetId` fallback removal,
  - preserve `iconKind` fallback removal,
  - add `appId` fallback removal,
  - keep deterministic key ordering and de-duplication.
- Added/updated unit tests in `contextActionRegistry.test.ts`:
  - window target qualifier mismatch fallback coverage,
  - icon target qualifier fallback and de-duplication coverage,
  - adjusted precedence expectation for message targets after app fallback drop.
- Added desktop debug logging in `useDesktopShellController.tsx` using npm `debug` namespaces:
  - `desktop:context-actions:resolve`,
  - `desktop:context-actions:open`.
- Hardened context menu layering in `primitives.css`:
  - changed `[data-part="context-menu"]` z-index from `500` to `100000`.
- Updated authoring docs in `desktop-menu-runtime-authoring.md`:
  - target mapping cheat sheet,
  - explicit qualifier-aware precedence model,
  - troubleshooting flow and `localStorage.debug` snippet.
- Included and committed already-pending branch changes for inventory-folder in-window icon context menus plus launcher integration test:
  - `apps/inventory/src/launcher/renderInventoryApp.tsx`,
  - `apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx`.
- Ran validation commands:
  - `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts` (pass),
  - `npm run build -w packages/engine` (pass),
  - `npm run build -w apps/inventory` (pass),
  - attempted launcher vitest run for context-menu suite (noisy/hanging; see failures section).

### Why

- Context actions were failing to appear in qualified right-click paths because open targets could include `appId`/`widgetId` while hook registrations often did not.
- Fixed z-index was an eventual layering hazard once window z-counter grows.
- Missing target/key resolution observability made debugging unnecessarily slow and uncertain.

### What worked

- Precedence fallback logic now explicitly bridges qualified open targets and less-qualified registrations.
- Unit tests for the new fallback cases pass and lock behavior.
- Build pipelines for touched packages/apps are clean.
- Desktop debug namespaces now emit target/precedence/match information only when enabled.
- Inventory-folder in-window right-click flow has explicit command routing and integration coverage in launcher tests.

### What didn't work

- `npm run test -w packages/engine -- src/components/shell/windowing/DesktopShell.contextMenu.test.tsx` failed because package vitest include config only matches `src/**/*.test.ts`, so `*.test.tsx` filter returned:
  - `No test files found, exiting with code 1`
- `npx vitest run src/__tests__/launcherContextMenu.test.tsx --reporter=dot` in `apps/os-launcher` produced repeated selector/act warnings and did not yield a clean final summary in this environment, including repeated:
  - `Selector unknown returned a different result when called with the same parameters.`
  - `An update to PluginCardSessionHost inside a test was not wrapped in act(...).`

### What I learned

- The precedence mismatch is best fixed in one place (key generation order) rather than patching call sites.
- Debug output at menu-resolution boundaries is a high-leverage addition because it reveals both computed precedence keys and actual registry matches.
- Some existing test runner configs and warnings are masking straightforward pass/fail feedback; that gap should be handled as a separate testing hygiene task.

### What was tricky to build

- The tricky part was preserving deterministic precedence while adding multiple qualifier-drop permutations without duplicate keys or unstable ordering.
- Symptoms: actions absent in qualified targets despite seemingly valid hook registration.
- Approach: add explicit qualifier-drop sequence (`widgetId`, `iconKind`, `appId`) and enforce de-duplication with the existing `seen` key set, then lock with focused unit tests for window and icon target shapes.

### What warrants a second pair of eyes

- Precedence key ordering choices in `resolveContextActionPrecedenceKeys` should be reviewed for long-term compatibility with plugin-scoped behaviors.
- The high z-index hardening (`100000`) should be confirmed against any future overlay components (modals/popovers) to avoid inversion conflicts.
- Launcher test noise/hang behavior should be triaged separately to restore trustworthy integration feedback loops.

### What should be done in the future

- Add a dedicated follow-up to stabilize/clean launcher context-menu test runtime warnings and ensure reliable completion reporting.
- Consider adding a dynamic menu z-index strategy tied to current window z-counter if overlay stacking requirements expand.

### Code review instructions

- Start in `packages/engine/src/components/shell/windowing/contextActionRegistry.ts`.
  - Review `resolveContextActionPrecedenceKeys`.
- Validate fallback behavior in `packages/engine/src/components/shell/windowing/contextActionRegistry.test.ts`.
- Inspect debug instrumentation in `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`.
- Confirm z-index hardening in `packages/engine/src/theme/desktop/primitives.css`.
- Review authoring contract updates in `packages/engine/docs/desktop-menu-runtime-authoring.md`.
- Validate with:
  - `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts`
  - `npm run build -w packages/engine`
  - `npm run build -w apps/inventory`

### Technical details

- Core fallback behavior now emits keys in specificity-preserving order with qualifier degradation:
  - exact,
  - drop widget qualifier,
  - drop iconKind qualifier,
  - drop app qualifier,
  - broad kind scopes,
  - non-window window-fallback (existing behavior retained).
- Debug namespaces introduced:
  - `desktop:context-actions:resolve`
  - `desktop:context-actions:open`
- Doc debug usage:
  - `localStorage.debug = 'desktop:context-actions:*'`
