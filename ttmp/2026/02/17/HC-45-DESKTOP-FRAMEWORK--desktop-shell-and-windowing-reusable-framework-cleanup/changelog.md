# Changelog

## 2026-02-17

- Initial workspace created
- Added comprehensive architecture assessment document for reusable desktop/windowing framework extraction
- Added phased implementation plan document with detailed workstreams, tasks, acceptance criteria, and migration strategy
- Updated ticket index/tasks metadata to reflect completed analysis and planning phase
- Added docmgr related-file links for analysis, plan, and diary artifacts
- Added `windowing` and `design-system` topic vocabulary entries and re-ran doctor checks
- Uploaded bundled design docs to reMarkable at `/ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK/HC-45 Desktop Framework Analysis and Plan`
- Added hard-cutover implementation task block (`T1`-`T4`) to ticket tasks
- Completed `T1`: moved windowing state from `features/windowing` to `desktop/core/state` and removed legacy source files
- Completed `T2`: extracted built-in desktop command routing into `desktopCommandRouter` with dedicated tests
- Completed `T3`: split monolithic `DesktopShell` into `useDesktopShellController` + `DesktopShellView` composition
- Updated engine exports/imports to desktop core state paths and validated with `npm run -w packages/engine test`
