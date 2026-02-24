import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { STACK } from '../domain/stack';

const launcherStateSlice = createSlice({
  name: 'inventoryLauncher',
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
  return `inventory-${Date.now()}`;
}

function buildLaunchWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = nextInstanceId();
  return {
    id: `window:inventory:${instanceId}`,
    title: 'Inventory',
    icon: '📦',
    bounds: {
      x: 140,
      y: 40,
      w: 640,
      h: 420,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey('inventory', instanceId),
    },
    dedupeKey: reason === 'startup' ? 'inventory:startup' : undefined,
  };
}

function InventoryLauncherWindow({
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
      <strong>Inventory Module</strong>
      <span>App ID: {appId}</span>
      <span>Instance ID: {instanceId}</span>
      <span>Window ID: {windowId}</span>
      <span>Stack: {STACK.name}</span>
      <span>Cards: {Object.keys(STACK.cards).length}</span>
    </section>
  );
}

export const inventoryLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'inventory',
    name: 'Inventory',
    icon: '📦',
    launch: { mode: 'window' },
    desktop: {
      order: 10,
    },
  },
  state: {
    stateKey: 'app_inventory',
    reducer: launcherStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(launcherStateSlice.actions.markLaunched(reason));
    return buildLaunchWindowPayload(reason);
  },
  renderWindow: ({ appId, instanceId, windowId }): ReactNode => (
    <InventoryLauncherWindow appId={appId} instanceId={instanceId} windowId={windowId} />
  ),
};
