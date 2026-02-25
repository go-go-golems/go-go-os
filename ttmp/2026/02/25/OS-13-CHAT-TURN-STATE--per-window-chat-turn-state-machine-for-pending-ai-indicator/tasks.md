# Tasks

## TODO

- [x] T1: Author per-window turn-state machine design contract (phases, transitions, clear rules).
- [ ] T2: Implement `usePendingAiTurn` state machine hook and wire `ChatConversationWindow` to it.
- [ ] T3: Remove legacy pending-spinner heuristics and debug-only decision branches superseded by the state machine.
- [ ] T4: Add or update tests to cover: (a) spinner appears only after user message append, (b) clears on AI-side timeline activity, (c) survives user-echo and streaming-without-assistant-message cases.
- [ ] T5: Run typecheck/tests, then update diary/changelog/index related-file links with results.
