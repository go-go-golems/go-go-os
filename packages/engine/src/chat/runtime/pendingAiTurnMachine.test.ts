import { describe, expect, it } from 'vitest';
import {
  advancePendingAiTurn,
  beginPendingAiTurn,
  createPendingAiTurnIdleState,
  markPendingAiTurnError,
  shouldShowPendingAiPlaceholder,
  type PendingAiTurnEntity,
} from './pendingAiTurnMachine';

function msg(id: string, role: string, content = ''): PendingAiTurnEntity {
  return {
    id,
    kind: 'message',
    props: {
      role,
      content,
      streaming: false,
    },
  };
}

function logEntity(id: string): PendingAiTurnEntity {
  return {
    id,
    kind: 'log',
    props: { message: 'trace' },
  };
}

describe('pendingAiTurnMachine', () => {
  it('does not show pending placeholder before user append is visible', () => {
    const state = beginPendingAiTurn(2);
    expect(state.phase).toBe('waiting_for_user_append');
    expect(shouldShowPendingAiPlaceholder(state)).toBe(false);

    const next = advancePendingAiTurn(state, {
      entities: [msg('older-user', 'user', 'one'), msg('older-ai', 'assistant', 'two')],
      connectionStatus: 'connected',
    });
    expect(next).toBe(state);
    expect(shouldShowPendingAiPlaceholder(next)).toBe(false);
  });

  it('shows pending placeholder after submitted user message append', () => {
    const state = beginPendingAiTurn(0);
    const next = advancePendingAiTurn(state, {
      entities: [msg('user-new', 'user', 'hello')],
      connectionStatus: 'connected',
    });
    expect(next.phase).toBe('waiting_for_ai_signal');
    expect(next.userEntityIndex).toBe(0);
    expect(shouldShowPendingAiPlaceholder(next)).toBe(true);
  });

  it('clears pending placeholder when first AI message arrives after user append', () => {
    const afterUser = advancePendingAiTurn(beginPendingAiTurn(0), {
      entities: [msg('user-new', 'user', 'hello')],
      connectionStatus: 'connected',
    });
    const next = advancePendingAiTurn(afterUser, {
      entities: [msg('user-new', 'user', 'hello'), msg('assistant-new', 'assistant', 'hi')],
      connectionStatus: 'connected',
    });
    expect(next.phase).toBe('ai_active');
    expect(shouldShowPendingAiPlaceholder(next)).toBe(false);
  });

  it('treats non-message timeline entities after user append as AI signal', () => {
    const afterUser = advancePendingAiTurn(beginPendingAiTurn(0), {
      entities: [msg('user-new', 'user', 'hello')],
      connectionStatus: 'connected',
    });
    const next = advancePendingAiTurn(afterUser, {
      entities: [msg('user-new', 'user', 'hello'), logEntity('log-1')],
      connectionStatus: 'connected',
    });
    expect(next.phase).toBe('ai_active');
    expect(shouldShowPendingAiPlaceholder(next)).toBe(false);
  });

  it('ignores user-echo and stays pending until AI-side signal appears', () => {
    const afterUser = advancePendingAiTurn(beginPendingAiTurn(0), {
      entities: [msg('user-new', 'user', 'hello')],
      connectionStatus: 'connected',
    });

    const withEcho = advancePendingAiTurn(afterUser, {
      entities: [msg('user-new', 'user', 'hello'), msg('user-echo', 'user', 'hello')],
      connectionStatus: 'connected',
    });
    expect(withEcho.phase).toBe('waiting_for_ai_signal');
    expect(shouldShowPendingAiPlaceholder(withEcho)).toBe(true);

    const withAi = advancePendingAiTurn(withEcho, {
      entities: [msg('user-new', 'user', 'hello'), msg('user-echo', 'user', 'hello'), msg('assistant', 'assistant', 'hi')],
      connectionStatus: 'connected',
    });
    expect(withAi.phase).toBe('ai_active');
  });

  it('enters error on connection error and then settles to idle on next reconcile', () => {
    const waiting = beginPendingAiTurn(0);
    const errored = advancePendingAiTurn(waiting, {
      entities: [],
      connectionStatus: 'error',
    });
    expect(errored.phase).toBe('error');
    expect(shouldShowPendingAiPlaceholder(errored)).toBe(false);

    const settled = advancePendingAiTurn(errored, {
      entities: [],
      connectionStatus: 'connected',
    });
    expect(settled.phase).toBe('idle');
  });

  it('creates explicit idle and error helper states', () => {
    const idle = createPendingAiTurnIdleState('manual');
    expect(idle.phase).toBe('idle');
    expect(idle.reason).toBe('manual');

    const error = markPendingAiTurnError('send-error');
    expect(error.phase).toBe('error');
    expect(error.reason).toBe('send-error');
  });
});

