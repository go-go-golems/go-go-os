import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { STACK } from '../domain/stack';

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
      w: 620,
      h: 420,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey('crm', instanceId),
    },
    dedupeKey: reason === 'startup' ? 'crm:startup' : undefined,
  };
}

function CrmLauncherWindow({ appId, instanceId, windowId }: { appId: string; instanceId: string; windowId: string }) {
  return (
    <section style={{ padding: 12, display: 'grid', gap: 8 }}>
      <strong>CRM Module</strong>
      <span>App ID: {appId}</span>
      <span>Instance ID: {instanceId}</span>
      <span>Window ID: {windowId}</span>
      <span>Stack: {STACK.name}</span>
      <span>Cards: {Object.keys(STACK.cards).length}</span>
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
  renderWindow: ({ appId, instanceId, windowId }): ReactNode => (
    <CrmLauncherWindow appId={appId} instanceId={instanceId} windowId={windowId} />
  ),
};
