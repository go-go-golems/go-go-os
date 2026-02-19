---
Title: Extract ChatWindow from inventory into reusable main package (pinocchio-aligned hard cutover)
Ticket: HC-56-CHATWINDOW-MAIN-PACKAGE-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - webchat
    - timeline
    - cleanup
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/01-regression-analysis-and-restoration-plan-rich-timeline-projections.md
      Note: Regression timeline and root-cause analysis for rich widget loss
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/02-generic-chatwindow-and-hypercard-renderer-pack-architecture.md
      Note: Architecture exploration for reusable ChatWindow runtime and Hypercard renderer pack
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md
      Note: Canonical HC-53 implementation playbook and invariants
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/design/01-clean-cutover-implementation-plan-timelineentityv2.md
      Note: Completed hard-cut execution sequence to reuse directly
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/ttmp/2026/02/19/01-pinocchio-webchat-flow-custom-renderers-and-widget-switching.md
      Note: Pinocchio-focused architecture reference for registration and renderer switching
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md
      Note: End-to-end tutorial for app-owned module registration on backend and frontend
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md
      Note: Standalone webchat shell tutorial for websocket/hydration/timeline rendering flow
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Current inventory host integration to slim to app-owned callbacks only
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Base component and behavior contract for reusable package extraction
ExternalSources: []
Summary: Hard-cut ticket to extract inventory ChatWindow orchestration into a reusable main package using pinocchio web-chat patterns and prior HC-53/HC-54 docs as implementation source of truth.
LastUpdated: 2026-02-19T14:38:48.855662264-05:00
WhatFor: Execute a no-backcompat extraction where chat runtime, timeline projection, and widget/card renderer dispatch are reusable and app-registered.
WhenToUse: Use when implementing or reviewing the clean cutover from inventory-owned chat flow to reusable package ownership.
---

# Extract ChatWindow from inventory into reusable main package (pinocchio-aligned hard cutover)

## Overview

HC-56 is the clean-cut follow-up to HC-53/HC-54: move ChatWindow orchestration and projection/render wiring out of inventory app code and into a reusable main package, modeled after `pinocchio/cmd/web-chat`.

This ticket is strict hard cutover. There is no compatibility mode, no legacy dual path, and no fallback branches for prior inventory-local chat runtime behavior.

## Key Links

- Detailed implementation plan:
  - `design/01-chatwindow-main-package-hard-cutover-implementation-plan.md`
- HC-53 reference docs:
  - `../../HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/01-regression-analysis-and-restoration-plan-rich-timeline-projections.md`
  - `../../HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/02-generic-chatwindow-and-hypercard-renderer-pack-architecture.md`
  - `../../HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md`
- HC-54 reference doc:
  - `../../HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/design/01-clean-cutover-implementation-plan-timelineentityv2.md`
- Pinocchio reference docs:
  - `../../../../../../../pinocchio/ttmp/2026/02/19/01-pinocchio-webchat-flow-custom-renderers-and-widget-switching.md`
  - `../../../../../../../pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md`
  - `../../../../../../../pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md`

## Status

Current status: **active**

## Topics

- architecture
- chat
- frontend
- webchat
- timeline
- cleanup

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
