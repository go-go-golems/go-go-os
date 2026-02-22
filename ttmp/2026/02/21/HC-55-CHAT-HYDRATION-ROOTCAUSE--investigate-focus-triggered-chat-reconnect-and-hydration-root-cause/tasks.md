# Tasks

## TODO

- [ ] Confirm whether focus causes a true chat subtree remount or only a rerender
- [ ] Capture lifecycle trace proving exact reconnect trigger path (`mount -> connect -> disconnect -> reconnect -> hydrate`)
- [ ] Decide canonical timeline ordering contract (first-seen order vs last-update order)
- [ ] Align backend snapshot order and frontend order semantics to chosen contract
- [ ] Decide suggestions contract: persisted in backend timeline vs explicitly ephemeral frontend-only
- [ ] If suggestions should persist, add `hypercard.suggestions.*` timeline handlers on Go side
- [ ] Reduce dual-projection ambiguity: define when frontend direct SEM handlers are allowed vs backend `timeline.upsert`
- [ ] Evaluate adding per-entity version in timeline snapshot payload (proto/store/frontend impact)
- [ ] Add regression tests covering focus/reconnect/hydrate order stability in dev and production-like modes

## DONE

- [x] Added deep Go and frontend timeline path analysis to HC-55 bug report
- [x] Documented ring buffer behavior and clarified that hydration reads timeline store, not sem buffer
