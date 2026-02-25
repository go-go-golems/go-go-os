// @vitest-environment jsdom
import { openWindow } from '@hypercard/engine/desktop-core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { App } from '../App';
import { launcherModules } from '../app/modules';
import { createLauncherAppStore } from '../app/store';

const roots: Root[] = [];
const containers: HTMLElement[] = [];

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.scrollIntoView !== 'function') {
    HTMLElement.prototype.scrollIntoView = () => undefined;
  }
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

function createHostContext() {
  return {
    dispatch: (action: unknown) => action,
    getState: () => ({}),
    openWindow: () => undefined,
    closeWindow: () => undefined,
    resolveApiBase: (appId: string) => `/api/apps/${appId}`,
    resolveWsBase: (appId: string) => `/api/apps/${appId}/ws`,
  };
}

async function renderHostWithTwoWindows(): Promise<HTMLElement> {
  const store = createLauncherAppStore();
  const hostContext = createHostContext();
  const firstPayload = launcherModules[0].buildLaunchWindow(hostContext, 'icon');
  const secondPayload = launcherModules[1].buildLaunchWindow(hostContext, 'icon');
  store.dispatch(openWindow(firstPayload));
  store.dispatch(openWindow(secondPayload));

  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
  });

  return container;
}

function fireContextMenu(target: Element): void {
  act(() => {
    target.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: 240,
        clientY: 180,
      }),
    );
  });
}

describe('launcher context menu behavior', () => {
  it('opens shell context menu from title-bar right click', async () => {
    const container = await renderHostWithTwoWindows();
    const titleBars = container.querySelectorAll('[data-part="windowing-window-title-bar"]');
    expect(titleBars.length).toBeGreaterThan(0);

    fireContextMenu(titleBars[0]);

    const contextMenu = container.querySelector('[data-part="context-menu"]');
    expect(contextMenu).not.toBeNull();
    expect(contextMenu?.textContent).toContain('Close Window');
  });

  it('focuses unfocused window before showing title-bar context menu', async () => {
    const container = await renderHostWithTwoWindows();
    const windows = Array.from(container.querySelectorAll('[data-part="windowing-window"]'));
    expect(windows.length).toBeGreaterThan(1);

    const initiallyUnfocused =
      windows.find((windowEl) => windowEl.getAttribute('data-state') !== 'focused') ?? windows[0];
    const titleBar = initiallyUnfocused.querySelector('[data-part="windowing-window-title-bar"]');
    expect(titleBar).not.toBeNull();

    fireContextMenu(titleBar as Element);

    expect(initiallyUnfocused.getAttribute('data-state')).toBe('focused');
    expect(container.querySelector('[data-part="context-menu"]')).not.toBeNull();
  });
});
