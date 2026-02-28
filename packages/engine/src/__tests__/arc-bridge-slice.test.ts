import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import {
  arcBridgeReducer,
  arcCommandFailed,
  arcCommandRequested,
  arcCommandStarted,
  arcCommandSucceeded,
  arcGameSnapshotUpserted,
  arcSessionSnapshotUpserted,
  mapRuntimeIntentToArcCommandRequested,
  validateArcCommandRequestPayload,
} from '../features/arcBridge';

function createStore() {
  return configureStore({
    reducer: {
      arcBridge: arcBridgeReducer,
    },
  });
}

describe('arcBridge reducer', () => {
  it('tracks command lifecycle and snapshots', () => {
    const store = createStore();

    store.dispatch(
      arcCommandRequested({
        op: 'create-session',
        requestId: 'req-1',
        args: { gameId: 'grid-1' },
        meta: { runtimeSessionId: 'runtime-1', source: 'plugin-runtime' },
      }),
    );

    store.dispatch(
      arcCommandStarted({
        requestId: 'req-1',
      }),
    );

    store.dispatch(
      arcSessionSnapshotUpserted({
        sessionId: 'session-1',
        gameId: 'grid-1',
        state: { status: 'ready' },
        updatedAt: '2026-02-28T00:00:00.000Z',
      }),
    );

    store.dispatch(
      arcGameSnapshotUpserted({
        sessionId: 'session-1',
        gameId: 'grid-1',
        frame: { step: 1 },
        state: 'PLAYING',
        updatedAt: '2026-02-28T00:00:01.000Z',
      }),
    );

    store.dispatch(
      arcCommandSucceeded({
        requestId: 'req-1',
        result: { sessionId: 'session-1' },
      }),
    );

    const state = store.getState().arcBridge;
    expect(state.commands.byId['req-1'].status).toBe('succeeded');
    expect(state.commands.byId['req-1'].result).toEqual({ sessionId: 'session-1' });
    expect(state.lastCommandByRuntimeSession['runtime-1']).toBe('req-1');
    expect(state.sessions['session-1'].gameId).toBe('grid-1');
    expect(state.games['session-1'].state).toBe('PLAYING');
  });

  it('stores failures in command records and recent error ring', () => {
    const store = createStore();

    store.dispatch(
      arcCommandRequested({
        op: 'perform-action',
        requestId: 'req-fail',
        args: { sessionId: 'session-1' },
      }),
    );

    store.dispatch(
      arcCommandFailed({
        requestId: 'req-fail',
        error: {
          code: 'http_error',
          message: 'Request failed',
          status: 500,
        },
      }),
    );

    const state = store.getState().arcBridge;
    expect(state.commands.byId['req-fail'].status).toBe('failed');
    expect(state.commands.byId['req-fail'].error?.status).toBe(500);
    expect(state.recentErrors).toHaveLength(1);
    expect(state.recentErrors[0].requestId).toBe('req-fail');
  });
});

describe('arc command payload validation', () => {
  it('accepts valid payload', () => {
    const validation = validateArcCommandRequestPayload({
      op: 'create-session',
      requestId: 'req-10',
      args: { gameId: 'g-1' },
      meta: { runtimeSessionId: 'runtime-10' },
    });

    expect(validation.ok).toBe(true);
  });

  it('rejects invalid payload', () => {
    const validation = validateArcCommandRequestPayload({
      op: 'unknown-op',
      requestId: '',
      args: 'bad',
    });

    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.reason).toBe('invalid_op');
    }
  });

  it('maps runtime action into arc command request action', () => {
    const mapped = mapRuntimeIntentToArcCommandRequested({
      type: 'arc/command.request',
      payload: {
        op: 'reset-game',
        requestId: 'req-map',
        args: { sessionId: 's-1', gameId: 'g-1' },
      },
      meta: {
        source: 'plugin-runtime',
        sessionId: 'runtime-123',
        cardId: 'home',
      },
    });

    expect(mapped).not.toBeNull();
    expect(mapped?.type).toBe('arc/command.request');
    expect(mapped?.payload.meta?.sessionId).toBe('runtime-123');
    expect(mapped?.payload.meta?.cardId).toBe('home');
  });
});
