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
  dispatch?: Dispatch<UnknownAction>;
  adapters?: ProjectionPipelineAdapter[];
  getAdapters?: () => ProjectionPipelineAdapter[];
  waitForHydration?: boolean;
  onRawEnvelope?: (envelope: SemEnvelope) => void;
  onStatus?: (status: ConversationConnectionStatus) => void;
  onError?: (error: string) => void;
}

function seqAsBigInt(value: unknown): bigint | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      return BigInt(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function compareBufferedEnvelopes(a: SemEnvelope, b: SemEnvelope): number {
  const aStream = streamId(a.event?.stream_id);
  const bStream = streamId(b.event?.stream_id);
  if (aStream && bStream) {
    if (aStream < bStream) return -1;
    if (aStream > bStream) return 1;
  }

  const aSeq = seqAsBigInt(a.event?.seq);
  const bSeq = seqAsBigInt(b.event?.seq);
  if (aSeq !== undefined && bSeq !== undefined) {
    if (aSeq < bSeq) return -1;
    if (aSeq > bSeq) return 1;
  }
  if (aSeq !== undefined && bSeq === undefined) return -1;
  if (aSeq === undefined && bSeq !== undefined) return 1;
  return 0;
}

export function createConversationRuntime(
  options: CreateConversationRuntimeOptions,
): ConversationRuntime {
  const {
    conversationId,
    semRegistry,
    createClient,
    dispatch: externalDispatch,
    adapters = [],
    getAdapters,
    waitForHydration = false,
    onRawEnvelope,
    onStatus,
    onError,
  } = options;

  let disposed = false;
  let connectionClaims = 0;
  let hydrated = !waitForHydration;
  let buffered: SemEnvelope[] = [];
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

  const pipelineDispatch: Dispatch<UnknownAction> = (action) => {
    timelineDispatch(action);
    externalDispatch?.(action);
    return action;
  };

  const activeAdapters = (): ProjectionPipelineAdapter[] => {
    return getAdapters?.() ?? adapters;
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

  const projectEnvelope = (envelope: SemEnvelope) => {
    projectSemEnvelope({
      conversationId,
      dispatch: pipelineDispatch,
      envelope,
      semRegistry,
      adapters: activeAdapters(),
    });
  };

  const replayBuffered = () => {
    if (buffered.length === 0) return;
    const replay = [...buffered].sort(compareBufferedEnvelopes);
    buffered = [];
    for (const envelope of replay) {
      projectEnvelope(envelope);
    }
  };

  const ensureConnected = () => {
    ensureClient();
    runtime.setConnectionStatus('connecting');
    client?.connect();
  };

  const maybeDisconnect = () => {
    if (connectionClaims > 0) return;
    client?.close();
    client = null;
    runtime.setConnectionStatus('closed');
  };

  const ensureClient = () => {
    if (client) return;
    client = createClient({
      onEnvelope: (envelope) => {
        runtime.ingestEnvelope(envelope);
      },
      onRawEnvelope: (envelope) => {
        onRawEnvelope?.(envelope);
      },
      onSnapshot: (snapshot) => {
        runtime.hydrateSnapshot(snapshot);
      },
      onStatus: (status) => {
        runtime.setConnectionStatus(normalizeConnectionStatus(status));
      },
      onError: (error) => {
        onError?.(error);
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
        ensureConnected();
      }

      return () => {
        if (released || disposed) return;
        released = true;
        connectionClaims = Math.max(0, connectionClaims - 1);
        maybeDisconnect();
      };
    },
    ingestEnvelope: (envelope) => {
      if (disposed) return;
      applyEnvelopeCursor(envelope);
      if (!hydrated) {
        buffered.push(envelope);
        return;
      }
      projectEnvelope(envelope);
    },
    hydrateSnapshot: (snapshot: TimelineSnapshotPayload) => {
      if (disposed) return;
      hydrateTimelineSnapshot({
        conversationId,
        dispatch: pipelineDispatch,
        semRegistry,
        snapshot,
        adapters: activeAdapters(),
      });
      const version = normalizeSeq(snapshot.version);
      hydrated = true;
      replayBuffered();
      if (version && state.connection.hydratedVersion !== version) {
        setState({
          ...state,
          connection: {
            ...state.connection,
            hydratedVersion: version,
          },
        });
      }
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
      onStatus?.(status);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      connectionClaims = 0;
      hydrated = true;
      buffered = [];
      client?.close();
      client = null;
      listeners.clear();
    },
  };

  return runtime;
}
