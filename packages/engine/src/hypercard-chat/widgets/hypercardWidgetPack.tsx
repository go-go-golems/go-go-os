import type { TimelineWidgetItem } from '../types';
import { HypercardCardPanelWidget, HypercardGeneratedWidgetPanel } from './HypercardArtifactPanels';
import { HypercardTimelineWidget, timelineItemsFromInlineWidget } from './HypercardTimelinePanel';
import {
  type ConversationWidgetRegistry,
  type InlineWidgetRenderContext,
} from './inlineWidgetRegistry';

export interface HypercardWidgetPackRenderContext extends InlineWidgetRenderContext {
  debug?: boolean;
  onOpenArtifact?: (item: TimelineWidgetItem) => void;
  onEditCard?: (item: TimelineWidgetItem) => void;
}

export interface RegisterHypercardWidgetPackOptions {
  registry: ConversationWidgetRegistry;
  namespace?: string;
}

export interface HypercardWidgetPackRegistration {
  namespace: string;
  unregister: () => void;
}

const registrationCountsByRegistry = new WeakMap<
  ConversationWidgetRegistry,
  Map<string, number>
>();

function countsForRegistry(registry: ConversationWidgetRegistry): Map<string, number> {
  const existing = registrationCountsByRegistry.get(registry);
  if (existing) {
    return existing;
  }
  const created = new Map<string, number>();
  registrationCountsByRegistry.set(registry, created);
  return created;
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

function registerRenderersForNamespace(
  registry: ConversationWidgetRegistry,
  namespace: string,
): void {
  registry.register(`${namespace}.cards`, (widget, context) => {
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

  registry.register(`${namespace}.widgets`, (widget, context) => {
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

  registry.register(`${namespace}.timeline`, (widget, context) => {
    const items = timelineItemsFromInlineWidget(widget);
    const ctx = asContext(context);
    return <HypercardTimelineWidget items={items} debug={ctx.debug === true} />;
  });
}

function unregisterRenderersForNamespace(
  registry: ConversationWidgetRegistry,
  namespace: string,
): void {
  registry.unregister(`${namespace}.cards`);
  registry.unregister(`${namespace}.widgets`);
  registry.unregister(`${namespace}.timeline`);
}

export function unregisterHypercardWidgetPack(
  options: RegisterHypercardWidgetPackOptions,
): void {
  const namespace = normalizeNamespace(options.namespace);
  unregisterRenderersForNamespace(options.registry, namespace);
  const counts = countsForRegistry(options.registry);
  counts.delete(namespace);
}

export function registerHypercardWidgetPack(
  options: RegisterHypercardWidgetPackOptions,
): HypercardWidgetPackRegistration {
  const namespace = normalizeNamespace(options.namespace);
  const counts = countsForRegistry(options.registry);
  const count = counts.get(namespace) ?? 0;

  if (count === 0) {
    registerRenderersForNamespace(options.registry, namespace);
  }
  counts.set(namespace, count + 1);

  let unregistered = false;
  return {
    namespace,
    unregister: () => {
      if (unregistered) {
        return;
      }
      unregistered = true;

      const currentCount = counts.get(namespace) ?? 0;
      if (currentCount <= 1) {
        unregisterRenderersForNamespace(options.registry, namespace);
        counts.delete(namespace);
        return;
      }

      counts.set(namespace, currentCount - 1);
    },
  };
}
