---
Title: context action contract hardening and week-one stabilization
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
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.ts
      Note: Context target key generation and precedence fallback resolution live here.
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
      Note: Registration hook contract that developers use for window/icon/message/conversation actions.
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Menu-open target construction and final action resolution pipeline.
    - Path: packages/engine/src/theme/desktop/primitives.css
      Note: Context menu z-index and stacking behavior.
    - Path: packages/engine/docs/desktop-menu-runtime-authoring.md
      Note: Authoring contract docs to align implementation and developer mental model.
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.test.ts
      Note: Unit tests for precedence-key generation and merge behavior.
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.contextMenu.test.tsx
      Note: Integration coverage for context menu behavior across target kinds.
ExternalSources: []
Summary: Stabilization ticket for closing context-action contract gaps (precedence fallback mismatch, menu layering, and runtime/docs debugging).
LastUpdated: 2026-02-26T09:20:00-05:00
WhatFor: Use this ticket to implement and verify the three high-impact week-one fixes from the windowing review.
WhenToUse: Use when implementing or validating context-action precedence, context-menu layering, and authoring/debug contract documentation.
---

# context action contract hardening and week-one stabilization

## Overview

This ticket operationalizes the external windowing review into a focused one-week stabilization plan.

The scope is intentionally narrow and high-impact:

1. Fix precedence fallback for context targets so common registration hooks match opened menu targets.
2. Guarantee context-menu layering above all windows.
3. Document and instrument the context-action contract so failures are diagnosable.

This ticket is planning and execution-ready; granular tasks are authored and sequenced by phase.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

Current progress:

1. Ticket workspace created.
2. Review intake reference captured.
3. Detailed week-one implementation path authored.
4. Granular execution checklist authored.
5. reMarkable upload pending completion.

## Topics

- architecture
- desktop
- frontend
- menus
- windowing
- ux
- debugging

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Design

- [three-things-this-week implementation path](./design-doc/01-three-things-this-week-implementation-path.md)

## Reference

- [review intake from windowing context action assessment](./reference/01-review-intake-from-windowing-context-action-assessment.md)
- [Diary](./reference/02-diary.md)

## Playbook

- [week-one implementation and verification runbook](./playbook/01-week-one-implementation-and-verification-runbook.md)

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
