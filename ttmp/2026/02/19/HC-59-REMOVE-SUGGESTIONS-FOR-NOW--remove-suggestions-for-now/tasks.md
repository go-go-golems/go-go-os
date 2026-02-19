# Tasks

## TODO

- [x] Add tasks here
  Task explanation and bigger refactor purpose: establish explicit execution tracking for a cross-cutting removal ticket.

- [x] Create HC-59 ticket workspace and baseline docs
  Task explanation and bigger refactor purpose: create a dedicated scope for suggestions removal so it is not mixed into HC-58 architecture work.
- [x] Write implementation plan document
  Task explanation and bigger refactor purpose: define file-level removal sequencing to avoid partial or inconsistent deletes.
- [x] Inventory and engine-wide suggestions surface mapping
  Task explanation and bigger refactor purpose: identify every state, adapter, UI, story, and docs touchpoint so no suggestion path is left behind.
- [x] Record diary and changelog with upload verification
  Task explanation and bigger refactor purpose: preserve command-level traceability and publication evidence for review workflows.
- [x] Upload HC-59 implementation plan to reMarkable
  Task explanation and bigger refactor purpose: publish plan to the established architecture-review channel.
- [x] Remove suggestion SEM handling and InventoryChatWindow suggestion wiring
  Task explanation and bigger refactor purpose: remove event-driven suggestion behavior from active inventory runtime flow.
- [x] Remove suggestion state/actions/selectors from inventory chatSlice
  Task explanation and bigger refactor purpose: eliminate app-owned suggestion runtime state and simplify chat slice responsibilities.
- [x] Write suggestions behavior-spec document for future rebuild
  Task explanation and bigger refactor purpose: preserve feature semantics so future reintroduction is deliberate and testable.
- [x] Run tests/typecheck for inventory and engine surfaces impacted by HC-59
  Task explanation and bigger refactor purpose: verify suggestion removal did not regress active chat runtime behavior.
- [x] Remove suggestion props/rendering from engine runtime and chat widgets
  Task explanation and bigger refactor purpose: delete stale API surface and prevent accidental dependency on removed suggestion flow.
- [x] Update diary/changelog throughout and commit each implementation phase
  Task explanation and bigger refactor purpose: keep phase-level implementation history explicit and reviewable.
- [x] Clean up suggestion references in stories/docs/theme/event viewer
  Task explanation and bigger refactor purpose: remove residual references so examples/docs/styles match actual runtime behavior.
