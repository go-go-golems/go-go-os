# Tasks

## TODO

- [x] 1) Freeze clean-cut scope and deletion policy:
  - document explicit no-backcompat rule in HC-56 docs and code comments
  - list all legacy inventory-owned chat runtime paths to delete (no shadow path allowed)
- [x] 2) Create reusable main-package chat runtime boundary:
  - extract connection + projection + display synthesis orchestration into shared package surface
  - define host callback interfaces for app-only actions (artifact open/edit, command dispatch)
- [x] 3) Move timeline ingestion to canonical upsert-only entry:
  - ensure reusable runtime uses timeline.upsert as durable truth
  - remove remaining direct raw-event extraction branches from inventory runtime path
- [x] 4) Extract renderer dispatch to registry-driven package seam:
  - keep kind normalizers and kind renderers registered via explicit bootstrap
  - remove inventory-local widget/card type switching logic now superseded by registry
- [x] 5) Extract Hypercard widget/card renderers as self-contained pack:
  - `git mv` renderer files first to preserve history and styling
  - keep pack registration explicit and app-triggered (no side-effect init)
- [x] 6) Rewire inventory app to pure host/integration role:
  - replace inventory chat runtime ownership with reusable main package consumption
  - keep only inventory business callbacks and domain actions
- [x] 7) Storybook + contract stories for extracted components:
  - add stories for reusable chat runtime shell-facing components
  - add stories for extracted Hypercard renderer pack components
- [x] 8) Remove legacy code and test surface:
  - delete old inventory runtime helpers, obsolete render branches, and compatibility adapters
  - delete or rewrite tests that assert legacy path behavior
- [x] 9) Validation gate:
  - run frontend typecheck/tests + backend tests touched by runtime and projection seams
  - verify hydration + replay + live stream parity for widget/card and tool timeline rendering
  - fail ticket if any legacy inventory-owned chat orchestration path remains in active code

## Done

- [x] Create HC-56 ticket workspace and initial task scaffold
- [x] Add detailed HC-56 implementation plan with cross-references to HC-53, HC-54, and pinocchio docs
