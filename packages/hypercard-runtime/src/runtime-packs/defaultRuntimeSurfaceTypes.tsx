import type { UINode } from '../plugin-runtime/uiTypes';
import { validateUINode } from '../plugin-runtime/uiSchema';
import { PluginCardRenderer } from '../runtime-host/PluginCardRenderer';
import {
  DEFAULT_RUNTIME_SURFACE_TYPE_ID,
  registerRuntimeSurfaceType,
  type RuntimeSurfaceTypeDefinition,
} from './runtimeSurfaceTypeRegistry';

export const UI_CARD_V1_SURFACE_TYPE: RuntimeSurfaceTypeDefinition<UINode> = {
  packId: DEFAULT_RUNTIME_SURFACE_TYPE_ID,
  validateTree: validateUINode,
  render: ({ tree, onEvent }) => <PluginCardRenderer tree={tree} onEvent={onEvent} />,
};

export function registerBuiltInRuntimeSurfaceTypes(): void {
  registerRuntimeSurfaceType(UI_CARD_V1_SURFACE_TYPE);
}
