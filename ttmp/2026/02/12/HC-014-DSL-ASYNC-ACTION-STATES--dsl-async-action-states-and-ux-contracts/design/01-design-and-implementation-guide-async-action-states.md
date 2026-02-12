---
Title: 'Design and Implementation Guide: Async Action States'
Ticket: HC-014-DSL-ASYNC-ACTION-STATES
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/dispatchDSLAction.ts
      Note: Current synchronous action dispatch behavior
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/features/notifications/notificationsSlice.ts
      Note: Existing simple notification mechanism likely reused for async feedback
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/widgets/FormView.tsx
      Note: Existing submit UX where loading/error states are currently absent
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/actionRegistry.ts
      Note: Existing action mapping surface that can be extended for async handlers
ExternalSources: []
Summary: "Defines a first-class async action model in DSL/runtime with pending/success/error states, UI contracts, and integration strategy."
LastUpdated: 2026-02-12T15:38:32-05:00
WhatFor: "Deliver deterministic async action handling and UX state semantics in HyperCard DSL apps."
WhenToUse: "Use for HC-014 implementation and async interaction architecture decisions."
---

# Design and Implementation Guide: Async Action States

## 1. Problem Statement

The current action flow assumes synchronous semantics:

- renderer dispatches DSL action
- domain handler maps payload
- reducer updates state
- optional toast appears

Real workflows require async behavior:

- API create/update/delete calls
- retries and cancellation
- optimistic UI with rollback
- loading/disabled states in forms and buttons

Without first-class async state, each app invents its own pattern, creating inconsistent UX and fragile control flow.

HC-014 introduces a standardized async action state contract.

## 2. Goals and Non-Goals

### Goals

1. Model async action lifecycle (`idle`, `pending`, `success`, `error`) in engine-level contracts.
2. Surface async state to card renderers/widgets declaratively.
3. Define deterministic action outcomes and error handling.
4. Integrate with existing action registry without breaking sync flows.
5. Support cancellation and dedupe basics.

### Non-Goals

1. Full workflow orchestration engine.
2. Background job scheduling.
3. Replacing Redux Toolkit async thunks entirely.

## 3. Proposed DSL and Runtime Model

### 3.1 Async Action Policy Declaration

At stack level:

```ts
interface AsyncActionPolicy {
  mode?: 'replace' | 'ignoreIfPending' | 'queue';
  timeoutMs?: number;
  successToast?: string;
  errorToast?: string;
  retry?: { maxAttempts: number; backoffMs: number };
}

interface Stack {
  ...
  asyncPolicies?: Record<string, AsyncActionPolicy>;
}
```

This config is optional; absent policy means current synchronous behavior.

### 3.2 Runtime Async State Slice

Introduce an engine state slice:

```ts
interface AsyncActionEntry {
  status: 'idle' | 'pending' | 'success' | 'error';
  startedAt?: number;
  endedAt?: number;
  error?: string;
  requestId?: string;
}

interface AsyncState {
  byActionType: Record<string, AsyncActionEntry>;
}
```

Expose selectors:

- `selectAsyncStatus(actionType)`
- `selectIsPending(actionType)`
- `selectAsyncError(actionType)`

### 3.3 Registry API Extension

Extend action registry entries:

```ts
interface ActionRegistryEntry<TPayload> {
  ...
  asyncHandler?: (ctx: ActionRegistryContext<TPayload>) => Promise<void>;
  onSuccess?: (ctx: ActionRegistryContext<TPayload>) => void;
  onError?: (ctx: ActionRegistryContext<TPayload> & { error: unknown }) => void;
}
```

If `asyncHandler` is present, runtime manages pending/success/error transitions.

## 4. Execution Flow

For async action:

1. validate payload/contracts (if HC-010 enabled)
2. check policy (`ignoreIfPending`, `replace`, `queue`)
3. mark pending with `requestId`
4. run `asyncHandler`
5. if resolve and current requestId matches:
   - mark success
   - run `onSuccess`
   - optional success toast
6. if reject and current requestId matches:
   - mark error
   - run `onError`
   - optional error toast

If a stale request resolves after replacement, ignore completion to avoid race bugs.

## 5. UI/UX Contract

### 5.1 Forms

`FormView` should support:

- `isSubmitting`
- `submitError`
- disabled submit button while pending (policy dependent)

### 5.2 Buttons and Actions

Action buttons can read pending state by action type and show spinner/disabled style.

### 5.3 Toasts and Errors

Use existing notifications slice for user feedback, but keep error details in async slice for richer debugging panels.

## 6. Integration with Lifecycle Hooks (HC-013)

Async outcomes should map naturally to lifecycle:

- success -> `onSubmitSuccess`
- error -> `onSubmitError`

This avoids duplicating submit outcome routing.

## 7. Implementation Plan

### Phase A: Async State Foundation

1. add async slice + selectors
2. export through engine barrel
3. add tests for state transitions

### Phase B: Action Registry Async Support

1. extend entry type with `asyncHandler`
2. implement requestId race guard and policy handling
3. wire success/error callbacks and toasts

### Phase C: UI Wiring

1. extend FormView props
2. update form overrides to consume pending/error selectors
3. add optional pending indicator in button components

### Phase D: Example Adoption

1. implement one async path in inventory (mock API receive/create)
2. implement one async path in todo (mock create/save)

## 8. Policy Semantics

### replace

New dispatch supersedes old pending request for same action type. Old completion ignored.

### ignoreIfPending

If same action type pending, new dispatch is dropped.

### queue

Pending requests serialized by action type. Phase 1 can defer full queue to follow-up if complexity is high.

Recommended phase 1 default: `replace` for idempotent edits, `ignoreIfPending` for submits.

## 9. Testing Strategy

### Unit

1. pending/success/error transitions
2. stale request resolution ignored
3. policy handling (`replace`, `ignoreIfPending`)
4. success/error toast behavior

### Integration

1. form submit shows pending then success
2. double-click submit obeys policy
3. forced async error renders error state and toast

### Regression

1. sync actions unchanged
2. no async policy + no asyncHandler = current behavior

## 10. Risks and Mitigations

### Risk: Race conditions and stale updates

Mitigation:

- requestId guard
- policy-defined replacement semantics
- explicit tests for interleaved completions

### Risk: UX inconsistency across apps

Mitigation:

- engine selectors and standardized widget props
- shared form submit behavior

### Risk: Async error handling leaks implementation details

Mitigation:

- normalize errors into user-safe message + developer detail channels

## 11. Deliverables

1. Async state slice + selectors.
2. Async-aware action registry execution path.
3. Form/button UI integration for pending/error.
4. Example async flows in both sample apps.
5. Documentation and migration guide.

## 12. Acceptance Criteria

1. Async actions can be declared and executed through registry.
2. Pending/success/error states are observable in UI.
3. Race/stale completion behavior is deterministic.
4. Sync actions continue to work unchanged.

## 13. Follow-Ups

1. cancellation token support propagated to async handlers.
2. queue policy full implementation (if deferred).
3. per-card async state scoping (beyond action type).
4. telemetry for action latency/error rates.
