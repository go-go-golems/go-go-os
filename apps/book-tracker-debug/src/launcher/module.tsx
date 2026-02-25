import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { DesktopIconLayer } from '@hypercard/engine/desktop-react';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { useDispatch } from 'react-redux';
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

const BOOK_TRACKER_APP_ID = 'book-tracker-debug';
const BOOK_TRACKER_FOLDER_INSTANCE_ID = 'folder';
const BOOK_TRACKER_WORKSPACE_INSTANCE_PREFIX = 'workspace-';

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `book-tracker-${Date.now()}`;
}

function buildLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = BOOK_TRACKER_FOLDER_INSTANCE_ID;
  return {
    id: `window:book-tracker-debug:${instanceId}`,
    title: 'Book Tracker Folder',
    icon: '📚',
    bounds: {
      x: 250,
      y: 88,
      w: 520,
      h: 380,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey(BOOK_TRACKER_APP_ID, instanceId),
    },
    dedupeKey: reason === 'startup' ? 'book-tracker-debug:folder:startup' : 'book-tracker-debug:folder',
  };
}

function buildWorkspaceWindowPayload(): OpenWindowPayload {
  const instanceId = `${BOOK_TRACKER_WORKSPACE_INSTANCE_PREFIX}${nextInstanceId()}`;
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
      appKey: formatAppKey(BOOK_TRACKER_APP_ID, instanceId),
    },
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

function BookTrackerFolderWindow() {
  const dispatch = useDispatch();
  const [selectedIconId, setSelectedIconId] = useState<string | null>('book-tracker-folder.open-workspace');

  const openIcon = useCallback(
    (iconId: string) => {
      if (iconId !== 'book-tracker-folder.open-workspace') {
        return;
      }
      dispatch(openWindow(buildWorkspaceWindowPayload()));
    },
    [dispatch],
  );

  return (
    <section style={{ height: '100%', padding: 12 }}>
      <DesktopIconLayer
        icons={[{ id: 'book-tracker-folder.open-workspace', label: 'Open Book Tracker', icon: '📚' }]}
        selectedIconId={selectedIconId}
        onSelectIcon={setSelectedIconId}
        onOpenIcon={openIcon}
      />
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
  renderWindow: ({ instanceId, windowId }): ReactNode =>
    instanceId === BOOK_TRACKER_FOLDER_INSTANCE_ID ? (
      <BookTrackerFolderWindow />
    ) : (
      <BookTrackerLauncherAppHost key={windowId} />
    ),
};
