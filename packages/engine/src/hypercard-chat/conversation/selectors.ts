import { useSyncExternalStore } from 'react';
import { useConversationRuntime } from './context';
import type {
  ConversationRuntimeMeta,
  ConversationRuntimeState,
} from './types';
import type { TimelineEntity } from '../timeline/types';

function useConversationSnapshot(conversationId: string): ConversationRuntimeState {
  const runtime = useConversationRuntime(conversationId);
  return useSyncExternalStore(
    runtime.subscribe,
    runtime.getState,
    runtime.getState,
  );
}

export function useConversationConnection(conversationId: string): {
  status: ConversationRuntimeState['connection']['status'];
  error?: string;
} {
  const snapshot = useConversationSnapshot(conversationId);
  return {
    status: snapshot.connection.status,
    error: snapshot.connection.error,
  };
}

export function useTimelineIds(conversationId: string): string[] {
  return useConversationSnapshot(conversationId).timeline.ids;
}

export function useTimelineEntity(
  conversationId: string,
  entityId: string,
): TimelineEntity | undefined {
  return useConversationSnapshot(conversationId).timeline.byId[entityId];
}

export function useTimelineEntities(conversationId: string): TimelineEntity[] {
  const snapshot = useConversationSnapshot(conversationId);
  return snapshot.timeline.ids
    .map((entityId) => snapshot.timeline.byId[entityId])
    .filter((entity): entity is TimelineEntity => Boolean(entity));
}

export function useConversationMeta<T>(
  conversationId: string,
  select: (meta: ConversationRuntimeMeta) => T,
): T {
  return select(useConversationSnapshot(conversationId).meta);
}
