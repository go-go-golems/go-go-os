# Changelog

## 2026-02-13

- Initial workspace created


## 2026-02-13

Created HC-018 ticket package with detailed debug-pane/introspection design guide, added runnable event-pipeline prototype evidence, and uploaded the guide to reMarkable at /ai/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/design/01-debug-pane-and-introspection-system-implementation-guide.md — Primary implementation guide for debug pane and DSL runtime introspection.
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/reference/01-diary.md — Step-by-step execution log for setup
- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/01-debug-event-pipeline-simulation.out.txt — Simulation output proving retention/redaction/filtering behavior.


## 2026-02-13

Step 3: implemented RuntimeDebugHooks plumbing across runtime/shell/renderer boundaries (commit 3a0976a).

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/cards/runtime.ts — Core debug event model and instrumentation emit points
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/CardRenderer.tsx — UI emit/inline action debug event hooks
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx — Shell-level dispatch debug emission and hook threading

