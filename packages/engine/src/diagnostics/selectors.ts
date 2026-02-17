import { createSelector } from '@reduxjs/toolkit';
import { ringWindowSince } from './ringBuffer';
import type { ReduxPerfState } from './reduxPerfSlice';
import type { ActionRate, FrameEvent, ReduxPerfEvent, ReduxPerfSnapshot } from './types';

export interface ReduxPerfStateSlice {
  reduxPerf: ReduxPerfState;
}

export const selectReduxPerf = (state: ReduxPerfStateSlice) => state.reduxPerf;
export const selectReduxPerfPaused = (state: ReduxPerfStateSlice) => state.reduxPerf.paused;
export const selectReduxPerfConfig = (state: ReduxPerfStateSlice) => state.reduxPerf.config;

/**
 * Compute the full rolling-window diagnostics snapshot.
 *
 * This selector recomputes on every state change to `reduxPerf`.
 * The UI should throttle reads (e.g. via `useRef` + `setInterval`)
 * rather than subscribing on every dispatch.
 */
export const selectReduxPerfSnapshot = createSelector(
  [selectReduxPerf],
  (perf): ReduxPerfSnapshot => {
    const now = Date.now();
    const windowMs = perf.config.windowMs;
    const sinceTs = now - windowMs;

    const events = ringWindowSince<ReduxPerfEvent>(perf.events, sinceTs);
    const frames = ringWindowSince<FrameEvent>(perf.frames, sinceTs);

    const windowSec = windowMs / 1000;

    // ── Action throughput ──
    const actionsPerSec = events.length / windowSec;
    const stateChanges = events.filter((e) => e.changed).length;
    const stateChangesPerSec = stateChanges / windowSec;

    // ── Reducer latency ──
    const durations = events.map((e) => e.durationMs);
    const avgReducerMs = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;
    const p95ReducerMs = computeP95(durations);

    // ── FPS ──
    const fps = computeFps(frames);
    const longFrameThreshold = perf.config.longFrameThresholdMs;
    const longFrames = frames.filter((f) => f.durationMs > longFrameThreshold).length;
    const longFramesPerSec = longFrames / windowSec;

    // ── Top action rates ──
    const topActionRates = computeTopActionRates(events, windowSec, 10);

    return {
      windowMs,
      actionsPerSec,
      stateChangesPerSec,
      avgReducerMs,
      p95ReducerMs,
      fps,
      longFramesPerSec,
      topActionRates,
    };
  },
);

/** Compute p95 from an array of numbers. Returns 0 for empty input. */
export function computeP95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

/** Compute average FPS from frame events. */
function computeFps(frames: FrameEvent[]): number {
  if (frames.length < 2) return 0;
  const totalDuration = frames.reduce((sum, f) => sum + f.durationMs, 0);
  if (totalDuration === 0) return 0;
  return (frames.length / totalDuration) * 1000;
}

/** Compute top-N action types by dispatch rate. */
function computeTopActionRates(
  events: ReduxPerfEvent[],
  windowSec: number,
  topN: number,
): ActionRate[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, perSec: count / windowSec }))
    .sort((a, b) => b.perSec - a.perSec)
    .slice(0, topN);
}
