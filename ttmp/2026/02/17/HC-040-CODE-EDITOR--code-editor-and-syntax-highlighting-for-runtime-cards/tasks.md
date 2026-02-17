---
Title: Tasks
Ticket: HC-040-CODE-EDITOR
---

# Tasks

## Phase A: Syntax Highlighting

### A.1 Install highlight.js
- [x] A.1a `npm install highlight.js` in apps/inventory
- [x] A.1b Verify tree-shakeable import: `highlight.js/lib/core` + per-language

### A.2 Create SyntaxHighlight component
- [x] A.2a Create `apps/inventory/src/features/chat/utils/SyntaxHighlight.tsx`
- [x] A.2b Support `language: 'javascript' | 'yaml'`, `code: string`, `maxLines?: number`
- [x] A.2c Expand/collapse toggle when truncated
- [x] A.2d Use `dangerouslySetInnerHTML` with hljs output
- [x] A.2e Support `variant: 'light' | 'dark'` for different backgrounds

### A.3 Add syntax highlight theme CSS
- [x] A.3a Add minimal light token color rules to `packages/engine/src/theme/base.css`
- [x] A.3b Add dark variant token colors (GitHub Dark style)
- [x] A.3c Scope under `[data-part="syntax-highlight"]` to avoid conflicts

### A.4 Wire into RuntimeCardDebugWindow
- [x] A.4a Replace `CodePreview` component with `SyntaxHighlight language="javascript"`

### A.5 Wire into timeline/artifact/event viewer (YAML)
- [x] A.5a InventoryTimelineWidget.tsx — metadata rawData `<pre>` → SyntaxHighlight
- [x] A.5b InventoryTimelineWidget.tsx — tool call rawData `<pre>` → SyntaxHighlight
- [x] A.5c InventoryArtifactPanelWidgets.tsx — rawData `<pre>` → SyntaxHighlight
- [x] A.5d EventViewerWindow.tsx — payload `<pre>` → SyntaxHighlight (dark variant)

### A.6 Verify
- [x] A.6a TypeScript clean
- [x] A.6b All tests pass (153/153)
- [ ] A.6c Visual check in browser

## Phase B: Switch to CodeMirror + Editor Window

### B.1 Install CodeMirror 6
- [x] B.1a Install packages: codemirror, @codemirror/lang-javascript, @codemirror/lang-yaml, @codemirror/theme-one-dark
- [x] B.1b Remove highlight.js dependency

### B.2 Replace SyntaxHighlight internals
- [x] B.2a Create `cmHighlight(code, language)` util using @lezer/highlight + classHighlighter
- [x] B.2b Update SyntaxHighlight.tsx to use CM highlighter instead of hljs
- [x] B.2c Update CSS theme rules: hljs-* → tok-* classes (15 light + 15 dark)
- [x] B.2d Verify all 5 existing surfaces still work (153 tests pass, TS clean)

### B.3 Create CodeEditorWindow component
- [ ] B.3a Create `CodeEditorWindow.tsx` with full CM EditorView
- [ ] B.3b Accept `cardId` and `initialCode` props
- [ ] B.3c "Save & Inject" button → registerRuntimeCard + update artifact state
- [ ] B.3d Error display area for eval failures
- [ ] B.3e Register as app window in App.tsx (`code-editor:{cardId}`)

### B.4 Wire "Edit" button from RuntimeCardDebugWindow
- [ ] B.4a Add ✏️ Edit button on each registry card entry
- [ ] B.4b Clicking opens CodeEditorWindow with card code

### B.5 Wire "Edit" button from card timeline widget
- [ ] B.5a Add ✏️ Edit button on card items with status=success in InventoryArtifactPanelWidgets
- [ ] B.5b Look up artifact record for runtimeCardId + runtimeCardCode
- [ ] B.5c Open CodeEditorWindow with card code

### B.6 Storybook stories
- [ ] B.6a SyntaxHighlight stories: JS light, JS dark, YAML light, YAML dark, with maxLines truncation
- [ ] B.6b CodeEditorWindow stories: empty, pre-filled JS, save callback, error display

### B.7 Verify
- [ ] B.7a TypeScript clean
- [ ] B.7b All tests pass
- [ ] B.7c Visual check in browser
