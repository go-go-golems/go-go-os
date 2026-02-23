import type { ConfirmRuntimeState } from './confirmRuntimeSlice';

export interface ConfirmRuntimeRootLike {
  confirmRuntime: ConfirmRuntimeState;
}

export function selectConfirmRuntime(state: ConfirmRuntimeRootLike): ConfirmRuntimeState {
  return state.confirmRuntime;
}

export function selectConfirmConnected(state: ConfirmRuntimeRootLike): boolean {
  return state.confirmRuntime.connected;
}

export function selectConfirmLastError(state: ConfirmRuntimeRootLike): string | undefined {
  return state.confirmRuntime.lastError;
}

export function selectActiveConfirmRequests(state: ConfirmRuntimeRootLike) {
  const runtime = state.confirmRuntime;
  return runtime.activeOrder.map((id) => runtime.activeById[id]).filter((value) => value !== undefined);
}

export function selectActiveConfirmRequestById(state: ConfirmRuntimeRootLike, requestId: string) {
  return state.confirmRuntime.activeById[requestId];
}
