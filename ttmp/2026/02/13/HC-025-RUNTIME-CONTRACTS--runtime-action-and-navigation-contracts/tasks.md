# Tasks

## TODO

- [ ] Decide `ActionDescriptor.to` strategy and document decision:
- [x] Implement full scope-aware execution semantics
- [x] Or remove/deprecate `to` from API surface if not supported
- [x] If implementing `to` semantics, update runtime dispatch flow in `packages/engine/src/cards/runtime.ts`
- [x] Add coverage for each action scope target:
- [x] `card`
- [x] `cardType`
- [x] `background`
- [x] `stack`
- [x] `global`
- [x] `shared`
  - [ ] `auto`
- [ ] Add explicit unhandled action signal path:
  - [ ] dev warning and debug metadata
  - [ ] ensure signal includes action type + card context
- [ ] Ensure errors in async local/shared action handlers are surfaced consistently
- [ ] Fix navigation initialization contract:
  - [ ] remove hard-coded `home` default from reducer initialization flow
  - [ ] ensure reset behavior respects active stack `homeCard`
- [ ] Define/update action(s) needed for runtime-aware navigation reset payload
- [ ] Add migration notes for existing stacks currently assuming card id `home`
- [ ] Fix `ListView` footer edge case for `min`/`max` when item list is empty
- [ ] Add regression tests for:
  - [ ] scope-aware action dispatch behavior
  - [ ] unhandled action signaling behavior
  - [ ] navigation reset to `homeCard`
  - [ ] empty footer aggregation results
- [ ] Update docs to reflect final action scope contract and navigation behavior
- [ ] Record command-level verification in changelog
