import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ArcBridgeState,
  ArcCommandFailurePayload,
  ArcCommandRecord,
  ArcCommandRequestPayload,
  ArcCommandSuccessPayload,
  ArcGameSnapshot,
  ArcSessionSnapshot,
} from './contracts';

const MAX_COMMAND_HISTORY = 250;
const MAX_RECENT_ERRORS = 100;

function nowIso() {
  return new Date().toISOString();
}

function pruneCommandHistory(state: ArcBridgeState) {
  if (state.commands.order.length <= MAX_COMMAND_HISTORY) {
    return;
  }

  const removeCount = state.commands.order.length - MAX_COMMAND_HISTORY;
  const toRemove = state.commands.order.slice(0, removeCount);
  for (const requestId of toRemove) {
    delete state.commands.byId[requestId];
  }
  state.commands.order = state.commands.order.slice(removeCount);
}

function upsertCommand(state: ArcBridgeState, record: ArcCommandRecord) {
  if (!state.commands.byId[record.requestId]) {
    state.commands.order.push(record.requestId);
  }

  state.commands.byId[record.requestId] = record;

  const runtimeSessionId = record.meta?.runtimeSessionId;
  if (runtimeSessionId) {
    state.lastCommandByRuntimeSession[runtimeSessionId] = record.requestId;
  }

  pruneCommandHistory(state);
}

const initialState: ArcBridgeState = {
  commands: {
    byId: {},
    order: [],
  },
  sessions: {},
  games: {},
  lastCommandByRuntimeSession: {},
  recentErrors: [],
};

export const arcCommandRequested = createAction<ArcCommandRequestPayload>('arc/command.request');
export const arcCommandStarted = createAction<
  Pick<ArcCommandRequestPayload, 'requestId' | 'meta'> & { startedAt?: string }
>('arc/command.started');
export const arcCommandSucceeded = createAction<ArcCommandSuccessPayload>('arc/command.succeeded');
export const arcCommandFailed = createAction<ArcCommandFailurePayload>('arc/command.failed');
export const arcSessionSnapshotUpserted = createAction<ArcSessionSnapshot>('arc/session.snapshot.upsert');
export const arcGameSnapshotUpserted = createAction<ArcGameSnapshot>('arc/game.snapshot.upsert');

const arcBridgeSlice = createSlice({
  name: 'arcBridge',
  initialState,
  reducers: {
    clearArcBridgeState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(arcCommandRequested, (state, action) => {
        const requestedAt = nowIso();
        upsertCommand(state, {
          requestId: action.payload.requestId,
          op: action.payload.op,
          args: action.payload.args,
          status: 'requested',
          requestedAt,
          meta: action.payload.meta,
        });
      })
      .addCase(arcCommandStarted, (state, action) => {
        const record = state.commands.byId[action.payload.requestId];
        if (!record) {
          return;
        }

        record.status = 'started';
        record.startedAt = action.payload.startedAt ?? nowIso();
        if (action.payload.meta) {
          record.meta = { ...record.meta, ...action.payload.meta };
        }
      })
      .addCase(arcCommandSucceeded, (state, action) => {
        const record = state.commands.byId[action.payload.requestId];
        if (!record) {
          return;
        }

        record.status = 'succeeded';
        record.completedAt = nowIso();
        record.result = action.payload.result;
        record.error = undefined;
        if (action.payload.meta) {
          record.meta = { ...record.meta, ...action.payload.meta };
        }
      })
      .addCase(arcCommandFailed, (state, action) => {
        const record = state.commands.byId[action.payload.requestId];
        if (!record) {
          return;
        }

        record.status = 'failed';
        record.completedAt = nowIso();
        record.error = action.payload.error;
        if (action.payload.meta) {
          record.meta = { ...record.meta, ...action.payload.meta };
        }

        state.recentErrors.push({
          requestId: record.requestId,
          op: record.op,
          timestamp: record.completedAt,
          code: action.payload.error.code,
          message: action.payload.error.message,
          status: action.payload.error.status,
          details: action.payload.error.details,
          meta: record.meta,
        });

        if (state.recentErrors.length > MAX_RECENT_ERRORS) {
          state.recentErrors.splice(0, state.recentErrors.length - MAX_RECENT_ERRORS);
        }
      })
      .addCase(arcSessionSnapshotUpserted, (state, action) => {
        state.sessions[action.payload.sessionId] = action.payload;
      })
      .addCase(arcGameSnapshotUpserted, (state, action) => {
        state.games[action.payload.sessionId] = action.payload;
      });
  },
});

export const { clearArcBridgeState } = arcBridgeSlice.actions;

export const arcBridgeReducer = arcBridgeSlice.reducer;

interface RuntimeIntentMeta {
  source?: string;
  sessionId?: string;
  cardId?: string;
}

interface RuntimeIntentLike {
  type: string;
  payload?: unknown;
  meta?: RuntimeIntentMeta;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRuntimeSource(source: unknown): 'plugin-runtime' | 'arc-ui' | 'debug' | undefined {
  if (source === 'plugin-runtime' || source === 'arc-ui' || source === 'debug') {
    return source;
  }
  return undefined;
}

function buildMetaFromRuntimeIntent(action: RuntimeIntentLike) {
  const runtimeMeta = action.meta;
  if (!runtimeMeta) {
    return undefined;
  }

  return {
    source: toRuntimeSource(runtimeMeta.source),
    sessionId: runtimeMeta.sessionId,
    cardId: runtimeMeta.cardId,
  };
}

export function mapRuntimeIntentToArcCommandRequested(
  action: RuntimeIntentLike,
): PayloadAction<ArcCommandRequestPayload> | null {
  if (action.type !== 'arc/command.request') {
    return null;
  }

  if (!isRecord(action.payload)) {
    return null;
  }

  const requestId = action.payload.requestId;
  const op = action.payload.op;
  const args = action.payload.args;

  if (typeof requestId !== 'string' || requestId.length === 0) {
    return null;
  }

  if (typeof op !== 'string') {
    return null;
  }

  if (!isRecord(args)) {
    return null;
  }

  return arcCommandRequested({
    requestId,
    op: op as ArcCommandRequestPayload['op'],
    args,
    meta: {
      ...buildMetaFromRuntimeIntent(action),
      ...(isRecord(action.payload.meta) ? action.payload.meta : {}),
    },
  });
}
