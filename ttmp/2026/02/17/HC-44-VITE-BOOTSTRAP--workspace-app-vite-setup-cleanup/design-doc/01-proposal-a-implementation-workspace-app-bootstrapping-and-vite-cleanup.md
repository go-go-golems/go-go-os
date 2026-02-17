---
Title: 'Proposal A Implementation: Workspace/App Bootstrapping and Vite Cleanup'
Ticket: HC-44-VITE-BOOTSTRAP
Status: active
Topics:
    - frontend
    - architecture
    - vite
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Implementation plan for consolidating duplicated app-level Vite setup into a shared helper with optional inventory proxy support."
LastUpdated: 2026-02-17T14:15:00-05:00
WhatFor: "Define design decisions, task sequence, and acceptance criteria for Proposal A implementation."
WhenToUse: "Use while implementing or reviewing Vite setup cleanup in HC-44."
---

# Proposal A Implementation: Workspace/App Bootstrapping and Vite Cleanup

## Executive Summary

This ticket removes repeated Vite setup logic from all app `vite.config.ts` files by introducing one shared helper. The helper provides common defaults and optional inventory-only proxy configuration, so each app config remains short and explicit.

## Problem Statement

Current app Vite configs duplicate the same boilerplate:

- `@vitejs/plugin-react`
- `@hypercard/engine` alias to `../../packages/engine/src`

Files with repeated setup:

- `apps/inventory/vite.config.ts`
- `apps/todo/vite.config.ts`
- `apps/crm/vite.config.ts`
- `apps/book-tracker-debug/vite.config.ts`

Duplication increases maintenance overhead and risks drift across apps.

## Proposed Solution

Add a shared helper at `tooling/vite/createHypercardViteConfig.ts` that returns a Vite config with:

- default React plugin
- default `@hypercard/engine` alias
- optional server proxy mode for inventory webchat backend

Then refactor all app configs to use this helper with minimal per-app options.

### Target API sketch

```ts
export interface HypercardViteConfigOptions {
  inventoryChatProxy?: boolean;
  inventoryChatBackendEnvVar?: string;
  inventoryChatBackendDefault?: string;
}

export function createHypercardViteConfig(options?: HypercardViteConfigOptions) {
  return defineConfig({ ... });
}
```

## Design Decisions

1. Keep helper in repo-level `tooling/vite`.
- Rationale: this is workspace tooling, not app runtime code.

2. Keep app-local `vite.config.ts` files.
- Rationale: app entrypoint remains explicit and discoverable.

3. Model inventory proxy as option.
- Rationale: avoid special-casing in app configs while preserving behavior.

4. Do not change backend env var semantics.
- Rationale: no migration needed; keep `INVENTORY_CHAT_BACKEND` behavior.

## Alternatives Considered

1. Leave configs duplicated.
- Rejected: no cleanup benefit.

2. Keep one root Vite config and remove app configs.
- Rejected: weak app-local clarity, harder app-specific overrides.

3. Move helper into `packages/engine`.
- Rejected: engine package should not own repo build-tooling concerns.

## Implementation Plan

1. Create `tooling/vite/createHypercardViteConfig.ts` with typed options.
2. Refactor all app `vite.config.ts` files.
3. Validate with `npm run typecheck` and targeted builds.
4. Update ticket docs and diary.
5. Close ticket.

## Acceptance Criteria

- All app Vite configs import and use shared helper.
- Inventory proxy behavior is unchanged.
- Typecheck/build checks pass.
- HC-44 tasks are completed and diary updated.

## Open Questions

None at start.

## References

- `apps/inventory/vite.config.ts`
- `apps/todo/vite.config.ts`
- `apps/crm/vite.config.ts`
- `apps/book-tracker-debug/vite.config.ts`
