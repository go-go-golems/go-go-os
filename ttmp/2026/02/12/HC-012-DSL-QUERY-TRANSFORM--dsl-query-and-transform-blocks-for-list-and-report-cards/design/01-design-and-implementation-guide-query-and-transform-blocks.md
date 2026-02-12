---
Title: 'Design and Implementation Guide: Query and Transform Blocks'
Ticket: HC-012-DSL-QUERY-TRANSFORM
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
      Note: Existing list/report card schema and data filter model
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/dsl/resolver.ts
      Note: Current value resolution and filter matching utilities
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/overrides/ListCardOverride.tsx
      Note: Current list filtering/sorting/query logic in renderer layer
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/overrides/ReportCardOverride.tsx
      Note: Current report computation and aggregation behavior
ExternalSources: []
Summary: "Introduces declarative query/transform blocks so list and report cards can express filtering, sorting, grouping, and aggregation without custom renderer code."
LastUpdated: 2026-02-12T15:38:32-05:00
WhatFor: "Define a DSL-level query pipeline that reduces bespoke data shaping logic in app overrides."
WhenToUse: "Use when implementing HC-012 and reviewing list/report data behavior architecture."
---

# Design and Implementation Guide: Query and Transform Blocks

## 1. Problem Statement

Current list and report cards expose only partial data shaping primitives (`dataFilter`, `filters`, `footer.sum`). Real-world behavior often requires richer transformation chains:

- pre-filter + user filter + sort + limit
- field projections / computed columns
- group-by with aggregates
- report sections derived from query results

Today these steps are manually implemented in renderer overrides (especially inventory list/report logic). That duplicates patterns and couples behavior to app code.

HC-012 adds first-class DSL query/transform blocks to make data shaping declarative and reusable.

## 2. Goals and Non-Goals

### Goals

1. Represent common query stages in DSL.
2. Support list and report cards with one shared pipeline model.
3. Preserve existing simple cards without requiring migration.
4. Keep execution deterministic and side-effect free.
5. Enable future optimization/caching with stable query AST.

### Non-Goals

1. Full SQL-like language support.
2. Remote database pushdown logic.
3. Arbitrary JS execution in query expressions.

## 3. Proposed DSL Model

### 3.1 Shared Query Block

```ts
interface QueryStageWhere {
  field: string;
  op: '<=' | '>=' | '==' | '!=' | '<' | '>' | 'contains' | 'iequals' | 'in';
  value: string | number | boolean | string[];
}

interface QueryStageSort {
  field: string;
  direction?: 'asc' | 'desc';
  nulls?: 'first' | 'last';
}

interface QueryStageProject {
  field: string;
  as?: string;
  expr?: string; // constrained expression subset
}

interface QueryStageGroupBy {
  fields: string[];
  aggregates: Array<{
    op: 'count' | 'sum' | 'avg' | 'min' | 'max';
    field?: string;
    as: string;
  }>;
}

interface QueryBlock {
  source: string;
  where?: QueryStageWhere[];
  sort?: QueryStageSort[];
  limit?: number;
  offset?: number;
  project?: QueryStageProject[];
  groupBy?: QueryStageGroupBy;
}
```

### 3.2 Card Usage

`ListCardDef` addition:

```ts
interface ListCardDef {
  ...
  query?: QueryBlock;
}
```

`ReportCardDef` addition:

```ts
interface ReportSectionDef {
  label: string;
  compute?: string;    // existing path remains
  query?: QueryBlock;  // new option
  valueField?: string; // which field from query result to render
}
```

## 4. Execution Semantics

Pipeline order must be fixed:

1. source load
2. where filters (all AND by default)
3. groupBy (if configured)
4. project
5. sort
6. offset
7. limit

This avoids ambiguity and makes tests straightforward.

### 4.1 Expression Safety

`expr` for project stage should use constrained expression evaluation (same safety direction as existing computed fields), with no direct JS eval.

Recommended phase 1:

- allow only basic arithmetic/string concatenation and field references
- no loops/functions/object creation

## 5. Runtime Design

### 5.1 Query Engine Module

New engine module:

- `packages/engine/src/dsl/queryEngine.ts`

API sketch:

```ts
function executeQuery(
  data: Record<string, Record<string, unknown>[]>,
  settings: Record<string, unknown>,
  query: QueryBlock,
): Record<string, unknown>[]
```

Responsibilities:

- resolve dynamic values (reuse `resolveValue`)
- run stage pipeline
- return immutable result set

### 5.2 Renderer Integration

List renderer behavior:

- if `def.query` exists, use query engine result
- else use current data + `dataFilter` path

Report renderer behavior:

- if section has `query`, execute query and derive display value
- else fallback to existing `compute` functions

This enables incremental migration.

## 6. Migration Strategy

### 6.1 List Cards

Replace manual prefilter/sort logic in inventory list override with query declarations in stack.

Example migration:

Before:

- custom `preFilter` function and implicit sort behavior in renderer

After:

```ts
query: {
  source: 'items',
  where: [{ field: 'qty', op: '<=', value: '$settings.lowStockThreshold' }],
  sort: [{ field: 'qty', direction: 'asc' }]
}
```

### 6.2 Report Cards

Move simple aggregate sections from bespoke `computeReportSections` to query section definitions:

- total units = `sum(qty)`
- out-of-stock count = `count` where qty == 0

Keep advanced business-specific derived metrics in domain compute functions initially.

## 7. Testing Strategy

### Unit

1. each stage independently
2. stage composition order
3. groupBy aggregate correctness
4. sort null handling
5. dynamic value resolution in where

### Integration

1. inventory low-stock list with query returns same rows as old implementation
2. report aggregate sections match prior compute output for baseline dataset

### Regression

1. cards without query blocks remain unchanged
2. existing `dataFilter` continues to work

## 8. Performance Considerations

Potential concerns:

- repeated query execution on every render

Mitigations:

1. memoize query result by:
   - query identity/hash
   - source table reference/version
2. keep pipeline operations immutable but efficient (single-pass where practical)
3. avoid deep cloning row objects unless project stage mutates shape

## 9. Risks and Mitigations

### Risk: DSL complexity increases too much

Mitigation:

- keep stage vocabulary small
- provide authoring cookbook patterns
- keep optional fallback to old model

### Risk: Multiple overlapping filtering systems confuse authors

Mitigation:

- deprecate `dataFilter` once query block adoption is stable
- document precedence clearly during transition

### Risk: Query expressions become unsafe

Mitigation:

- constrained evaluator
- static linting against unsupported operators

## 10. Implementation Plan

### Phase A: Types + Engine

1. extend DSL types
2. implement query execution module
3. add stage-level and pipeline tests

### Phase B: List Integration

1. update list overrides to use query block when present
2. migrate inventory lowStock and browse examples

### Phase C: Report Integration

1. add report section query execution support
2. migrate selected report sections in inventory stack

### Phase D: Cleanup

1. document guidance for when to use query vs compute
2. evaluate deprecation plan for `dataFilter`

## 11. Deliverables

1. Query block DSL schema.
2. Query execution runtime with tests.
3. List/report integration in renderers.
4. Migrated inventory examples.
5. Updated docs and migration notes.

## 12. Acceptance Criteria

1. List cards can declare filter/sort/limit via query block.
2. Report sections can compute values via query aggregates.
3. Behavior parity demonstrated on inventory examples.
4. No regressions for cards without query blocks.

## 13. Follow-Ups

1. add `or` group support in where clauses.
2. optional join semantics across named tables.
3. precompiled query execution plans.
4. query inspector/debug panel in development mode.
