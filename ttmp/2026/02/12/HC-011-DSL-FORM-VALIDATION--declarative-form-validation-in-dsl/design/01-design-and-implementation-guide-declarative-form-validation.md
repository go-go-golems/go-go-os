---
Title: 'Design and Implementation Guide: Declarative Form Validation'
Ticket: HC-011-DSL-FORM-VALIDATION
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
      Note: Current DSL field model and form card definition
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/overrides/FormCardOverride.tsx
      Note: Current manual form submit behavior and ad hoc branching
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/todo/src/overrides/FormCardOverride.tsx
      Note: Current generic form submit flow without declarative validation
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/widgets/FormView.tsx
      Note: Widget extension point for field-level and form-level errors
ExternalSources: []
Summary: "Defines a declarative validation framework for DSL forms, including field and cross-field constraints, UX behavior, and runtime integration."
LastUpdated: 2026-02-12T15:38:32-05:00
WhatFor: "Specify and implement validation-first form behavior directly in DSL form definitions."
WhenToUse: "Use when implementing HC-011 or reviewing form reliability and UX rules."
---

# Design and Implementation Guide: Declarative Form Validation

## 1. Problem Statement

Form cards currently declare fields and submit actions, but validation behavior is mostly implicit:

- `required` exists but is inconsistently enforced at runtime
- numeric and text constraints are not represented in DSL
- cross-field rules (for example `startDate <= endDate`) cannot be declared
- app-specific renderers may implement one-off checks, which do not scale

In practice, this produces duplicated logic and weak feedback loops. Users can submit invalid data and only discover issues downstream (or never, if invalid payloads degrade to no-ops).

HC-011 introduces a declarative validation model in the DSL so form behavior is predictable and portable.

## 2. Goals and Non-Goals

### Goals

1. Represent field validation rules directly in DSL.
2. Support cross-field validation rules.
3. Provide consistent inline error UX and submit blocking behavior.
4. Keep renderer implementation minimal by centralizing validation engine.
5. Allow progressive adoption with legacy forms still working.

### Non-Goals

1. Replacing all custom submit flows (for example special `priceCheck`) in this ticket.
2. Building full i18n/error catalog tooling now.
3. Supporting arbitrary user-authored JavaScript validators in phase 1.

## 3. Proposed DSL Extensions

### 3.1 Field-Level Rules

Extend `DSLField`:

```ts
interface DSLField {
  ...
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  validateAs?: 'email' | 'url' | 'date' | 'datetime' | 'sku';
  normalize?: 'trim' | 'lowercase' | 'uppercase';
  errorMessage?: string;
}
```

### 3.2 Form-Level Rules

Extend `FormCardDef`:

```ts
interface FormValidationRule {
  id: string;
  when?: string; // lightweight expression language, optional in phase 1
  check: {
    op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'implies';
    leftField: string;
    rightField?: string;
    rightValue?: string | number | boolean;
  };
  message: string;
  path?: string; // field id for inline placement, or omitted for form-level
}

interface FormCardDef {
  ...
  validation?: {
    mode?: 'onSubmit' | 'onBlur' | 'onChange';
    rules?: FormValidationRule[];
    stopAtFirstError?: boolean;
  };
}
```

Phase 1 can support `onSubmit` only, with `onBlur`/`onChange` behavior implemented as enhancements.

## 4. UX Contract

Validation behavior must be deterministic and consistent:

1. On submit:
   - run field normalizations
   - run field-level validators
   - run form-level validators
2. If errors:
   - block submit action dispatch
   - show inline field errors for targeted paths
   - show summary banner for global errors
3. If valid:
   - dispatch submit action as today
   - clear previous errors

Keyboard/accessibility requirement:

- first invalid field should receive focus in default `onSubmit` mode.

## 5. Runtime Architecture

### 5.1 Validator Engine

New module in engine:

- `packages/engine/src/dsl/formValidation.ts`

Responsibilities:

- normalize values
- evaluate field constraints
- evaluate cross-field rules
- return normalized values and error map

Output:

```ts
interface ValidationError {
  path?: string;
  code: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  normalizedValues: Record<string, unknown>;
  errors: ValidationError[];
}
```

### 5.2 Form Renderer Integration

`FormCardOverride` logic becomes:

1. Build current values
2. Call validator with `def.fields` + `def.validation`
3. If invalid, set local `errors` state and return
4. If valid, dispatch submit action with normalized values

This keeps app overrides small and consistent across domains.

### 5.3 Widget Changes

`FormView` should accept:

- `errorsByField?: Record<string, string>`
- `formErrors?: string[]`
- `touchedFields?: Record<string, boolean>` (if we support blur/change modes)

These are backward-compatible optional props.

## 6. Expression and Rule Language

Keep phase 1 rule language constrained and explicit.

Example rules:

```ts
validation: {
  rules: [
    {
      id: 'dueDateFormat',
      check: { op: 'gte', leftField: 'qty', rightValue: 0 },
      message: 'Quantity must be non-negative',
      path: 'qty'
    },
    {
      id: 'priceVsCost',
      check: { op: 'gte', leftField: 'price', rightField: 'cost' },
      message: 'Price must be >= cost',
      path: 'price'
    }
  ]
}
```

Avoid arbitrary JavaScript predicates in phase 1 to protect safety and consistency.

## 7. Implementation Plan

### Phase A: DSL Model Changes

1. Extend `DSLField` and `FormCardDef` interfaces.
2. Add type-safe helpers (`defineFormValidation` optional).

### Phase B: Validator Core

1. Implement primitive validators.
2. Implement normalization pipeline.
3. Implement cross-field rule evaluation.
4. Add unit tests covering rule matrix.

### Phase C: Form Rendering Integration

1. Update both Todo and Inventory form overrides to use validator.
2. Extend `FormView` with optional error props.
3. Implement focus-first-invalid behavior.

### Phase D: Documentation and Examples

1. Add authoring examples to DSL guide.
2. Update sample stacks with at least one non-trivial validation rule each.

## 8. Migration Strategy

### Legacy Compatibility

Existing forms with only `required` continue to work.

### Progressive Adoption

1. Add rules to a single form (`newItem` in inventory).
2. Verify UX and user flow.
3. Expand to remaining forms.

### Fallbacks

If validation config is malformed:

- warn in development
- fail safe by not blocking submit unless parsing succeeds (phase 1)

## 9. Testing Plan

### Unit

1. Field required + type constraints.
2. Min/max + string length + regex pattern.
3. Normalization behavior.
4. Cross-field rules across numeric/text/boolean combinations.

### Component

1. `FormView` error rendering.
2. Submit blocked with inline errors.
3. Submit allowed with normalized payload.
4. Focus management on first invalid field.

### Integration

1. Inventory `newItem` invalid price/cost blocked.
2. Todo `newTask` invalid due-date format blocked (if rule added).

## 10. Risks and Mitigations

### Risk: Too many validation features too early

Mitigation:

- strict phase split
- start with essential primitives and cross-field comparisons

### Risk: UX inconsistency between apps

Mitigation:

- engine-level validator and shared `FormView` error props
- minimal custom behavior in overrides

### Risk: Schema complexity overwhelms authors

Mitigation:

- concise rule syntax
- clear examples in docs
- linter/validator for malformed form rules

## 11. Deliverables

1. Extended DSL form field and form-card validation schema.
2. Runtime validator module + tests.
3. Updated form rendering contracts and sample app adoption.
4. Migration notes and authoring reference.

## 12. Acceptance Criteria

1. At least one Todo and one Inventory form enforce declarative rules.
2. Invalid submissions are blocked with field-level feedback.
3. Valid submissions dispatch normalized payloads.
4. Existing forms without `validation` continue functioning.

## 13. Post-Ticket Enhancements

1. Async validators (for uniqueness checks) integrated with HC-014 async action states.
2. Reusable named validation rule libraries.
3. Runtime analytics on top failing validation rules.
4. i18n-ready error catalog keys.
