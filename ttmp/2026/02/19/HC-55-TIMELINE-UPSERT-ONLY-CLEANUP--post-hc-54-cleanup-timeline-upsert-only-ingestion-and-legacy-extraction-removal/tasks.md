# Tasks

## TODO

- [ ] 1) Convert Inventory chat ingestion to canonical `timeline.upsert` projection path only:
  - remove `onEnvelope` filter that skips `timeline.upsert` in `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - enable `timeline.upsert` registration in sem registry setup for inventory runtime
  - ensure only timeline entities drive chat timeline rendering/hydration behavior
- [ ] 2) Remove redundant direct Hypercard raw-event extraction from inventory artifact adapter path:
  - stop relying on direct `hypercard.widget.v1` / `hypercard.card.v2` extraction branches in `packages/engine/src/hypercard-chat/artifacts/artifactRuntime.ts`
  - keep artifact upsert derivation from canonical `timeline.upsert` entities only
- [ ] 3) Align projection adapter coverage and tests with timeline-upsert-only behavior:
  - update `apps/inventory/src/features/chat/runtime/projectionAdapters.ts` expectations if needed
  - update/replace tests that assume direct raw-event extraction pathways
- [ ] 4) Remove residual compatibility branches and stale references introduced by pre-HC-54 behavior:
  - scan for legacy assumptions around direct hypercard ready events in inventory/runtime tests and docs
  - remove dead code/comments that describe dual-path behavior
- [ ] 5) Validation gate:
  - `go test ./...` in `go-inventory-chat`
  - `npm run test -w packages/engine`
  - targeted inventory chat tests
  - `npm run typecheck`
  - legacy-path scan proving no direct raw-event artifact extraction path remains for widget/card

## Done

- [x] Create follow-up cleanup ticket and seed concrete execution tasks
