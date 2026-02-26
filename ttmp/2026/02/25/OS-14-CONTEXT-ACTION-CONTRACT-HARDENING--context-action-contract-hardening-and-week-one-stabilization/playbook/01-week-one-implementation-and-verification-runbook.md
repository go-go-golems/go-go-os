---
Title: week-one implementation and verification runbook
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
DocType: playbook
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.ts
    - Path: packages/engine/src/theme/desktop/primitives.css
    - Path: packages/engine/docs/desktop-menu-runtime-authoring.md
    - Path: apps/inventory/src/launcher/renderInventoryApp.tsx
    - Path: apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx
ExternalSources: []
Summary: Command-oriented runbook for implementing and validating OS-14 week-one context action fixes.
LastUpdated: 2026-02-26T09:20:00-05:00
WhatFor: Provide a repeatable command flow for implementing and verifying the three OS-14 stabilization fixes.
WhenToUse: Use while executing OS-14 phases or when reproducing validation evidence for review.
---

# week-one implementation and verification runbook

## Purpose

Execute and verify the three week-one fixes with a deterministic command path:

1. precedence fallback hardening
2. context-menu layering hardening
3. docs/debug instrumentation hardening

## Environment Assumptions

1. Workspace root is `go-go-os/`.
2. Node dependencies are installed (`npm ci` or existing lockfile install).
3. Tests can run in local environment.
4. `docmgr` and `remarquee` are available for documentation and upload steps.

## Commands

```bash
# 0) Enter workspace
cd /home/manuel/workspaces/2026-02-24/add-menus/go-go-os

# 1) Baseline context-action tests before change
npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/DesktopShell.contextMenu.test.tsx

# 2) Implement fallback logic + tests (edit files)
# - packages/engine/src/components/shell/windowing/contextActionRegistry.ts
# - packages/engine/src/components/shell/windowing/contextActionRegistry.test.ts

# 3) Re-run targeted tests
npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/DesktopShell.contextMenu.test.tsx

# 4) Harden context-menu layering (edit CSS)
# - packages/engine/src/theme/desktop/primitives.css

# 5) Optional integration tests in launcher app
npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx

# 6) Update docs/debug instrumentation (edit docs + code)
# - packages/engine/docs/desktop-menu-runtime-authoring.md
# - packages/engine/src/components/shell/windowing/useDesktopShellController.tsx (debug logging)

# 7) Build validation
npm run build -w packages/engine
npm run build -w apps/inventory

# 8) Ticket hygiene
docmgr doctor --ticket OS-14-CONTEXT-ACTION-CONTRACT-HARDENING --stale-after 30

# 9) Bundle and upload ticket docs to reMarkable
remarquee upload bundle \
  ttmp/2026/02/25/OS-14-CONTEXT-ACTION-CONTRACT-HARDENING--context-action-contract-hardening-and-week-one-stabilization/index.md \
  ttmp/2026/02/25/OS-14-CONTEXT-ACTION-CONTRACT-HARDENING--context-action-contract-hardening-and-week-one-stabilization/design-doc/01-three-things-this-week-implementation-path.md \
  ttmp/2026/02/25/OS-14-CONTEXT-ACTION-CONTRACT-HARDENING--context-action-contract-hardening-and-week-one-stabilization/reference/01-review-intake-from-windowing-context-action-assessment.md \
  ttmp/2026/02/25/OS-14-CONTEXT-ACTION-CONTRACT-HARDENING--context-action-contract-hardening-and-week-one-stabilization/tasks.md \
  --name "OS-14 Context Action Week-One Plan" \
  --remote-dir "/ai/2026/02/26/OS-14-CONTEXT-ACTION-CONTRACT-HARDENING" \
  --toc-depth 2
```

## Exit Criteria

1. Precedence tests pass and demonstrate qualifier-drop fallback behavior.
2. Context menu remains visible above windows in stress scenarios.
3. Docs include target mapping, fallback order, and troubleshooting steps.
4. Debug logs can show opened target plus computed precedence keys when enabled.
5. Ticket docs uploaded to reMarkable and visible under the dated OS-14 folder.

## Notes

1. Keep week-one scope tight; avoid pull-model redesign in this ticket.
2. If z-index still conflicts in edge cases, queue dynamic z-index as follow-up.
3. Capture validation output summaries in ticket changelog for traceability.
