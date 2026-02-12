---
Title: 'Design and Implementation Guide: Card Lifecycle Hooks'
Ticket: HC-013-DSL-LIFECYCLE-HOOKS
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Current card transition orchestration and context assembly
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/dispatchDSLAction.ts
      Note: Core action dispatch pipeline where hook actions can flow
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/features/navigation/navigationSlice.ts
      Note: Navigation stack transitions that should trigger lifecycle events
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/overrides/FormCardOverride.tsx
      Note: Current ad hoc submit-side effects and custom branches
ExternalSources: []
Summary: "Defines declarative card lifecycle hooks (onEnter, onLeave, submit success/error) and a safe runtime model for hook execution ordering."
LastUpdated: 2026-02-12T15:38:32-05:00
WhatFor: "Introduce predictable lifecycle-driven side effects in DSL instead of ad hoc renderer logic."
WhenToUse: "Use for HC-013 implementation and lifecycle behavior review."
---

# Design and Implementation Guide: Card Lifecycle Hooks

## 1. Problem Statement

Current stacks can define card actions, but lifecycle-based behavior is mostly implicit in renderer/domain code:

- enter/leave behavior requires custom effects in React components
- post-submit behavior (toast, navigation, refresh) is hand-authored in each flow
- sequencing is inconsistent across cards and apps

This creates duplicated control logic and makes behavior hard to audit.

HC-013 introduces declarative lifecycle hooks directly in DSL card definitions.

## 2. Goals and Non-Goals

### Goals

1. Allow card-level lifecycle actions (`onEnter`, `onLeave`).
2. Allow form lifecycle actions (`onSubmitSuccess`, `onSubmitError`).
3. Define deterministic ordering and reentrancy safety.
4. Integrate with existing `dispatchDSLAction` and domain handlers.
5. Keep lifecycle hooks optional and non-breaking.

### Non-Goals

1. Full workflow/state machine engine in this ticket.
2. Arbitrary hook scripting logic.
3. Hook concurrency controls beyond basic dedupe/guarding.

## 3. Proposed DSL Additions

### 3.1 Base Card Hooks

```ts
interface LifecycleHooks {
  onEnter?: DSLAction[];
  onLeave?: DSLAction[];
}

interface BaseCard {
  type: CardType;
  title: string;
  icon: string;
  hooks?: LifecycleHooks;
}
```

### 3.2 Form-Specific Hooks

```ts
interface FormCardDef extends BaseCard {
  ...
  hooks?: LifecycleHooks & {
    onSubmitSuccess?: DSLAction[];
    onSubmitError?: DSLAction[];
  };
}
```

Phase 1 keeps hooks as static action arrays. Future phases can add conditional guard predicates.

## 4. Execution Semantics

### 4.1 Enter/Leave Triggers

- `onEnter` fires when current card ID changes to target card.
- `onLeave` fires when current card ID changes away from source card.

Both run after navigation state update is committed, so hook actions can inspect current context deterministically.

### 4.2 Submit Hooks

`onSubmitSuccess` and `onSubmitError` fire from form submit pipeline:

- success: validation passes + domain action dispatch accepted
- error: validation failed or domain dispatch returns a handled error signal

### 4.3 Ordering

For navigation transition A -> B:

1. A `onLeave`
2. B `onEnter`

For submit success on current card C:

1. submit action dispatch
2. C `onSubmitSuccess`

Avoid automatic recursion: hook-triggered navigate actions should not retrigger the same hook in an infinite loop.

## 5. Runtime Architecture

### 5.1 Hook Runner Module

Create module:

- `packages/engine/src/dsl/lifecycleRunner.ts`

Responsibilities:

- detect transitions
- run hook action arrays through `dispatchDSLAction`
- dedupe within same tick for identical hook+card combination

### 5.2 Shell Integration

`HyperCardShell` should track previous/current card IDs (via ref) and invoke hook runner in an effect.

Implementation sketch:

- on render, compare previous `current.card` with next
- run leave/enter hooks accordingly
- update previous ref

### 5.3 Form Integration

Form renderer/submit adapter should return structured submit result:

```ts
interface SubmitOutcome {
  ok: boolean;
  reason?: 'validation' | 'domain' | 'unknown';
}
```

Hook runner uses this to choose success or error hooks.

## 6. Safety and Reentrancy

Primary risk is infinite loops:

- `onEnter` dispatches `navigate` back to same card
- `onLeave` triggers action that pushes immediate reverse navigation

Mitigations:

1. tick-level dedupe key (`cardId`, `hookType`, `navDepth`, `timestamp frame`).
2. max hook dispatch count per transition (for example 10).
3. development warning when loop guard triggers.

## 7. Example Usage

```ts
cards: {
  receive: {
    type: 'form',
    ...,
    hooks: {
      onEnter: [{ type: 'toast', message: 'Ready to receive stock' }],
      onSubmitSuccess: [
        { type: 'toast', message: 'Shipment received' },
        { type: 'navigate', card: 'browse' }
      ],
      onSubmitError: [{ type: 'toast', message: 'Please fix form errors' }]
    }
  }
}
```

This removes custom submit orchestration from form renderer and keeps behavior auditable in stack definitions.

## 8. Migration Strategy

### 8.1 Identify Existing Manual Side Effects

Collect flows where effects are currently in custom renderer logic:

- post-submit toasts
- back navigation after delete
- entry hints

### 8.2 Move Behavior into Hooks Gradually

1. move static toasts first
2. move simple navigate actions
3. keep complex conditional logic in app layer until guard expressions arrive

### 8.3 Compatibility

Cards without hooks behave exactly as today.

## 9. Testing Plan

### Unit

1. transition detection logic
2. execution ordering leave->enter
3. dedupe and loop guard behavior

### Integration

1. navigation from list to detail triggers hooks once
2. form submit success triggers success hook sequence
3. validation failure triggers error hooks (once)

### Regression

1. no hooks means no extra dispatches
2. built-in navigation remains unchanged

## 10. Risks and Mitigations

### Risk: Hook overuse leading to opaque behavior

Mitigation:

- docs with best practices
- lint rule: max hook actions per card/hook type
- debug panel listing recently executed hooks

### Risk: Timing conflicts with async actions

Mitigation:

- design async hook interplay explicitly with HC-014
- define clear sync-only semantics in phase 1

### Risk: Coupling hooks to render cycles

Mitigation:

- run hooks on explicit navigation transitions, not arbitrary re-renders

## 11. Implementation Plan

### Phase A: Types + Runner

1. extend card/form types with hooks
2. implement lifecycle runner with loop guard

### Phase B: Shell Wiring

1. add transition detection in `HyperCardShell`
2. execute leave/enter hooks

### Phase C: Form Submit Hook Wiring

1. add submit outcome pipeline in form renderer adapter
2. trigger success/error hooks

### Phase D: Example Adoption

1. add hooks to selected inventory/todo cards
2. remove equivalent ad hoc code where safe

## 12. Deliverables

1. DSL hook schema.
2. lifecycle runner module + tests.
3. shell/form integration.
4. sample card adoption and documentation.

## 13. Acceptance Criteria

1. Enter/leave hooks execute once per navigation transition.
2. Submit hooks execute correctly on success/error.
3. Loop guard prevents runaway recursive dispatch.
4. Existing cards without hooks are unaffected.

## 14. Follow-Ups

1. conditional hooks (`when` expressions).
2. async hook stages (`beforeSubmit`, `afterSubmitAsync`).
3. tooling to visualize hook chains across card graph.
4. static analyzer for possible hook navigation loops.
