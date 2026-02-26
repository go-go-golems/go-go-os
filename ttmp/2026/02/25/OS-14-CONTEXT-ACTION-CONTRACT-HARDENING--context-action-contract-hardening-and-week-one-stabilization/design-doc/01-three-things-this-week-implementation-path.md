---
Title: three-things-this-week implementation path
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
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.ts
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
    - Path: packages/engine/src/theme/desktop/primitives.css
    - Path: packages/engine/docs/desktop-menu-runtime-authoring.md
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.test.ts
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.contextMenu.test.tsx
ExternalSources: []
Summary: Detailed week-one execution plan for context-action precedence hardening, context-menu layering, and contract documentation.
LastUpdated: 2026-02-26T09:20:00-05:00
WhatFor: Convert review findings into an implementation-ready, testable week-one plan.
WhenToUse: Use before and during implementation to keep scope fixed to the agreed three priorities.
---

# three-things-this-week implementation path

## Executive Summary

The current context-action system has one critical contract mismatch and one UI layering risk:

1. Registration targets often omit qualifiers (`appId`, `widgetId`) that open-menu targets include.
2. Context menu z-index can eventually lose against window z growth.

This plan prioritizes three week-one deliverables:

1. Precedence fallback hardening in `resolveContextActionPrecedenceKeys`.
2. Context-menu layering hardening so menu is always above windows.
3. Authoring+debug contract hardening (docs and debug logging of target/keys).

The output is a coherent target-resolution contract that app developers can trust, plus diagnostics for fast root-cause when actions do not appear.

## Problem Statement

The desktop shell opens context menus with highly qualified targets (for example window + appId + widgetId), while common hook registration paths provide less qualified targets (for example only kind + windowId). Because fallback precedence currently does not explicitly degrade across `widgetId` and `appId`, legitimate registrations can miss at resolution time.

Additionally, context menu layering currently relies on a fixed z-index that can be overtaken by window z-counter growth, causing intermittent “menu behind window” behavior.

Finally, contract documentation and runtime debug output are not explicit enough for rapid diagnosis, which increases uncertainty and encourages local hacks.

## Proposed Solution

### Track A: Precedence fallback hardening (core fix)

Update `resolveContextActionPrecedenceKeys` to preserve specificity but add deterministic degradations:

1. exact normalized target
2. drop `widgetId`
3. drop `iconKind` variants (exact and widget-agnostic)
4. drop `appId` variants (with/without widget/iconKind)
5. broad `kind + appId`, then `kind`
6. existing non-window fallback to `kind=window` with window qualifiers

This keeps widget/app-specific authoring possible while ensuring generic hook registrations still match.

### Track B: Context-menu layering hardening

Implement one of two supported strategies:

1. Simple: set context menu z-index to an always-top value.
2. Dynamic: compute menu z-index from latest `zCounter + offset` on open.

Week-one default is strategy 1 for low-risk stabilization; strategy 2 can be follow-up if needed.

### Track C: Contract docs + debug instrumentation

1. Add a dedicated section to desktop menu authoring docs:
   - target kinds and examples
   - registration hook to target mapping
   - precedence fallback order
   - troubleshooting checklist
2. Add debug-channel logging around context menu open:
   - normalized target
   - precedence keys generated
   - matched registry entries
3. Keep logs behind `debug` namespace so production output remains clean.

## Design Decisions

1. **Patch precedence, do not redesign registry this week**
Reason: The mismatch is contract-level and can be resolved with low churn in one function + tests.

2. **Maintain specificity-first ordering**
Reason: Plugin/app/widget scoped actions must keep deterministic override behavior.

3. **Prefer fixed top z-index in week-one**
Reason: Fastest reliable mitigation for real UX bug with minimal blast radius.

4. **Document and instrument now**
Reason: Stabilization is incomplete unless diagnosis path is explicit for future contributors.

## Alternatives Considered

1. **Full push->pull provider rewrite for context actions**
Rejected for week-one: high payoff but too large for immediate stabilization target.

2. **Move all menu registries to Redux immediately**
Rejected for week-one: orthogonal to contract mismatch; can be a follow-up architecture ticket.

3. **No debug logging, docs only**
Rejected: docs alone do not reduce live-debug turnaround enough.

## Implementation Plan

### Day 1: Baseline and failing coverage

1. Add/expand `contextActionRegistry` unit tests covering current mismatch cases:
   - window target with `appId`/`widgetId` open target
   - icon target with `appId` and iconKind variants
2. Add/expand integration tests for representative right-click paths.
3. Confirm tests fail before code fix.

### Day 2: Precedence fallback implementation

1. Implement fallback expansion in `resolveContextActionPrecedenceKeys`.
2. Keep de-duplication deterministic via existing `seen` set mechanics.
3. Validate all new and existing registry tests.

### Day 3: Layering hardening

1. Raise context-menu z-index in `primitives.css` (week-one default).
2. Add regression coverage if test harness supports style assertions; else add explicit manual QA checklist.
3. Validate behavior with many focus operations and repeated context menus.

### Day 4: Docs and debug

1. Update `desktop-menu-runtime-authoring.md` with contract section and troubleshooting table.
2. Add debug logs for open-target + computed keys + matched actions.
3. Verify logs in local dev with `DEBUG=chat:*,desktop:*` style namespaces.

### Day 5: Final verification and release notes

1. Run targeted engine + launcher tests.
2. Run package builds for touched apps/packages.
3. Capture before/after behavior in changelog and ticket docs.
4. Run `docmgr doctor` and prepare closeout path.

## Open Questions

1. Keep fixed z-index permanently, or follow-up dynamic z-index tied to `zCounter`?
2. Should `appId` fallback behavior be configurable for strict plugin scopes later?
3. Should key computation traces be exposed in a dedicated debug UI in addition to debug logs?

## References

- Ticket index: `../index.md`
- Review intake: `../reference/01-review-intake-from-windowing-context-action-assessment.md`
- Runbook: `../playbook/01-week-one-implementation-and-verification-runbook.md`
