# Tasks

## TODO

- [ ] C1: Inventory all `tool_result + customKind` producers/consumers (backend projector, frontend mapper, renderers, artifact runtime, tests) and freeze current behavior snapshot
- [ ] C2: Define canonical timeline `kind` contract for hypercard artifacts (`hypercard.widget.v1`, `hypercard.card.v2`) and document required `props` shape
- [ ] C3: Backend cutover: emit first-class hypercard timeline kinds in timeline upsert (`kind`), keep payload fields stable
- [ ] C4: Frontend cutover: register renderers directly for first-class hypercard kinds and remove `customKind` remap dependency
- [ ] C5: Artifact ingestion cutover: parse artifact upserts from first-class hypercard timeline entities (not only `tool_result` wrappers)
- [ ] C6: Compatibility window: support legacy `tool_result + customKind` for replay/old sessions with explicit deprecation guardrails
- [ ] C7: Remove compatibility path after soak period (delete remap logic + legacy tests + dead conditionals)
- [ ] C8: Add migration validation playbook (snapshot/replay, websocket stream, open/edit artifact flows, suggestions unaffected)
