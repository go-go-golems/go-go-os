import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createBookStore } from '../app/store';
import { BookTrackerRealAppWindow } from './renderBookTrackerApp';

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
      w: 980,
      h: 700,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey('book-tracker-debug', instanceId),
    },
    dedupeKey: reason === 'startup' ? 'book-tracker-debug:startup' : undefined,
  };
}

function BookTrackerLauncherAppHost() {
  const storeRef = useRef<ReturnType<typeof createBookStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createBookStore();
  }
  return (
    <Provider store={storeRef.current}>
      <BookTrackerRealAppWindow />
    </Provider>
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
  renderWindow: ({ windowId }): ReactNode => <BookTrackerLauncherAppHost key={windowId} />,
};
