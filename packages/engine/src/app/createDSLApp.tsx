import type { Reducer } from '@reduxjs/toolkit';
import type { CardStackDefinition } from '../cards/types';
import type { DesktopIconDef } from '../components/shell/windowing/types';
import { DesktopShell } from '../components/shell/windowing/DesktopShell';
import { createAppStore } from './createAppStore';

export interface DSLAppConfig {
  /** The card stack definition */
  stack: CardStackDefinition;
  /** Domain-specific reducers (engine reducers are added automatically) */
  domainReducers: Record<string, Reducer>;
  /** Optional desktop icon overrides */
  icons?: DesktopIconDef[];
}

/**
 * Creates a complete plugin-card app from a config object.
 * Returns an App component, a singleton store, and a createStore factory.
 *
 * @example
 * ```ts
 * const { App, store, createStore } = createDSLApp({
 *   stack: CRM_STACK,
 *   domainReducers: { contacts: contactsReducer, ... },
 *   navShortcuts: [{ card: 'home', icon: '🏠' }],
 *   snapshotSelector: (state) => ({ contacts: state.contacts }),
 * });
 * ```
 */
export function createDSLApp(config: DSLAppConfig) {
  const { stack, domainReducers, icons } = config;

  const { store, createStore } = createAppStore(domainReducers);

  function App() {
    return <DesktopShell stack={stack} icons={icons} />;
  }

  return { App, store, createStore };
}
