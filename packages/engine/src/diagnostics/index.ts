// ── Diagnostics: Redux throughput & FPS monitoring ──

export type {
  ActionRate,
  DiagnosticsConfig,
  FrameEvent,
  ReduxPerfEvent,
  ReduxPerfSnapshot,
} from './types';
export { DEFAULT_DIAGNOSTICS_CONFIG } from './types';

export {
  createRingBuffer,
  ringClear,
  ringPush,
  ringToArray,
  ringWindowSince,
  type RingBufferState,
} from './ringBuffer';

export {
  recordFrameEvent,
  recordPerfEvent,
  reduxPerfReducer,
  reduxPerfSlice,
  resetMetrics,
  setWindowMs,
  togglePause,
  type ReduxPerfState,
} from './reduxPerfSlice';

export {
  computeP95,
  type ReduxPerfStateSlice,
  selectReduxPerf,
  selectReduxPerfConfig,
  selectReduxPerfPaused,
  selectReduxPerfSnapshot,
} from './selectors';

export {
  createReduxPerfMiddleware,
  type ReduxPerfMiddlewareOptions,
} from './reduxPerfMiddleware';

export { startFrameMonitor } from './frameMonitor';
