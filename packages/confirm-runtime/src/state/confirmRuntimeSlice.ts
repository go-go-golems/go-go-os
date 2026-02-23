import type { ConfirmRealtimeEvent, ConfirmRequest, ConfirmRequestCompletion } from '../types';

export interface ConfirmRuntimeState {
  connected: boolean;
  activeById: Record<string, ConfirmRequest>;
  activeOrder: string[];
  completionsById: Record<string, ConfirmRequestCompletion>;
  lastError?: string;
}

export const initialConfirmRuntimeState: ConfirmRuntimeState = {
  connected: false,
  activeById: {},
  activeOrder: [],
  completionsById: {},
};

export type ConfirmRuntimeAction =
  | { type: 'confirmRuntime/setConnectionState'; payload: boolean }
  | { type: 'confirmRuntime/setLastError'; payload: string | undefined }
  | { type: 'confirmRuntime/upsertRequest'; payload: ConfirmRequest }
  | {
      type: 'confirmRuntime/completeRequestById';
      payload: { requestId: string; completedAt: string; output?: Record<string, unknown> };
    }
  | { type: 'confirmRuntime/removeRequest'; payload: string }
  | { type: 'confirmRuntime/clearCompletions' }
  | { type: 'confirmRuntime/applyRealtimeEvent'; payload: ConfirmRealtimeEvent };

function upsertActiveRequest(state: ConfirmRuntimeState, request: ConfirmRequest) {
  state.activeById[request.id] = request;
  if (!state.activeOrder.includes(request.id)) {
    state.activeOrder.push(request.id);
  }
}

function completeRequest(state: ConfirmRuntimeState, requestId: string, completedAt: string, output?: Record<string, unknown>) {
  delete state.activeById[requestId];
  state.activeOrder = state.activeOrder.filter((id) => id !== requestId);
  state.completionsById[requestId] = { requestId, completedAt, output };
}

export function setConnectionState(payload: boolean): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/setConnectionState', payload };
}

export function setLastError(payload: string | undefined): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/setLastError', payload };
}

export function upsertRequest(payload: ConfirmRequest): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/upsertRequest', payload };
}

export function completeRequestById(payload: {
  requestId: string;
  completedAt: string;
  output?: Record<string, unknown>;
}): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/completeRequestById', payload };
}

export function removeRequest(payload: string): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/removeRequest', payload };
}

export function clearCompletions(): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/clearCompletions' };
}

export function applyRealtimeEvent(payload: ConfirmRealtimeEvent): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/applyRealtimeEvent', payload };
}

export function confirmRuntimeReducer(
  state: ConfirmRuntimeState = initialConfirmRuntimeState,
  action: ConfirmRuntimeAction,
): ConfirmRuntimeState {
  const nextState: ConfirmRuntimeState = {
    ...state,
    activeById: { ...state.activeById },
    activeOrder: [...state.activeOrder],
    completionsById: { ...state.completionsById },
  };

  switch (action.type) {
    case 'confirmRuntime/setConnectionState': {
      nextState.connected = action.payload;
      if (action.payload) {
        nextState.lastError = undefined;
      }
      return nextState;
    }
    case 'confirmRuntime/setLastError': {
      nextState.lastError = action.payload;
      return nextState;
    }
    case 'confirmRuntime/upsertRequest': {
      upsertActiveRequest(nextState, action.payload);
      return nextState;
    }
    case 'confirmRuntime/completeRequestById': {
      completeRequest(nextState, action.payload.requestId, action.payload.completedAt, action.payload.output);
      return nextState;
    }
    case 'confirmRuntime/removeRequest': {
      delete nextState.activeById[action.payload];
      nextState.activeOrder = nextState.activeOrder.filter((id) => id !== action.payload);
      return nextState;
    }
    case 'confirmRuntime/clearCompletions': {
      nextState.completionsById = {};
      return nextState;
    }
    case 'confirmRuntime/applyRealtimeEvent': {
      const event = action.payload;
      if (event.type === 'new_request' || event.type === 'request_updated') {
        if (event.request) {
          upsertActiveRequest(nextState, event.request);
        }
        return nextState;
      }

      const completedAt = event.completedAt ?? new Date().toISOString();
      if (event.requestId) {
        completeRequest(nextState, event.requestId, completedAt, event.output);
        return nextState;
      }
      if (event.request?.id) {
        completeRequest(nextState, event.request.id, completedAt, event.output);
      }
      return nextState;
    }
    default:
      return state;
  }
}
