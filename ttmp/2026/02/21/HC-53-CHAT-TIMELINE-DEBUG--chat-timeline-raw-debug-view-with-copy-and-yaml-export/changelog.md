# Changelog

## 2026-02-21

- Initial workspace created.
- Added implementation analysis for chat timeline raw debug window with structured tree, per-entity copy, conversation copy, and YAML export.
- Added implementation backlog tasks and diary step documenting architecture findings and execution plan.
- Implemented `timelineDebugModel.ts`: snapshot builder, sanitizeForExport, entity/conversation YAML copy, YAML file export helpers.
- Implemented `StructuredDataTree.tsx`: recursive expand/collapse tree component for nested object/array inspection.
- Implemented `TimelineDebugWindow.tsx`: split-pane debug window with entity list, tree/YAML detail view, per-entity copy, conversation copy, and YAML export.
- Wired into inventory app: header button, desktop icon, menu command, appKey routing in `App.tsx`.
- Added engine barrel exports for `TimelineDebugWindow`, `timelineDebugModel`, `StructuredDataTree`.
- Added 18 vitest tests for snapshot model (empty/populated, sanitization, YAML export).
- Added 5 Storybook stories: Empty, MixedEntities, DeeplyNested, HighVolume (120 entities), SuggestionsOnly.
- All implementation tasks complete.
