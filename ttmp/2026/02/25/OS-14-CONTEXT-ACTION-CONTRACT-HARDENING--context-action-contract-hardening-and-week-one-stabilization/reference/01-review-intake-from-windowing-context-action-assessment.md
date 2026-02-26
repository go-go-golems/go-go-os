---
Title: review intake from windowing context action assessment
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
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
    - Path: packages/engine/src/theme/desktop/primitives.css
    - Path: packages/engine/docs/desktop-menu-runtime-authoring.md
ExternalSources: []
Summary: Imported findings and constraints from external windowing/context-menu architecture review.
LastUpdated: 2026-02-26T09:20:00-05:00
WhatFor: Preserve high-signal findings from the external review in project-native form for execution and onboarding.
WhenToUse: Use when planning or validating OS-14 work, especially to confirm why the three week-one priorities were chosen.
---

# review intake from windowing context action assessment

## Goal

Translate the attached external review into a concise, implementation-facing reference that can be directly mapped to tasks and code changes.

## Context

The review concludes the architecture is broadly healthy (durable/ephemeral lanes, adapter chain, routing pipeline), but identifies one high-impact contract mismatch and one latent UX bug:

1. **Contract mismatch**: opened context targets can include qualifiers not present in hook registrations.
2. **Layering risk**: fixed menu z-index can fall behind incrementing window z-index.

## Quick Reference

### Three things this week (execution scope)

1. Add `widgetId` and `appId` fallback degradation in `resolveContextActionPrecedenceKeys`.
2. Harden context-menu z-index so menu always appears above windows.
3. Add explicit contract docs + debug logging for target/key resolution.

### Key mismatch snapshot

| Area | Current behavior | Problem | Required behavior |
| --- | --- | --- | --- |
| Window context action registration | Common hook registers `kind=window|window=<id>` | Open target may be `kind=window|app=<id>|window=<id>|widget=title-bar`, no fallback drop for qualifiers | Resolution must degrade to less-qualified keys so registered actions show |
| Icon/context registration | Open target may include app and icon qualifiers | Qualifier mismatch may hide otherwise valid actions | Explicit precedence fallback order with deterministic dedupe |
| Context menu layering | CSS menu z-index is fixed low | Long-running zCounter can overtake menu layer | Menu must remain topmost in all normal sessions |

### Guardrails from review

1. Keep specificity-first resolution; do not remove app/widget scoped capabilities.
2. Prefer minimal week-one patch over full architecture rewrite.
3. Add diagnostics so missing-action issues can be explained from logs immediately.

## Usage Examples

1. Before coding, confirm each planned change maps to one of the three scoped week-one items.
2. While testing missing action issues, compare opened target qualifiers to registered target key and verify fallback path.
3. During PR review, verify docs and debug output reflect implemented precedence order.

## Related

- `../index.md`
- `../design-doc/01-three-things-this-week-implementation-path.md`
- `../playbook/01-week-one-implementation-and-verification-runbook.md`
