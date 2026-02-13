# Tasks

## TODO

- [ ] Confirm baseline failures still reproduce:
- [x] `npm run build` fails because `@hypercard/engine` has no `build` script
- [x] `npm run lint` fails due missing lint config/tooling
- [x] `npm run typecheck` passes while omitting `apps/todo` and `apps/crm`
- [x] Add `build` script in `packages/engine/package.json` (prefer `tsc -b`)
- [x] Redesign root `build` script in `package.json` to cover all workspaces or an explicit app matrix
- [x] Add `apps/todo` and `apps/crm` to root `tsconfig.json` references
- [x] Install and configure Biome at repo root (`biome.json`)
- [x] Replace root lint script with Biome check command
- [x] Add root lint-fix script using Biome write mode
- [x] Define Biome include/ignore paths so generated/build outputs are excluded
- [x] Verify Biome handles TS/TSX for:
- [x] `packages/engine/src/**`
- [x] `apps/**/src/**`
- [x] Storybook config files as intended
- [x] Run and record post-change validation:
  - [ ] `npm run typecheck`
  - [ ] `npm run build`
  - [ ] `npm run lint`
- [ ] Add/update CI job commands to use root `typecheck` + `build` + Biome lint
- [ ] Document the new setup contract in root `README.md` quick-start/tooling sections
- [ ] Add short migration notes for developers who used ESLint CLI locally
- [ ] Update ticket changelog with final command outputs and outcomes
