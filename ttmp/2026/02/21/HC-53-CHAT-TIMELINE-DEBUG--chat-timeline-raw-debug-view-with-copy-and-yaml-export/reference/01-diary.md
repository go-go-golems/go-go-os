---
Title: Diary
Ticket: HC-53-CHAT-TIMELINE-DEBUG
Status: active
Topics:
    - chat
    - debugging
    - frontend
    - ux
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Analyzed app-level integration point for launching timeline debug view
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/21/HC-53-CHAT-TIMELINE-DEBUG--chat-timeline-raw-debug-view-with-copy-and-yaml-export/design-doc/01-analysis-chat-timeline-raw-debug-tree-with-copy-and-export.md
      Note: Primary analysis artifact recorded by diary
ExternalSources: []
Summary: Diary for analysis and implementation of chat timeline raw debug tree and export tooling.
LastUpdated: 2026-02-21T19:15:00-05:00
WhatFor: Preserve analysis steps, findings, and implementation guidance context.
WhenToUse: Use when continuing implementation planning or reviewing why this debug surface is being added.
---


# Diary

## Goal

Track the analysis process for adding a dedicated chat timeline-state debug view with structured tree inspection and shareable copy/export actions.

## Step 1: Create ticket and complete implementation analysis

I created a new ticket workspace in `2026-02-12--hypercard-react/ttmp`, inspected the existing timeline and debug architecture, and produced a concrete implementation analysis doc for a new timeline debug window.

The analysis is implementation-oriented: it defines data shape, UI architecture, integration points, clipboard/export behavior, risks, and validation criteria so a new contributor can execute directly.

### Prompt Context

**User prompt (verbatim):** "Let's add a ticket for adding debugging features to hypercard. 

ANalyze what it wil ltake to implement the following: 

- a debug view of the chat window that shows the raw timeline data as expendable structured tree, along with clip board buttons (individual timeline widgets, but also entire conversation) and export to YAML button. That way if something is iffy with the timeline, I can give you the raw data straight away. 

Store as analysis document in the new ticket (in 2026-02-12--hypercard-react/ this time)"

**Assistant interpretation:** Create a new ticket in the hypercard-react docs root and deliver an analysis document that explains what is required to implement timeline-state debug inspection and export features.

**Inferred user intent:** Make timeline debugging self-service by adding tooling that can produce accurate raw-state artifacts quickly for support/debugging.

**Commit (code):** N/A (analysis only)

### What I did

- Created ticket:
  - `HC-53-CHAT-TIMELINE-DEBUG`
- Created docs:
  - design doc: `design-doc/01-analysis-chat-timeline-raw-debug-tree-with-copy-and-export.md`
  - diary: `reference/01-diary.md`
- Mapped current architecture:
  - timeline state shape (`timelineSlice`, selectors)
  - debug utilities (`EventViewerWindow`, clipboard, YAML formatter)
  - app integration (`App.tsx` window payload and command routing)
- Wrote detailed analysis covering:
  - problem statement
  - proposed solution
  - design decisions
  - alternatives
  - implementation backlog
  - risks/open questions
  - validation checklist

### Why

- The current event debug view does not expose final reducer timeline state, which is the main artifact needed when timeline rendering appears wrong.

### What worked

- Existing code already provides reusable primitives for clipboard and YAML export, lowering implementation complexity for the new window.

### What didn't work

- No blocking issues during analysis.

### What I learned

- The fastest path is a separate timeline debug window (state-focused) rather than extending the event viewer (stream-focused).

### What was tricky to build

- The key nuance is preserving exact state fidelity for exports while still presenting an operator-friendly structured tree.

### What warrants a second pair of eyes

- Confirm whether exports should include only `timeline` or also `chatSession` diagnostics in the first implementation.

### What should be done in the future

- Implement the backlog tasks listed in `tasks.md` and add helper-level tests for snapshot sanitization and export stability.

### Code review instructions

- Review analysis doc first:
  - `ttmp/2026/02/21/HC-53-CHAT-TIMELINE-DEBUG--chat-timeline-raw-debug-view-with-copy-and-yaml-export/design-doc/01-analysis-chat-timeline-raw-debug-tree-with-copy-and-export.md`
- Then inspect referenced code entry points:
  - `apps/inventory/src/App.tsx`
  - `packages/engine/src/chat/state/timelineSlice.ts`
  - `packages/engine/src/chat/debug/EventViewerWindow.tsx`

### Technical details

- Primary proposal: add `TimelineDebugWindow` + `StructuredDataTree` + snapshot/export helpers under `packages/engine/src/chat/debug/`.
- Launch path: inventory app adds a `timeline-debug:<convId>` appKey route and chat header command/button.

## Step 2: Implement timeline debug window, tests, and stories

Executed the full implementation backlog from the analysis document. Built all components, wired them into the inventory app, added tests, and added Storybook stories.

### Prompt Context

**User prompt (verbatim):** "Implement the docmgr ticket HC-53-CHAT-TIMELINE-DEBUG in @2026-02-12--hypercard-react/ . Keep a detailed diary as you go. Read the implementation / analysis document in the ticket, create tasks in the ticket, then work on them one by one, committing at appropriate points and updating your diary."

**Assistant interpretation:** Execute the implementation backlog from the analysis document, creating all files, wiring integration, adding tests and stories, and committing at logical checkpoints.

**Inferred user intent:** Turn the analysis into working code so the timeline debug window is usable.

**Commits (code):**
- `ec713f8` feat(timeline-debug): add timeline debug window with tree view and export
- `8d530d1` test(timeline-debug): add snapshot model tests and storybook stories

### What I did

- Created `packages/engine/src/chat/debug/timelineDebugModel.ts`:
  - `TimelineDebugSnapshot` type with summary, ordered entities, and full timeline state
  - `buildTimelineDebugSnapshot()` — projects Redux timeline state into an export-friendly model
  - `sanitizeForExport()` — deep-clone with cycle/Date/BigInt/function/Symbol guards
  - `buildEntityYamlForCopy()`, `buildConversationYamlForCopy()` — clipboard YAML builders
  - `buildTimelineYamlExport()` — file download YAML with safe filename
- Created `packages/engine/src/chat/debug/StructuredDataTree.tsx`:
  - Recursive expand/collapse tree for objects, arrays, and scalars
  - Color-coded by type (strings blue, numbers cyan, booleans red, keys purple)
  - Max-depth guard to prevent runaway rendering
  - Inline styles matching existing dark debug theme
- Created `packages/engine/src/chat/debug/TimelineDebugWindow.tsx`:
  - Split-pane layout: entity list (left 40%) + detail tree/YAML (right 60%)
  - Top toolbar: Copy Conversation, Export YAML, tree/YAML view toggle, entity summary
  - Entity rows with kind, id, timestamp, per-entity copy button
  - Detail pane: StructuredDataTree for tree mode, SyntaxHighlight for YAML mode
  - Entity metadata header (id, kind, index, version) above props tree
  - Accepts `initialSnapshot` prop for Storybook/testing (bypasses Redux)
- Wired into `apps/inventory/src/App.tsx`:
  - `buildTimelineDebugWindowPayload(convId)` — window payload with `timeline-debug:<convId>` appKey
  - `renderAppWindow` route for `timeline-debug:*` appKey prefix
  - Header button `🧱 Timeline` in `InventoryChatAssistantWindow`
  - Desktop icon `{ id: 'timeline-debug', label: 'Timeline Debug', icon: '🧱' }`
  - File menu item `Open Timeline Debug` with commandId `debug.timeline-debug`
  - Debug menu item `🧱 Timeline Debug`
  - Command handler `inventory.debug.timeline-debug` resolving conversation from focused window
- Added engine barrel exports in `packages/engine/src/chat/index.ts`
- Created `packages/engine/src/chat/debug/timelineDebugModel.test.ts`:
  - 18 vitest tests covering sanitization (null, Date, BigInt, functions, cycles, RegExp, Error, Symbol, max-depth), snapshot building (empty, populated, orphan IDs, mixed kinds), entity YAML, conversation YAML, and export filename
- Created `packages/engine/src/components/widgets/TimelineDebugWindow.stories.tsx`:
  - 5 stories: Empty, MixedEntities, DeeplyNested, HighVolume (120 entities), SuggestionsOnly
  - Wraps with minimal Redux Provider since TimelineDebugWindow uses `useSelector`
  - Uses `initialSnapshot` prop to bypass Redux for deterministic story data
- Ran biome lint/format on all new files, fixed import ordering and formatting
- All 43 tests pass (5 test files including all existing debug tests)

### Why

- The analysis identified that timeline state debugging required a separate window focused on post-reducer state, distinct from the event stream viewer. This is what operators need when timeline rendering looks wrong.

### What worked

- Reusing `copyTextToClipboard`, `toYaml`, `SyntaxHighlight`, and the window payload/command patterns from `EventViewerWindow` made implementation fast and consistent.
- The `initialSnapshot` prop pattern on `TimelineDebugWindow` cleanly separates Redux dependency from testability — stories and tests use pre-built snapshots, production uses `useSelector`.
- `sanitizeForExport` handles all edge cases (cycles, BigInt, Date, functions, symbols, max depth) and the test suite validates each one.

### What didn't work

- No blocking issues during implementation.

### What I learned

- Biome enforces import ordering (alphabetical within groups) and reformats JSX more aggressively than the original code style — but the existing codebase already follows these conventions.
- The a11y `useKeyWithMouseEvents` lint rule fires on hover-highlight patterns used by EventViewerWindow too — this is a pre-existing codebase pattern, not something introduced here.
- TypeScript strict mode errors (implicit `any` on callback params) are pre-existing across all debug components due to React types not being fully installed.

### What was tricky to build

- Getting the `StructuredDataTree` to balance readability with compactness: inline scalars need to be on the same line as their key, while objects/arrays need expand/collapse with proper indentation. The current approach uses `ScalarLine` for leaf nodes and `CollapsibleNode` for branches, with `depth`-based left padding and a vertical border-left guide.
- Ensuring the `sanitizeForExport` WeakSet properly tracks seen objects without false positives — arrays and plain objects are both "object" types that need separate cycle detection.

### What warrants a second pair of eyes

- Whether the 40%/60% split-pane ratio works well at smaller window sizes.
- Whether entity rows need more metadata visible (e.g., version number inline).
- Whether we should add a filter/search within the entity list for large timelines.

### What should be done in the future

- Add filter/search in the entity list for large timelines.
- Consider adding `chatSession` diagnostics alongside `timeline` in the export.
- Add a toggle for "all entities" vs "renderable only" (exclude suggestions).
- Consider adding JSON export as an alternative to YAML.

### Code review instructions

- Review new files in order:
  1. `packages/engine/src/chat/debug/timelineDebugModel.ts` — data model and export helpers
  2. `packages/engine/src/chat/debug/StructuredDataTree.tsx` — recursive tree component
  3. `packages/engine/src/chat/debug/TimelineDebugWindow.tsx` — main window component
  4. `apps/inventory/src/App.tsx` — integration (diff only: payload builder, route, header button, icon, menu, command)
  5. `packages/engine/src/chat/debug/timelineDebugModel.test.ts` — test coverage
  6. `packages/engine/src/components/widgets/TimelineDebugWindow.stories.tsx` — Storybook stories
- Run tests: `npx vitest run packages/engine/src/chat/debug/`
- Launch storybook: story title is `Engine/Widgets/TimelineDebugWindow`

### Technical details

- Files created: 5 new files, 2 modified files
- Test count: 18 new tests, 43 total in debug suite
- Story count: 5 new stories
- Zero new dependencies — reuses existing `@reduxjs/toolkit`, `react-redux`, `@storybook/react`
