import type { ReactNode } from 'react';
import type { InlineWidget } from '../../components/widgets';

export type InlineWidgetRenderContext = Record<string, unknown>;
export type InlineWidgetRenderer = (
  widget: InlineWidget,
  context: InlineWidgetRenderContext,
) => ReactNode;

export type InlineWidgetRendererOverrides = Record<string, InlineWidgetRenderer>;

export interface ConversationWidgetRegistry {
  register: (type: string, renderer: InlineWidgetRenderer) => void;
  unregister: (type: string) => void;
  clear: () => void;
  resolve: (
    type: string,
    overrides?: InlineWidgetRendererOverrides,
  ) => InlineWidgetRenderer | undefined;
  render: (
    widget: InlineWidget,
    context?: InlineWidgetRenderContext,
    overrides?: InlineWidgetRendererOverrides,
  ) => ReactNode;
}

function normalizeType(type: string): string {
  return String(type || '').trim();
}

function resolveRenderer(
  renderers: Map<string, InlineWidgetRenderer>,
  type: string,
  overrides?: InlineWidgetRendererOverrides,
): InlineWidgetRenderer | undefined {
  const key = normalizeType(type);
  if (!key) return undefined;
  return overrides?.[key] ?? renderers.get(key);
}

export function createConversationWidgetRegistry(): ConversationWidgetRegistry {
  const renderers = new Map<string, InlineWidgetRenderer>();

  return {
    register: (type, renderer) => {
      const key = normalizeType(type);
      if (!key) return;
      renderers.set(key, renderer);
    },
    unregister: (type) => {
      const key = normalizeType(type);
      if (!key) return;
      renderers.delete(key);
    },
    clear: () => {
      renderers.clear();
    },
    resolve: (type, overrides) => resolveRenderer(renderers, type, overrides),
    render: (widget, context = {}, overrides) => {
      const renderer = resolveRenderer(renderers, widget.type, overrides);
      if (!renderer) {
        return null;
      }
      return renderer(widget, context);
    },
  };
}
