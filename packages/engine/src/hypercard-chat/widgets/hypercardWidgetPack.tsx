import type { TimelineWidgetItem } from '../types';
import { HypercardCardPanelWidget, HypercardGeneratedWidgetPanel } from './HypercardArtifactPanels';
import { HypercardTimelineWidget, timelineItemsFromInlineWidget } from './HypercardTimelinePanel';
import { type InlineWidgetRenderContext, registerInlineWidgetRenderer } from './inlineWidgetRegistry';

export interface HypercardWidgetPackRenderContext extends InlineWidgetRenderContext {
  debug?: boolean;
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
  onEditCard?: (item: TimelineWidgetItem) => void;
}

export interface RegisterHypercardWidgetPackOptions {
  namespace?: string;
}

function asItemHandler(value: unknown): ((item: TimelineWidgetItem) => void) | undefined {
  return typeof value === 'function' ? (value as (item: TimelineWidgetItem) => void) : undefined;
}

function asContext(context: InlineWidgetRenderContext): HypercardWidgetPackRenderContext {
  return context as HypercardWidgetPackRenderContext;
}

function normalizeNamespace(namespace: string | undefined): string {
  const key = String(namespace ?? '').trim();
  return key.length > 0 ? key : 'hypercard';
}

export function registerHypercardWidgetPack(options: RegisterHypercardWidgetPackOptions = {}): void {
  const namespace = normalizeNamespace(options.namespace);

  registerInlineWidgetRenderer(`${namespace}.cards`, (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = asContext(context);
    return (
      <HypercardCardPanelWidget
        items={items}
        onOpenArtifact={asItemHandler(ctx.onOpenArtifact)}
        onEditCard={asItemHandler(ctx.onEditCard)}
        debug={ctx.debug === true}
      />
    );
  });

  registerInlineWidgetRenderer(`${namespace}.widgets`, (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = asContext(context);
    return (
      <HypercardGeneratedWidgetPanel
        items={items}
        onOpenArtifact={asItemHandler(ctx.onOpenArtifact)}
        debug={ctx.debug === true}
      />
    );
  });

  registerInlineWidgetRenderer(`${namespace}.timeline`, (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = asContext(context);
    return <HypercardTimelineWidget items={items} debug={ctx.debug === true} />;
  });
}
