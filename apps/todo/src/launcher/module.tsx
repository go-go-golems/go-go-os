import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createTodoStore } from '../app/store';
import { TodoRealAppWindow } from './renderTodoApp';

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
      w: 980,
      h: 700,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey('todo', instanceId),
    },
    dedupeKey: reason === 'startup' ? 'todo:startup' : undefined,
  };
}

function TodoLauncherAppHost() {
  const storeRef = useRef<ReturnType<typeof createTodoStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createTodoStore();
  }
  return (
    <Provider store={storeRef.current}>
      <TodoRealAppWindow />
    </Provider>
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
  renderWindow: ({ windowId }): ReactNode => <TodoLauncherAppHost key={windowId} />,
};
