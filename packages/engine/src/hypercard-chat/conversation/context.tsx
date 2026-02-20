import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { ConversationManager, ConversationRuntime } from './types';

const ConversationManagerContext = createContext<ConversationManager | null>(null);

export interface ConversationManagerProviderProps {
  manager: ConversationManager;
  children?: ReactNode;
}

export function ConversationManagerProvider({
  manager,
  children,
}: ConversationManagerProviderProps) {
  return (
    <ConversationManagerContext.Provider value={manager}>
      {children}
    </ConversationManagerContext.Provider>
  );
}

export function useConversationManager(): ConversationManager {
  const manager = useContext(ConversationManagerContext);
  if (!manager) {
    throw new Error(
      'ConversationManagerProvider is missing. Wrap this subtree with <ConversationManagerProvider />.',
    );
  }
  return manager;
}

export function useConversationRuntime(conversationId: string): ConversationRuntime {
  const manager = useConversationManager();
  const runtime = useMemo(
    () => manager.getRuntime(conversationId),
    [manager, conversationId],
  );

  useEffect(() => {
    return () => {
      manager.releaseRuntime(conversationId);
    };
  }, [manager, conversationId]);

  return runtime;
}

