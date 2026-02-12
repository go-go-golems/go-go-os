---
Title: 'Design and Implementation Guide: DSL Action Contracts'
Ticket: HC-010-DSL-ACTION-CONTRACTS
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/dsl/types.ts
      Note: Current DSL action and card type definitions
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/dispatchDSLAction.ts
      Note: Built-in action dispatch path and domain fallback behavior
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/actionRegistry.ts
      Note: Existing runtime integration point for domain action mapping
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/app/domainActionHandler.ts
      Note: Existing payload normalization and toasts done manually in mapPayload
ExternalSources: []
Summary: "Proposes action contracts in the DSL so every domain action has a declarative payload schema, validation, and stronger runtime guarantees."
LastUpdated: 2026-02-12T15:38:32-05:00
WhatFor: "Define and ship a typed, validated action contract layer for domain actions."
WhenToUse: "Use when implementing or reviewing HC-010 and any follow-up work on action safety."
---

# Design and Implementation Guide: DSL Action Contracts

## 1. Problem Statement

The current DSL keeps domain actions open-ended through `GenericDSLAction` (`{ type: string; [key: string]: unknown }`). This is flexible, but the price is paid at runtime in every app:

- renderers emit action objects with weak guarantees
- domain handlers defensively coerce payloads using `mapPayload`
- invalid payloads often degrade to no-op behavior instead of clear errors
- schema expectations are implicit and scattered

The most visible symptom is in `apps/inventory/src/app/domainActionHandler.ts`, where each action entry must sanitize unknown values (`String(...)`, `Number(...)`, partial object guards). This code is correct, but repetitive, and easy to drift from the intended DSL contract.

HC-010 introduces explicit action contracts into the DSL so payload expectations are declared once and enforced consistently.

## 2. Goals and Non-Goals

### Goals

1. Define a declarative contract schema for each domain action type.
2. Validate action payloads before dispatch to domain handlers.
3. Improve type inference for action payloads at renderer and handler boundaries.
4. Preserve backwards compatibility in a migration window (warn + soft-fail mode first).
5. Keep runtime overhead small and predictable.

### Non-Goals

1. Replacing built-in action semantics (`navigate`, `back`, `toast`) in this ticket.
2. Introducing remote schema registries or dynamic code loading.
3. Converting all legacy stacks instantly.

## 3. Proposed DSL Additions

### 3.1 New Action Contract Registry in Stack

Add optional `actionContracts` at stack level:

```ts
interface ActionContractField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum';
  required?: boolean;
  enumValues?: string[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

interface ActionContract {
  description?: string;
  fields: Record<string, ActionContractField>;
  allowUnknownFields?: boolean;
}

interface Stack {
  ...
  actionContracts?: Record<string, ActionContract>;
}
```

Example:

```ts
actionContracts: {
  updateQty: {
    fields: {
      sku: { type: 'string', required: true, minLength: 1 },
      delta: { type: 'number', required: true, min: -1000, max: 1000 }
    }
  },
  createTask: {
    fields: {
      values: { type: 'object', required: true }
    }
  }
}
```

### 3.2 Optional Per-Card Action Refinements

Some actions are reused with context-specific constraints. Add optional per-action refinement on button/action points:

```ts
interface DSLButton {
  label: string;
  action: DSLAction;
  contractRefinement?: {
    fieldConstraints?: Record<string, Partial<ActionContractField>>;
  };
}
```

This is optional and can be deferred to phase 2 if complexity becomes high.

## 4. Runtime Architecture

### 4.1 Validation Stage

Insert contract validation at dispatch boundary before domain handler is called:

1. `dispatchDSLAction` receives action.
2. Built-in action types skip contract validation.
3. For domain action types:
   - lookup contract by `action.type`
   - validate payload shape
   - if invalid, emit structured error and optional toast
   - block dispatch to domain handler in strict mode

### 4.2 Modes

Define two validation modes (stack-level or shell prop):

- `warn` (default for rollout): log + continue
- `strict`: block action and emit error toast

This allows migration with low disruption.

### 4.3 Error Surface

Return a normalized result:

```ts
interface ActionValidationResult {
  valid: boolean;
  errors: Array<{ field: string; code: string; message: string }>;
}
```

Use this for logging, telemetry, and test assertions.

## 5. TypeScript API Strategy

### 5.1 Helper Builder

Add `defineActionContracts` helper to preserve literal types:

```ts
export function defineActionContracts<T extends Record<string, ActionContract>>(v: T): T {
  return v;
}
```

### 5.2 Infer Payload Type from Contract

Create a utility type mapping contract fields to payload shape (phase 2 if too costly in phase 1):

```ts
type PayloadFromContract<C extends ActionContract> = ...
```

Then allow `createDomainActionHandler` to optionally take contracts for typed payload map hints.

### 5.3 Backward-Compatible Handler API

No breaking change for existing registry API; the contract system should wrap around existing `createDomainActionHandler` behavior.

## 6. Implementation Plan

### Phase A: Schema and Validator Core

1. Extend DSL types in `packages/engine/src/dsl/types.ts`.
2. Add validation module:
   - `packages/engine/src/dsl/actionContracts.ts`
3. Add unit tests for validator:
   - valid payloads
   - required/missing
   - enum violations
   - numeric/string constraints
   - unknown fields behavior

### Phase B: Dispatch Integration

1. Extend `dispatchDSLAction` signature to accept optional contract map + mode.
2. Integrate validator call for non-built-in actions.
3. Add console diagnostics with action type + field errors.
4. Add optional toast message in strict mode.

### Phase C: Shell Integration

1. Update `HyperCardShellProps`:
   - `actionContracts?: Record<string, ActionContract>`
   - `actionValidationMode?: 'warn' | 'strict'`
2. Wire stack-level contracts automatically if present.

### Phase D: App Migration Example

1. Inventory: define contracts for:
   - `updateQty`, `saveItem`, `deleteItem`, `createItem`, `receiveStock`
2. Todo: define contracts for:
   - `setStatus`, `saveTask`, `deleteTask`, `createTask`
3. Convert some `mapPayload` defensive branches into simplified mappings once contracts are trusted.

## 7. Validation Rules Details

### 7.1 Primitive Rules

- `string`: must be string
- `number`: must be finite number
- `boolean`: boolean
- `object`: non-null object and not array
- `array`: `Array.isArray`
- `enum`: string in `enumValues`

### 7.2 Constraint Rules

- `min/max` for number
- `minLength/maxLength` for string
- `pattern` as regex for string

### 7.3 Unknown Field Handling

If `allowUnknownFields` is false:

- extra payload keys flagged as errors

Recommended default: true in early rollout, false for strict stacks later.

## 8. Example Before/After

### Before

`mapPayload` does broad coercion and may silently normalize malformed data.

### After

- Validator rejects malformed payload in strict mode.
- Handler receives predictable shape.
- `mapPayload` can focus on transformation, not sanitation.

Inventory `receiveStock` is a strong candidate; today it converts missing fields into empty defaults. With contracts, invalid input can be caught earlier and surfaced explicitly.

## 9. Testing Strategy

### Unit Tests

1. Validator field type checks.
2. Constraint checks.
3. Unknown field behavior.
4. Integration with dispatch for warn/strict.

### Integration Tests

1. Renderer emits valid action -> domain reducer called.
2. Renderer emits invalid action -> strict mode blocks reducer.
3. Warn mode still calls reducer but logs warning.

### Regression Tests

1. Built-in actions remain unaffected.
2. Existing stacks without contracts keep current behavior.

## 10. Migration and Rollout Plan

1. Ship validator and dispatch hooks behind opt-in mode.
2. Add contracts to Inventory and Todo stacks.
3. Keep mode `warn` for one sprint.
4. Monitor warnings; fix emitters.
5. Move selected stacks to `strict`.

## 11. Risks and Mitigations

### Risk: Performance overhead per action

Mitigation:

- lightweight validator
- compiled contract check functions cached by action type
- benchmark against current dispatch path

### Risk: Contract drift from domain reducers

Mitigation:

- add tests that verify contract-required fields align with reducer action payload types
- optionally generate contract skeleton from action creators in tooling phase

### Risk: Developer friction during early migration

Mitigation:

- `warn` mode default
- clear error messages with action type/field
- migration docs with known patterns

## 12. Deliverables

1. DSL type additions for action contracts.
2. Runtime validator implementation and tests.
3. Dispatch/shell integration.
4. Example contract adoption in Todo and Inventory stacks.
5. Documentation updates for authoring action contracts.

## 13. Acceptance Criteria

1. Action contracts can be declared in stack and validated at runtime.
2. Invalid payload behavior is deterministic in `warn` and `strict` modes.
3. Existing stacks without contracts continue to run.
4. Todo + Inventory have at least one contractized action each with tests.

## 14. Post-Ticket Follow-Ups

1. Contract-aware editor/autocomplete tooling.
2. Compile-time inference bridge for renderer action builders.
3. Optional codegen for action payload helper types.
4. Telemetry sink for invalid action events in production.
