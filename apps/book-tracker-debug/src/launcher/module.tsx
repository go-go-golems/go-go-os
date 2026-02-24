import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { STACK } from '../domain/stack';

const launcherStateSlice = createSlice({
  name: 'bookTrackerLauncher',
  initialState: {
    launchCount: 0,
    lastLaunchReason: null as LaunchReason | null,
  },
  reducers: {
    markLaunched(state, action: PayloadAction<LaunchReason>) {
      state.launchCount += 1;
      state.lastLaunchReason = action.payload;
    },
  },
});

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `book-tracker-${Date.now()}`;
}

function buildLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = nextInstanceId();
  return {
    id: `window:book-tracker-debug:${instanceId}`,
    title: 'Book Tracker',
    icon: '📚',
    bounds: {
      x: 260,
      y: 88,
      w: 620,
      h: 430,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey('book-tracker-debug', instanceId),
    },
    dedupeKey: reason === 'startup' ? 'book-tracker-debug:startup' : undefined,
  };
}

function BookTrackerLauncherWindow({
  appId,
  instanceId,
  windowId,
}: {
  appId: string;
  instanceId: string;
  windowId: string;
}) {
  return (
    <section style={{ padding: 12, display: 'grid', gap: 8 }}>
      <strong>Book Tracker Module</strong>
      <span>App ID: {appId}</span>
      <span>Instance ID: {instanceId}</span>
      <span>Window ID: {windowId}</span>
      <span>Stack: {STACK.name}</span>
      <span>Cards: {Object.keys(STACK.cards).length}</span>
    </section>
  );
}

export const bookTrackerLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'book-tracker-debug',
    name: 'Book Tracker',
    icon: '📚',
    launch: { mode: 'window' },
    desktop: {
      order: 40,
    },
  },
  state: {
    stateKey: 'app_book_tracker_debug',
    reducer: launcherStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(launcherStateSlice.actions.markLaunched(reason));
    return buildLaunchWindowPayload(reason);
  },
  renderWindow: ({ appId, instanceId, windowId }): ReactNode => (
    <BookTrackerLauncherWindow appId={appId} instanceId={instanceId} windowId={windowId} />
  ),
};
