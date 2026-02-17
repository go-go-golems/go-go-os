# Tasks

## TODO

- [x] Create HC-45 ticket workspace and scaffold analysis/plan docs
- [x] Complete 5+ page architecture analysis for desktop shell/windowing reusability
- [x] Complete 5+ page implementation plan with phased execution tasks
- [x] Update ticket index/changelog/diary with investigation and authoring log
- [x] Upload bundled HC-45 design docs to reMarkable and verify remote artifact
- [x] Relate key code files to HC-45 docs with docmgr metadata links
- [x] Final review pass for frontmatter quality and stale metadata checks

## Implementation (Hard Cutover)

- [x] T1: Move windowing state APIs from `features/windowing` to `desktop/core/state`, rewrite imports, and remove legacy `features/windowing` source files
- [x] T2: Extract desktop command routing into a dedicated router module and wire `DesktopShell` through it
- [x] T3: Split `DesktopShell` into controller + view composition (`useDesktopShellController` + `DesktopShellView`) with behavior parity
- [x] T4: Update engine exports/tests/docs to new desktop paths, run validation, and record implementation diary/changelog
