---
Title: MacSlides import diary
Ticket: OS-18-MAC-SLIDES-IMPORT
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - cleanup
    - diary
DocType: reference
Intent: implementation-log
Owners: []
RelatedFiles:
    - imports/mac-slides.jsx
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-06T09:00:00-05:00
WhatFor: ""
WhenToUse: ""
---

# MacSlides import diary

## 2026-03-06 — Ticket creation and initial audit

### Goal

Create a dedicated ticket for importing `imports/mac-slides.jsx` as a proper rich widget, then break the work into task-sized steps before starting implementation.

### Initial findings from `imports/mac-slides.jsx`

- The file is a monolith combining UI, styles, markdown parsing, slideshow handling, and fake desktop/window chrome.
- The import reimplements app shell elements that should not survive the port:
  - menu bar,
  - dropdown menus,
  - title bar,
  - close box,
  - desktop texture,
  - browser-global style injection.
- The actual reusable widget content is the presentation editor itself:
  - slide list,
  - markdown editor,
  - preview pane,
  - slideshow mode,
  - alignment control.
- The markdown rendering layer needs cleanup before adoption:
  - ad hoc HTML generation,
  - fake `oli` intermediate tags,
  - duplicated directive parsing paths,
  - inline `<style>` injection.

### Next step

Task 1: scaffold the widget folder and extract the reusable helper/domain layer before starting the big JSX/CSS rebuild.

## 2026-03-06 — Task 1 scaffold

### Goal

Create the initial `packages/rich-widgets/src/mac-slides/` folder and extract the raw import’s reusable domain/helpers before attempting the UI rewrite.

### Files added

- `packages/rich-widgets/src/mac-slides/types.ts`
- `packages/rich-widgets/src/mac-slides/sampleData.ts`
- `packages/rich-widgets/src/mac-slides/markdown.ts`
- `packages/rich-widgets/src/mac-slides/MacSlides.tsx`
- `packages/rich-widgets/src/mac-slides/markdown.test.ts`

### What changed

1. Added a typed deck model:
   - `SlideAlignment`
   - `SlideDocument`
   - `MacSlidesDeck`
2. Extracted the raw import’s core helper logic into `markdown.ts`:
   - slide splitting,
   - alignment directive parsing,
   - alignment class naming,
   - the initial markdown-to-HTML renderer.
3. Moved the demo deck into `sampleData.ts` and added helper variants for dense and empty decks.
4. Added a minimal `MacSlides.tsx` scaffold component so the folder has a real widget entrypoint while the full CSS/primitive rebuild is still pending.
5. Added tests around the extracted helper layer so the cleanup can proceed with a stable baseline.

### Notes

- This is intentionally not yet wired into `parts.ts`, `theme/index.ts`, package exports, or launcher modules.
- The markdown renderer is still intentionally simple; the goal of Task 1 was extraction and typing, not final rendering fidelity.

### Commands run

```bash
npm run test -w packages/rich-widgets
```

### Results

- `npm run test -w packages/rich-widgets` ✅

### Next task

Task 2: add `RICH_PARTS` entries and build `theme/mac-slides.css`, replacing the import’s inline style object and injected style blocks with repo-native CSS.
