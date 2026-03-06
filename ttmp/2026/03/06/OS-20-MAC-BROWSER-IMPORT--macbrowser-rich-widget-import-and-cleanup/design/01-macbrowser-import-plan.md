---
Title: MacBrowser import plan
Ticket: OS-20-MAC-BROWSER-IMPORT
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
  - imports/mac-browser.jsx
  - packages/rich-widgets/src/parts.ts
  - packages/rich-widgets/src/theme/index.ts
  - packages/rich-widgets/src/launcher/modules.tsx
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-06T14:30:00-05:00
WhatFor: ""
WhenToUse: ""
---

# MacBrowser import plan

`imports/mac-browser.jsx` is a raw sketch with fake browser chrome, inline/global CSS, and an ad hoc markdown parser. The import plan is to keep the document browser behavior while rebuilding the shell with rich-widget primitives and a seedable state model.

## Implementation phases

1. Audit and scaffold the widget package plus parser/sample-data helpers.
2. Add a real `data-part` and theme CSS contract.
3. Rebuild the toolbar/content/editor layout with rich-widget primitives.
4. Add seeded Storybook states for welcome, 404, edit mode, and custom-page flows.
5. Add Redux-backed seedable state for URL/history/editor/custom pages while keeping DOM refs and click delegation local.
