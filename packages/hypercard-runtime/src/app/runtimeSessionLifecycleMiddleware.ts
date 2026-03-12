import { createListenerMiddleware } from '@reduxjs/toolkit';
import { closeWindow, type WindowInstance } from '@hypercard/engine/desktop-core';
import { removeRuntimeSession } from '../features/runtimeSessions';
import { DEFAULT_RUNTIME_SESSION_MANAGER } from '../runtime-session-manager';

type RootStateLike = {
  windowing?: {
    windows?: Record<string, WindowInstance>;
  };
};

function getClosedSurfaceSessionId(state: RootStateLike, windowId: string): string | null {
  const window = state.windowing?.windows?.[windowId];
  if (!window || window.content.kind !== 'surface') {
    return null;
  }
  return window.content.surface?.surfaceSessionId ?? null;
}

function stillHasSurfaceWindow(state: RootStateLike, sessionId: string): boolean {
  const windows = Object.values(state.windowing?.windows ?? {});
  return windows.some(
    (window) =>
      window.content.kind === 'surface' &&
      window.content.surface?.surfaceSessionId === sessionId,
  );
}

export function createRuntimeSessionLifecycleMiddleware() {
  const listener = createListenerMiddleware();

  listener.startListening({
    actionCreator: closeWindow,
    effect: async (action, api) => {
      const windowId = action.payload;
      const sessionId = getClosedSurfaceSessionId(api.getOriginalState() as RootStateLike, windowId);
      if (!sessionId) {
        return;
      }

      const nextState = api.getState() as RootStateLike;
      if (stillHasSurfaceWindow(nextState, sessionId)) {
        return;
      }

      DEFAULT_RUNTIME_SESSION_MANAGER.disposeSession(sessionId);
      api.dispatch(removeRuntimeSession({ sessionId }));
    },
  });

  return listener;
}
