import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { DesktopIconLayer } from '@hypercard/engine/desktop-react';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { useDispatch } from 'react-redux';
import { createCrmStore } from '../app/store';
import { CrmRealAppWindow } from './renderCrmApp';

const launcherStateSlice = createSlice({
  name: 'crmLauncher',
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

const CRM_APP_ID = 'crm';
const CRM_FOLDER_INSTANCE_ID = 'folder';
const CRM_WORKSPACE_INSTANCE_PREFIX = 'workspace-';

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `crm-${Date.now()}`;
}

function buildLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = CRM_FOLDER_INSTANCE_ID;
  return {
    id: `window:crm:${instanceId}`,
    title: 'CRM Folder',
    icon: '📇',
    bounds: {
      x: 230,
      y: 72,
      w: 520,
      h: 380,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey(CRM_APP_ID, instanceId),
    },
    dedupeKey: reason === 'startup' ? 'crm:folder:startup' : 'crm:folder',
  };
}

function buildWorkspaceWindowPayload(): OpenWindowPayload {
  const instanceId = `${CRM_WORKSPACE_INSTANCE_PREFIX}${nextInstanceId()}`;
  return {
    id: `window:crm:${instanceId}`,
    title: 'CRM',
    icon: '📇',
    bounds: {
      x: 210,
      y: 60,
      w: 1040,
      h: 720,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey(CRM_APP_ID, instanceId),
    },
  };
}

function CrmLauncherAppHost() {
  const storeRef = useRef<ReturnType<typeof createCrmStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createCrmStore();
  }
  return (
    <Provider store={storeRef.current}>
      <CrmRealAppWindow />
    </Provider>
  );
}

function CrmFolderWindow() {
  const dispatch = useDispatch();
  const [selectedIconId, setSelectedIconId] = useState<string | null>('crm-folder.open-workspace');

  const openIcon = useCallback(
    (iconId: string) => {
      if (iconId !== 'crm-folder.open-workspace') {
        return;
      }
      dispatch(openWindow(buildWorkspaceWindowPayload()));
    },
    [dispatch],
  );

  return (
    <section style={{ height: '100%', padding: 12 }}>
      <DesktopIconLayer
        icons={[{ id: 'crm-folder.open-workspace', label: 'Open CRM', icon: '📇' }]}
        selectedIconId={selectedIconId}
        onSelectIcon={setSelectedIconId}
        onOpenIcon={openIcon}
      />
    </section>
  );
}

export const crmLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'crm',
    name: 'CRM',
    icon: '📇',
    launch: { mode: 'window' },
    desktop: {
      order: 30,
    },
  },
  state: {
    stateKey: 'app_crm',
    reducer: launcherStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(launcherStateSlice.actions.markLaunched(reason));
    return buildLaunchWindowPayload(reason);
  },
  renderWindow: ({ instanceId, windowId }): ReactNode =>
    instanceId === CRM_FOLDER_INSTANCE_ID ? <CrmFolderWindow /> : <CrmLauncherAppHost key={windowId} />,
};
