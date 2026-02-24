# Tasks

## Execution Checklist

- [ ] `OS06-01` Define backend module interfaces (`AppBackendManifest`, `AppBackendModule`) in Go.
- [ ] `OS06-02` Add backend module registry with unique app ID enforcement.
- [ ] `OS06-03` Add lifecycle manager for module init/start/stop hooks.
- [ ] `OS06-04` Add startup validation for required module presence and health.
- [ ] `OS06-05` Add namespaced router mount helper for `/api/apps/<app-id>`.
- [ ] `OS06-06` Implement `/api/os/apps` endpoint exposing backend module capabilities.
- [ ] `OS06-07` Convert inventory backend into module form and mount under namespaced route.
- [ ] `OS06-08` Update frontend-consumed API references to use namespaced inventory routes.
- [ ] `OS06-09` Remove legacy aliases (`/chat`, `/ws`, `/api/timeline`) from backend router wiring.
- [ ] `OS06-10` Add startup guard that fails when forbidden legacy routes are configured.
- [ ] `OS06-11` Add unit tests for module registry collision behavior.
- [ ] `OS06-12` Add integration tests for namespaced route mount + request handling.
- [ ] `OS06-13` Add integration tests for required-module startup failures.
- [ ] `OS06-14` Add tests validating `/api/os/apps` payload schema and completeness.
- [ ] `OS06-15` Run `go test ./...` and record baseline outputs in changelog.
- [ ] `OS06-16` Update backend runbook documenting module host and route policy.
- [ ] `OS06-17` Run `docmgr doctor --ticket OS-06-BACKEND-MODULE-HOST-HARD-CUTOVER --stale-after 30`.

## Definition of Done

- [ ] Backend module host composes app modules in one process.
- [ ] All app backend routes use `/api/apps/<app-id>/*` namespace.
- [ ] Legacy aliases are removed and blocked by tests.
