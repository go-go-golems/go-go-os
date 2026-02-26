# Tasks

## Execution Checklist

### Ticket setup and research framing

- [x] `OS11-00` Confirm OS-11 ticket scope from OS-10 scenario 11 follow-up requirements.
- [x] `OS11-01` Produce intern-ready architecture and implementation guide with evidence-backed references.
- [x] `OS11-02` Record investigation diary including commands, findings, and delivery steps.

### Phase 1: Context target contracts and registry foundation

- [ ] `OS11-10` Add `ContextTargetKind` and `ContextTargetRef` contracts to shell type layer.
- [ ] `OS11-11` Add target-aware action descriptor contract including origin metadata.
- [ ] `OS11-12` Implement context action registry module with register/unregister/query primitives.
- [ ] `OS11-13` Add deterministic ordering and conflict policy helpers (id collision + precedence).
- [ ] `OS11-14` Add unit tests for target match and merge semantics.
- [ ] `OS11-15` Export new contracts and helpers via desktop-react barrel.

### Phase 2: Shell runtime integration for target-scoped menus

- [ ] `OS11-20` Extend `desktopMenuRuntime` APIs to support target-scoped registration (while keeping window API available).
- [ ] `OS11-21` Refactor `useDesktopShellController` context menu state to include `targetRef`.
- [ ] `OS11-22` Implement context action resolution pipeline (`exact target -> qualified kind -> window -> defaults`).
- [ ] `OS11-23` Add right-click handling support for desktop icons in `DesktopIconLayer` and controller wiring.
- [ ] `OS11-24` Add infrastructure hooks for widget/message/conversation target emitters.
- [ ] `OS11-25` Ensure routed command invocation payload contains `targetRef` metadata.
- [ ] `OS11-26` Add controller tests for target-specific menu resolution and fallback behavior.

### Phase 3: Plugin declaration API and validation

- [ ] `OS11-30` Extend plugin runtime contracts with context action declaration types.
- [ ] `OS11-31` Add context action declaration support to stack bootstrap surface.
- [ ] `OS11-32` Add runtime-service validation for context action declarations on bundle load.
- [ ] `OS11-33` Extend plugin authoring d.ts files for app bundles (`inventory`, `todo`, `crm`, `book-tracker-debug`).
- [ ] `OS11-34` Add plugin-runtime unit tests for valid/invalid action declarations.
- [ ] `OS11-35` Document declaration schema examples in engine docs.

### Phase 4: Capability and authorization model

- [ ] `OS11-40` Extend `CapabilityPolicy` with `contextActions.register` and `contextActions.invoke` scopes.
- [ ] `OS11-41` Implement capability resolution defaults (deny plugin context actions unless declared).
- [ ] `OS11-42` Implement authorization helpers for registration and invocation checks.
- [ ] `OS11-43` Integrate checks into plugin registration and command execution paths.
- [ ] `OS11-44` Add tests for allowed/denied matrix across target kinds and command namespaces.

### Phase 5: Plugin lifecycle bridge

- [ ] `OS11-50` Create plugin context-action bridge module bound to `(appId, pluginId, sessionId, windowId)`.
- [ ] `OS11-51` Register plugin actions when session status becomes `ready`.
- [ ] `OS11-52` Unregister plugin actions on session dispose, runtime error, and window close.
- [ ] `OS11-53` Add idempotent replace behavior for plugin reload (same id re-registration).
- [ ] `OS11-54` Add integration tests proving no leaked registrations after teardown.

### Phase 6: Routing, namespacing, and execution safety

- [ ] `OS11-60` Define and enforce plugin command namespace format (`plugin.<appId>.<pluginId>.<actionId>`).
- [ ] `OS11-61` Add payload validation guardrails (JSON shape and size bounds).
- [ ] `OS11-62` Route plugin context actions through existing command router with origin tracing.
- [ ] `OS11-63` Add robust error handling (failed handler execution should not crash shell).
- [ ] `OS11-64` Add tests for malformed payloads, unknown commands, and namespace violations.

### Phase 7: Telemetry, kill switch, and operator safety

- [ ] `OS11-70` Add plugin context-action telemetry events (`shown`, `invoked`, `blocked`, `error`).
- [ ] `OS11-71` Add in-memory kill switch controls: global, app-level, plugin-level.
- [ ] `OS11-72` Integrate kill switch checks into action visibility and invocation paths.
- [ ] `OS11-73` Add debug surface or logging adapter to inspect plugin context-action state.
- [ ] `OS11-74` Add tests for kill switch precedence and telemetry emission.

### Phase 8: Launcher and app integration demos

- [ ] `OS11-80` Add one concrete plugin context-action demo in Inventory (for message or widget target).
- [ ] `OS11-81` Add one non-inventory demo (Todo/CRM/BookTracker) to prove multi-app compatibility.
- [ ] `OS11-82` Add os-launcher integration tests for plugin action presence and execution.
- [ ] `OS11-83` Verify non-plugin windows continue to show default context menus.

### Phase 9: Documentation and closure

- [ ] `OS11-90` Update engine authoring docs with target-scoped and plugin-scoped context action APIs.
- [ ] `OS11-91` Add migration notes from window-only context action API to target-scoped API.
- [ ] `OS11-92` Add troubleshooting section (capability denied, registration collisions, teardown leaks).
- [ ] `OS11-93` Run validation commands (`npm run test`, scoped test/build commands) and record outcomes.
- [ ] `OS11-94` Update ticket changelog and diary with final implementation evidence.
- [ ] `OS11-95` Run `docmgr doctor --ticket OS-11-PLUGIN-CONTEXT-ACTIONS --stale-after 30` clean.
- [ ] `OS11-96` Close ticket after DoD is fully met.

## Definition of Done

- [ ] Plugin bundles can declaratively contribute context actions for supported target kinds.
- [ ] Shell resolves target-scoped actions deterministically with documented precedence.
- [ ] Capability model enforces plugin registration/invocation permissions.
- [ ] Plugin action registrations are lifecycle-safe (no stale actions after teardown).
- [ ] Command namespace and payload validation guardrails are enforced.
- [ ] Telemetry and kill switch controls exist and are tested.
- [ ] Launcher integration proves at least two real plugin-backed apps use the new system.
- [ ] Documentation is sufficient for a new intern to implement and operate the feature safely.
