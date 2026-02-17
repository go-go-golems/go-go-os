import type { Dispatch } from '@reduxjs/toolkit';
import { recordFrameEvent } from './reduxPerfSlice';
import type { FrameEvent } from './types';

/**
 * Starts a `requestAnimationFrame` loop that measures inter-frame timing
 * and dispatches `recordFrameEvent` actions into the Redux store.
 *
 * Returns a cleanup function that cancels the loop.
 */
export function startFrameMonitor(dispatch: Dispatch): () => void {
  let rafId: number | null = null;
  let lastTimestamp: number | null = null;
  let active = true;

  function tick(timestamp: number) {
    if (!active) return;

    if (lastTimestamp !== null) {
      const durationMs = timestamp - lastTimestamp;
      const event: FrameEvent = {
        ts: Date.now(),
        durationMs,
      };
      dispatch(recordFrameEvent(event));
    }

    lastTimestamp = timestamp;
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    active = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
