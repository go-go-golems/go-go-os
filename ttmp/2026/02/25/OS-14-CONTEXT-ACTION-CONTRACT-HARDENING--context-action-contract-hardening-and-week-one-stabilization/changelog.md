# Changelog

## 2026-02-25

- Initial workspace created

## 2026-02-26

- Added design doc `01-three-things-this-week-implementation-path.md` with detailed execution path for:
  - precedence fallback hardening (`widgetId`/`appId` qualifier drop strategy),
  - context-menu layering hardening,
  - docs/debug contract hardening.
- Added reference doc `01-review-intake-from-windowing-context-action-assessment.md` to capture high-signal findings from the attached review and map them to action items.
- Added playbook `01-week-one-implementation-and-verification-runbook.md` with command sequence, validation steps, and upload path.
- Replaced placeholder `tasks.md` with granular phase-based checklist (`OS14-00` through `OS14-44`).
- Updated index metadata and links to reflect current plan artifacts and ticket status.
- Uploaded bundled ticket plan to reMarkable as `OS-14 Context Action Week-One Plan` under `/ai/2026/02/26/OS-14-CONTEXT-ACTION-CONTRACT-HARDENING`.
- Implemented week-one stabilization code (commit `ff3f787`):
  - extended context-action precedence fallback to degrade `widgetId`, `iconKind`, and `appId` qualifiers while preserving deterministic ordering,
  - added/updated unit tests for window and icon qualifier fallback behavior and key de-duplication,
  - added desktop debug-channel logging for context-menu target resolution and open events,
  - hardened context menu layering (`z-index: 100000`),
  - updated desktop runtime authoring docs with target mapping, fallback order, and troubleshooting/debug guidance.
- Added in-window inventory-folder icon context menu routing + integration coverage (same commit `ff3f787`).
- Validation executed:
  - `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts` ✅
  - `npm run build -w packages/engine` ✅
  - `npm run build -w apps/inventory` ✅
  - launcher Vitest run remained noisy/hanging with repeated React-Redux selector warnings in `PluginCardSessionHost` (follow-up validation still open in `OS14-40`).
- Updated `tasks.md` to check off completed implementation/doc/debug/build items and keep `OS14-40` open for follow-up validation cleanup.
- Added implementation diary in `reference/02-diary.md` with command transcript, failure notes, and review instructions.
