---
Title: Diary
Ticket: HC-016-THEME-PROVIDER
Status: active
Topics:
    - react
    - vite
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/theme/HyperCardTheme.tsx
      Note: The new ThemeProvider component
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Shell integration wraps in HyperCardTheme
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/WindowChrome.tsx
      Note: Removed data-widget attribute
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/.storybook/preview.ts
      Note: Global Storybook decorator
ExternalSources: []
Summary: "Step-by-step implementation diary for HC-016 HyperCardTheme provider."
LastUpdated: 2026-02-12T17:40:00-05:00
WhatFor: "Record implementation journey, decisions, and validation results for the HyperCardTheme provider."
WhenToUse: "Reference when reviewing the HyperCardTheme implementation or extending it."
---

# Diary

## Goal

Implement a `HyperCardTheme` provider component so that HyperCard widgets get correct CSS styling when used outside `HyperCardShell` (Storybook stories, embedded widgets, tests).

## Step 1: Diagnosis and Design

The root cause was clear: all CSS in `base.css` is scoped under `[data-widget="hypercard"]`, which was set by `WindowChrome`. Widgets rendered outside the shell (all engine widget stories, BookTracker stories) got zero styling. The existing engine widget stories (`MenuGrid.stories.tsx`, `ListView.stories.tsx`, etc.) had this problem all along — it just wasn't noticed because they were always rendered unstyled.

### Prompt Context

**User prompt (verbatim):** "styling is off in the widgets and book tracker, can we fix that? How? Tell me before actually doing it."

**Assistant interpretation:** Identify why standalone widget stories are unstyled and propose a fix.

**Inferred user intent:** Get correct HyperCard styling in all Storybook stories, not just shell-wrapped ones.

### What I did
- Traced the CSS scoping chain: `base.css` → `[data-widget="hypercard"]` → `WindowChrome` → only in shell
- Identified that the Storybook `preview.ts` imported `base.css` but widgets had no ancestor with the scoping attribute
- Proposed `HyperCardTheme` component design following the react-modular-themable-storybook skill patterns

### Why
- Widgets must be usable and styled independently of the shell
- The skill recommends a root `data-widget` scoping component separate from structural wrappers

### What worked
- Design aligned cleanly with existing `data-part` / `data-widget` CSS architecture
- No need to change any CSS at all — only who sets the root attribute

### What I learned
- The CSS architecture was already well-designed (parts, tokens, scoped root) — just missing the composition boundary

## Step 2: Implementation (All 10 Tasks)

Implemented all changes in one focused pass: new component, exports, shell integration, WindowChrome cleanup, Storybook decorator.

### Prompt Context

**User prompt (verbatim):** "yes, create a new ticket and add tasks to it, then implement one by one, build, commit, check off, update your diary."

**Assistant interpretation:** Create HC-016 ticket with task breakdown, implement each task, verify, commit, complete bookkeeping.

**Inferred user intent:** Disciplined task-by-task implementation with verification at each step.

**Commit (code):** 8ef06e9 — "HC-016: Add HyperCardTheme provider for standalone widget styling"

### What I did
1. Created `packages/engine/src/theme/HyperCardTheme.tsx` — lightweight component that renders `<div data-widget="hypercard">` with optional `theme` class, `unstyled` bypass, and `themeVars` inline overrides
2. Exported from `theme/index.ts` and engine barrel `index.ts`
3. Modified `HyperCardShell.tsx` to wrap in `<HyperCardTheme theme={themeClass}>` instead of passing `className` to WindowChrome
4. Changed `WindowChrome` from `data-widget="hypercard"` to `data-part="window-frame"` (it was already styled with `[data-part="window-frame"]` in CSS)
5. Added global `HyperCardTheme` decorator in Storybook `preview.ts`
6. Typecheck passed after each step
7. Ran Storybook: 48 stories, all 22 tested pass (BookTracker, widgets, full app, themed)
8. Built both apps (`apps/inventory`, `apps/todo`) — both succeed

### Why
- Separation of concerns: theming scope (`data-widget`) belongs on a dedicated component, not a chrome decorator
- Follows the skill's layered CSS pattern: base → theme class → inline overrides
- `unstyled` mode enables headless/BYOCSS use cases

### What worked
- Zero CSS changes needed — only moved where the root attribute is set
- Nested `data-widget="hypercard"` (preview decorator + HyperCardShell) is safe — CSS attribute selectors match both, inner inherits outer tokens
- All existing themed stories (classic/modern) still work via `themeClass` prop passthrough

### What didn't work
- Nothing failed during implementation

### What was tricky to build
- The main subtlety was double-nesting: Storybook decorator wraps everything in `HyperCardTheme`, and `HyperCardShell` also wraps in `HyperCardTheme`. The CSS `[data-widget="hypercard"]` selector matches both. The outer provides defaults for standalone widgets; the inner (with theme class) provides themed override for full shell. CSS variable inheritance makes this work correctly — inner vars override outer.
- Had to decide whether `WindowChrome` should keep `data-widget` or not. Decided to remove it and use `data-part="window-frame"` since `[data-part="window-frame"]` CSS already existed in `base.css` and the window chrome is a structural component, not a theming scope.

### What warrants a second pair of eyes
- The `themeVars` prop casts `Record<string, string>` to `CSSProperties`. This is the standard pattern for CSS variable injection in React (CSS custom properties are accepted by React's style prop), but the cast is technically unsafe. If someone passes non-CSS-variable keys, they'd get unexpected inline styles.

### What should be done in the future
- Consider adding a `size` variant to `HyperCardTheme` (e.g., `compact`, `fullscreen`) so the fixed height from `base.css` can be overridden for embedded use cases
- Update `docs/js-api-user-guide-reference.md` to document `HyperCardTheme` as the standalone styling wrapper

### Code review instructions
- Start at `packages/engine/src/theme/HyperCardTheme.tsx` — the entire new component
- Then `packages/engine/src/components/shell/HyperCardShell.tsx` — see the wrapper integration
- Then `packages/engine/src/components/shell/WindowChrome.tsx` — the `data-widget` → `data-part` change
- Then `apps/inventory/.storybook/preview.ts` — the global decorator
- Validate: `npx tsc --noEmit`, `npm run build -w apps/inventory`, `npm run build -w apps/todo`, `npx storybook dev -p 6006 --config-dir apps/inventory/.storybook`

### Technical details

**HyperCardTheme component API:**
```tsx
<HyperCardTheme>              {/* default: scoped, no theme */}
<HyperCardTheme theme="theme-modern">  {/* with theme class */}
<HyperCardTheme unstyled>     {/* no scope wrapper, parts still render */}
<HyperCardTheme themeVars={{ '--hc-color-bg': '#1a1a2e' }}>  {/* inline overrides */}
```

**Files changed:**
| File | Change |
|------|--------|
| `packages/engine/src/theme/HyperCardTheme.tsx` | New |
| `packages/engine/src/theme/index.ts` | Added export |
| `packages/engine/src/index.ts` | Added barrel export |
| `packages/engine/src/components/shell/HyperCardShell.tsx` | Wraps in HyperCardTheme |
| `packages/engine/src/components/shell/WindowChrome.tsx` | data-widget → data-part |
| `apps/inventory/.storybook/preview.ts` | Global decorator |
