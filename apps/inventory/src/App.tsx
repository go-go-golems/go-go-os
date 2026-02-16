import { DesktopShell, openWindow, type CardStackDefinition } from '@hypercard/engine';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { InventoryChatAssistantWindow } from './chat/InventoryChatAssistantWindow';
import { STACK } from './domain/stack';

const CHAT_APP_KEY = 'inventory-chat-assistant';

function cloneStackDefinition(stack: CardStackDefinition): CardStackDefinition {
  return {
    ...stack,
    plugin: { ...stack.plugin },
    cards: { ...stack.cards },
  };
}

export function App() {
  const dispatch = useDispatch();
  const stackRef = useRef<CardStackDefinition>(cloneStackDefinition(STACK));

  useEffect(() => {
    dispatch(
      openWindow({
        id: 'window:inventory-chat-assistant',
        title: 'Inventory Chat',
        icon: 'AI',
        bounds: { x: 520, y: 20, w: 520, h: 460 },
        content: { kind: 'app', appKey: CHAT_APP_KEY },
        dedupeKey: CHAT_APP_KEY,
      }),
    );
  }, [dispatch]);

  const renderAppWindow = useCallback((appKey: string) => {
    if (appKey === CHAT_APP_KEY) {
      return <InventoryChatAssistantWindow stack={stackRef.current} />;
    }
    return null;
  }, []);

  return <DesktopShell stack={stackRef.current} renderAppWindow={renderAppWindow} />;
}
