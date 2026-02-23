---
Title: Chat timeline raw debug view with copy and YAML export
Ticket: HC-53-CHAT-TIMELINE-DEBUG
Status: done
Topics:
    - chat
    - debugging
    - frontend
    - ux
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/timelineDebugModel.ts
      Note: Snapshot builder, sanitization, and export helpers
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/StructuredDataTree.tsx
      Note: Recursive expand/collapse tree component
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/TimelineDebugWindow.tsx
      Note: Main timeline debug window component
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Window launch integration (payload, route, header button, menu, command)
    - Path: 2026-02-12--hypercard-react/packages/engine/src/chat/debug/timelineDebugModel.test.ts
      Note: Test suite for snapshot model and export helpers
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/TimelineDebugWindow.stories.tsx
      Note: Storybook stories
ExternalSources: []
Summary: Timeline debug window for inspecting raw conversation state as expandable tree with per-entity copy, conversation copy, and YAML export.
LastUpdated: 2026-02-21T19:15:00-05:00
WhatFor: Self-service timeline debugging for operators and developers.
WhenToUse: When timeline rendering appears wrong and raw state inspection is needed.
---

# Chat timeline raw debug view with copy and YAML export

## Overview

Dedicated debug view for chat timeline state — shows raw Redux timeline data as an expandable structured tree with per-entity copy, conversation copy, and YAML export. Implemented as a separate window (`TimelineDebugWindow`) launched from the chat header, desktop icon, or menu command.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **done**

## Topics

- chat
- debugging
- frontend
- ux

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
