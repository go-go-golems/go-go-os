import { describe, expect, it } from 'vitest';
import {
  openWindow as legacyOpenWindow,
  selectWindowsByZ as legacySelectWindowsByZ,
  windowingReducer as legacyWindowingReducer,
} from '../features/windowing';
import {
  DesktopShell as legacyDesktopShell,
  WindowLayer as legacyWindowLayer,
  useWindowInteractionController as legacyUseWindowInteractionController,
} from '../components/shell/windowing';
import {
  openWindow as coreOpenWindow,
  selectWindowsByZ as coreSelectWindowsByZ,
  windowingReducer as coreWindowingReducer,
} from '../desktop/core';
import {
  DesktopShell as reactDesktopShell,
  WindowLayer as reactWindowLayer,
  useWindowInteractionController as reactUseWindowInteractionController,
} from '../desktop/react';
import { core as desktopCore, react as desktopReact } from '../desktop';

type RootDesktopNamespace = typeof import('../index').desktop;
type RootDesktopCoreNamespace = typeof import('../index').desktopCore;
type RootDesktopReactNamespace = typeof import('../index').desktopReact;

describe('desktop namespace compatibility exports', () => {
  it('re-exports core windowing APIs from desktop/core', () => {
    expect(coreOpenWindow).toBe(legacyOpenWindow);
    expect(coreSelectWindowsByZ).toBe(legacySelectWindowsByZ);
    expect(coreWindowingReducer).toBe(legacyWindowingReducer);
  });

  it('re-exports shell/windowing React APIs from desktop/react', () => {
    expect(reactDesktopShell).toBe(legacyDesktopShell);
    expect(reactWindowLayer).toBe(legacyWindowLayer);
    expect(reactUseWindowInteractionController).toBe(legacyUseWindowInteractionController);
  });

  it('exposes grouped namespaces from desktop root', () => {
    expect(desktopCore.openWindow).toBe(coreOpenWindow);
    expect(desktopReact.DesktopShell).toBe(reactDesktopShell);
  });

  it('keeps top-level engine barrel desktop namespace contracts type-compatible', () => {
    const fromDesktopCoreType: RootDesktopCoreNamespace['openWindow'] = coreOpenWindow;
    const fromDesktopReactType: RootDesktopReactNamespace['DesktopShell'] = reactDesktopShell;
    const fromDesktopTypeCore: RootDesktopNamespace['core']['openWindow'] = coreOpenWindow;
    const fromDesktopTypeReact: RootDesktopNamespace['react']['DesktopShell'] = reactDesktopShell;

    expect(fromDesktopCoreType).toBe(coreOpenWindow);
    expect(fromDesktopReactType).toBe(reactDesktopShell);
    expect(fromDesktopTypeCore).toBe(coreOpenWindow);
    expect(fromDesktopTypeReact).toBe(reactDesktopShell);
  });
});
