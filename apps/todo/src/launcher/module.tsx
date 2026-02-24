import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { STACK } from '../domain/stack';

const launcherStateSlice = createSlice({
  name: 'todoLauncher',
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
  return `todo-${Date.now()}`;
}

function buildLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = nextInstanceId();
  return {
    id: `window:todo:${instanceId}`,
    title: 'Todo',
    icon: '✅',
    bounds: {
      x: 180,
      y: 56,
      w: 600,
      h: 400,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey('todo', instanceId),
    },
    dedupeKey: reason === 'startup' ? 'todo:startup' : undefined,
  };
}

function TodoLauncherWindow({ appId, instanceId, windowId }: { appId: string; instanceId: string; windowId: string }) {
  return (
    <section style={{ padding: 12, display: 'grid', gap: 8 }}>
      <strong>Todo Module</strong>
      <span>App ID: {appId}</span>
      <span>Instance ID: {instanceId}</span>
      <span>Window ID: {windowId}</span>
      <span>Stack: {STACK.name}</span>
      <span>Cards: {Object.keys(STACK.cards).length}</span>
    </section>
  );
}

export const todoLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'todo',
    name: 'Todo',
    icon: '✅',
    launch: { mode: 'window' },
    desktop: {
      order: 20,
    },
  },
  state: {
    stateKey: 'app_todo',
    reducer: launcherStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(launcherStateSlice.actions.markLaunched(reason));
    return buildLaunchWindowPayload(reason);
  },
  renderWindow: ({ appId, instanceId, windowId }): ReactNode => (
    <TodoLauncherWindow appId={appId} instanceId={instanceId} windowId={windowId} />
  ),
};
