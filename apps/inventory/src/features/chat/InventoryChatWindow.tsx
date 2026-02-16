import { ChatWindow } from '@hypercard/engine';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  appendToolEvent,
  applyLLMDelta,
  applyLLMFinal,
  applyLLMStart,
  queueUserPrompt,
  setConnectionStatus,
  setConversationId,
  setStreamError,
} from './chatSlice';
import { selectConnectionStatus, selectConversationId, selectIsStreaming, selectMessages } from './selectors';
import {
  getOrCreateConversationId,
  InventoryWebChatClient,
  type InventoryWebChatClientHandlers,
  type SemEventEnvelope,
  submitPrompt,
} from './webchatClient';

function eventIdFromEnvelope(envelope: SemEventEnvelope): string {
  const eventId = envelope.event?.id;
  if (typeof eventId === 'string' && eventId.length > 0) {
    return eventId;
  }
  return `evt-${Date.now()}`;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

function recordField(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = record[key];
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function compactJSON(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '"<unserializable>"';
  }
}

function formatHypercardLifecycle(type: string, data: Record<string, unknown>): string | undefined {
  const title = stringField(data, 'title');
  const itemId = stringField(data, 'itemId');

  if (type === 'hypercard.widget.start') {
    return `widget start: ${title ?? itemId ?? 'unknown'}`;
  }
  if (type === 'hypercard.widget.update') {
    return `widget update: ${title ?? itemId ?? 'unknown'}`;
  }
  if (type === 'hypercard.widget.v1') {
    const payload = recordField(data, 'data');
    const artifact = payload ? recordField(payload, 'artifact') : undefined;
    const artifactId = artifact ? stringField(artifact, 'id') : undefined;
    return `widget ready: ${title ?? itemId ?? 'unknown'}${artifactId ? ` artifact=${artifactId}` : ''}`;
  }
  if (type === 'hypercard.widget.error') {
    return `widget error: ${stringField(data, 'error') ?? 'unknown error'}`;
  }

  if (type === 'hypercard.card.start') {
    return `card start: ${title ?? itemId ?? 'unknown'}`;
  }
  if (type === 'hypercard.card.update') {
    return `card update: ${title ?? itemId ?? 'unknown'}`;
  }
  if (type === 'hypercard.card_proposal.v1') {
    const template = stringField(data, 'template');
    const payload = recordField(data, 'data');
    const artifact = payload ? recordField(payload, 'artifact') : undefined;
    const artifactId = artifact ? stringField(artifact, 'id') : undefined;
    return `card ready: ${title ?? itemId ?? 'unknown'}${template ? ` template=${template}` : ''}${artifactId ? ` artifact=${artifactId}` : ''}`;
  }
  if (type === 'hypercard.card.error') {
    return `card error: ${stringField(data, 'error') ?? 'unknown error'}`;
  }

  return undefined;
}

function formatTimelineUpsert(data: Record<string, unknown>): string {
  const entity = recordField(data, 'entity');
  if (!entity) {
    return 'timeline upsert';
  }
  const kind = stringField(entity, 'kind') ?? 'entity';
  const id = stringField(entity, 'id') ?? 'unknown';
  const status = recordField(entity, 'status');
  if (status) {
    const text = stringField(status, 'text');
    const statusType = stringField(status, 'type');
    return `timeline ${kind}: ${statusType ?? 'info'} ${text ?? id}`;
  }
  const toolResult = recordField(entity, 'toolResult');
  if (toolResult) {
    const customKind = stringField(toolResult, 'customKind');
    return `timeline ${kind}: ${customKind ?? id}`;
  }
  return `timeline ${kind}: ${id}`;
}

function onSemEnvelope(envelope: SemEventEnvelope, dispatch: ReturnType<typeof useDispatch>): void {
  const type = envelope.event?.type;
  const data = envelope.event?.data ?? {};
  const messageId = eventIdFromEnvelope(envelope);

  if (type === 'llm.start') {
    dispatch(applyLLMStart({ messageId }));
    return;
  }

  if (type === 'llm.delta') {
    dispatch(
      applyLLMDelta({
        messageId,
        cumulative: stringField(data, 'cumulative'),
        delta: stringField(data, 'delta'),
      }),
    );
    return;
  }

  if (type === 'llm.final') {
    dispatch(
      applyLLMFinal({
        messageId,
        text: stringField(data, 'text'),
      }),
    );
    return;
  }

  if (type === 'tool.start') {
    const name = stringField(data, 'name') ?? 'tool';
    const input = data.input;
    const argsText = typeof input === 'undefined' ? '' : ` args=${compactJSON(input)}`;
    dispatch(appendToolEvent({ text: `tool start: ${name}${argsText}` }));
    return;
  }

  if (type === 'tool.delta') {
    const patch = data.patch;
    const patchText = typeof patch === 'undefined' ? '' : ` patch=${compactJSON(patch)}`;
    dispatch(appendToolEvent({ text: `tool delta:${patchText}` }));
    return;
  }

  if (type === 'tool.result') {
    const result = stringField(data, 'result') ?? 'ok';
    dispatch(appendToolEvent({ text: `tool result: ${result}` }));
    return;
  }

  if (type === 'tool.done') {
    dispatch(appendToolEvent({ text: 'tool done' }));
    return;
  }

  const lifecycleText = type ? formatHypercardLifecycle(type, data) : undefined;
  if (lifecycleText) {
    dispatch(appendToolEvent({ text: lifecycleText }));
    return;
  }

  if (type === 'timeline.upsert') {
    dispatch(appendToolEvent({ text: formatTimelineUpsert(data) }));
    return;
  }

  if (type === 'ws.error') {
    dispatch(setStreamError({ message: stringField(data, 'message') ?? 'websocket stream error' }));
  }
}

export function InventoryChatWindow() {
  const dispatch = useDispatch();
  const conversationId = useSelector(selectConversationId);
  const connectionStatus = useSelector(selectConnectionStatus);
  const messages = useSelector(selectMessages);
  const isStreaming = useSelector(selectIsStreaming);

  const clientRef = useRef<InventoryWebChatClient | null>(null);

  useEffect(() => {
    if (conversationId) {
      return;
    }

    dispatch(setConversationId(getOrCreateConversationId()));
  }, [dispatch, conversationId]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const handlers: InventoryWebChatClientHandlers = {
      onEnvelope: (envelope) => onSemEnvelope(envelope, dispatch),
      onStatus: (status) => dispatch(setConnectionStatus(status)),
      onError: (error) => dispatch(setStreamError({ message: error })),
    };

    const client = new InventoryWebChatClient(conversationId, handlers);
    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [conversationId, dispatch]);

  const subtitle = useMemo(() => {
    if (!conversationId) {
      return 'bootstrapping...';
    }
    return `${connectionStatus} · ${conversationId}`;
  }, [connectionStatus, conversationId]);

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) {
        return;
      }

      const prompt = text.trim();
      if (prompt.length === 0) {
        return;
      }

      const convId = conversationId ?? getOrCreateConversationId();
      if (!conversationId) {
        dispatch(setConversationId(convId));
      }

      dispatch(queueUserPrompt({ text: prompt }));

      try {
        await submitPrompt(prompt, convId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'chat request failed';
        dispatch(setStreamError({ message }));
      }
    },
    [conversationId, dispatch, isStreaming],
  );

  return (
    <ChatWindow
      messages={messages}
      isStreaming={isStreaming}
      onSend={handleSend}
      title="Inventory Chat"
      subtitle={subtitle}
      placeholder="Ask about inventory..."
      suggestions={['Show current inventory status', 'What items are low stock?', 'Summarize today sales']}
      footer={<span>Streaming via /chat + /ws</span>}
    />
  );
}
