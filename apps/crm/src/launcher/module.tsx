import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
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

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `crm-${Date.now()}`;
}

function buildLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = nextInstanceId();
  return {
    id: `window:crm:${instanceId}`,
    title: 'CRM',
    icon: '📇',
    bounds: {
      x: 220,
      y: 72,
      w: 1040,
      h: 720,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey('crm', instanceId),
    },
    dedupeKey: reason === 'startup' ? 'crm:startup' : undefined,
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
  renderWindow: ({ windowId }): ReactNode => <CrmLauncherAppHost key={windowId} />,
};
