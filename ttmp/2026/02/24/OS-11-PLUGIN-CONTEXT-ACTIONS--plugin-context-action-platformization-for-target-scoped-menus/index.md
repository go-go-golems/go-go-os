---
Title: plugin context action platformization for target-scoped menus
Ticket: OS-11-PLUGIN-CONTEXT-ACTIONS
Status: active
Topics:
    - architecture
    - frontend
    - desktop
    - plugins
    - menus
    - engine
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Implementation ticket for scenario 11 platformization: plugin-contributed context actions with target-scoped resolution, capability controls, lifecycle safety, and operator guardrails.
LastUpdated: 2026-02-25T10:42:00-05:00
WhatFor: Use this ticket to deliver production-grade plugin context-action infrastructure for the launcher desktop shell.
WhenToUse: Use when planning, implementing, reviewing, or testing plugin context menu platform work.
---

# plugin context action platformization for target-scoped menus

## Overview

This ticket is the execution package for OS-10 scenario 11: plugin-injected context actions.

The design and task plan in this ticket convert scenario 11 from a concept into an implementation-ready platform with:

1. target-scoped context menu contracts,
2. plugin declaration and capability validation,
3. lifecycle-safe registration/unregistration,
4. deterministic conflict handling,
5. telemetry and kill switch controls.

## Key Links

- Design doc: `design-doc/01-plugin-context-action-platform-architecture-and-intern-implementation-guide.md`
- Diary: `reference/01-investigation-diary.md`
- Tasks: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **active**

Current progress:

1. Ticket and investigation docs created.
2. Full architecture and intern implementation guide authored.
3. Detailed granular execution checklist authored.
4. Implementation work not started yet (planning/research only).

## Topics

- architecture
- frontend
- desktop
- plugins
- menus
- engine

## Tasks

See [tasks.md](./tasks.md) for the full phase-by-phase checklist.

## Changelog

See [changelog.md](./changelog.md) for recorded updates.

## Structure

- design-doc/ - Architecture and implementation design
- reference/ - Investigation diary and onboarding notes
- tasks.md - Granular execution checklist
- changelog.md - Ticket change history
