# Tasks

## Execution Checklist

### Ticket setup and bug intake

- [x] `OS15-00` Create ticket `OS-15-CONTEXT-ACTION-EFFECT-LOOP` with bug-focused scope.
- [x] `OS15-01` Record stack-trace-driven bug summary and impacted subsystems.
- [x] `OS15-02` Author detailed root-cause research document with code-line evidence and dependency loop analysis.
- [x] `OS15-03` Upload bug report + research bundle to reMarkable.

### Root-cause validation and reproduction

- [x] `OS15-10` Build minimal deterministic reproduction scenario (StrictMode + context action registration). (Waived at close by user direction.)
- [x] `OS15-11` Capture lifecycle logs proving cleanup/register loop before fix. (Waived at close by user direction.)
- [x] `OS15-12` Identify all entry points that call `useRegisterContextActions` and classify churn risk. (Waived at close by user direction.)

### Fix design and implementation

- [x] `OS15-20` Split runtime context surface so registration hooks do not depend on `openContextMenu` identity.
- [x] `OS15-21` Keep `useOpenDesktopContextMenu` behavior unchanged for callers while decoupling internals.
- [x] `OS15-21A` Move context-menu UI state (`open/close + payload`) from controller-local state into Redux `windowing.desktop`.
- [x] `OS15-21B` Add Redux selectors/actions for context-menu state and route all context-menu close paths through reducers.
- [x] `OS15-21C` Sanitize persisted context-menu action entries to avoid storing runtime-only visibility predicates in Redux.
- [x] `OS15-22` Add idempotence guardrails in registration effects if needed (target/action stability checks). (Deferred: not required after runtime context split in this ticket scope.)
- [x] `OS15-23` Validate no behavioral regression in icon/window/message/conversation context menus.

### Testing and closure

- [x] `OS15-30` Add regression test that fails on repeated cleanup/register loop and passes after fix. (Waived at close by user direction.)
- [x] `OS15-31` Run targeted engine + launcher tests and record outcomes.
- [x] `OS15-32` Run build validation for impacted apps/packages.
- [x] `OS15-33` Update changelog + diary with final fix evidence.
- [x] `OS15-34` Run `docmgr doctor --ticket OS-15-CONTEXT-ACTION-EFFECT-LOOP --stale-after 30`.
- [x] `OS15-35` Close ticket with documented risk acceptance for deferred regression coverage.

## Definition of Done

- [x] `Maximum update depth exceeded` no longer appears for context-action registration paths. (Validated in manual run.)
- [x] Runtime context registration hooks do not churn due to unrelated callback identity changes. (Validated via architecture change + manual run.)
- [x] Context-menu behavior remains correct for window/icon/message/conversation targets. (Validated by targeted tests.)
- [x] Regression test coverage prevents reintroduction. (Accepted risk: deferred by user direction.)
