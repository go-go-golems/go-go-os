import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { DesktopIconLayer } from '@hypercard/engine/desktop-react';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { useDispatch } from 'react-redux';
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

const TODO_APP_ID = 'todo';
const TODO_FOLDER_INSTANCE_ID = 'folder';
const TODO_WORKSPACE_INSTANCE_PREFIX = 'workspace-';

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `todo-${Date.now()}`;
}

function buildLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = TODO_FOLDER_INSTANCE_ID;
  return {
    id: `window:todo:${instanceId}`,
    title: 'Todo Folder',
    icon: '✅',
    bounds: {
      x: 210,
      y: 72,
      w: 520,
      h: 380,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey(TODO_APP_ID, instanceId),
    },
    dedupeKey: `todo:folder:${reason}`,
  };
}

function buildWorkspaceWindowPayload(): OpenWindowPayload {
  const instanceId = `${TODO_WORKSPACE_INSTANCE_PREFIX}${nextInstanceId()}`;
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
      appKey: formatAppKey(TODO_APP_ID, instanceId),
    },
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

function TodoFolderWindow() {
  const dispatch = useDispatch();
  const [selectedIconId, setSelectedIconId] = useState<string | null>('todo-folder.open-workspace');

  const openIcon = useCallback(
    (iconId: string) => {
      if (iconId !== 'todo-folder.open-workspace') {
        return;
      }
      dispatch(openWindow(buildWorkspaceWindowPayload()));
    },
    [dispatch],
  );

  return (
    <section style={{ height: '100%', padding: 12 }}>
      <DesktopIconLayer
        icons={[{ id: 'todo-folder.open-workspace', label: 'Open Todo', icon: '✅' }]}
        selectedIconId={selectedIconId}
        onSelectIcon={setSelectedIconId}
        onOpenIcon={openIcon}
      />
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
  renderWindow: ({ instanceId, windowId }): ReactNode =>
    instanceId === TODO_FOLDER_INSTANCE_ID ? <TodoFolderWindow /> : <TodoLauncherAppHost key={windowId} />,
};
