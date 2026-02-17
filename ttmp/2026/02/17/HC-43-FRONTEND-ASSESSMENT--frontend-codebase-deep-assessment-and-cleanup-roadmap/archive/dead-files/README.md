# Dead File Archive (HC-43 Phase 1)

Date: 2026-02-17

These files were archived before removal from active source as part of the HC-43 Phase 1 low-risk cleanup item:

- Remove legacy dead-file markers and archive actual dead files.

Archived snapshots:

- `apps-inventory-src-stories-decorators.tsx`
- `packages-engine-src-plugin-runtime-worker-sandboxClient.ts`
- `packages-engine-src-plugin-runtime-worker-runtime.worker.ts`

Verification notes:

- `decorators.tsx` had no runtime references and contained only a legacy marker stub.
- `sandboxClient.ts` and `runtime.worker.ts` were unreferenced by active runtime paths; only barrel-exported from `plugin-runtime/index.ts`, which also introduced unwanted worker-side effects in non-browser test contexts.
