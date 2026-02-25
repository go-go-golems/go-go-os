---
Title: widget and icon scoped context menu showcase scenarios
Ticket: OS-10-CONTEXT-MENU-SHOWCASES
Status: complete
Topics:
    - frontend
    - desktop
    - menus
    - ux
    - plugins
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Target-aware context menu composition and routing across icon/window/message scopes.
    - Path: apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx
      Note: Integration coverage for icon and folder context menu behavior.
    - Path: apps/os-launcher/src/__tests__/launcherHost.test.tsx
      Note: Command-routing integration coverage for message-context action payloads.
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx
      Note: Storybook showcase coverage for icon, folder, chat message/conversation, and role-aware context menu scenarios.
    - Path: packages/engine/src/components/shell/windowing/types.ts
      Note: Context target and icon-folder contract definitions.
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.ts
      Note: Target-key registry and precedence resolver (including icon-kind fallback).
    - Path: packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx
      Note: Per-message context action registration and message-target context menu invocation.
    - Path: packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Conversation-surface context menu targeting and registration wiring.
    - Path: packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Conversation background context-menu event surface.
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
      Note: Runtime hook/API surface for opening context menus from in-window components.
    - Path: packages/engine/src/components/shell/windowing/contextActionVisibility.ts
      Note: Role/profile visibility evaluator, unauthorized fallback policy, and context-menu command guardrails.
    - Path: packages/engine/src/components/shell/windowing/contextActionVisibility.test.ts
      Note: Unit coverage for profile/role filtering, hide/disable fallback, separator normalization, and guard behavior.
    - Path: packages/engine/docs/desktop-menu-runtime-authoring.md
      Note: Authoring guide updates for target-scoped hooks, openContextMenu API, and visibility policies.
    - Path: apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: Inventory launcher command handlers for chat message and conversation context actions.
ExternalSources: []
Summary: Implementation planning ticket for target-scoped context menu showcase scenarios (icons, folders, chat message/conversation, role-aware menus) plus plugin-extension feasibility notes.
LastUpdated: 2026-02-25T17:25:00-05:00
WhatFor: Track planning and execution for high-impact context menu showcases in desktop-os/engine.
WhenToUse: Use when implementing or reviewing OS-level context menu UX scenarios and extension hooks.
---

# widget and icon scoped context menu showcase scenarios

## Overview

This ticket plans and tracks implementation of target-scoped context menu showcases:

1. Icon quick actions
2. Folder/icon hybrid launcher
3. Chat message context menu
4. Conversation-level menu
5. Role/profile-aware menus

It also documents scenario 11 (plugin-injected context actions) and required platform prerequisites.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **complete**

## Topics

- frontend
- desktop
- menus
- ux
- plugins

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Design

- [context menu showcase implementation plan](./design-doc/01-context-menu-showcase-implementation-plan.md)

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
