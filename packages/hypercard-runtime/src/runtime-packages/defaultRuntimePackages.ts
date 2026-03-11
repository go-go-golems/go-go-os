import uiPackagePrelude from './ui.package.vm.js?raw';
import type { RuntimePackageDefinition } from './runtimePackageRegistry';
import { registerRuntimePackage } from './runtimePackageRegistry';

export const UI_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'ui',
  version: '1.0.0',
  summary: 'Base UI DSL package providing ui.* node constructors.',
  installPrelude: uiPackagePrelude,
  surfaceTypes: ['ui.card.v1'],
};

export function registerBuiltInRuntimePackages(): void {
  registerRuntimePackage(UI_RUNTIME_PACKAGE);
}
