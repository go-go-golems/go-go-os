import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createRingBuffer, ringClear, ringPush, type RingBufferState } from './ringBuffer';
import type { DiagnosticsConfig, FrameEvent, ReduxPerfEvent } from './types';
import { DEFAULT_DIAGNOSTICS_CONFIG } from './types';

export interface ReduxPerfState {
  /** Ring buffer of raw dispatch timing events. */
  events: RingBufferState<ReduxPerfEvent>;
  /** Ring buffer of frame timing samples. */
  frames: RingBufferState<FrameEvent>;
  /** Active diagnostics configuration. */
  config: DiagnosticsConfig;
  /** Whether metric updates are paused (collection continues, UI freezes). */
  paused: boolean;
}

function createInitialState(config?: Partial<DiagnosticsConfig>): ReduxPerfState {
  const cfg = { ...DEFAULT_DIAGNOSTICS_CONFIG, ...config };
  return {
    events: createRingBuffer<ReduxPerfEvent>(cfg.maxEvents),
    frames: createRingBuffer<FrameEvent>(cfg.maxFrames),
    config: cfg,
    paused: false,
  };
}

export const reduxPerfSlice = createSlice({
  name: 'reduxPerf',
  initialState: createInitialState(),
  reducers: {
    /** Record a single dispatch timing event. */
    recordPerfEvent(state, action: PayloadAction<ReduxPerfEvent>) {
      ringPush(state.events, action.payload);
    },

    /** Record a single frame timing event from the rAF monitor. */
    recordFrameEvent(state, action: PayloadAction<FrameEvent>) {
      ringPush(state.frames, action.payload);
    },

    /** Reset all collected metrics. */
    resetMetrics(state) {
      ringClear(state.events);
      ringClear(state.frames);
    },

    /** Pause/resume UI updates (collection still happens). */
    togglePause(state) {
      state.paused = !state.paused;
    },

    /** Update rolling window size (ms). */
    setWindowMs(state, action: PayloadAction<number>) {
      state.config.windowMs = action.payload;
    },
  },
});

export const {
  recordPerfEvent,
  recordFrameEvent,
  resetMetrics,
  togglePause,
  setWindowMs,
} = reduxPerfSlice.actions;

export const reduxPerfReducer = reduxPerfSlice.reducer;
