import {
  ChatWindow,
  createSemRegistry,
  projectSemEnvelope,
  selectTimelineEntities as selectTimelineEntitiesForConversation,
  type ChatWindowMessage,
  type ProjectionPipelineAdapter,
  type SemRegistry,
} from '@hypercard/engine';
import { openWindow } from '@hypercard/engine/desktop-core';
import { emitConversationEvent } from '@hypercard/engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  replaceSuggestions,
  setConnectionStatus,
  setStreamError,
  type TurnStats,
} from './chatSlice';
import {
  type ChatStateSlice,
  selectConnectionStatus,
  selectCurrentTurnStats,
  selectModelName,
  selectStreamOutputTokens,
  selectStreamStartTime,
  selectSuggestions,
} from './selectors';
import {
  InventoryWebChatClient,
  type InventoryWebChatClientHandlers,
  submitPrompt,
} from './webchatClient';
import { stripTrailingWhitespace } from './semHelpers';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { createChatMetaProjectionAdapter, createInventoryArtifactProjectionAdapter } from './runtime/projectionAdapters';
import { mapTimelineEntityToMessage } from './runtime/timelineEntityRenderer';

function formatNumber(n: number): string {
  if (n >= 1000) {
    return n.toLocaleString('en-US');
  }
  return String(n);
}

function StatsFooter({
  modelName,
  turnStats,
  isStreaming,
  streamStartTime,
  streamOutputTokens,
}: {
  modelName: string | null;
  turnStats: TurnStats | null;
  isStreaming: boolean;
  streamStartTime: number | null;
  streamOutputTokens: number;
}) {
  const parts: string[] = [];

  if (modelName) {
    parts.push(modelName);
  }

  if (isStreaming && streamStartTime) {
    const elapsed = (Date.now() - streamStartTime) / 1000;
    if (streamOutputTokens > 0 && elapsed > 0) {
      const liveTps = Math.round((streamOutputTokens / elapsed) * 10) / 10;
      parts.push(`streaming: ${formatNumber(streamOutputTokens)} tok · ${liveTps} tok/s`);
    } else {
      parts.push('streaming...');
    }
  } else if (turnStats) {
    const tokenParts: string[] = [];
    if (turnStats.inputTokens !== undefined) {
      tokenParts.push(`In:${formatNumber(turnStats.inputTokens)}`);
    }
    if (turnStats.outputTokens !== undefined) {
      tokenParts.push(`Out:${formatNumber(turnStats.outputTokens)}`);
    }
    if (turnStats.cachedTokens !== undefined && turnStats.cachedTokens > 0) {
      tokenParts.push(`Cache:${formatNumber(turnStats.cachedTokens)}`);
    }
    if (turnStats.cacheCreationInputTokens !== undefined && turnStats.cacheCreationInputTokens > 0) {
      tokenParts.push(`CacheWrite:${formatNumber(turnStats.cacheCreationInputTokens)}`);
    }
    if (tokenParts.length > 0) {
      parts.push(tokenParts.join(' '));
    }
    if (turnStats.durationMs !== undefined) {
      parts.push(`${(turnStats.durationMs / 1000).toFixed(1)}s`);
    }
    if (turnStats.tps !== undefined) {
      parts.push(`${turnStats.tps} tok/s`);
    }
  }

  if (parts.length === 0) {
    return <span>Streaming via /chat + /ws</span>;
  }

  return <span>{parts.join(' · ')}</span>;
}

export interface InventoryChatWindowProps {
  conversationId: string;
}

export function InventoryChatWindow({ conversationId }: InventoryChatWindowProps) {
  const dispatch = useDispatch<Dispatch<UnknownAction>>();
  const connectionStatus = useSelector((s: ChatStateSlice) => selectConnectionStatus(s, conversationId));
  const timelineEntities = useSelector((s: ChatStateSlice) =>
    selectTimelineEntitiesForConversation(s, conversationId),
  );
  const suggestions = useSelector((s: ChatStateSlice) => selectSuggestions(s, conversationId));
  const modelName = useSelector((s: ChatStateSlice) => selectModelName(s, conversationId));
  const currentTurnStats = useSelector((s: ChatStateSlice) => selectCurrentTurnStats(s, conversationId));
  const streamStartTime = useSelector((s: ChatStateSlice) => selectStreamStartTime(s, conversationId));
  const streamOutputTokens = useSelector((s: ChatStateSlice) => selectStreamOutputTokens(s, conversationId));

  const [debugMode, setDebugMode] = useState(false);
  const clientRef = useRef<InventoryWebChatClient | null>(null);
  const semRegistryRef = useRef<SemRegistry>(
    createSemRegistry({ enableTimelineUpsert: false }),
  );
  const projectionAdaptersRef = useRef<ProjectionPipelineAdapter[]>([
    createChatMetaProjectionAdapter(),
    createInventoryArtifactProjectionAdapter(),
  ]);

  useEffect(() => {
    const handlers: InventoryWebChatClientHandlers = {
      onRawEnvelope: (envelope) => {
        // Raw ingress stream for EventViewer/debug tooling; do not gate on projection.
        emitConversationEvent(conversationId, envelope);
      },
      onEnvelope: (envelope) => {
        if (envelope.event?.type === 'timeline.upsert') {
          return;
        }
        projectSemEnvelope({
          conversationId,
          dispatch,
          semRegistry: semRegistryRef.current,
          envelope,
          adapters: projectionAdaptersRef.current,
        });
      },
      onStatus: (status) => dispatch(setConnectionStatus({ conversationId, status })),
      onError: (error) => dispatch(setStreamError({ conversationId, message: error })),
    };

    const client = new InventoryWebChatClient(conversationId, handlers, {
      hydrate: false,
    });
    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      if (client && clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [conversationId, dispatch]);

  const subtitle = useMemo(() => {
    return `${connectionStatus} · ${conversationId.slice(0, 8)}…`;
  }, [connectionStatus, conversationId]);

  const isStreaming = useMemo(
    () =>
      timelineEntities.some(
        (entity) => entity.kind === 'message' && entity.props.streaming === true,
      ),
    [timelineEntities],
  );

  const displayMessages = useMemo<ChatWindowMessage[]>(
    () =>
      timelineEntities.map(mapTimelineEntityToMessage).map((message) => {
        let msg = message;
        if (msg.role !== 'user' && msg.text) {
          const text = stripTrailingWhitespace(msg.text);
          if (text !== msg.text) {
            msg = { ...msg, text };
          }
        }
        if (debugMode && msg.id) {
          const badge = `[${msg.id} | ${msg.status ?? '—'} | ${msg.role}]`;
          const existingContent = msg.content ?? (msg.text ? [{ kind: 'text' as const, text: msg.text }] : []);
          return {
            ...msg,
            content: [
              { kind: 'text' as const, text: badge },
              ...existingContent,
            ],
          };
        }
        return msg;
      }),
    [timelineEntities, debugMode],
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) {
        return;
      }

      const prompt = text.trim();
      if (prompt.length === 0) {
        return;
      }

      dispatch(replaceSuggestions({ conversationId, suggestions: [] }));

      try {
        await submitPrompt(prompt, conversationId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'chat request failed';
        dispatch(setStreamError({ conversationId, message }));
      }
    },
    [conversationId, dispatch, isStreaming],
  );

  const openEventViewer = useCallback(() => {
    dispatch(
      openWindow({
        id: `window:event-viewer:${conversationId}`,
        title: `📡 Events — ${conversationId.slice(0, 8)}…`,
        icon: '📡',
        bounds: { x: 600 + Math.round(Math.random() * 40), y: 60 + Math.round(Math.random() * 30), w: 580, h: 400 },
        content: { kind: 'app', appKey: `event-viewer:${conversationId}` },
        dedupeKey: `event-viewer:${conversationId}`,
      }),
    );
  }, [dispatch, conversationId]);

  return (
    <ChatWindow
      messages={displayMessages}
      isStreaming={isStreaming}
      onSend={handleSend}
      title="Inventory Chat"
      subtitle={subtitle}
      placeholder="Ask about inventory..."
      suggestions={suggestions}
      showSuggestionsAlways
      headerActions={
        <>
          <button
            type="button"
            data-part="btn"
            onClick={openEventViewer}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            📡 Events
          </button>
          <button
            type="button"
            data-part="btn"
            data-state={debugMode ? 'active' : undefined}
            onClick={() => setDebugMode((d) => !d)}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            {debugMode ? '🔍 Debug ON' : '🔍 Debug'}
          </button>
        </>
      }
      footer={
        <StatsFooter
          modelName={modelName}
          turnStats={currentTurnStats}
          isStreaming={isStreaming}
          streamStartTime={streamStartTime}
          streamOutputTokens={streamOutputTokens}
        />
      }
    />
  );
}
