import type { SemEnvelope } from '../sem/types';
import type { TimelineSnapshotPayload } from '../runtime/projectionPipeline';
import type { TimelineEntity } from '../timeline/types';

export type ConversationConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'closed'
  | 'error';

export interface ConversationRuntimeMeta {
  modelName?: string;
  streamStartTime?: number;
  streamOutputTokens?: number;
  turnStats?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
    durationMs?: number;
    tps?: number;
  };
  lastError?: string;
}

export interface ConversationRuntimeState {
  conversationId: string;
  connection: {
    status: ConversationConnectionStatus;
    error?: string;
    lastSeq?: string;
    lastStreamId?: string;
    hydratedVersion?: string;
  };
  timeline: {
    ids: string[];
    byId: Record<string, TimelineEntity>;
  };
  meta: ConversationRuntimeMeta;
}

export interface ConversationRuntimeClientHandlers {
  onRawEnvelope?: (envelope: SemEnvelope) => void;
  onEnvelope: (envelope: SemEnvelope) => void;
  onSnapshot?: (snapshot: TimelineSnapshotPayload) => void;
  onStatus?: (status: string) => void;
  onError?: (error: string) => void;
}

export interface ConversationRuntimeClient {
  connect: () => void;
  close: () => void;
}

export type ConversationRuntimeClientFactory = (
  handlers: ConversationRuntimeClientHandlers,
) => ConversationRuntimeClient;

export type ConversationRuntimeListener = () => void;

export interface ConversationRuntime {
  getState: () => ConversationRuntimeState;
  subscribe: (listener: ConversationRuntimeListener) => () => void;
  claimConnection: () => () => void;
  ingestEnvelope: (envelope: SemEnvelope) => void;
  hydrateSnapshot: (snapshot: TimelineSnapshotPayload) => void;
  setConnectionStatus: (status: ConversationConnectionStatus, error?: string) => void;
  dispose: () => void;
}

export type ConversationRuntimeFactory = (
  conversationId: string,
) => ConversationRuntime;

export interface ConversationManager {
  getRuntime: (conversationId: string) => ConversationRuntime;
  releaseRuntime: (conversationId: string) => void;
}

