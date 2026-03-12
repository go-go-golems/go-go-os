import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import INVENTORY_STACK from '../plugin-runtime/fixtures/inventory-stack.vm.js?raw';
import { closeWindow, openWindow } from '@hypercard/engine/desktop-core';
import { createAppStore } from './createAppStore';
import { registerRuntimeSession, selectRuntimeSession } from '../features/runtimeSessions';
import { DEFAULT_RUNTIME_SESSION_MANAGER } from '../runtime-session-manager';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE, TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';

describe('runtimeSessionLifecycleMiddleware', () => {
  async function flushEffects() {
    await Promise.resolve();
    await Promise.resolve();
  }

  beforeEach(() => {
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
  });

  afterEach(() => {
    DEFAULT_RUNTIME_SESSION_MANAGER.clear();
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
  });

  it('disposes the runtime session only when the last surface window closes', async () => {
    const { createStore } = createAppStore({});
    const store = createStore();

    await DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession({
      bundleId: 'inventory',
      sessionId: 'session-lifecycle',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-lifecycle',
        bundleId: 'inventory',
        status: 'ready',
      }),
    );

    store.dispatch(
      openWindow({
        id: 'window:one',
        title: 'One',
        icon: '1',
        bounds: { x: 0, y: 0, w: 300, h: 200 },
        content: {
          kind: 'surface',
          surface: {
            bundleId: 'inventory',
            surfaceId: 'lowStock',
            surfaceSessionId: 'session-lifecycle',
          },
        },
      }),
    );

    store.dispatch(
      openWindow({
        id: 'window:two',
        title: 'Two',
        icon: '2',
        bounds: { x: 20, y: 20, w: 300, h: 200 },
        content: {
          kind: 'surface',
          surface: {
            bundleId: 'inventory',
            surfaceId: 'lowStock',
            surfaceSessionId: 'session-lifecycle',
          },
        },
      }),
    );

    store.dispatch(closeWindow('window:one'));
    await flushEffects();
    expect(DEFAULT_RUNTIME_SESSION_MANAGER.getSession('session-lifecycle')).not.toBeNull();
    expect(selectRuntimeSession(store.getState() as never, 'session-lifecycle')).not.toBeUndefined();

    store.dispatch(closeWindow('window:two'));
    await flushEffects();
    expect(DEFAULT_RUNTIME_SESSION_MANAGER.getSession('session-lifecycle')).toBeNull();
    expect(selectRuntimeSession(store.getState() as never, 'session-lifecycle')).toBeUndefined();
  });
});
