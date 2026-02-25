import type { ChatConnectionStatus } from '../state/chatSessionSlice';

export type PendingAiTurnPhase =
  | 'idle'
  | 'waiting_for_user_append'
  | 'waiting_for_ai_signal'
  | 'ai_active'
  | 'error';

export interface PendingAiTurnState {
  phase: PendingAiTurnPhase;
  baselineIndex: number;
  userEntityIndex: number | null;
  reason?: string;
}

export interface PendingAiTurnEntity {
  id: string;
  kind: string;
  props: unknown;
}

export interface PendingAiTurnSnapshot {
  entities: PendingAiTurnEntity[];
  connectionStatus: ChatConnectionStatus;
}

function messageRole(entity: PendingAiTurnEntity): string {
  if (!entity.props || typeof entity.props !== 'object' || Array.isArray(entity.props)) {
    return '';
  }
  return String((entity.props as Record<string, unknown>).role ?? '')
    .trim()
    .toLowerCase();
}

function isUserMessage(entity: PendingAiTurnEntity): boolean {
  return entity.kind === 'message' && messageRole(entity) === 'user';
}

function isAiSignal(entity: PendingAiTurnEntity): boolean {
  if (entity.kind !== 'message') {
    return true;
  }
  return messageRole(entity) !== 'user';
}

function findIndexAfter(
  entities: PendingAiTurnEntity[],
  startIndex: number,
  predicate: (entity: PendingAiTurnEntity) => boolean
): number {
  const safeStart = Math.max(0, startIndex);
  for (let i = safeStart; i < entities.length; i += 1) {
    if (predicate(entities[i])) {
      return i;
    }
  }
  return -1;
}

export function createPendingAiTurnIdleState(reason = 'idle'): PendingAiTurnState {
  return {
    phase: 'idle',
    baselineIndex: 0,
    userEntityIndex: null,
    reason,
  };
}

export function beginPendingAiTurn(entityCount: number): PendingAiTurnState {
  return {
    phase: 'waiting_for_user_append',
    baselineIndex: Math.max(0, entityCount),
    userEntityIndex: null,
    reason: 'submit',
  };
}

export function markPendingAiTurnError(reason: string): PendingAiTurnState {
  return {
    phase: 'error',
    baselineIndex: 0,
    userEntityIndex: null,
    reason,
  };
}

export function shouldShowPendingAiPlaceholder(state: PendingAiTurnState): boolean {
  return state.phase === 'waiting_for_ai_signal';
}

export function advancePendingAiTurn(
  state: PendingAiTurnState,
  snapshot: PendingAiTurnSnapshot
): PendingAiTurnState {
  if (state.phase === 'idle' || state.phase === 'ai_active') {
    return state;
  }

  if (snapshot.connectionStatus === 'error') {
    return markPendingAiTurnError('connection-error');
  }

  if (state.phase === 'error') {
    return createPendingAiTurnIdleState('error-ack');
  }

  if (state.phase === 'waiting_for_user_append') {
    const userIndex = findIndexAfter(snapshot.entities, state.baselineIndex, isUserMessage);
    if (userIndex < 0) {
      return state;
    }
    return {
      phase: 'waiting_for_ai_signal',
      baselineIndex: state.baselineIndex,
      userEntityIndex: userIndex,
      reason: 'user-appended',
    };
  }

  if (state.phase === 'waiting_for_ai_signal') {
    const aiStart = (state.userEntityIndex ?? state.baselineIndex) + 1;
    const aiIndex = findIndexAfter(snapshot.entities, aiStart, isAiSignal);
    if (aiIndex < 0) {
      return state;
    }
    return {
      phase: 'ai_active',
      baselineIndex: state.baselineIndex,
      userEntityIndex: state.userEntityIndex,
      reason: `ai-signal:${snapshot.entities[aiIndex]?.kind ?? 'unknown'}`,
    };
  }

  return state;
}

