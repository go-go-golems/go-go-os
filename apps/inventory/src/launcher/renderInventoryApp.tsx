import { formatAppKey, parseAppKey, type LaunchReason, type LauncherHostContext } from '@hypercard/desktop-os';
import {
  ChatConversationWindow,
  CodeEditorWindow,
  ensureChatModulesRegistered,
  EventViewerWindow,
  getEditorInitialCode,
  registerChatRuntimeModule,
  registerHypercardTimelineModule,
  RuntimeCardDebugWindow,
  TimelineDebugWindow,
} from '@hypercard/engine';
import { openWindow, type OpenWindowPayload, type WindowInstance } from '@hypercard/engine/desktop-core';
import { PluginCardSessionHost } from '@hypercard/engine/desktop-hypercard-adapter';
import {
  type DesktopCommandHandler,
  type DesktopContribution,
  type WindowContentAdapter,
} from '@hypercard/engine/desktop-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { STACK } from '../domain/stack';
import { ReduxPerfWindow } from '../features/debug/ReduxPerfWindow';

const INVENTORY_APP_ID = 'inventory';
const INVENTORY_API_BASE_PREFIX = '/api/apps/inventory';
const CHAT_INSTANCE_PREFIX = 'chat-';
const EVENT_VIEW_INSTANCE_PREFIX = 'event-viewer-';
const TIMELINE_DEBUG_INSTANCE_PREFIX = 'timeline-debug-';
const CODE_EDITOR_INSTANCE_PREFIX = 'code-editor-';
const RUNTIME_DEBUG_INSTANCE = 'runtime-debug';
const REDUX_PERF_INSTANCE = 'redux-perf';

registerChatRuntimeModule({
  id: 'chat.hypercard-timeline',
  register: registerHypercardTimelineModule,
});
ensureChatModulesRegistered();

function nextInstanceId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}${Date.now()}`;
}

function buildInventoryAppWindowPayload(
  instanceId: string,
  title: string,
  icon: string,
  bounds: OpenWindowPayload['bounds'],
  dedupeKey?: string,
): OpenWindowPayload {
  return {
    id: `window:inventory:${instanceId}`,
    title,
    icon,
    bounds,
    content: {
      kind: 'app',
      appKey: formatAppKey(INVENTORY_APP_ID, instanceId),
    },
    dedupeKey,
  };
}

function buildInventoryCardWindowPayload(cardId: string, options?: { dedupe?: boolean }): OpenWindowPayload {
  const card = STACK.cards[cardId];
  const sessionId = nextInstanceId(`inv-card-${cardId}-`);
  return {
    id: `window:inventory:card:${cardId}:${sessionId}`,
    title: card?.title ?? cardId,
    icon: card?.icon ?? '📄',
    bounds: {
      x: 180 + Math.round(Math.random() * 60),
      y: 40 + Math.round(Math.random() * 40),
      w: 820,
      h: 620,
    },
    content: {
      kind: 'card',
      card: {
        stackId: STACK.id,
        cardId,
        cardSessionId: sessionId,
      },
    },
    dedupeKey: options?.dedupe ? `inventory-card:${cardId}` : undefined,
  };
}

function buildChatWindowPayload(options?: { dedupeKey?: string }): OpenWindowPayload {
  const instanceId = nextInstanceId(CHAT_INSTANCE_PREFIX);
  return buildInventoryAppWindowPayload(instanceId, 'Inventory Chat', '💬', { x: 340, y: 20, w: 560, h: 460 }, options?.dedupeKey);
}

function buildEventViewerWindowPayload(convId: string): OpenWindowPayload {
  const shortId = convId.slice(0, 8);
  return buildInventoryAppWindowPayload(
    `${EVENT_VIEW_INSTANCE_PREFIX}${convId}`,
    `Event Viewer (${shortId})`,
    '🧭',
    { x: 780, y: 40, w: 560, h: 420 },
    `inventory-event-viewer:${convId}`,
  );
}

function buildTimelineDebugWindowPayload(convId: string): OpenWindowPayload {
  const shortId = convId.slice(0, 8);
  return buildInventoryAppWindowPayload(
    `${TIMELINE_DEBUG_INSTANCE_PREFIX}${convId}`,
    `Timeline Debug (${shortId})`,
    '🧱',
    { x: 820, y: 60, w: 640, h: 460 },
    `inventory-timeline-debug:${convId}`,
  );
}

function buildRuntimeDebugWindowPayload(): OpenWindowPayload {
  return buildInventoryAppWindowPayload(
    RUNTIME_DEBUG_INSTANCE,
    'Stacks & Cards',
    '🔧',
    { x: 80, y: 30, w: 560, h: 480 },
    RUNTIME_DEBUG_INSTANCE,
  );
}

function buildReduxPerfWindowPayload(): OpenWindowPayload {
  return buildInventoryAppWindowPayload(
    REDUX_PERF_INSTANCE,
    'Redux Perf',
    '📈',
    { x: 900, y: 40, w: 420, h: 320 },
    REDUX_PERF_INSTANCE,
  );
}

export function buildInventoryLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  return buildInventoryCardWindowPayload(STACK.homeCard, { dedupe: reason === 'startup' });
}

function resolveConversationIdFromWindow(win: WindowInstance | null | undefined): string | null {
  if (!win || win.content.kind !== 'app' || !win.content.appKey) {
    return null;
  }
  try {
    const parsed = parseAppKey(win.content.appKey);
    if (parsed.appId !== INVENTORY_APP_ID || !parsed.instanceId.startsWith(CHAT_INSTANCE_PREFIX)) {
      return null;
    }
    return parsed.instanceId.slice(CHAT_INSTANCE_PREFIX.length) || null;
  } catch {
    return null;
  }
}

function resolveFocusedConversationId(state: unknown, focusedWindowId: string | null): string | null {
  if (typeof state !== 'object' || state === null || Array.isArray(state)) {
    return null;
  }
  const root = state as Record<string, unknown>;
  const windowing = root.windowing as Record<string, unknown> | undefined;
  const windows = (windowing?.windows ?? {}) as Record<string, WindowInstance>;

  if (focusedWindowId && windows[focusedWindowId]) {
    const fromFocused = resolveConversationIdFromWindow(windows[focusedWindowId]);
    if (fromFocused) {
      return fromFocused;
    }
  }

  for (const win of Object.values(windows)) {
    const convId = resolveConversationIdFromWindow(win);
    if (convId) {
      return convId;
    }
  }

  return null;
}

function asCardId(commandId: string): string | null {
  if (commandId.startsWith('inventory.card.open.')) {
    return commandId.replace('inventory.card.open.', '').trim() || null;
  }
  if (commandId.startsWith('icon.open.inventory.card.')) {
    return commandId.replace('icon.open.inventory.card.', '').trim() || null;
  }
  return null;
}

function createInventoryCardAdapter(): WindowContentAdapter {
  return {
    id: 'inventory.card-adapter',
    canRender: (window) => window.content.kind === 'card' && window.content.card?.stackId === STACK.id,
    render: (window, ctx) => {
      if (window.content.kind !== 'card' || !window.content.card) {
        return null;
      }
      return (
        <PluginCardSessionHost
          windowId={window.id}
          sessionId={window.content.card.cardSessionId}
          stack={STACK}
          mode={ctx.mode}
        />
      );
    },
  };
}

function createInventoryCommands(hostContext: LauncherHostContext): DesktopCommandHandler[] {
  return [
    {
      id: 'inventory.chat.new',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.chat.new' || commandId === 'icon.open.inventory.new-chat',
      run: () => {
        hostContext.openWindow(buildChatWindowPayload());
        return 'handled';
      },
    },
    {
      id: 'inventory.card.open',
      priority: 100,
      matches: (commandId) => asCardId(commandId) !== null,
      run: (commandId) => {
        const cardId = asCardId(commandId);
        if (!cardId || !STACK.cards[cardId]) {
          return 'pass';
        }
        hostContext.openWindow(buildInventoryCardWindowPayload(cardId));
        return 'handled';
      },
    },
    {
      id: 'inventory.debug.event-viewer',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.debug.event-viewer' || commandId === 'icon.open.inventory.event-viewer',
      run: (_commandId, ctx) => {
        const convId = resolveFocusedConversationId(ctx.getState?.(), ctx.focusedWindowId);
        if (!convId) {
          return 'pass';
        }
        hostContext.openWindow(buildEventViewerWindowPayload(convId));
        return 'handled';
      },
    },
    {
      id: 'inventory.debug.timeline-debug',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.debug.timeline-debug' || commandId === 'icon.open.inventory.timeline-debug',
      run: (_commandId, ctx) => {
        const convId = resolveFocusedConversationId(ctx.getState?.(), ctx.focusedWindowId);
        if (!convId) {
          return 'pass';
        }
        hostContext.openWindow(buildTimelineDebugWindowPayload(convId));
        return 'handled';
      },
    },
    {
      id: 'inventory.debug.stacks',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.debug.stacks' || commandId === 'icon.open.inventory.runtime-debug',
      run: () => {
        hostContext.openWindow(buildRuntimeDebugWindowPayload());
        return 'handled';
      },
    },
    {
      id: 'inventory.debug.redux-perf',
      priority: 100,
      matches: (commandId) => commandId === 'inventory.debug.redux-perf' || commandId === 'icon.open.inventory.redux-perf',
      run: () => {
        hostContext.openWindow(buildReduxPerfWindowPayload());
        return 'handled';
      },
    },
  ];
}

export function createInventoryContributions(hostContext: LauncherHostContext): DesktopContribution[] {
  const cardIcons = Object.keys(STACK.cards).map((cardId) => ({
    id: `inventory.card.${cardId}`,
    label: STACK.cards[cardId].title ?? cardId,
    icon: STACK.cards[cardId].icon ?? '📄',
  }));

  return [
    {
      id: 'inventory.launcher',
      icons: [
        { id: 'inventory.new-chat', label: 'New Chat', icon: '💬' },
        { id: 'inventory.runtime-debug', label: 'Stacks & Cards', icon: '🔧' },
        { id: 'inventory.event-viewer', label: 'Event Viewer', icon: '🧭' },
        { id: 'inventory.timeline-debug', label: 'Timeline Debug', icon: '🧱' },
        { id: 'inventory.redux-perf', label: 'Redux Perf', icon: '📈' },
        ...cardIcons,
      ],
      menus: [
        {
          id: 'file',
          label: 'File',
          items: [
            { id: 'inventory-new-chat', label: 'New Inventory Chat', commandId: 'inventory.chat.new', shortcut: 'Ctrl+N' },
            {
              id: 'inventory-open-home',
              label: `Open ${STACK.cards[STACK.homeCard]?.title ?? 'Home'}`,
              commandId: `inventory.card.open.${STACK.homeCard}`,
            },
            { id: 'inventory-close-focused', label: 'Close Window', commandId: 'window.close-focused', shortcut: 'Ctrl+W' },
          ],
        },
        {
          id: 'cards',
          label: 'Cards',
          items: Object.keys(STACK.cards).map((cardId) => ({
            id: `inventory-open-${cardId}`,
            label: `${STACK.cards[cardId].icon ?? ''} ${STACK.cards[cardId].title ?? cardId}`.trim(),
            commandId: `inventory.card.open.${cardId}`,
          })),
        },
        {
          id: 'debug',
          label: 'Debug',
          items: [
            { id: 'inventory-debug-stacks', label: '🔧 Stacks & Cards', commandId: 'inventory.debug.stacks' },
            { id: 'inventory-debug-event-viewer', label: '🧭 Event Viewer', commandId: 'inventory.debug.event-viewer' },
            { id: 'inventory-debug-timeline', label: '🧱 Timeline Debug', commandId: 'inventory.debug.timeline-debug' },
            { id: 'inventory-debug-redux', label: '📈 Redux Perf', commandId: 'inventory.debug.redux-perf' },
          ],
        },
      ],
      commands: createInventoryCommands(hostContext),
      windowContentAdapters: [createInventoryCardAdapter()],
    },
  ];
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error('clipboard unavailable');
}

function InventoryChatAssistantWindow({ convId }: { convId: string }) {
  const dispatch = useDispatch();
  const [renderMode, setRenderMode] = useState<'normal' | 'debug'>('normal');
  const [copyConvStatus, setCopyConvStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const openEventViewer = useCallback(() => {
    dispatch(openWindow(buildEventViewerWindowPayload(convId)));
  }, [convId, dispatch]);

  const openTimelineDebug = useCallback(() => {
    dispatch(openWindow(buildTimelineDebugWindowPayload(convId)));
  }, [convId, dispatch]);

  const copyConversationId = useCallback(() => {
    copyTextToClipboard(convId)
      .then(() => {
        setCopyConvStatus('copied');
      })
      .catch(() => {
        setCopyConvStatus('error');
      })
      .finally(() => {
        setTimeout(() => setCopyConvStatus('idle'), 1300);
      });
  }, [convId]);

  return (
    <ChatConversationWindow
      convId={convId}
      basePrefix={INVENTORY_API_BASE_PREFIX}
      title="Inventory Chat"
      enableProfileSelector
      profileRegistry="default"
      renderMode={renderMode}
      headerActions={
        <>
          <button type="button" data-part="btn" onClick={openEventViewer} style={{ fontSize: 10, padding: '1px 6px' }}>
            🧭 Events
          </button>
          <button
            type="button"
            data-part="btn"
            onClick={openTimelineDebug}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            🧱 Timeline
          </button>
          <button
            type="button"
            data-part="btn"
            onClick={copyConversationId}
            title={convId}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            {copyConvStatus === 'copied'
              ? '✅ Copied'
              : copyConvStatus === 'error'
                ? '⚠ Copy failed'
                : '📋 Copy Conv ID'}
          </button>
          <button
            type="button"
            data-part="btn"
            data-state={renderMode === 'debug' ? 'active' : undefined}
            onClick={() => setRenderMode((mode) => (mode === 'normal' ? 'debug' : 'normal'))}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            {renderMode === 'debug' ? '🔍 Debug ON' : '🔍 Debug'}
          </button>
        </>
      }
    />
  );
}

export function InventoryLauncherAppWindow({ instanceId }: { instanceId: string }): ReactNode {
  if (instanceId.startsWith(CHAT_INSTANCE_PREFIX)) {
    const convId = instanceId.slice(CHAT_INSTANCE_PREFIX.length);
    return <InventoryChatAssistantWindow convId={convId} />;
  }
  if (instanceId.startsWith(EVENT_VIEW_INSTANCE_PREFIX)) {
    const convId = instanceId.slice(EVENT_VIEW_INSTANCE_PREFIX.length);
    return <EventViewerWindow conversationId={convId} />;
  }
  if (instanceId.startsWith(TIMELINE_DEBUG_INSTANCE_PREFIX)) {
    const convId = instanceId.slice(TIMELINE_DEBUG_INSTANCE_PREFIX.length);
    return <TimelineDebugWindow conversationId={convId} />;
  }
  if (instanceId === RUNTIME_DEBUG_INSTANCE) {
    return <RuntimeCardDebugWindow stacks={[STACK]} />;
  }
  if (instanceId === REDUX_PERF_INSTANCE) {
    return <ReduxPerfWindow />;
  }
  if (instanceId.startsWith(CODE_EDITOR_INSTANCE_PREFIX)) {
    const cardId = instanceId.slice(CODE_EDITOR_INSTANCE_PREFIX.length);
    return <CodeEditorWindow cardId={cardId} initialCode={getEditorInitialCode(cardId)} />;
  }

  return (
    <section style={{ padding: 12, display: 'grid', gap: 8 }}>
      <strong>Inventory</strong>
      <span>Unknown inventory window instance: {instanceId}</span>
    </section>
  );
}
