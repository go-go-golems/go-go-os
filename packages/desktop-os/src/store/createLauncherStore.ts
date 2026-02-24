import { type CreateAppStoreOptions, createAppStore } from '@hypercard/engine';
import type { Reducer } from '@reduxjs/toolkit';
import type { AppStateKey } from '../contracts/appManifest';
import type { LaunchableAppModule } from '../contracts/launchableAppModule';

const ENGINE_CORE_REDUCER_KEYS = new Set([
  'pluginCardRuntime',
  'windowing',
  'notifications',
  'debug',
  'hypercardArtifacts',
]);

export function collectModuleReducers(modules: readonly LaunchableAppModule[]): Record<string, Reducer> {
  const seen = new Set<string>();
  const reducers: Record<string, Reducer> = {};

  for (const module of modules) {
    if (!module.state) {
      continue;
    }

    const { stateKey, reducer } = module.state;
    if (ENGINE_CORE_REDUCER_KEYS.has(stateKey)) {
      throw new Error(`App module "${module.manifest.id}" uses reserved reducer key "${stateKey}".`);
    }
    if (seen.has(stateKey)) {
      throw new Error(`Duplicate app reducer key "${stateKey}".`);
    }

    seen.add(stateKey);
    reducers[stateKey] = reducer;
  }

  return reducers;
}

export function createLauncherStore(modules: readonly LaunchableAppModule[], options: CreateAppStoreOptions = {}) {
  const reducers = collectModuleReducers(modules);
  return createAppStore(reducers, options);
}

export function selectModuleState<TSlice = unknown>(state: unknown, stateKey: AppStateKey): TSlice | undefined {
  if (typeof state !== 'object' || state === null || Array.isArray(state)) {
    return undefined;
  }
  return (state as Record<string, unknown>)[stateKey] as TSlice | undefined;
}

export function createModuleSelector<TSlice = unknown, TResult = TSlice | undefined>(
  stateKey: AppStateKey,
  selector: (slice: TSlice | undefined) => TResult,
) {
  return (state: unknown): TResult => selector(selectModuleState<TSlice>(state, stateKey));
}
