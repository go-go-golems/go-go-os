---
Title: Comprehensive JS API design for engine factories profile registry and schema-first middleware (v2 hard cutover)
Ticket: OS-09-JS-ENGINE-API-DESIGN
Status: active
Topics:
    - go-go-os
    - javascript
    - api-design
    - middleware
    - profiles
    - engine
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-go-os/go-inventory-chat/internal/backendhost/routes.go
      Note: Namespaced app route policy and forbidden legacy aliases
    - Path: go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main.go
      Note: Namespaced mounting, hard legacy 404s, in-memory profile registry bootstrap
    - Path: go-go-os/go-inventory-chat/cmd/go-go-os-launcher/inventory_backend_module.go
      Note: Profile API + schema API handler registration
    - Path: go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go
      Note: End-to-end assertions for namespaced routing, legacy 404s, runtime key/version behavior
    - Path: go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go
      Note: Strict resolver policy and request/runtime override rejection
    - Path: go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go
      Note: Middleware schema-first resolution + runtime fingerprint composition
    - Path: go-go-os/packages/engine/src/chat/runtime/profileApi.ts
      Note: Frontend transport API for profiles + schema catalogs
    - Path: go-go-os/packages/engine/src/chat/runtime/useConversation.ts
      Note: Profile+registry propagated into connect/send runtime flows
    - Path: go-go-os/packages/engine/src/chat/ws/wsManager.ts
      Note: Websocket profile+registry query serialization
    - Path: go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: Inventory chat mounted under namespaced base prefix with registry-aware profile selector
    - Path: pinocchio/pkg/webchat/http/profile_api.go
      Note: Shared profile API and middleware/extension schema endpoints
    - Path: geppetto/pkg/js/modules/geppetto/module.go
      Note: Current JS export surface missing profile/schema/factory namespaces
    - Path: geppetto/pkg/js/modules/geppetto/api_engines.go
      Note: Current engines.fromProfile model-centric semantics (to be hard-cutover)
    - Path: geppetto/pkg/js/modules/geppetto/spec/geppetto.d.ts.tmpl
      Note: Public JS type surface currently missing profile/schema/factory APIs
    - Path: geppetto/pkg/profiles/overlay.go
      Note: OverlayStore abstraction currently present but unused by production runtime paths
    - Path: geppetto/pkg/profiles/overlay_test.go
      Note: Only concrete OverlayStore call sites are tests
    - Path: geppetto/ttmp/2026/02/24/GP-21-PROFILE-MW-REGISTRY-JS--port-profile-registry-schema-middleware-schema-support-to-js-bindings/design-doc/02-unified-final-js-api-design-inference-first.md
      Note: Final inference-first JS API synthesis adopted as baseline
    - Path: geppetto/ttmp/2026/02/24/GP-28-STACK-PROFILES--stack-profiles-provider-model-middleware-layering-with-merge-provenance/design-doc/01-stack-profiles-architecture-and-merge-provenance-for-provider-model-middleware-layering.md
      Note: Merge provenance and stack/fingerprint lessons incorporated into v2
ExternalSources: []
Summary: Hard-cutover v2 design for Geppetto JS API that unifies profile registry, schema catalogs, and inference factory composition; removes legacy compatibility paths and drops unused overlay abstraction.
LastUpdated: 2026-02-25T23:55:00-05:00
WhatFor: Define the final implementation target for JS API parity and inference ergonomics under a no-migration hard cutover policy.
WhenToUse: Use for implementation and review of JS profile/schema/factory APIs in geppetto, go-go-os, and pinocchio integrations.
---

# Comprehensive JS API design for engine factories profile registry and schema-first middleware (v2 hard cutover)

## Executive summary

This v2 document replaces the original OS-09 direction with a hard-cutover architecture:

1. No backward-compatibility layer.
2. No migration-phase dual semantics.
3. No overlay abstraction in the target profile-resolution path.
4. Registry-first profile resolution as the only profile model.
5. Schema-first middleware configuration as the only middleware config model.
6. Inference-first JS API that composes into existing Builder/Session runtime contracts.

Key conclusions from current codebase state:

1. go-go-os is already hard-cut to namespaced backend routes (`/api/apps/<app-id>/...`) with explicit legacy route blocking.
2. profile CRUD and schema catalog endpoints are already exposed and consumed over app-scoped APIs.
3. strict resolver/composer paths reject ad-hoc runtime overrides.
4. Geppetto JS bindings still do not expose profile registry APIs, schema catalogs, or engine factories.
5. `OverlayStore` in `geppetto/pkg/profiles/overlay.go` is currently unused in production runtime paths and should be removed from the final design.

## Hard-cutover decisions

These are final design decisions for v2:

1. `engines.fromProfile(...)` semantics change to registry-backed profile resolution only.
2. Legacy model-centric fallback behavior in `engines.fromProfile` is removed.
3. Profile APIs are registry-first only (`profiles.Registry` semantics); no alternate map-based compatibility path.
4. Middleware config is resolved through schema-aware definition registries only.
5. Route policy remains namespaced-only; no legacy aliases.
6. Overlay abstraction is removed from architecture and implementation plan.

## Current-state evidence (rebased go-go-os + pinocchio + geppetto)

### 1) Namespaced route policy and legacy hard block are active

1. App prefix construction is fixed at `/api/apps/<app-id>` (`go-go-os/go-inventory-chat/internal/backendhost/routes.go:29-35`).
2. Legacy aliases are explicitly forbidden by guard (`/chat`, `/ws`, `/api/timeline`) (`.../routes.go:12-16`, `59-67`).
3. Launcher startup validates and rejects forbidden aliases (`go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main.go:200-202`).
4. Legacy handlers are intentionally mounted as 404-only stubs (`.../main.go:350-363`).
5. Integration test verifies legacy routes are not mounted (`.../main_integration_test.go:418-432`).

### 2) Profile API and schema API are mounted in app namespace

1. Inventory backend mounts profile handlers via `RegisterProfileAPIHandlers` (`go-go-os/go-inventory-chat/cmd/go-go-os-launcher/inventory_backend_module.go:89-96`).
2. Shared pinocchio handler exposes:
   - `GET /api/chat/schemas/middlewares` (`pinocchio/pkg/webchat/http/profile_api.go:142-149`),
   - `GET /api/chat/schemas/extensions` (`.../profile_api.go:151-158`),
   - profile CRUD routes (`.../profile_api.go:160+`).
3. Extension schema catalog merges explicit schemas + middleware typed-key schemas + codec schemas (`.../profile_api.go:670-740`).

### 3) Resolver/composer enforce strict runtime policy

1. Request resolver rejects chat body overrides (`go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go:109-114`).
2. Resolver selection chain supports body/query/cookie/default profile resolution (`.../request_resolver.go:164-184`).
3. Runtime composer rejects runtime overrides (`.../runtime_composer.go:77-79`).
4. Runtime composer resolves middleware config through definition + resolver pipeline (`.../runtime_composer.go:155-217`).

### 4) Runtime identity and versioning are already part of app truth

1. Runtime key includes profile version (`go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main_integration_test.go:118-124`).
2. Runtime key changes with profile selection (`.../main_integration_test.go:636-678`, `680-744`).
3. Runtime key increments after profile update (`.../main_integration_test.go:917-975`).

### 5) Frontend already sends profile+registry through connect/send

1. `useConversation` passes selected `profile` and `registry` in both connect and send (`go-go-os/packages/engine/src/chat/runtime/useConversation.ts:38-47`, `73-76`).
2. websocket URL appends both query params when set (`go-go-os/packages/engine/src/chat/ws/wsManager.ts:84-91`).
3. profile API client supports registry-aware requests and schema catalog decoding (`go-go-os/packages/engine/src/chat/runtime/profileApi.ts:13-20`, `171-223`, `237+`).
4. Inventory app binds chat UI to namespaced base prefix + default registry (`go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx:33`, `692-699`).

### 6) JS binding parity gap still exists

1. Current exports include `engines`, `middlewares`, `tools`, `createBuilder`, `createSession`, `runInference` only (`geppetto/pkg/js/modules/geppetto/module.go:105-138`).
2. No `profiles`, `schemas`, or `factories` namespace exists in TypeScript contract (`geppetto/pkg/js/modules/geppetto/spec/geppetto.d.ts.tmpl:245-264`).
3. Current `engines.fromProfile` is model/env precedence logic, not registry resolve (`geppetto/pkg/js/modules/geppetto/api_engines.go:81-94`, `251-260`).

### 7) Overlay abstraction is currently unused in production paths

1. Overlay type and constructors are defined (`geppetto/pkg/profiles/overlay.go:9-49`).
2. Repository call-site scan shows concrete uses only in tests (`geppetto/pkg/profiles/overlay_test.go:102-166`), not in launcher/webchat runtime wiring.
3. Therefore `OverlayStore` adds conceptual surface without current runtime value.

## Final v2 JS API architecture

The API must merge GP-21 parity and OS-09 ergonomics, while preserving inference runtime invariants.

### Top-level shape

```ts
import gp from "geppetto";

// new namespaces
const profiles = gp.profiles;
const schemas = gp.schemas;
const factories = gp.factories;
```

### 1) `gp.profiles` (registry CRUD + resolve)

```ts
profiles.listRegistries(): RegistrySummary[]
profiles.getRegistry(registrySlug?: string): ProfileRegistry
profiles.listProfiles(registrySlug?: string): Profile[]
profiles.getProfile(profileSlug: string, registrySlug?: string): Profile
profiles.resolve(input?: ResolveInput): ResolvedProfile
profiles.createProfile(profile: Profile, opts?: { registrySlug?: string; write?: WriteOptions }): Profile
profiles.updateProfile(profileSlug: string, patch: ProfilePatch, opts?: { registrySlug?: string; write?: WriteOptions }): Profile
profiles.deleteProfile(profileSlug: string, opts?: { registrySlug?: string; write?: WriteOptions }): void
profiles.setDefaultProfile(profileSlug: string, opts?: { registrySlug?: string; write?: WriteOptions }): void
```

Contract notes:

1. Backed directly by Go `profiles.Registry`.
2. Registry read/write/resolve semantics are source-of-truth in Go.
3. No JS-side duplicate profile domain model.

### 2) `gp.schemas` (middleware + extension catalogs)

```ts
schemas.listMiddlewares(): Array<{
  name: string;
  version?: number;
  displayName?: string;
  description?: string;
  schema: Record<string, any>;
}>;

schemas.listExtensions(): Array<{
  key: string;
  schema: Record<string, any>;
}>;
```

Contract notes:

1. Middleware schema list comes from `middlewarecfg.DefinitionRegistry`.
2. Extension schema list merges explicit docs + middleware typed-key extension schemas + codec-exposed schemas.
3. Deterministic ordering must be guaranteed.

### 3) `gp.factories` (inference-first composition)

```ts
type FactoryCreateInput = {
  profile?: string;
  registry?: string;
  requestOverrides?: Record<string, any>;
  middlewarePatch?: MiddlewarePatch | ((b: MiddlewarePatchBuilder) => MiddlewarePatchBuilder);
  runDefaults?: { timeoutMs?: number; tags?: Record<string, any> };
  debug?: boolean;
};

interface EngineFactory {
  plan(input?: FactoryCreateInput): ComposedPlan;
  createEngine(input?: FactoryCreateInput): Engine;
  createBuilder(input?: FactoryCreateInput): Builder;
  createSession(input?: FactoryCreateInput): Session;
}

factories.createEngineFactory(options?: {
  defaultRegistrySlug?: string;
  defaultProfileSlug?: string;
}): EngineFactory;

factories.middlewarePatch(): MiddlewarePatchBuilder;
```

Contract notes:

1. Factory composes into existing Builder/Session runtime, not a parallel runner.
2. `plan()` is required for inspectability and debugging.
3. Patch builder is mandatory for deterministic middleware edits.

### 4) `engines.fromProfile` hard-cut semantics

After cutover:

1. `engines.fromProfile(profile, options)` resolves registry profile through `profiles.resolve`/registry wiring.
2. If no profile registry is configured, throw `PROFILE_REGISTRY_NOT_CONFIGURED`.
3. Model/env fallback behavior previously implemented in `api_engines.go` is removed.
4. Direct model/provider construction moves to `engines.fromConfig`.

## Merge, policy, and inference rules (final)

### Factory merge order

1. Base/default step settings (module/host defaults).
2. Resolved effective profile runtime/step settings from registry.
3. Request overrides (only if effective policy allows).
4. Middleware patch operations.
5. Schema validation/coercion of middleware config.
6. Builder/session composition.

### Policy behavior

1. Runtime overrides default to policy-controlled (deny unless explicitly allowed).
2. Unknown middleware names are hard errors.
3. Schema validation errors include path context.

### Fingerprint behavior

Fingerprinting is for runtime identity and engine/session cache correctness.

1. Runtime fingerprint must represent the full effective inference shape:
   - profile slug + profile version,
   - resolved runtime payload,
   - resolved step settings,
   - resolved middleware configs.
2. If stack profiles/provenance are enabled later, ordered layer identity must be included in fingerprint payload.
3. Cache keys for ready-to-go engines/sessions should use runtime fingerprint as primary identity input.

## Inference invariants that must not regress

The new API is valid only if these remain true:

1. `Session` active-run and cancellation behavior remains unchanged.
2. `run`, `runAsync`, and `start` semantics remain unchanged.
3. Context metadata (`sessionId`, `inferenceId`, `tags`, `deadline`) remains available to middlewares/tools.
4. Tool loop and hook wiring stays compatible with existing builder options.

## Remove unnecessary complexity

### 1) Remove overlay abstraction from target architecture

Decision:

1. `OverlayStore` is out-of-scope for v2 profile architecture.
2. No new logic should be built around store-level overlay merging.
3. Resolve path should use single registry service plus explicit stack/provenance model (if/when stack profiles are implemented), not hidden store overlays.

Implementation consequence:

1. Delete `geppetto/pkg/profiles/overlay.go` and related tests in the hard-cutover implementation phase.
2. Remove any docs that recommend overlay-based profile composition.

### 2) Remove migration sections and compatibility branches

Decision:

1. No phased compatibility path in public API docs.
2. No “legacy + new semantics” dual behavior in runtime code.

Implementation consequence:

1. Update JS docs/types/examples directly to final API.
2. Fail fast with explicit error codes instead of silent fallback.

## Implementation plan (hard cutover)

### Phase A: JS namespace parity and host wiring

1. Extend `geppetto/pkg/js/modules/geppetto/Options` with:
   - `ProfileRegistry`,
   - `MiddlewareDefinitionRegistry`,
   - `ExtensionCodecRegistry`,
   - explicit extension schema docs.
2. Add `api_profiles.go`.
3. Add `api_schemas.go`.
4. Wire `profiles` and `schemas` into `installExports`.
5. Update `geppetto.d.ts.tmpl`.

### Phase B: Factory API and patch builder

1. Add `api_factories.go` with `createEngineFactory` + `middlewarePatch`.
2. Route factory outputs through existing builder/session machinery.
3. Add structured error model and debug plan payload.

### Phase C: hard switch `engines.fromProfile`

1. Replace model-centric `fromProfile` path with registry-backed resolution.
2. Remove old fallback helpers for `fromProfile` semantics.
3. Keep `fromConfig` as explicit non-registry engine constructor.

### Phase D: remove overlay abstraction

1. Delete `geppetto/pkg/profiles/overlay.go`.
2. Delete `geppetto/pkg/profiles/overlay_test.go`.
3. Remove overlay references in docs.

### Phase E: verify in heavy consumers

1. Validate go-go-os inventory launcher integration paths.
2. Validate pinocchio profile/schema endpoints + runtime composition parity.
3. Add targeted tests for:
   - profile+registry propagation,
   - schema list contracts,
   - runtime key/fingerprint changes on profile updates,
   - explicit failure on missing registry wiring.

## API examples (v2)

### Example 1: list profiles and schema catalogs

```js
const gp = require("geppetto");

const regs = gp.profiles.listRegistries();
const profiles = gp.profiles.listProfiles("default");
const middlewareSchemas = gp.schemas.listMiddlewares();
const extensionSchemas = gp.schemas.listExtensions();

console.log({ regs, profileCount: profiles.length, mwSchemaCount: middlewareSchemas.length });
```

### Example 2: create session from profile via factory

```js
const gp = require("geppetto");

const f = gp.factories.createEngineFactory({
  defaultRegistrySlug: "default",
  defaultProfileSlug: "inventory",
});

const session = f.createSession({
  profile: "analyst",
  debug: true,
});

const out = session.run(gp.turns.newTurn({
  blocks: [gp.turns.newUserBlock("Summarize low-stock items")],
}));

console.log(out);
```

### Example 3: middleware patch with typed intent

```js
const gp = require("geppetto");

const factory = gp.factories.createEngineFactory({
  defaultRegistrySlug: "default",
});

const plan = factory.plan({
  profile: "inventory",
  middlewarePatch: (m) =>
    m
      .configure("inventory_suggestions_policy", { instructions: "Prefer operational next steps." })
      .append({ name: "turnLogging", config: { verbose: false } }),
  debug: true,
});

console.log(plan.runtimeFingerprint);
console.log(plan.resolvedRuntime.middlewares);
```

## Risks and mitigations

1. Risk: breakage for scripts relying on legacy `fromProfile` model fallback.
   - Mitigation: hard error with explicit code and clear migration docs in same release.
2. Risk: policy drift if JS duplicates merge logic.
   - Mitigation: keep Go registry+resolver as source of truth and keep JS thin.
3. Risk: schema metadata gaps in base registries.
   - Mitigation: allow optional metadata provider interfaces; fallback gracefully to name+schema.
4. Risk: fingerprint mismatch across components.
   - Mitigation: single canonical fingerprint construction in Go runtime path.

## Open questions requiring explicit yes/no before implementation freeze

1. Should `engines.fromProfile` require `options.registry` always, or default to configured default registry slug?
2. Should `gp.factories.createEngineFactory` return debug payloads by default or only when `debug:true`?
3. Should middleware patch operations allow implicit target by `name` without `id` when multiple instances exist?

## Final recommendation

Proceed with this v2 hard-cutover design exactly as specified:

1. implement `profiles`, `schemas`, and `factories` namespaces,
2. hard-switch `engines.fromProfile` semantics,
3. remove overlay abstraction,
4. keep inference/runtime behavior stable by composing through existing Builder/Session engine paths.

No migration compatibility layer is required.
