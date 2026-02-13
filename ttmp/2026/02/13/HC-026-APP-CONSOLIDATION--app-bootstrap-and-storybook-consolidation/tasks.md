# Tasks

## TODO

- [ ] Inventory app store wiring differences across all apps
- [x] Migrate `apps/inventory/src/app/store.ts` from manual reducer wiring to `createAppStore`
- [x] Migrate `apps/todo/src/app/store.ts` from manual reducer wiring to `createAppStore`
- [x] Verify `apps/crm/src/app/store.ts` and `apps/book-tracker-debug/src/app/store.ts` remain aligned with shared helper expectations
- [x] Add or improve typing support in `createAppStore` if needed for migrated apps
- [x] Inventory story wiring differences across apps
- [x] Migrate Todo story setup (`apps/todo/src/stories/TodoApp.stories.tsx`) to `createStoryHelpers`
- [x] Migrate Inventory story setup (including `apps/inventory/src/stories/decorators.tsx`) to `createStoryHelpers`
- [x] Keep app-specific story behavior only where domain-specific and documented
- [x] Extract repeated binding patterns into reusable helper utilities:
  - [ ] `state.setField` change handlers
  - [ ] scoped edits reset (`patchScopedState('card', { edits: {} })`) patterns
- [ ] Apply extracted helpers in at least two app domains to prove reuse
- [ ] Verify no behavioral regressions in card flows:
  - [ ] list to detail navigation
  - [ ] detail edit flows
  - [ ] form submit/update flows
- [ ] Run validation matrix:
  - [ ] per-app build commands
  - [ ] storybook smoke for migrated stories
  - [ ] root typecheck (after HC-023 merge)
- [ ] Update docs/examples to reflect consolidated helper usage
- [ ] Record migration deltas and validation in changelog
