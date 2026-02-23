---
Title: Diary
Ticket: HC-54-CHAT-FOCUS-TIMELINE-ORDER
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
    - Path: packages/engine/src/chat/state/timelineSlice.test.ts
      Note: Diary step includes mergeSnapshot regression test details
    - Path: packages/engine/src/chat/state/timelineSlice.ts
      Note: Diary step tracks merge reducer extraction and order preservation semantics
    - Path: packages/engine/src/chat/ws/wsManager.test.ts
      Note: Diary step includes focus/reconnect regression test details
    - Path: packages/engine/src/chat/ws/wsManager.ts
      Note: Diary step tracks hydrate behavior change and rationale
ExternalSources: []
Summary: 'Implementation diary for the focus-triggered timeline reorder bug: reproduction, root-cause analysis, patching, and tests.'
LastUpdated: 2026-02-22T00:00:00Z
WhatFor: Preserve timeline order and entities across focus/reconnect hydration.
WhenToUse: Use when continuing or reviewing this bug fix and related hydrate/reconnect behavior.
---


# Diary

## Goal

Capture exactly how the focus/reconnect timeline reorder bug was diagnosed and fixed so implementation can be reviewed and continued without re-discovery.

## Step 1: Capture Repro and Identify Hydration Reset Path

The user provided a strong before/after timeline export showing a stable timeline becoming reordered after focus. The key indicators were the disappearance of `suggestions:starter`, reorder of status/widget/message entities, and flattened entity versions.

I traced websocket connection/hydration code paths and confirmed the reconnect flow used a destructive reset pattern (`clearConversation` then `applySnapshot`) that can reproduce this behavior even when no real user-intended timeline reset happened.

### Prompt Context

**User prompt (verbatim):** "THe conversation timeline gets reordered when I focus the chatwindow. 

Before: 

conversationId: 648bf4db-b742-4f1e-9408-604f5cf1a5a9
exportedAt: \"2026-02-22T00:46:02.242Z\"
summary:
  entityCount: 6
  orderCount: 6
  kinds:
    suggestions: 1
    message: 3
    hypercard_widget: 1
    status: 1
timeline:
  order:
    - \"suggestions:starter\"
    - user-41120502-5b2b-4439-b6e4-488619db3d9f
    - \"46de112b-79e1-466b-961c-c3f09bb97d41:thinking\"
    - 46de112b-79e1-466b-961c-c3f09bb97d41
    - \"widget:46de112b-79e1-466b-961c-c3f09bb97d41:1\"
    - \"46de112b-79e1-466b-961c-c3f09bb97d41:1:status\"
  entities:
    - id: \"suggestions:starter\"
        orderIndex: 0
        kind: suggestions
        createdAt: 1771721151101
        updatedAt: 1771721152102
        version: null
        props:
          source: starter
          items:
            - Show current inventory status
            - \"What items are low stock?\"
            - Summarize today sales
          consumedAt: 1771721152102
    - id: user-41120502-5b2b-4439-b6e4-488619db3d9f
        orderIndex: 1
        kind: message
        createdAt: 1771721152108
        updatedAt: 1771721152108
        version: 1771721152108000000
        props:
          content: Summarize today sales
          metadata:
            {}
          role: user
          schemaVersion: 1
          streaming: false
    - id: \"46de112b-79e1-466b-961c-c3f09bb97d41:thinking\"
        orderIndex: 2
        kind: message
        createdAt: 1771721153001
        updatedAt: 1771721162226
        version: 1771721162226000000
        props:
          role: thinking
          content: \"I need to respond with a quick summary sentence before using a widget tag. The request is to summarize today's sales, and I should fetch the information from the sales log, although I'm uncertain about the date. Instead of a detailed visual card, it seems simpler to use a widget for this summary. The instructions suggest I emit a <hypercard:widget:v1> for a quick overview rather than a complex visual display, which feels more appropriate here.The instruction clearly states to emit structured inventory artifacts in a specific format, but for a simple display, I can still use a widget tag. Since the user asked for a summary of today's sales, I’ll create a <hypercard:widget:v1> that includes the report's title and relevant data, marking today's date. I need to prepend a plain-language summary sentence before the tag to clarify the information being presented.I need to ensure that the title isn't empty, so I'll make that a priority. It seems I can also provide optional follow-up suggestions, but to keep things concise, I might skip that for now. For the report, I’ll use the current date—2026-02-22. I need to make sure that the YAML is only inside the tag and that we are using the three required keys. Alright, let’s proceed with structuring the output correctly!\"
          streaming: false
          metadata:
            {}
          schemaVersion: 1
    - id: 46de112b-79e1-466b-961c-c3f09bb97d41
        orderIndex: 3
        kind: message
        createdAt: 1771721152113
        updatedAt: 1771721162227
        version: 1771721162227000000
        props:
          role: assistant
          content: |
  Here's a quick summary of today's sales.
          streaming: false
          metadata:
            {}
          schemaVersion: 1
    - id: \"widget:46de112b-79e1-466b-961c-c3f09bb97d41:1\"
        orderIndex: 4
        kind: hypercard_widget
        createdAt: 1771721162087
        updatedAt: 1771721162087
        version: 1771721162086000000
        props:
          title: \"Today's Sales Summary\"
          status: success
          detail: ready
          template: report
          itemId: \"46de112b-79e1-466b-961c-c3f09bb97d41:1\"
          artifactId: today-sales-summary
          rawData:
            data:
              actions: null
              artifact:
                data:
                  note: auto-generated
                  since: \"2026-02-22T00:00:00Z\"
                id: today-sales-summary
              title: \"Today's Sales Summary\"
              type: report
            itemId: \"46de112b-79e1-466b-961c-c3f09bb97d41:1\"
            title: \"Today's Sales Summary\"
            widgetType: report
          customKind: \"\"
          error: \"\"
          result:
            data:
              actions: null
              artifact:
                data:
                  note: auto-generated
                  since: \"2026-02-22T00:00:00Z\"
                id: today-sales-summary
              title: \"Today's Sales Summary\"
              type: report
            itemId: \"46de112b-79e1-466b-961c-c3f09bb97d41:1\"
            title: \"Today's Sales Summary\"
            widgetType: report
          resultRaw: \"{\\\"data\\\":{\\\"actions\\\":null,\\\"artifact\\\":{\\\"data\\\":{\\\"note\\\":\\\"auto-generated\\\",\\\"since\\\":\\\"2026-02-22T00:00:00Z\\\"},\\\"id\\\":\\\"today-sales-summary\\\"},\\\"title\\\":\\\"Today's Sales Summary\\\",\\\"type\\\":\\\"report\\\"},\\\"itemId\\\":\\\"46de112b-79e1-466b-961c-c3f09bb97d41:1\\\",\\\"title\\\":\\\"Today's Sales Summary\\\",\\\"widgetType\\\":\\\"report\\\"}\"
          schemaVersion: 1
          toolCallId: \"46de112b-79e1-466b-961c-c3f09bb97d41:1\"
    - id: \"46de112b-79e1-466b-961c-c3f09bb97d41:1:status\"
        orderIndex: 5
        kind: status
        createdAt: 1771721162046
        updatedAt: 1771721162084
        version: 1771721162083000000
        props:
          schemaVersion: 1
          text: \"Updating widget: Today's Sales Summary\"
          type: info

---

After: 

conversationId: 648bf4db-b742-4f1e-9408-604f5cf1a5a9
exportedAt: \"2026-02-22T00:46:08.338Z\"
summary:
  entityCount: 5
  orderCount: 5
  kinds:
    message: 3
    status: 1
    hypercard_widget: 1
timeline:
  order:
    - user-41120502-5b2b-4439-b6e4-488619db3d9f
    - \"46de112b-79e1-466b-961c-c3f09bb97d41:1:status\"
    - \"widget:46de112b-79e1-466b-961c-c3f09bb97d41:1\"
    - \"46de112b-79e1-466b-961c-c3f09bb97d41:thinking\"
    - 46de112b-79e1-466b-961c-c3f09bb97d41
  entities:
    - id: user-41120502-5b2b-4439-b6e4-488619db3d9f
        orderIndex: 0
        kind: message
        createdAt: 1771721152108
        updatedAt: 1771721152108
        version: 1771721162227000000
        props:
          content: Summarize today sales
          metadata:
            {}
          role: user
          schemaVersion: 1
          streaming: false
    - id: \"46de112b-79e1-466b-961c-c3f09bb97d41:1:status\"
        orderIndex: 1
        kind: status
        createdAt: 1771721162046
        updatedAt: 1771721162084
        version: 1771721162227000000
        props:
          schemaVersion: 1
          text: \"Updating widget: Today's Sales Summary\"
          type: info
    - id: \"widget:46de112b-79e1-466b-961c-c3f09bb97d41:1\"
        orderIndex: 2
        kind: hypercard_widget
        createdAt: 1771721162087
        updatedAt: 1771721162087
        version: 1771721162227000000
        props:
          customKind: \"\"
          error: \"\"
          result:
            data:
              actions: null
              artifact:
                data:
                  note: auto-generated
                  since: \"2026-02-22T00:00:00Z\"
                id: today-sales-summary
              title: \"Today's Sales Summary\"
              type: report
            itemId: \"46de112b-79e1-466b-961c-c3f09bb97d41:1\"
            title: \"Today's Sales Summary\"
            widgetType: report
          resultRaw: \"{\\\"data\\\":{\\\"actions\\\":null,\\\"artifact\\\":{\\\"data\\\":{\\\"note\\\":\\\"auto-generated\\\",\\\"since\\\":\\\"2026-02-22T00:00:00Z\\\"},\\\"id\\\":\\\"today-sales-summary\\\"},\\\"title\\\":\\\"Today's Sales Summary\\\",\\\"type\\\":\\\"report\\\"},\\\"itemId\\\":\\\"46de112b-79e1-466b-961c-c3f09bb97d41:1\\\",\\\"title\\\":\\\"Today's Sales Summary\\\",\\\"widgetType\\\":\\\"report\\\"}\"
          schemaVersion: 1
          toolCallId: \"46de112b-79e1-466b-961c-c3f09bb97d41:1\"
          itemId: \"46de112b-79e1-466b-961c-c3f09bb97d41:1\"
          artifactId: today-sales-summary
          template: report
          status: success
          title: \"Today's Sales Summary\"
          detail: ready
    - id: \"46de112b-79e1-466b-961c-c3f09bb97d41:thinking\"
        orderIndex: 3
        kind: message
        createdAt: 1771721153001
        updatedAt: 1771721162226
        version: 1771721162227000000
        props:
          content: \"I need to respond with a quick summary sentence before using a widget tag. The request is to summarize today's sales, and I should fetch the information from the sales log, although I'm uncertain about the date. Instead of a detailed visual card, it seems simpler to use a widget for this summary. The instructions suggest I emit a <hypercard:widget:v1> for a quick overview rather than a complex visual display, which feels more appropriate here.The instruction clearly states to emit structured inventory artifacts in a specific format, but for a simple display, I can still use a widget tag. Since the user asked for a summary of today's sales, I’ll create a <hypercard:widget:v1> that includes the report's title and relevant data, marking today's date. I need to prepend a plain-language summary sentence before the tag to clarify the information being presented.I need to ensure that the title isn't empty, so I'll make that a priority. It seems I can also provide optional follow-up suggestions, but to keep things concise, I might skip that for now. For the report, I’ll use the current date—2026-02-22. I need to make sure that the YAML is only inside the tag and that we are using the three required keys. Alright, let’s proceed with structuring the output correctly!\"
          metadata:
            {}
          role: thinking
          schemaVersion: 1
          streaming: false
    - id: 46de112b-79e1-466b-961c-c3f09bb97d41
        orderIndex: 4
        kind: message
        createdAt: 1771721152113
        updatedAt: 1771721162227
        version: 1771721162227000000
        props:
          content: |
  Here's a quick summary of today's sales.
          metadata:
            {}
          role: assistant
          schemaVersion: 1
          streaming: false


Not sure what's going on, gbut the hypercard bounced up"

**Assistant interpretation:** The timeline should not reorder or lose entities when the chat window focus changes; investigate and fix the underlying state/hydration path.

**Inferred user intent:** Keep conversation UI stable across focus/reconnect events so debug exports and visible history remain trustworthy.

**Commit (code):** N/A (analysis step before commit)

### What I did
- Inspected websocket connect/hydrate flow in `packages/engine/src/chat/ws/wsManager.ts`.
- Inspected timeline reducers in `packages/engine/src/chat/state/timelineSlice.ts`.
- Confirmed hydrate path was clearing conversation state before snapshot apply.
- Confirmed snapshot apply replaced full conversation order and byId.

### Why
- The user report specifically indicated reorder and missing entities after focus, which strongly maps to state replacement logic.

### What worked
- The code path analysis matched every observed symptom from user-provided exports.

### What didn't work
- Initial exploration checked a non-existent path for desktop shell (`packages/engine/src/components/shell/DesktopShell.tsx`), which did not contribute to diagnosis.

### What I learned
- Hydration had “initial-load” semantics but was reused in reconnect contexts where merge semantics are safer.

### What was tricky to build
- Distinguishing whether reorder came from renderer sort logic vs state replacement required mapping user export differences back to exact reducer operations.

### What warrants a second pair of eyes
- Whether any flows still rely on hard reset behavior for correctness (for example, explicit conversation reset scenarios).

### What should be done in the future
- Add explicit hydrate mode flags (`initial` vs `reconnect`) if a future path needs intentional destructive replacement.

### Code review instructions
- Start with `packages/engine/src/chat/ws/wsManager.ts` and locate `hydrate()`.
- Then inspect snapshot reducers in `packages/engine/src/chat/state/timelineSlice.ts`.
- Validate by reproducing focus behavior and comparing timeline exports before/after.

### Technical details
- Key problematic sequence before fix:
  1. `clearConversation(convId)`
  2. fetch `/api/timeline`
  3. `applySnapshot(convId, entities)`

## Step 2: Implement Merge-Based Hydration and Regressions

I replaced destructive snapshot application with a merge reducer and updated websocket hydration to stop clearing conversation state. This preserves existing order and local-only entities while still ingesting fresh snapshot data.

I also added regression tests at reducer and websocket levels to lock in expected behavior when hydrating into an existing timeline.

### Prompt Context

**User prompt (verbatim):** "create a ticket with docmgr and backfill its diary for this bug."

**Assistant interpretation:** Create a dedicated ticket and write a detailed diary entry documenting reproduction, diagnosis, and in-progress implementation details.

**Inferred user intent:** Ensure this bug fix is trackable and handoff-ready in the project doc system while implementation continues.

**Commit (code):** `1f63ce0679738d05e7c88074e4c1dd07caceb8c5` — \"fix(chat): preserve timeline order across hydrate reconnect\"

### What I did
- Added `upsertConversationEntity()` helper in `packages/engine/src/chat/state/timelineSlice.ts` to centralize version-aware merge behavior.
- Updated `upsertEntity` reducer to use helper.
- Added new `mergeSnapshot` reducer in `packages/engine/src/chat/state/timelineSlice.ts`.
- Updated hydrate snapshot path in `packages/engine/src/chat/ws/wsManager.ts` to dispatch `mergeSnapshot`.
- Removed hydrate-time `clearConversation` call in `packages/engine/src/chat/ws/wsManager.ts`.
- Added reducer test in `packages/engine/src/chat/state/timelineSlice.test.ts`:
  - verifies existing order remains,
  - verifies local suggestions survive,
  - verifies new snapshot entities append.
- Added websocket hydration test in `packages/engine/src/chat/ws/wsManager.test.ts`:
  - seeds pre-existing timeline,
  - hydrates with snapshot missing starter suggestions,
  - verifies order/suggestions preserved and new snapshot entity appended.
- Created ticket `HC-54-CHAT-FOCUS-TIMELINE-ORDER`.
- Added analysis doc `analysis/01-focus-triggered-timeline-reorder-bug-analysis.md`.
- Backfilled this diary doc.

### Why
- Merge semantics directly solve user-visible reorder/entity-loss without weakening existing version gating.

### What worked
- Reducer-level design allows reuse of existing upsert logic with minimal behavioral drift.
- The websocket fix is small and local to hydrate path.
- Targeted validation passed:
  - `pnpm vitest packages/engine/src/chat/state/timelineSlice.test.ts packages/engine/src/chat/ws/wsManager.test.ts`
  - Result: 2 files passed, 9 tests passed.

### What didn't work
- No implementation-blocking errors encountered in this step.

### What I learned
- Snapshot application and live stream replay have to be carefully coordinated; replacing timeline state during reconnect is too aggressive.

### What was tricky to build
- Preserving local order while still allowing snapshot updates required an additive merge approach that does not remove absent snapshot entries.

### What warrants a second pair of eyes
- Potential stale-entity retention due to non-destructive merge if backend intended deletion by omission.
- Ensure no other code path still calls `applySnapshot` for reconnect semantics.

### What should be done in the future
- Add a dedicated “force reset timeline” action for explicit hard refresh flows if needed.

### Code review instructions
- Review reducer changes in `packages/engine/src/chat/state/timelineSlice.ts` first.
- Review hydrate flow update in `packages/engine/src/chat/ws/wsManager.ts`.
- Run targeted tests:
  - `pnpm vitest packages/engine/src/chat/state/timelineSlice.test.ts packages/engine/src/chat/ws/wsManager.test.ts`

### Technical details
- New reducer: `timelineSlice.actions.mergeSnapshot({ convId, entities })`.
- Hydrate now merges snapshot entities into existing timeline rather than clearing and replacing.
