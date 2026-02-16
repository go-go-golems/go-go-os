import {
  ChatWindow,
  DataTable,
  ReportView,
  openWindow,
  type CardStackDefinition,
  type ChatContentBlock,
  type ChatWindowMessage,
  type ColumnConfig,
  type InlineWidget,
} from '@hypercard/engine';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { injectPluginCard, type CardProposal } from './cardInjector';
import {
  connectCompletionStream,
  fetchTimeline,
  startCompletion,
  type BackendArtifact,
  type BackendMessage,
  type BackendTimelineMessage,
} from './protocol';

const SUGGESTIONS = [
  'Show low stock below 3',
  'What is total inventory value?',
  'Show sales last 7 days',
  'Find A-1002',
];

const STORAGE_CONVERSATION_KEY = 'hc-inventory-chat-conversation-id';

interface InventoryChatAssistantWindowProps {
  stack: CardStackDefinition;
  backendBaseUrl?: string;
}

function readConversationId(): string {
  if (typeof window === 'undefined') {
    return 'default';
  }
  return window.localStorage.getItem(STORAGE_CONVERSATION_KEY) ?? 'default';
}

function writeConversationId(nextConversationId: string) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_CONVERSATION_KEY, nextConversationId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function makeSystemMessage(text: string): ChatWindowMessage {
  return {
    id: `sys-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    role: 'system',
    text,
    status: 'complete',
  };
}

function normalizeColumns(raw: unknown): ColumnConfig[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is Record<string, unknown> => isRecord(item) && typeof item.key === 'string')
    .map((item) => {
      const formatType = typeof item.format === 'string' ? item.format : '';
      return {
        key: item.key as string,
        label: typeof item.label === 'string' ? item.label : (item.key as string),
        width: typeof item.width === 'number' || typeof item.width === 'string' ? item.width : undefined,
        align: item.align === 'left' || item.align === 'right' || item.align === 'center' ? item.align : undefined,
        format:
          formatType === 'money'
            ? (value: unknown) => `$${Number(value ?? 0).toFixed(2)}`
            : undefined,
      } satisfies ColumnConfig;
    });
}

function normalizeDataTableItems(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isRecord);
}

function normalizeReportSections(raw: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      label: String(item.label ?? 'Metric'),
      value: String(item.value ?? ''),
    }));
}

function toBackendHistory(messages: ChatWindowMessage[], nextUserText: string): BackendMessage[] {
  const prior = messages
    .filter((message) => message.role === 'user' || message.role === 'ai')
    .slice(-12)
    .map((message) => ({ role: message.role, text: message.text }));

  prior.push({ role: 'user', text: nextUserText });
  return prior;
}

function createMessageContent(text: string, blocks: ChatContentBlock[]): ChatContentBlock[] | undefined {
  if (blocks.length === 0) {
    return undefined;
  }

  const content: ChatContentBlock[] = [];
  if (text.trim()) {
    content.push({ kind: 'text', text: text.trim() });
  }
  return [...content, ...blocks];
}

function normalizeRole(role: string): ChatWindowMessage['role'] {
  if (role === 'user' || role === 'ai' || role === 'system') {
    return role;
  }
  if (role === 'assistant') {
    return 'ai';
  }
  return 'system';
}

function normalizeStatus(status: string): ChatWindowMessage['status'] {
  if (status === 'streaming' || status === 'error') {
    return status;
  }
  return 'complete';
}

function toTimelineChatMessage(
  message: BackendTimelineMessage,
  toContentBlock: (artifact: BackendArtifact) => ChatContentBlock | null,
): ChatWindowMessage {
  const blocks: ChatContentBlock[] = [];
  for (const artifact of message.artifacts ?? []) {
    const block = toContentBlock(artifact);
    if (block) {
      blocks.push(block);
    }
  }

  return {
    id: message.id,
    role: normalizeRole(message.role),
    text: message.text,
    status: normalizeStatus(message.status),
    actions: message.actions,
    content: createMessageContent(message.text, blocks),
  };
}

export function InventoryChatAssistantWindow({
  stack,
  backendBaseUrl,
}: InventoryChatAssistantWindowProps) {
  const dispatch = useDispatch();
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(readConversationId());

  const streamCancelRef = useRef<(() => void) | null>(null);
  const hydratedConversationRef = useRef<string | null>(null);
  const cardProposalsRef = useRef<Map<string, CardProposal>>(new Map());
  const sessionCounterRef = useRef(2000);

  const resolvedBaseUrl =
    backendBaseUrl ??
    (import.meta.env.VITE_INVENTORY_CHAT_BASE_URL as string | undefined) ??
    'http://localhost:8081';

  const openCardWindow = useCallback(
    (cardId: string, param?: string) => {
      const cardDef = stack.cards[cardId];
      if (!cardDef) {
        setMessages((prev) => [...prev, makeSystemMessage(`Card '${cardId}' does not exist.`)]);
        return;
      }

      sessionCounterRef.current += 1;
      const sessionId = `chat-session-${sessionCounterRef.current}`;

      dispatch(
        openWindow({
          id: `window:${cardId}:${sessionId}`,
          title: cardDef.title ?? cardId,
          icon: cardDef.icon,
          bounds: {
            x: 210 + (sessionCounterRef.current % 5) * 28,
            y: 50 + (sessionCounterRef.current % 4) * 22,
            w: 440,
            h: 360,
          },
          content: {
            kind: 'card',
            card: {
              stackId: stack.id,
              cardId,
              cardSessionId: sessionId,
              param,
            },
          },
        }),
      );
    },
    [dispatch, stack],
  );

  const toContentBlock = useCallback((artifact: BackendArtifact): ChatContentBlock | null => {
    if (artifact.kind === 'widget') {
      const widgetType = artifact.widgetType;
      if (!widgetType) {
        return null;
      }
      const widget: InlineWidget = {
        id: artifact.id,
        type: widgetType,
        label: artifact.label,
        props: artifact.props ?? {},
      };
      return { kind: 'widget', widget };
    }

    if (artifact.kind === 'card-proposal') {
      const proposal: CardProposal = {
        id: artifact.id,
        cardId: String(artifact.cardId ?? ''),
        title: String(artifact.title ?? 'Generated Card'),
        icon: String(artifact.icon ?? 'GEN'),
        code: String(artifact.code ?? ''),
        dedupeKey: typeof artifact.dedupeKey === 'string' ? artifact.dedupeKey : undefined,
        version: typeof artifact.version === 'number' ? artifact.version : undefined,
        policy: artifact.policy,
      };
      cardProposalsRef.current.set(proposal.id, proposal);
      return {
        kind: 'text',
        text: `Card proposal ready: ${proposal.title} (${proposal.cardId}). Use 'Create Saved Card'.`,
      };
    }

    return null;
  }, []);

  useEffect(() => {
    if (hydratedConversationRef.current === conversationId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const timeline = await fetchTimeline(conversationId, resolvedBaseUrl);
        if (cancelled) {
          return;
        }

        cardProposalsRef.current.clear();
        const hydratedMessages = timeline.messages.map((message) =>
          toTimelineChatMessage(message, toContentBlock),
        );
        setMessages(hydratedMessages);
        setIsStreaming(hydratedMessages.some((message) => message.status === 'streaming'));

        hydratedConversationRef.current = timeline.conversationId;
        setConversationId(timeline.conversationId);
        writeConversationId(timeline.conversationId);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        setMessages((prev) =>
          prev.length > 0 ? prev : [makeSystemMessage(`Timeline hydration failed: ${message}`)],
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, resolvedBaseUrl, toContentBlock]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) {
        return;
      }

      const userId = `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const aiId = `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', text: trimmed, status: 'complete' },
        { id: aiId, role: 'ai', text: '', status: 'streaming' },
      ]);
      setIsStreaming(true);

      const requestMessages = toBackendHistory(messages, trimmed);
      let contentBlocks: ChatContentBlock[] = [];

      try {
        const response = await startCompletion(
          {
            conversationId,
            messages: requestMessages,
          },
          resolvedBaseUrl,
        );

        setConversationId(response.conversationId);
        writeConversationId(response.conversationId);

        const cancel = connectCompletionStream(response.streamUrl, {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiId
                  ? {
                      ...msg,
                      text: msg.text + token,
                    }
                  : msg,
              ),
            );
          },
          onArtifact: (artifact) => {
            const block = toContentBlock(artifact);
            if (block) {
              contentBlocks = [...contentBlocks, block];
            }
          },
          onDone: (actions) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiId
                  ? {
                      ...msg,
                      status: 'complete',
                      actions,
                      content: createMessageContent(msg.text, contentBlocks),
                    }
                  : msg,
              ),
            );
            setIsStreaming(false);
            streamCancelRef.current = null;
          },
          onError: (error) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiId
                  ? {
                      ...msg,
                      status: 'error',
                      text: msg.text || error,
                    }
                  : msg,
              ),
            );
            setMessages((prev) => [...prev, makeSystemMessage(`Backend stream error: ${error}`)]);
            setIsStreaming(false);
            streamCancelRef.current = null;
          },
        });

        streamCancelRef.current = cancel;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiId
              ? {
                  ...msg,
                  status: 'error',
                  text: message,
                }
              : msg,
          ),
        );
        setMessages((prev) => [...prev, makeSystemMessage(`Request failed: ${message}`)]);
        setIsStreaming(false);
      }
    },
    [conversationId, isStreaming, messages, resolvedBaseUrl, toContentBlock],
  );

  const handleCancel = useCallback(() => {
    if (streamCancelRef.current) {
      streamCancelRef.current();
      streamCancelRef.current = null;
    }
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.status === 'streaming'
          ? {
              ...msg,
              status: 'complete',
            }
          : msg,
      ),
    );
  }, []);

  const handleAction = useCallback(
    (rawAction: unknown) => {
      if (!isRecord(rawAction) || typeof rawAction.type !== 'string') {
        setMessages((prev) => [...prev, makeSystemMessage('Unsupported action payload from backend.')]);
        return;
      }

      const actionType = rawAction.type;
      if (actionType === 'open-card' && typeof rawAction.cardId === 'string') {
        const param = typeof rawAction.param === 'string' ? rawAction.param : undefined;
        openCardWindow(rawAction.cardId, param);
        return;
      }

      if (actionType === 'prefill' && typeof rawAction.text === 'string') {
        void send(rawAction.text);
        return;
      }

      if (actionType === 'create-card' && typeof rawAction.proposalId === 'string') {
        const proposal = cardProposalsRef.current.get(rawAction.proposalId);
        if (!proposal) {
          setMessages((prev) => [...prev, makeSystemMessage(`Proposal '${rawAction.proposalId}' is not available.`)]);
          return;
        }

        const result = injectPluginCard(stack, proposal);
        setMessages((prev) => [...prev, makeSystemMessage(result.reason)]);
        openCardWindow(proposal.cardId);
        return;
      }

      setMessages((prev) => [...prev, makeSystemMessage(`Unhandled action type: ${actionType}`)]);
    },
    [openCardWindow, send, stack],
  );

  const renderWidget = useCallback((widget: InlineWidget) => {
    if (widget.type === 'data-table') {
      const items = normalizeDataTableItems(widget.props.items);
      const columns = normalizeColumns(widget.props.columns);
      return <DataTable items={items} columns={columns} />;
    }

    if (widget.type === 'report-view') {
      const sections = normalizeReportSections(widget.props.sections);
      return <ReportView sections={sections} />;
    }

    return <div style={{ padding: 8, fontSize: 11 }}>Unsupported widget type: {widget.type}</div>;
  }, []);

  return (
    <ChatWindow
      messages={messages}
      isStreaming={isStreaming}
      onSend={(text) => {
        void send(text);
      }}
      onCancel={handleCancel}
      onAction={handleAction}
      suggestions={SUGGESTIONS}
      title="Inventory Assistant"
      subtitle="SQLite tool-backed chat"
      placeholder="Ask about stock levels, sales, inventory value, or a SKU..."
      renderWidget={renderWidget}
      footer={<span>Conversation: {conversationId} · Backend: {resolvedBaseUrl}</span>}
    />
  );
}
