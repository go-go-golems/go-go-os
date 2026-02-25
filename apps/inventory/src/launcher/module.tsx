import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createInventoryStore } from '../app/store';
import { InventoryRealAppWindow } from './renderInventoryApp';

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
      w: 1120,
      h: 760,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey('inventory', instanceId),
    },
    dedupeKey: reason === 'startup' ? 'inventory:startup' : undefined,
  };
}

function InventoryLauncherAppHost() {
  const storeRef = useRef<ReturnType<typeof createInventoryStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createInventoryStore();
  }
  return (
    <Provider store={storeRef.current}>
      <InventoryRealAppWindow />
    </Provider>
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
  renderWindow: ({ windowId }): ReactNode => <InventoryLauncherAppHost key={windowId} />,
};
