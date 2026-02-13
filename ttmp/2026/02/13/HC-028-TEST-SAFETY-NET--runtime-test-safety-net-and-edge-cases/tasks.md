# Tasks

## TODO

- [ ] Decide test runner placement and scope (engine package, app package, or dedicated workspace)
- [x] Add baseline test infrastructure for runtime-focused tests
- [x] Add tests for `executeActionDescriptor` behavior:
- [x] builtin navigation and toast actions
- [x] local action handler precedence
- [x] shared action handler fallback
- [x] unhandled action signaling path
- [x] Add tests for selector resolution order (`card` -> `cardType` -> `background` -> `stack` -> `global` -> `shared`)
- [x] Add tests for scoped state mutation commands:
- [x] `state.set`
- [x] `state.setField`
- [x] `state.patch`
  - [ ] `state.reset`
- [ ] Add navigation reducer tests for initialization/reset semantics including non-`home` `homeCard`
- [ ] Add `ListView` footer tests for empty and non-empty datasets (`sum`, `count`, `avg`, `min`, `max`)
- [ ] Add at least one end-to-end-like integration test around card action execution with selectors + params + event payload
- [ ] Ensure tests are deterministic and not coupled to Storybook runtime
- [ ] Add root/package scripts for running tests in CI
- [ ] Run full validation matrix and capture command outputs
- [ ] Document test suite structure and how to extend it in ticket docs
