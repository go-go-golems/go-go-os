import { formatAppKey, type LaunchableAppModule, type LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { createSlice } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';

interface PlaceholderWindowProps {
  appName: string;
  appId: string;
  instanceId: string;
  launchReason: LaunchReason;
  windowId: string;
}

function PlaceholderWindow({ appName, appId, instanceId, launchReason, windowId }: PlaceholderWindowProps) {
  return (
    <section style={{ padding: 12, display: 'grid', gap: 8 }}>
      <strong>{appName}</strong>
      <span>App ID: {appId}</span>
      <span>Instance: {instanceId}</span>
      <span>Launch reason: {launchReason}</span>
      <span>Window ID: {windowId}</span>
      <span>App module migration is tracked in OS-05.</span>
    </section>
  );
}

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `inst-${Date.now()}`;
}

function createPlaceholderModule(params: {
  appId: string;
  appName: string;
  icon: string;
  order: number;
}): LaunchableAppModule {
  const launchSlice = createSlice({
    name: `launcher_${params.appId}`,
    initialState: { launches: 0 },
    reducers: {
      incrementLaunches(state) {
        state.launches += 1;
      },
    },
  });

  function buildLaunchWindow(reason: LaunchReason): OpenWindowPayload {
    const instanceId = nextInstanceId();
    const appKey = formatAppKey(params.appId, instanceId);
    return {
      id: `window:${params.appId}:${instanceId}`,
      title: params.appName,
      icon: params.icon,
      bounds: {
        x: 160 + params.order * 28,
        y: 36 + params.order * 18,
        w: 520,
        h: 360,
      },
      content: {
        kind: 'app',
        appKey,
      },
      dedupeKey: reason === 'startup' ? params.appId : undefined,
    };
  }

  return {
    manifest: {
      id: params.appId,
      name: params.appName,
      icon: params.icon,
      launch: { mode: 'window' },
      desktop: {
        order: params.order,
      },
    },
    state: {
      stateKey: `app_${params.appId.replace(/-/g, '_')}`,
      reducer: launchSlice.reducer,
    },
    buildLaunchWindow: (_ctx, reason) => buildLaunchWindow(reason),
    renderWindow: ({ appId, instanceId, windowId }): ReactNode => (
      <PlaceholderWindow
        appName={params.appName}
        appId={appId}
        instanceId={instanceId}
        launchReason="icon"
        windowId={windowId}
      />
    ),
  };
}

export const launcherModules: LaunchableAppModule[] = [
  createPlaceholderModule({ appId: 'inventory', appName: 'Inventory', icon: '📦', order: 10 }),
  createPlaceholderModule({ appId: 'todo', appName: 'Todo', icon: '✅', order: 20 }),
  createPlaceholderModule({ appId: 'crm', appName: 'CRM', icon: '📇', order: 30 }),
  createPlaceholderModule({ appId: 'book-tracker-debug', appName: 'Book Tracker', icon: '📚', order: 40 }),
];
