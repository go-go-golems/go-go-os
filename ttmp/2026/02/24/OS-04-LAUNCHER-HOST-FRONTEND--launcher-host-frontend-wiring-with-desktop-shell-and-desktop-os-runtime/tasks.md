# Tasks

## Execution Checklist

- [ ] `OS04-01` Create or repurpose launcher app package (`apps/os-launcher`) with workspace scripts.
- [ ] `OS04-02` Add launcher app `tsconfig.json` and Vite config using repo conventions.
- [ ] `OS04-03` Implement `src/main.tsx` provider bootstrap and theme wiring.
- [ ] `OS04-04` Implement `src/app/store.ts` using `desktop-os/createLauncherStore`.
- [ ] `OS04-05` Implement `src/app/modules.ts` assembling launchable modules list.
- [ ] `OS04-06` Implement `src/app/registry.ts` using `createAppRegistry`.
- [ ] `OS04-07` Implement icon model derivation using `buildLauncherIcons`.
- [ ] `OS04-08` Wire desktop launcher grid component to manifest-driven icon list.
- [ ] `OS04-09` Implement `openWindow` host action using engine window primitives.
- [ ] `OS04-10` Implement app-key creation and attach it to window payload metadata.
- [ ] `OS04-11` Implement app window renderer using `renderAppWindow`.
- [ ] `OS04-12` Ensure unknown app/window payload fails safely with explicit UI fallback.
- [ ] `OS04-13` Add smoke test for launcher boot with valid module set.
- [ ] `OS04-14` Add negative test for registry collision boot failure.
- [ ] `OS04-15` Add interaction test: click icon opens corresponding app window.
- [ ] `OS04-16` Add test/assertion that host remains orchestration-only (no app-specific business logic).
- [ ] `OS04-17` Validate desktop and mobile layout behavior for shell + window surfaces.
- [ ] `OS04-18` Run `npm run -w apps/os-launcher lint test build` and capture results in changelog.
- [ ] `OS04-19` Run full frontend smoke (`npm run lint`, `npm run test`) before handoff.
- [ ] `OS04-20` Run `docmgr doctor --ticket OS-04-LAUNCHER-HOST-FRONTEND --stale-after 30`.

## Definition of Done

- [ ] Launcher host boots with single store and manifest-driven icons.
- [ ] App windows are opened and rendered only through desktop-os runtime APIs.
- [ ] Tests cover core host behavior and failure paths.
