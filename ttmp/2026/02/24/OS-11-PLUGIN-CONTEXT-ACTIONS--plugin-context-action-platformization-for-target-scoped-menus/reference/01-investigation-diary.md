---
Title: Investigation diary
Ticket: OS-11-PLUGIN-CONTEXT-ACTIONS
Status: active
Topics:
    - architecture
    - frontend
    - desktop
    - plugins
    - menus
    - engine
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: Concrete runtime menu/context registration reference
    - Path: go-go-os/apps/os-launcher/src/App.tsx
      Note: Launcher host composition entrypoint inspected during investigation
    - Path: go-go-os/packages/engine/docs/desktop-menu-runtime-authoring.md
      Note: Current menu runtime guidance used for gap analysis
    - Path: go-go-os/packages/engine/src/components/shell/windowing/DesktopShell.contextMenu.test.tsx
      Note: Existing context-menu behavior test baseline
    - Path: go-go-os/packages/engine/src/plugin-runtime/runtimeService.ts
      Note: Plugin runtime load/validation lifecycle evidence
ExternalSources: []
Summary: Chronological command-level log used to produce the OS-11 plugin context-action platform design and implementation task plan.
LastUpdated: 2026-02-25T10:42:00-05:00
WhatFor: Use this diary to reproduce the investigation and understand why OS-11 scope and architecture decisions were made.
WhenToUse: Use when onboarding to OS-11 or validating evidence behind scenario 11 platform decisions.
---


# Investigation diary

## Goal

Create a detailed ticket for missing plugin platform work required to deliver scenario 11 (plugin-injected context actions), with enough context for a new intern to start implementation immediately.

## Phase 1: Ticket state and skill workflow validation

### Commands

```bash
cat /home/manuel/.codex/skills/ticket-research-docmgr-remarkable/SKILL.md
cat /home/manuel/.codex/skills/docmgr/SKILL.md
cat /home/manuel/.codex/skills/remarkable-upload/SKILL.md
docmgr status --summary-only
docmgr ticket list --ticket OS-11-PLUGIN-CONTEXT-ACTIONS
docmgr doc list --ticket OS-11-PLUGIN-CONTEXT-ACTIONS
```

### Findings

1. Required skills were available and loaded.
2. OS-11 ticket already existed with placeholder docs.
3. `tasks.md` was still placeholder (`Add tasks here`).

## Phase 2: Recover scenario-11 source context

### Commands

```bash
find go-go-os/ttmp/2026/02/24 -maxdepth 1 -type d | sort | rg "OS-10|OS-11|OS-08|OS-09" -n
rg -n "scenario 11|plugin-injected context actions|Additional build needed" \
  go-go-os/ttmp/2026/02/24/OS-10-CONTEXT-MENU-SHOWCASES--widget-and-icon-scoped-context-menu-showcase-scenarios/design-doc/01-context-menu-showcase-implementation-plan.md -S
nl -ba go-go-os/ttmp/2026/02/24/OS-10-CONTEXT-MENU-SHOWCASES--widget-and-icon-scoped-context-menu-showcase-scenarios/design-doc/01-context-menu-showcase-implementation-plan.md | sed -n '180,320p'
```

### Findings

1. Confirmed exact OS-10 ticket path (initial attempt used incorrect slug path).
2. Scenario 11 explicitly lists missing platform pieces:
   - capability model,
   - schema validation,
   - lifecycle cleanup,
   - conflict policy,
   - telemetry/kill switch.

## Phase 3: Architecture evidence sweep (engine + launcher + plugin runtime)

### Commands

```bash
nl -ba packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx | sed -n '1,320p'
nl -ba packages/engine/src/components/shell/windowing/useDesktopShellController.tsx | sed -n '1,840p'
nl -ba packages/engine/src/components/shell/windowing/types.ts | sed -n '1,360p'
nl -ba packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx | sed -n '1,420p'
nl -ba packages/engine/src/components/shell/windowing/desktopContributions.ts | sed -n '1,420p'
nl -ba packages/engine/src/components/shell/windowing/DesktopShell.contextMenu.test.tsx | sed -n '1,360p'

nl -ba packages/engine/src/plugin-runtime/contracts.ts | sed -n '1,420p'
nl -ba packages/engine/src/plugin-runtime/stack-bootstrap.vm.js | sed -n '1,420p'
nl -ba packages/engine/src/plugin-runtime/runtimeService.ts | sed -n '1,420p'
nl -ba packages/engine/src/plugin-runtime/intentSchema.ts | sed -n '1,320p'
nl -ba packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts | sed -n '1,340p'
nl -ba packages/engine/src/components/shell/windowing/pluginIntentRouting.ts | sed -n '1,380p'
nl -ba packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx | sed -n '1,420p'

nl -ba apps/inventory/src/launcher/renderInventoryApp.tsx | sed -n '240,380p'
nl -ba apps/inventory/src/launcher/renderInventoryApp.tsx | sed -n '560,760p'
nl -ba apps/inventory/src/domain/stack.ts | sed -n '1,220p'
nl -ba apps/todo/src/domain/stack.ts | sed -n '1,200p'
nl -ba apps/crm/src/domain/stack.ts | sed -n '1,220p'
nl -ba apps/book-tracker-debug/src/domain/stack.ts | sed -n '1,200p'

nl -ba apps/os-launcher/src/App.tsx | sed -n '1,320p'
nl -ba apps/os-launcher/src/app/modules.tsx | sed -n '1,260p'
nl -ba apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx | sed -n '1,280p'
nl -ba apps/os-launcher/src/__tests__/launcherMenuRuntime.test.tsx | sed -n '1,340p'
```

### Findings

1. Menu runtime registration is currently keyed by `windowId` only.
2. `DesktopCommandInvocation` is already rich enough to carry contextual metadata.
3. Plugin runtime has no context-action declaration contract.
4. Capability model only covers domain/system intents.
5. Launcher integration and tests confirm current context behavior is window-default plus app-specific runtime actions.

## Phase 4: Documentation synthesis

### Commands

```bash
cat > .../design-doc/01-plugin-context-action-platform-architecture-and-intern-implementation-guide.md
cat > .../tasks.md
cat > .../index.md
cat > .../changelog.md
cat > .../reference/01-investigation-diary.md
```

### Content decisions

1. Designed around deterministic, host-validated plugin extension rather than unbounded runtime mutation.
2. Chose declarative plugin bundle `contextActions` as v1 API for validation simplicity.
3. Retained existing command router and invocation path to minimize architectural blast radius.
4. Added explicit intern start map, file map, and phased implementation guidance.

## Phase 5: Ticket bookkeeping and validation

### Commands

```bash
docmgr doc relate --doc /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-11-PLUGIN-CONTEXT-ACTIONS--plugin-context-action-platformization-for-target-scoped-menus/design-doc/01-plugin-context-action-platform-architecture-and-intern-implementation-guide.md --file-note "..."
docmgr doc relate --doc /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-11-PLUGIN-CONTEXT-ACTIONS--plugin-context-action-platformization-for-target-scoped-menus/reference/01-investigation-diary.md --file-note "..."
docmgr changelog update --ticket OS-11-PLUGIN-CONTEXT-ACTIONS --entry "Completed OS-11 planning package: authored intern-ready scenario 11 architecture/design doc, replaced placeholder tasks with detailed phase-by-phase execution checklist, and documented investigation diary with command-level evidence and delivery workflow." --file-note "..."
docmgr doctor --ticket OS-11-PLUGIN-CONTEXT-ACTIONS --stale-after 30
```

### Results

1. Related files were attached to both design doc and diary.
2. Changelog was updated through `docmgr changelog update`.
3. Doctor output: `All checks passed`.

## Phase 6: reMarkable delivery

### Commands

```bash
remarquee status
remarquee cloud account --non-interactive
remarquee upload bundle --dry-run <index.md> <design-doc.md> <tasks.md> <changelog.md> <diary.md> \
  --name "OS-11 Plugin Context Action Platformization" \
  --remote-dir "/ai/2026/02/25/OS-11-PLUGIN-CONTEXT-ACTIONS" \
  --toc-depth 2
remarquee upload bundle <index.md> <design-doc.md> <tasks.md> <changelog.md> <diary.md> \
  --name "OS-11 Plugin Context Action Platformization" \
  --remote-dir "/ai/2026/02/25/OS-11-PLUGIN-CONTEXT-ACTIONS" \
  --toc-depth 2
remarquee cloud ls /ai/2026/02/25/OS-11-PLUGIN-CONTEXT-ACTIONS --long --non-interactive
```

### Results

1. Dry run succeeded and listed all five docs.
2. Upload succeeded: `OS-11 Plugin Context Action Platformization.pdf`.
3. Cloud listing confirmed artifact in `/ai/2026/02/25/OS-11-PLUGIN-CONTEXT-ACTIONS`.

## Current status

1. OS-11 planning and design investigation are completed.
2. Implementation tasks are fully expanded and ready for assignment.
3. Ticket package is delivered and ready for implementation handoff.
