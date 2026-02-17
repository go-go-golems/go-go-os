import type { Middleware } from '@reduxjs/toolkit';
import { recordPerfEvent } from './reduxPerfSlice';
import type { ReduxPerfEvent } from './types';
import { DEFAULT_DIAGNOSTICS_CONFIG } from './types';

export interface ReduxPerfMiddlewareOptions {
  /** Rolling window in ms. Default 5000. */
  windowMs?: number;
}

/**
 * Redux middleware that times every dispatch and records a `ReduxPerfEvent`
 * into the `reduxPerf` slice.
 *
 * Captures:
 * - action type
 * - reducer duration (ms)
 * - whether root state reference changed (state-change detection)
 */
export function createReduxPerfMiddleware(
  opts: ReduxPerfMiddlewareOptions = {},
): Middleware {
  const _windowMs = opts.windowMs ?? DEFAULT_DIAGNOSTICS_CONFIG.windowMs;
  void _windowMs; // reserved for future sampling logic

  const middleware: Middleware = (storeApi) => (next) => (action) => {
    const prevState = storeApi.getState();
    const start = performance.now();
    const result = next(action);
    const end = performance.now();
    const nextState = storeApi.getState();

    // Don't record our own bookkeeping action to avoid infinite loop
    const actionType =
      action && typeof action === 'object' && 'type' in action
        ? (action as { type: string }).type
        : 'unknown';

    if (actionType === recordPerfEvent.type) {
      return result;
    }

    const event: ReduxPerfEvent = {
      ts: Date.now(),
      type: actionType,
      durationMs: end - start,
      changed: prevState !== nextState,
    };

    storeApi.dispatch(recordPerfEvent(event));

    return result;
  };

  return middleware;
}
