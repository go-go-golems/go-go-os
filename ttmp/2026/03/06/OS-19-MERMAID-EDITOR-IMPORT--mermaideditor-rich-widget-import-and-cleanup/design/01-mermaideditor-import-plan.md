---
Title: MermaidEditor import plan
Ticket: OS-19-MERMAID-EDITOR-IMPORT
Status: active
Topics:
  - frontend
  - widgets
  - storybook
  - state-management
  - cleanup
DocType: design-doc
Intent: implementation-plan
Owners: []
RelatedFiles:
  - imports/mermaid-editor.jsx
  - packages/rich-widgets/src/parts.ts
  - packages/rich-widgets/src/theme/index.ts
  - packages/rich-widgets/src/launcher/modules.tsx
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-06T14:30:00-05:00
WhatFor: ""
WhenToUse: ""
---

# MermaidEditor import plan

`imports/mermaid-editor.jsx` is a raw sketch with fake shell chrome, inline styling, direct DOM listeners, and CDN-based Mermaid rendering. The import plan is to keep the useful editor/preview behavior and discard the fake desktop shell.

## Implementation phases

1. Audit and scaffold the widget package plus helper/state files.
2. Add a real `data-part` and theme CSS contract.
3. Rebuild the split editor/preview UI with rich-widget primitives.
4. Add seeded Storybook states for presets, syntax errors, zoom, and about/help.
5. Add Redux-backed seedable state for code, split/zoom, selected preset, and about visibility while keeping runtime render results local.
