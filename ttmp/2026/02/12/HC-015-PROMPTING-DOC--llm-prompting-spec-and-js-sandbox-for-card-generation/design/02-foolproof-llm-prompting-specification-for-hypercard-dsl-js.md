---
Title: Foolproof LLM Prompting Specification for HyperCard DSL/JS
Ticket: HC-015-PROMPTING-DOC
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
      Note: Canonical DSL schema and action/card definitions
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/app/dispatchDSLAction.ts
      Note: Runtime dispatch semantics for built-in and domain actions
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/actionRegistry.ts
      Note: Registry-based domain action wiring expected in generated app code
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/selectorRegistry.ts
      Note: Registry-based domain data wiring expected in generated app code
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts
      Note: Full stack example across all current card types
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/overrides/cardRenderers.ts
      Note: Card renderer registration map and current extension pattern
ExternalSources: []
Summary: "Exhaustive prompt pack and generation protocol for producing robust HyperCard DSL/JS code with strict constraints, validation, and repair loops."
LastUpdated: 2026-02-12T17:19:51-05:00
WhatFor: "Provide a production-grade prompting spec that minimizes hallucinations and invalid code when asking an LLM to generate cards."
WhenToUse: "Use when prompting an LLM to create or modify stack cards, renderers, action registries, selectors, or related runtime glue."
---

# Foolproof LLM Prompting Specification for HyperCard DSL/JS

## 1. Objective

This document defines a high-discipline prompting specification for generating HyperCard card code with an LLM.

The goal is not "good enough" output; the goal is operationally safe output that can pass deterministic checks and be applied with minimal manual cleanup.

"Foolproof" here means:

1. constrained output formats
2. strict capability boundaries
3. explicit forbidden behaviors
4. deterministic self-checks
5. repair-loop prompts for common failure classes

## 2. Ground Truth Constraints (Must Be Encoded in Prompt)

These are non-negotiable constraints from the current repo architecture:

1. Engine card rendering is app-provided.
- `packages/engine/src/components/shell/CardRenderer.tsx` delegates to `customRenderers`.
- Therefore, generating a new card type implies generating renderer wiring in app code.

2. Built-in DSL action dispatch handles only:
- `navigate`, `back`, `toast`
- all other action types must be handled by domain action handler.

3. Domain actions should be implemented via action registry API:
- `defineActionRegistry`
- `createDomainActionHandler`

4. Domain data in app root should be wired via selector registry API:
- `defineSelectorRegistry`
- `selectDomainData`

5. Existing card types are fixed unless explicitly extending DSL types and runtime:
- `menu`, `list`, `detail`, `form`, `chat`, `report`

6. Generated code must preserve existing project structure and import paths.

If these constraints are missing from prompts, model error rate rises sharply.

## 3. Prompting Architecture (Three-Layer Prompt)

Use a three-layer prompt stack every time.

## 3.1 Layer A: System Prompt (Permanent Contract)

This should be a static, reusable instruction block.

```text
You are generating code for the HyperCard React codebase.
You MUST follow the repository architecture exactly.

Hard rules:
1. Only use existing card types: menu, list, detail, form, chat, report.
2. Built-in action types are navigate, back, toast.
3. Domain actions must be wired through defineActionRegistry/createDomainActionHandler.
4. Domain data selectors must be wired through defineSelectorRegistry/selectDomainData.
5. Do not invent libraries, components, fields, or imports.
6. Do not modify unrelated files.
7. If requirements cannot be satisfied within existing architecture, output BLOCKED with reason.

Output must be deterministic and machine-parseable following the required JSON envelope.
```

## 3.2 Layer B: Developer Prompt (Task Template)

This is the "job sheet" for each generation request.

Required sections:

1. Task summary
2. Allowed files to edit
3. Repo facts (ground truth snippets)
4. Output schema
5. Validation checklist
6. Refusal condition

Template:

```text
TASK
- <specific card or feature request>

ALLOWED FILES
- <list exact files>

REPO FACTS
- Card types: menu|list|detail|form|chat|report
- Built-in actions: navigate|back|toast
- Domain actions: action registry API in packages/engine/src/api/actionRegistry.ts
- Domain data: selector registry API in packages/engine/src/api/selectorRegistry.ts

REQUIRED OUTPUT SCHEMA
<JSON schema block from section 5>

MANDATORY CHECKLIST
- [ ] No unknown card types
- [ ] No unknown imports
- [ ] All domain actions mapped in registry
- [ ] All referenced data tables exist
- [ ] Row action param field exists in columns/records
- [ ] Stack card id references are valid

IF BLOCKED
Return status=BLOCKED and a concise reason.
```

## 3.3 Layer C: User Prompt (Business Intent)

This should carry only product intent and constraints, not architecture.

Example:

```text
Add a new low-stock reorder form card in inventory.
After successful submit, show toast and navigate to browse.
Do not add any backend calls.
```

Keep user prompt short. Push implementation constraints into layers A/B.

## 4. Input Context Package for LLM

Always provide a compact context bundle with canonical snippets.

Minimum required context files:

1. `packages/engine/src/dsl/types.ts`
2. `packages/engine/src/app/dispatchDSLAction.ts`
3. app stack file (for target app)
4. app `domainActionHandler.ts`
5. app `domainDataRegistry.ts` (or selectors used)
6. app `cardRenderers.ts`

Optional but recommended:

- relevant card override files (`FormCardOverride.tsx`, `ListCardOverride.tsx`, etc.)

Do not provide the entire repository to the model if avoidable. Excess context increases inconsistency.

## 5. Required Output Contract (Machine-Parseable)

Force the model to emit one JSON object and nothing else.

```json
{
  "status": "OK | BLOCKED | NEEDS_CLARIFICATION",
  "summary": "string",
  "assumptions": ["string"],
  "file_changes": [
    {
      "path": "string",
      "action": "create | update",
      "purpose": "string"
    }
  ],
  "code_blocks": [
    {
      "path": "string",
      "language": "ts | tsx | json | md",
      "content": "full file content or full replacement block"
    }
  ],
  "self_check": {
    "unknown_card_types": false,
    "unknown_imports": false,
    "unhandled_domain_actions": false,
    "broken_stack_references": false,
    "notes": ["string"]
  }
}
```

Rules:

1. `code_blocks.path` must match one `file_changes.path`.
2. no ellipses (`...`) allowed in `content`.
3. if blocked, `code_blocks` must be empty.

## 6. Generation Modes

Define explicit mode to reduce output drift.

### Mode A: DSL-only card generation

Use when requested behavior fits existing renderer semantics.

Expected files:

- stack file update
- domain action registry update if new domain actions introduced

### Mode B: DSL + JS renderer extension

Use when new card behavior exceeds template renderer capabilities.

Expected files:

- stack file update
- new/updated override renderer file
- card renderer registration map update
- domain action registry updates if actions added

### Mode C: Refusal/blocked

Use when request requires unsupported architecture changes (for example new card type without runtime support) and user did not authorize framework-level changes.

## 7. Mandatory Static Validation Checklist (Model Self-Check)

Require model to evaluate each item and return true/false in `self_check`.

1. Every card `type` is one of six supported values.
2. Every `navigate.card` target exists in `stack.cards`.
3. Every `rowAction.param` exists on record shape used by renderer.
4. Every non-built-in DSL action has a registry entry.
5. Every registry entry imports a real action creator.
6. Every selector used by `domainDataRegistry` exists.
7. Every data source table referenced by cards exists in `data` or `domainData`.
8. No import path invents non-existing modules.
9. No forbidden APIs used (`eval`, dynamic `require`, unknown package imports).
10. No file outside allowed list changed.

If any check fails, model must either:

- repair output before returning
- or return `BLOCKED`/`NEEDS_CLARIFICATION`

## 8. Foolproof Prompt Template (Copy/Paste)

Use this exact skeleton in production prompting.

```text
SYSTEM
<insert Layer A system prompt>

DEVELOPER
TASK
- <intent>

ALLOWED FILES
- <exact paths>

REPO FACTS
- Card types: menu|list|detail|form|chat|report
- Built-in action types: navigate|back|toast
- Domain action wiring: defineActionRegistry/createDomainActionHandler
- Domain data wiring: defineSelectorRegistry/selectDomainData

CONTEXT SNIPPETS
<insert minimal snippets from current files>

OUTPUT RULES
1. Return ONLY one JSON object.
2. JSON MUST follow REQUIRED OUTPUT CONTRACT exactly.
3. Include full replacement code for each changed file.
4. Do not include markdown fences.

REQUIRED OUTPUT CONTRACT
<insert JSON schema from section 5>

MANDATORY SELF-CHECK
<insert checklist from section 7>

USER
<plain-language feature request>
```

## 9. Canonical Examples

## 9.1 Example A: Add DSL-only menu button

User intent:

- add "Receive Shipment" button on inventory home menu
- navigates to existing `receive` card

Expected scope:

- one stack file update only
- no registry changes

Model should not edit any renderer in this case.

## 9.2 Example B: Add new form card + domain action

User intent:

- add "archive task" action from detail card

Expected changes:

1. stack card button action `{ type: 'archiveTask' }`
2. action registry entry for `archiveTask`
3. imports in domain handler for `archiveTask` action creator

Expected self-check flags:

- `unhandled_domain_actions: false`

## 9.3 Example C: Request requiring custom renderer

User intent:

- "add a timeline card with grouped date bands and custom row expand"

Expected mode:

- Mode B (DSL + JS renderer extension), not Mode A

Expected files:

- stack update to use existing supported card type (likely `list` or `report`) plus metadata used by custom renderer
- new override renderer implementation
- renderer map registration

## 10. Known Failure Modes and Repair Prompts

## 10.1 Failure: Hallucinated card type

Symptom:

- model outputs `type: 'timeline'`

Repair prompt:

```text
Repair required. Card type 'timeline' is invalid.
Use only: menu|list|detail|form|chat|report.
Regenerate JSON output contract with corrected files only.
```

## 10.2 Failure: Missing domain action mapping

Symptom:

- stack uses `{ type: 'x' }` but registry has no `x`

Repair prompt:

```text
Repair required. Domain action '<x>' is used but not handled in action registry.
Add registry entry and required imports. Regenerate full JSON output.
```

## 10.3 Failure: Invalid navigation target

Symptom:

- navigate to non-existent card

Repair prompt:

```text
Repair required. navigate.card target '<id>' does not exist in stack.cards.
Either create that card or update target to a valid card id.
Regenerate full JSON output.
```

## 10.4 Failure: Unscoped file edits

Symptom:

- model modifies files outside allowed list

Repair prompt:

```text
Repair required. You changed files outside ALLOWED FILES.
Reissue output with changes strictly limited to allowed files.
```

## 11. Deterministic Review Rubric for Humans

Score each generation from 0-2 per dimension:

1. Architecture compliance
2. Correct file scope
3. Action wiring completeness
4. Data source/selector consistency
5. Runtime safety (no forbidden APIs)
6. Readability and minimality of diff

Interpretation:

- 11-12: merge candidate
- 8-10: needs targeted fixes
- <=7: reject and reprompt

## 12. Optional Two-Pass Strategy (Recommended)

Pass 1: Planning only (no code)

- output: `status`, `assumptions`, `file_changes`, checklist predictions

Pass 2: Code generation

- only after pass 1 accepted

This significantly reduces hallucinated edits and simplifies review.

## 13. Security and Safety Boundaries for Generated JS

Generated JS must never include:

1. `eval`, `new Function`, dynamic import from untrusted strings
2. direct DOM mutation outside React lifecycle
3. network calls unless explicitly requested
4. global mutable singletons for card-local behavior

If user asks for restricted behavior, model should return `BLOCKED` with reason.

## 14. Integration with Manual Sandbox (HC-015 companion)

When using the sandbox app described in `design/01-...manual-llm-validation.md`:

1. run prompt with contract output
2. apply code to sandbox in-memory
3. run automated contract checks
4. run interaction smoke tests
5. only then promote to repo patch

This creates a controlled pre-merge staging workflow for generated code.

## 15. Minimal Ready-to-Use Prompt Pack

## 15.1 System Prompt

```text
You generate HyperCard DSL/JS code with strict repository constraints.
Never invent APIs or card types.
Return output as one JSON object following the provided schema.
```

## 15.2 Developer Prompt Stub

```text
TASK: <...>
ALLOWED FILES: <...>
REPO FACTS: <...>
OUTPUT CONTRACT: <...>
SELF-CHECK LIST: <...>
```

## 15.3 User Prompt Stub

```text
Build <feature> for <app>, with <constraints>.
```

## 16. Final Operational Guidance

1. Treat prompting like API design, not conversation.
2. Never omit architectural invariants.
3. Force machine-parseable output.
4. Require explicit self-check booleans.
5. Use repair prompts for targeted fault classes.
6. Keep context tight and canonical.
7. Prefer two-pass generation for high-impact changes.

Following this spec will not guarantee perfection, but it materially reduces failure classes that currently consume review/debug time.
