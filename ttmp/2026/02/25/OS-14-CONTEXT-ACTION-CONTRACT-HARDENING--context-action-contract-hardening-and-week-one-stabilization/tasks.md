# Tasks

## Execution Checklist

### Ticket setup and review intake

- [x] `OS14-00` Create ticket `OS-14-CONTEXT-ACTION-CONTRACT-HARDENING` and baseline workspace docs.
- [x] `OS14-01` Capture review intake summary and actionable scope from attached windowing assessment.
- [x] `OS14-02` Author detailed "three things this week" implementation path doc.
- [x] `OS14-03` Author command-oriented week-one implementation/verification playbook.
- [x] `OS14-04` Produce granular phased task checklist for execution.
- [x] `OS14-05` Upload ticket bundle to reMarkable under date-scoped OS-14 folder.

### Phase 1: Precedence fallback hardening

- [x] `OS14-10` Add unit tests reproducing window target mismatch with `appId` and `widgetId` qualifiers.
- [x] `OS14-11` Add unit tests covering icon target fallback interactions (`iconKind`, `appId`, `widgetId`).
- [x] `OS14-12` Add tests proving deterministic de-duplication of precedence keys.
- [x] `OS14-13` Implement fallback expansion in `resolveContextActionPrecedenceKeys`:
  exact -> drop widgetId -> drop iconKind -> drop appId -> broad kind/app/window.
- [x] `OS14-14` Validate existing precedence behavior remains stable for already-supported cases.
- [x] `OS14-15` Add/adjust integration tests for right-click actions registered via window/icon/conversation hooks.
- [x] `OS14-16` Verify inventory folder/icon context-menu flows still resolve expected defaults + dynamic entries.

### Phase 2: Context menu layering hardening

- [x] `OS14-20` Choose week-one layering strategy and document rationale (fixed top z-index by default).
- [x] `OS14-21` Implement context menu z-index hardening in desktop theme primitives.
- [ ] `OS14-22` Add regression test or visual assertion where feasible; otherwise add explicit manual QA evidence note.
- [ ] `OS14-23` Run manual stress scenario (many focus changes + repeated right-click) to confirm menu remains visible.

### Phase 3: Contract docs and debug instrumentation

- [x] `OS14-30` Update desktop runtime authoring docs with target-kind map and registration-hook mapping.
- [x] `OS14-31` Document precedence fallback order including qualifier drop semantics.
- [x] `OS14-32` Add troubleshooting section: "action not showing", expected target vs registered key, and quick checks.
- [x] `OS14-33` Add debug logger statements around context-menu open resolution (target, keys, matched entries).
- [x] `OS14-34` Ensure debug logging is namespace-gated and does not pollute default console output.
- [x] `OS14-35` Add one short debug usage snippet to docs (`DEBUG=...`) for developers.

### Phase 4: Validation, release notes, and closeout

- [ ] `OS14-40` Run targeted unit/integration tests for context action registry and desktop context menu behavior.
- [x] `OS14-41` Run build validation for touched packages/apps.
- [x] `OS14-42` Capture before/after validation evidence in changelog and ticket docs.
- [x] `OS14-43` Run `docmgr doctor --ticket OS-14-CONTEXT-ACTION-CONTRACT-HARDENING --stale-after 30`.
- [ ] `OS14-44` Close ticket once all three week-one deliverables and verification evidence are complete.

## Definition of Done

- [ ] Precedence fallback resolves hook-registered actions even when open target includes `appId`/`widgetId` qualifiers.
- [ ] Context menu renders above windows under prolonged usage (no intermittent behind-window rendering).
- [ ] Contract docs clearly explain target mapping, fallback order, and troubleshooting.
- [ ] Debug logging makes target/key resolution observable on demand.
- [ ] Test/build validation and ticket documentation evidence are recorded.
