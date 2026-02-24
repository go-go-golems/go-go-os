import { createLauncherStore } from '@hypercard/desktop-os';
import { launcherModules } from './modules';

export const { store, createStore: createLauncherAppStore } = createLauncherStore(launcherModules);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
