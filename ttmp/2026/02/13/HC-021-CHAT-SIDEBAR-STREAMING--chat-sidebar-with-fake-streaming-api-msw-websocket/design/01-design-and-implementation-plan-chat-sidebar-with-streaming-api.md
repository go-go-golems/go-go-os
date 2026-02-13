---
Title: 'Design and Implementation Plan: Chat Sidebar with Streaming API'
Ticket: HC-021-CHAT-SIDEBAR-STREAMING
Status: active
Topics:
    - frontend
    - architecture
    - redux
    - storybook
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatView.tsx
      Note: "Existing chat widget — will be enhanced for streaming token display"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/LayoutSplit.tsx
      Note: "Split layout used for side panels — chat sidebar will use a variant"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx
      Note: "Shell already supports renderAIPanel + layoutMode — will add chatSidebar mode"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
      Note: "Existing simple chat slice — will be replaced by streaming-aware chat slice"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/app/cardRuntime.ts
      Note: "Existing synchronous chat.send action — will be replaced by streaming API call"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/CardRenderer.tsx
      Note: "CardRenderer already handles ui.chat() node type"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/types.ts
      Note: "ChatMessage type — will be extended with streaming state"
ExternalSources: []
Summary: Design and implementation plan for upgrading the chat system from synchronous in-card responses to a streaming sidebar with fake MSW REST + WebSocket APIs.
LastUpdated: 2026-02-13T14:00:00-05:00
WhatFor: Guide implementation of the chat sidebar and streaming mock API.
WhenToUse: Reference during HC-021 implementation.
---


# Design and Implementation Plan: Chat Sidebar with Streaming API

## 1. Current State Analysis

### 1.1 What exists today

The codebase already has a complete but **synchronous, in-card** chat system:

| Component | File | Description |
|-----------|------|-------------|
| **ChatView widget** | `packages/engine/src/components/widgets/ChatView.tsx` | React component: message timeline, suggestions, composer input, action chips |
| **ChatMessage type** | `packages/engine/src/types.ts` | `{ role: 'user'|'ai', text, results?, actions?, meta? }` |
| **ui.chat() helper** | `packages/engine/src/cards/helpers.ts` | DSL node constructor for chat widget |
| **CardRenderer chat case** | `packages/engine/src/components/shell/CardRenderer.tsx` | Renders `ui.chat()` nodes using ChatView |
| **Chat CSS** | `packages/engine/src/theme/base.css` | Timeline, message bubbles, composer, suggestions styling |
| **chatSlice** | `apps/inventory/src/features/chat/chatSlice.ts` | Redux: `messages[]`, `addMessages`, `resetChat` |
| **chat.send action** | `apps/inventory/src/app/cardRuntime.ts` | Synchronous keyword-matching "AI" with canned responses |
| **LayoutSplit** | `packages/engine/src/components/shell/LayoutSplit.tsx` | Side-by-side layout (main + side panel) |
| **LayoutDrawer** | `packages/engine/src/components/shell/LayoutDrawer.tsx` | Bottom drawer layout |
| **AI panel CSS** | `packages/engine/src/theme/base.css` | Panel header, model label styling |
| **renderAIPanel prop** | `HyperCardShell` | Existing prop for custom AI sidebar content |

### 1.2 What's missing

1. **No streaming** — responses appear all-at-once, not token-by-token
2. **No API layer** — "AI" logic is hardcoded in shared actions, no HTTP/WS calls
3. **No sidebar mode** — chat only works as a full card (`assistant` card in inventory), not as an always-visible sidebar alongside other cards
4. **No loading/thinking state** — no visual feedback while waiting for a response
5. **No conversation context** — each message is independently keyword-matched
6. **No mock infrastructure** — no MSW or fake WebSocket for development/Storybook

### 1.3 Architecture diagram (current)

```
User types message
      |
      v
ChatView.onSend → emit('send', { text })
      |
      v
CardRenderer → bindings → chat.send shared action
      |
      v
Synchronous keyword match → addMessages([user, ai])
      |
      v
Redux → ChatView re-renders with new messages
```


## 2. Target Architecture

### 2.1 Architecture diagram (target)

```
User types message
      |
      v
ChatView.onSend → emit('send', { text })
      |
      v
chat.send shared action
      |
      ├─ dispatch(addUserMessage)
      ├─ dispatch(startStreaming)          ← new
      |
      v
POST /api/chat/completions              ← new (MSW-intercepted)
      |
      v
Response: { conversationId, streamUrl }  ← new
      |
      v
WebSocket connect to streamUrl           ← new (fake WS)
      |
      ├─ onMessage: token chunk → dispatch(appendStreamToken)  ← new
      ├─ onMessage: tool_call → dispatch(addToolCall)          ← new (future)
      ├─ onMessage: done → dispatch(finishStreaming)           ← new
      |
      v
Redux → ChatView re-renders with streaming text + cursor
```

### 2.2 Two API modes: REST initiation + WebSocket streaming

**Why not just WebSocket for everything?**
Separating initiation (REST) from streaming (WebSocket) mirrors real LLM APIs (OpenAI, Anthropic) and makes it easy to swap in a real backend later. The REST endpoint starts a conversation turn; the WebSocket delivers the token stream.

**Why not SSE (Server-Sent Events)?**
WebSocket is bidirectional, which allows future features like cancellation, tool-call responses, and follow-up context without a new HTTP request. MSW v2 also has better WebSocket mocking support than SSE.


## 3. Detailed Design

### 3.1 Extended ChatMessage type

```ts
// packages/engine/src/types.ts
export interface ChatMessage {
  id: string;                                    // NEW: unique message ID
  role: 'user' | 'ai' | 'system';              // CHANGED: added 'system'
  text: string;
  status?: 'complete' | 'streaming' | 'error';  // NEW
  results?: unknown[];
  actions?: Array<{ label: string; action: unknown }>;
  meta?: Record<string, unknown>;
}
```

### 3.2 Streaming-aware chat slice (engine-level)

```ts
// packages/engine/src/chat/chatSlice.ts
interface ChatState {
  conversations: Record<string, {
    id: string;
    messages: ChatMessage[];
    isStreaming: boolean;
    streamingMessageId: string | null;
    error: string | null;
  }>;
  activeConversationId: string;
}

// Reducers:
//   createConversation(id)
//   addMessage(conversationId, message)
//   startStreaming(conversationId, messageId)
//   appendStreamToken(conversationId, messageId, token)
//   finishStreaming(conversationId, messageId, { actions?, results? })
//   streamError(conversationId, messageId, error)
//   resetConversation(conversationId)
```

### 3.3 Chat API client

```ts
// packages/engine/src/chat/chatApi.ts
export interface ChatCompletionRequest {
  conversationId: string;
  messages: Array<{ role: string; text: string }>;
  model?: string;
}

export interface ChatCompletionResponse {
  conversationId: string;
  messageId: string;
  streamUrl: string;   // WebSocket URL for token streaming
}

export interface StreamToken {
  type: 'token' | 'tool_call' | 'done' | 'error';
  content?: string;     // for type: 'token'
  tool?: string;        // for type: 'tool_call' (future)
  args?: unknown;       // for type: 'tool_call' (future)
  error?: string;       // for type: 'error'
  actions?: Array<{ label: string; action: unknown }>;  // for type: 'done'
}

// Functions:
//   startCompletion(request): Promise<ChatCompletionResponse>
//   connectStream(streamUrl, handlers): () => void  // returns cleanup
```

### 3.4 MSW mock handlers

```ts
// packages/engine/src/chat/mocks/handlers.ts
// Using MSW v2 API

// POST /api/chat/completions
//   → Returns { conversationId, messageId, streamUrl: "ws://localhost:xxx/stream/{messageId}" }
//   → The conversationId is passed through, messageId is generated

// packages/engine/src/chat/mocks/fakeResponses.ts
// Canned responses with configurable delays:
//   - Keyword-based (like current inventory chat.send)
//   - Random delay per token (30-80ms)
//   - Configurable total response length
//   - Support for tool_call tokens (future)
```

### 3.5 Fake WebSocket server

MSW v2 supports WebSocket interception via `ws.link()`. The mock will:

1. Accept connection at the stream URL
2. Look up the pending completion by messageId
3. Stream tokens from a canned response at realistic speed (30-80ms per token)
4. Send a `done` message with optional action suggestions
5. Close the connection

```ts
// packages/engine/src/chat/mocks/wsHandler.ts
import { ws } from 'msw';

const chat = ws.link('ws://*/stream/:messageId');

export const wsHandlers = [
  chat.addEventListener('connection', ({ client, params }) => {
    const messageId = params.messageId;
    const response = lookupPendingResponse(messageId);
    streamTokens(client, response);
  }),
];
```

### 3.6 Chat sidebar component

A new layout mode for HyperCardShell that shows the chat panel alongside any card:

```ts
// HyperCardShell props addition:
layoutMode?: 'legacyTabs' | 'debugPane' | 'chatSidebar' | 'chatSidebarDebug';
renderChatSidebar?: () => ReactNode;
```

The `chatSidebar` mode shows:
```
┌─────────────────────┬──────────────┐
│                     │              │
│   Main card area    │  Chat panel  │
│   (any card)        │  (streaming) │
│                     │              │
└─────────────────────┴──────────────┘
```

The `chatSidebarDebug` mode adds the debug pane below:
```
┌─────────────────────┬──────────────┐
│                     │              │
│   Main card area    │  Chat panel  │
│   (any card)        │  (streaming) │
│                     │              │
├─────────────────────┴──────────────┤
│          Debug pane (collapsed)     │
└─────────────────────────────────────┘
```

### 3.7 StreamingChatView component

An enhanced ChatView that handles streaming state:

```ts
// packages/engine/src/components/widgets/StreamingChatView.tsx
interface StreamingChatViewProps extends ChatViewProps {
  isStreaming: boolean;
  streamingText?: string;     // partial text being streamed
  onCancel?: () => void;      // cancel current stream
}
```

Visual features:
- Animated cursor (blinking `▊`) at the end of streaming text
- "Thinking..." indicator before first token arrives
- Cancel button during streaming
- Smooth scroll-to-bottom as tokens arrive
- Typing indicator animation


## 4. Implementation Plan

### Task 1: Extend ChatMessage type + create streaming chat slice in engine

- Add `id`, `status`, `system` role to ChatMessage
- Create `packages/engine/src/chat/chatSlice.ts` with conversation + streaming reducers
- Create `packages/engine/src/chat/index.ts` barrel
- Add to engine exports
- Backward-compatible: existing apps using the old ChatMessage shape still work

### Task 2: Create chat API client types + fake MSW handlers

- Install MSW v2 as a dev dependency
- Create `packages/engine/src/chat/chatApi.ts` — types + client functions
- Create `packages/engine/src/chat/mocks/handlers.ts` — REST mock
- Create `packages/engine/src/chat/mocks/fakeResponses.ts` — canned responses with keyword matching
- Create `packages/engine/src/chat/mocks/server.ts` — MSW setup for dev/test/Storybook

### Task 3: Create fake WebSocket streaming handler

- Create `packages/engine/src/chat/mocks/wsHandler.ts` — MSW WebSocket mock
- Implement token-by-token streaming with configurable delays
- Support `token`, `done`, and `error` message types
- Connect REST initiation to WS delivery via shared pending-response map

### Task 4: Build StreamingChatView component

- Create `packages/engine/src/components/widgets/StreamingChatView.tsx`
- Streaming cursor animation, thinking indicator, cancel button
- Storybook stories showing: idle, streaming, complete, error states
- Keep original ChatView unchanged for backward compatibility

### Task 5: Build ChatSidebar shell component

- Create `packages/engine/src/components/shell/ChatSidebar.tsx`
- Wraps StreamingChatView with panel chrome (header, model label, collapse/expand)
- Add `chatSidebar` layout mode to HyperCardShell
- Wire MSW startup into Storybook + dev mode

### Task 6: Create streaming chat shared action + hook

- Create `packages/engine/src/chat/useChatStream.ts` — hook that manages REST call + WS connection + Redux dispatch loop
- Create a standard `chat.sendStreaming` shared action pattern for apps to use
- Handle: initiation → connect → stream tokens → finish → cleanup

### Task 7: Build demo — add chat sidebar to CRM app

- Add chat sidebar to CRM with context-aware fake responses (contacts, deals, pipeline queries)
- Wire MSW handlers in CRM dev mode
- Create Storybook stories showing chat alongside different CRM cards
- Demonstrate streaming in action

### Task 8: Verify + polish

- Full typecheck
- All Storybook stories (existing + new)
- Test streaming states: normal flow, error, cancel, rapid messages
- CSS polish: theme tokens for chat sidebar width, streaming cursor color

### Dependency order

```
Task 1 (types + slice)
  └─> Task 2 (API client + MSW REST)
        └─> Task 3 (fake WebSocket)
              └─> Task 6 (useChatStream hook)
Task 4 (StreamingChatView) — independent, can parallel with 2-3
Task 5 (ChatSidebar shell) — needs Task 4
Task 7 (CRM demo) — needs all of 1-6
Task 8 (verify) — needs 7
```


## 5. MSW v2 Strategy

### 5.1 Why MSW

- Intercepts at the network level — app code uses real `fetch()` and `WebSocket`
- Same mocks work in Storybook, Vite dev, and tests
- No conditional logic in app code (`if (mock) ... else ...`)
- MSW v2 has first-class WebSocket support via `ws.link()`

### 5.2 Setup locations

| Context | Setup file | Initialization |
|---------|-----------|----------------|
| Storybook | `.storybook/preview.ts` | `worker.start()` in global decorator |
| Vite dev | `src/main.tsx` | `worker.start()` before `ReactDOM.createRoot()` |
| Tests | `vitest.setup.ts` | `server.listen()` / `server.close()` |

### 5.3 Mock fidelity

The fake API should feel realistic:
- **Token delay**: 30-80ms per token (configurable)
- **First-token latency**: 200-500ms "thinking" delay
- **Response length**: 20-100 tokens (varies by query type)
- **Error simulation**: configurable error rate for testing error UI
- **Context awareness**: responses reference the app's domain (CRM contacts/deals)


## 6. Protocol Specification

### 6.1 REST: POST /api/chat/completions

**Request:**
```json
{
  "conversationId": "conv-1",
  "messages": [
    { "role": "user", "text": "Show me open deals" }
  ],
  "model": "fake-gpt-4"
}
```

**Response (200):**
```json
{
  "conversationId": "conv-1",
  "messageId": "msg-42",
  "streamUrl": "ws://localhost:6007/stream/msg-42"
}
```

### 6.2 WebSocket: /stream/:messageId

Server sends JSON frames, one per line:

```json
{"type":"token","content":"Here "}
{"type":"token","content":"are "}
{"type":"token","content":"the "}
{"type":"token","content":"open "}
{"type":"token","content":"deals:"}
{"type":"done","actions":[{"label":"📋 View Deals","action":{"$":"act","type":"nav.go","args":{"card":"deals"}}}]}
```

Error case:
```json
{"type":"error","error":"Model unavailable"}
```

Client can send:
```json
{"type":"cancel"}
```


## 7. File Inventory (planned)

### Engine additions (~12 files)

```
packages/engine/src/chat/
  chatSlice.ts            — streaming-aware chat reducer
  chatApi.ts              — API client types + functions
  useChatStream.ts        — React hook for streaming lifecycle
  index.ts                — barrel exports
  mocks/
    handlers.ts           — MSW REST handlers
    wsHandler.ts          — MSW WebSocket handlers
    fakeResponses.ts      — canned domain-aware responses
    server.ts             — MSW worker/server setup
packages/engine/src/components/
  widgets/
    StreamingChatView.tsx          — enhanced chat widget
    StreamingChatView.stories.tsx  — Storybook stories
  shell/
    ChatSidebar.tsx               — sidebar wrapper component
```

### App additions (CRM demo, ~4 files)

```
apps/crm/src/
  chat/
    crmChatResponses.ts   — CRM-specific fake responses
  App.tsx                 — updated with chatSidebar mode
  stories/CrmChat.stories.tsx  — chat-specific stories
```


## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| MSW v2 WebSocket API is unstable | Medium | High | Pin MSW version; have fallback to setTimeout-based fake |
| Storybook MSW integration issues | Medium | Medium | Test early in Task 2; MSW-Storybook addon exists |
| Streaming state race conditions | Medium | High | Single-writer pattern: only the stream hook dispatches to streaming message |
| ChatMessage type change breaks existing apps | Low | High | All new fields are optional; old shape is a valid subset |
| WebSocket cleanup on unmount/navigation | Medium | Medium | Cleanup in useEffect return; abort controller pattern |


## 9. Success Criteria

1. ✅ Chat sidebar visible alongside any card in the CRM app
2. ✅ Messages stream in token-by-token with visible cursor animation
3. ✅ "Thinking..." state shown between send and first token
4. ✅ Cancel button stops streaming mid-response
5. ✅ Domain-aware fake responses (mention CRM contacts/deals by name)
6. ✅ All mock infrastructure runs in Storybook without any backend
7. ✅ Existing apps (inventory, book-tracker) unaffected by type changes
8. ✅ Full typecheck clean
9. ✅ Storybook stories for: idle, streaming, complete, error, cancel states
