import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { DesktopShell, type DesktopContribution } from '@hypercard/engine/desktop-react';
import {
  CodeEditorWindow,
  EventViewerWindow,
  getRuntimeCardEditorInitialCode,
} from '@hypercard/engine';
import { type ReactNode, useCallback, useMemo } from 'react';
import { STACK } from './domain/stack';
import { InventoryChatWindow } from './features/chat/InventoryChatWindow';
import { RuntimeCardDebugWindow } from './features/chat/RuntimeCardDebugWindow';
import { ReduxPerfWindow } from './features/debug/ReduxPerfWindow';

const CHAT_APP_KEY = 'inventory-chat';
const REDUX_PERF_APP_KEY = 'redux-perf-debug';

function newConversationId(): string {
  return typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `inv-${Date.now()}`;
}

function buildChatWindowPayload(options?: { dedupeKey?: string }): OpenWindowPayload {
  const convId = newConversationId();
  return {
    id: `window:chat:${convId}`,
    title: '💬 Inventory Chat',
    icon: '💬',
    bounds: {
      x: 340 + Math.round(Math.random() * 60),
      y: 20 + Math.round(Math.random() * 40),
      w: 520,
      h: 440,
    },
    content: {
      kind: 'app',
      appKey: `${CHAT_APP_KEY}:${convId}`,
    },
    dedupeKey: options?.dedupeKey ?? `chat:${convId}`,
  };
}

export function App() {
  const renderAppWindow = useCallback((appKey: string): ReactNode => {
    if (appKey === REDUX_PERF_APP_KEY) {
      return <ReduxPerfWindow />;
    }
    if (appKey.startsWith(`${CHAT_APP_KEY}:`)) {
      const convId = appKey.slice(CHAT_APP_KEY.length + 1);
      return <InventoryChatWindow conversationId={convId} />;
    }
    if (appKey.startsWith('event-viewer:')) {
      const convId = appKey.slice('event-viewer:'.length);
      return <EventViewerWindow conversationId={convId} />;
    }
    if (appKey === 'runtime-card-debug') {
      return <RuntimeCardDebugWindow />;
    }
    if (appKey.startsWith('code-editor:')) {
      const cardId = appKey.slice('code-editor:'.length);
      return (
        <CodeEditorWindow
          cardId={cardId}
          initialCode={getRuntimeCardEditorInitialCode(cardId)}
        />
      );
    }
    return null;
  }, []);

  const contributions = useMemo((): DesktopContribution[] => {
    const cardIcons = Object.keys(STACK.cards).map((cardId) => ({
      id: cardId,
      label: STACK.cards[cardId].title ?? cardId,
      icon: STACK.cards[cardId].icon ?? '📄',
    }));
    const debugIcons = [
      { id: 'runtime-debug', label: 'Stacks & Cards', icon: '🔧' },
    ];
    if (import.meta.env.DEV) {
      debugIcons.push({ id: 'redux-perf', label: 'Redux Perf', icon: '📈' });
    }
    const startupWindows = [
      {
        id: 'startup.chat',
        create: () => buildChatWindowPayload({ dedupeKey: 'chat:startup' }),
      },
      ...(import.meta.env.DEV
        ? [
            {
              id: 'startup.redux-perf',
              create: () =>
                ({
                  id: 'window:redux-perf:dev',
                  title: '📈 Redux Perf',
                  icon: '📈',
                  bounds: { x: 900, y: 40, w: 420, h: 320 },
                  content: { kind: 'app', appKey: REDUX_PERF_APP_KEY },
                  dedupeKey: REDUX_PERF_APP_KEY,
                }) satisfies OpenWindowPayload,
            },
          ]
        : []),
    ];

    return [
      {
        id: 'inventory.desktop',
        icons: [
          { id: 'new-chat', label: 'New Chat', icon: '💬' },
          ...debugIcons,
          ...cardIcons,
        ],
        menus: [
          {
            id: 'file',
            label: 'File',
            items: [
              { id: 'new-chat', label: 'New Chat', commandId: 'chat.new', shortcut: 'Ctrl+N' },
              {
                id: 'new-home',
                label: `New ${STACK.cards[STACK.homeCard]?.title ?? 'Home'} Window`,
                commandId: 'window.open.home',
              },
              { id: 'close-focused', label: 'Close Window', commandId: 'window.close-focused', shortcut: 'Ctrl+W' },
            ],
          },
          {
            id: 'cards',
            label: 'Cards',
            items: Object.keys(STACK.cards).map((cardId) => ({
              id: `open-${cardId}`,
              label: `${STACK.cards[cardId].icon ?? ''} ${STACK.cards[cardId].title ?? cardId}`.trim(),
              commandId: `window.open.card.${cardId}`,
            })),
          },
          {
            id: 'window',
            label: 'Window',
            items: [
              { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
              { id: 'cascade', label: 'Cascade Windows', commandId: 'window.cascade' },
            ],
          },
          ...(import.meta.env.DEV
            ? [
                {
                  id: 'debug',
                  label: 'Debug',
                  items: [
                    { id: 'redux-perf', label: '📈 Redux Perf', commandId: 'debug.redux-perf' },
                    { id: 'stacks-cards', label: '🔧 Stacks & Cards', commandId: 'debug.stacks' },
                  ],
                },
              ]
            : []),
        ],
        commands: [
          {
            id: 'inventory.chat.new',
            priority: 100,
            matches: (commandId) => commandId === 'chat.new' || commandId === 'icon.open.new-chat',
            run: (_commandId, ctx) => {
              ctx.dispatch(openWindow(buildChatWindowPayload()));
              return 'handled';
            },
          },
          {
            id: 'inventory.debug.stacks',
            priority: 100,
            matches: (commandId) => commandId === 'debug.stacks' || commandId === 'icon.open.runtime-debug',
            run: (_commandId, ctx) => {
              ctx.dispatch(openWindow({
                id: 'window:runtime-debug',
                title: '🔧 Stacks & Cards',
                icon: '🔧',
                bounds: { x: 80, y: 30, w: 560, h: 480 },
                content: { kind: 'app', appKey: 'runtime-card-debug' },
                dedupeKey: 'runtime-card-debug',
              }));
              return 'handled';
            },
          },
          {
            id: 'inventory.debug.redux-perf',
            priority: 100,
            matches: (commandId) => commandId === 'debug.redux-perf' || commandId === 'icon.open.redux-perf',
            run: (_commandId, ctx) => {
              ctx.dispatch(openWindow({
                id: 'window:redux-perf:dev',
                title: '📈 Redux Perf',
                icon: '📈',
                bounds: { x: 900, y: 40, w: 420, h: 320 },
                content: { kind: 'app', appKey: REDUX_PERF_APP_KEY },
                dedupeKey: REDUX_PERF_APP_KEY,
              }));
              return 'handled';
            },
          },
        ],
        startupWindows,
      },
    ];
  }, []);

  return (
    <DesktopShell
      stack={STACK}
      contributions={contributions}
      renderAppWindow={renderAppWindow}
    />
  );
}
