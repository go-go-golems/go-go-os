import {
  createConversationWidgetRegistry,
  createSemRegistry,
  registerHypercardWidgetPack,
  type ConversationWidgetRegistry,
  type ProjectionPipelineAdapter,
  type SemRegistry,
} from '@hypercard/engine';
import { createInventoryArtifactProjectionAdapter } from './projectionAdapters';

export interface InventoryConversationExtensions {
  semRegistry: SemRegistry;
  widgetRegistry: ConversationWidgetRegistry;
  adapters: ProjectionPipelineAdapter[];
  widgetNamespace: string;
}

let singleton: InventoryConversationExtensions | null = null;

export function registerInventoryConversationExtensions(): InventoryConversationExtensions {
  if (singleton) {
    return singleton;
  }

  const widgetNamespace = 'inventory';
  const semRegistry = createSemRegistry();
  const widgetRegistry = createConversationWidgetRegistry();
  const adapters: ProjectionPipelineAdapter[] = [
    createInventoryArtifactProjectionAdapter(),
  ];

  registerHypercardWidgetPack({
    registry: widgetRegistry,
    namespace: widgetNamespace,
  });

  singleton = {
    semRegistry,
    widgetRegistry,
    adapters,
    widgetNamespace,
  };
  return singleton;
}
