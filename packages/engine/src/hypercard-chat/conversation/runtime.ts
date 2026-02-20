import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import type { SemRegistry } from '../sem/registry';
import type { SemEnvelope } from '../sem/types';
import {
  hydrateTimelineSnapshot,
  type ProjectionPipelineAdapter,
  projectSemEnvelope,
  type TimelineSnapshotPayload,
} from '../runtime/projectionPipeline';
import { timelineReducer } from '../timeline/timelineSlice';
import type {
  ConversationConnectionStatus,
  ConversationRuntime,
  ConversationRuntimeClient,
  ConversationRuntimeClientFactory,
  ConversationRuntimeListener,
  ConversationRuntimeState,
} from './types';

const EMPTY_IDS: string[] = [];
const EMPTY_BY_ID: ConversationRuntimeState['timeline']['byId'] = {};

function normalizeConnectionStatus(value: string): ConversationConnectionStatus {
  if (value === 'idle') return 'idle';
  if (value === 'connecting') return 'connecting';
  if (value === 'connected') return 'connected';
  if (value === 'closed') return 'closed';
  if (value === 'error') return 'error';
  return 'error';
}

function normalizeSeq(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

function streamId(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

export interface CreateConversationRuntimeOptions {
  conversationId: string;
  semRegistry: SemRegistry;
  createClient: ConversationRuntimeClientFactory;
  adapters?: ProjectionPipelineAdapter[];
}

export function createConversationRuntime(
  options: CreateConversationRuntimeOptions,
): ConversationRuntime {
  const {
    conversationId,
    semRegistry,
    createClient,
    adapters = [],
  } = options;

  let disposed = false;
  let connectionClaims = 0;
  let client: ConversationRuntimeClient | null = null;
  const listeners = new Set<ConversationRuntimeListener>();
  let timelineState = timelineReducer(undefined, { type: '@@INIT' } as UnknownAction);

  let state: ConversationRuntimeState = {
    conversationId,
    connection: { status: 'idle' },
    timeline: {
      ids: EMPTY_IDS,
      byId: EMPTY_BY_ID,
    },
    meta: {},
  };

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (next: ConversationRuntimeState) => {
    if (next === state) return;
    state = next;
    notify();
  };

  const syncTimelineFromReducer = () => {
    const conversation = timelineState.conversations[conversationId];
    const nextIds = conversation?.order ?? EMPTY_IDS;
    const nextById = conversation?.byId ?? EMPTY_BY_ID;

    if (state.timeline.ids === nextIds && state.timeline.byId === nextById) {
      return;
    }

    setState({
      ...state,
      timeline: {
        ids: nextIds,
        byId: nextById,
      },
    });
  };

  const timelineDispatch: Dispatch<UnknownAction> = (action) => {
    timelineState = timelineReducer(timelineState, action as UnknownAction);
    syncTimelineFromReducer();
    return action;
  };

  const applyEnvelopeCursor = (envelope: SemEnvelope) => {
    const seq = normalizeSeq(envelope.event?.seq);
    const nextStreamId = streamId(envelope.event?.stream_id);
    const hasSeqChange = seq && state.connection.lastSeq !== seq;
    const hasStreamChange =
      nextStreamId && state.connection.lastStreamId !== nextStreamId;

    if (!hasSeqChange && !hasStreamChange) {
      return;
    }

    setState({
      ...state,
      connection: {
        ...state.connection,
        lastSeq: seq ?? state.connection.lastSeq,
        lastStreamId: nextStreamId ?? state.connection.lastStreamId,
      },
    });
  };

  const ensureClient = () => {
    if (client) return;
    client = createClient({
      onEnvelope: (envelope) => {
        runtime.ingestEnvelope(envelope);
      },
      onRawEnvelope: () => {
        // Reserved for debug/event-viewer hooks in later phases.
      },
      onSnapshot: (snapshot) => {
        runtime.hydrateSnapshot(snapshot);
      },
      onStatus: (status) => {
        runtime.setConnectionStatus(normalizeConnectionStatus(status));
      },
      onError: (error) => {
        runtime.setConnectionStatus('error', error);
      },
    });
  };

  const runtime: ConversationRuntime = {
    getState: () => state,
    subscribe: (listener) => {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    claimConnection: () => {
      if (disposed) return () => {};

      let released = false;
      connectionClaims += 1;
      if (connectionClaims === 1) {
        ensureClient();
        runtime.setConnectionStatus('connecting');
        client?.connect();
      }

      return () => {
        if (released || disposed) return;
        released = true;
        connectionClaims = Math.max(0, connectionClaims - 1);
        if (connectionClaims === 0) {
          client?.close();
          client = null;
          runtime.setConnectionStatus('closed');
        }
      };
    },
    ingestEnvelope: (envelope) => {
      if (disposed) return;
      applyEnvelopeCursor(envelope);
      projectSemEnvelope({
        conversationId,
        dispatch: timelineDispatch,
        envelope,
        semRegistry,
        adapters,
      });
    },
    hydrateSnapshot: (snapshot: TimelineSnapshotPayload) => {
      if (disposed) return;
      hydrateTimelineSnapshot({
        conversationId,
        dispatch: timelineDispatch,
        semRegistry,
        snapshot,
        adapters,
      });
      const version = normalizeSeq(snapshot.version);
      if (!version || state.connection.hydratedVersion === version) return;

      setState({
        ...state,
        connection: {
          ...state.connection,
          hydratedVersion: version,
        },
      });
    },
    setConnectionStatus: (status, error) => {
      if (disposed) return;
      if (
        state.connection.status === status &&
        state.connection.error === error
      ) {
        return;
      }

      setState({
        ...state,
        connection: {
          ...state.connection,
          status,
          error,
        },
      });
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      connectionClaims = 0;
      client?.close();
      client = null;
      listeners.clear();
    },
  };

  return runtime;
}

