import { describe, expect, it, vi } from 'vitest';
import { registerHypercardWidgetPack, unregisterHypercardWidgetPack } from './hypercardWidgetPack';
import { createConversationWidgetRegistry } from './inlineWidgetRegistry';

describe('registerHypercardWidgetPack', () => {
  it('registers timeline/cards/widgets renderers for a namespace', () => {
    const registry = createConversationWidgetRegistry();
    const registration = registerHypercardWidgetPack({
      registry,
      namespace: 'inventory',
    });
    expect(registry.resolve('inventory.timeline')).toBeDefined();
    expect(registry.resolve('inventory.cards')).toBeDefined();
    expect(registry.resolve('inventory.widgets')).toBeDefined();
    registration.unregister();
  });

  it('keeps renderers active until the final registration is unregistered', () => {
    const registry = createConversationWidgetRegistry();
    const first = registerHypercardWidgetPack({ registry, namespace: 'inventory' });
    const second = registerHypercardWidgetPack({ registry, namespace: 'inventory' });

    first.unregister();
    expect(registry.resolve('inventory.timeline')).toBeDefined();

    second.unregister();
    expect(registry.resolve('inventory.timeline')).toBeUndefined();
  });

  it('supports explicit namespace-level unregistration', () => {
    const registry = createConversationWidgetRegistry();
    registerHypercardWidgetPack({ registry, namespace: 'inventory' });
    unregisterHypercardWidgetPack({ registry, namespace: 'inventory' });
    expect(registry.resolve('inventory.timeline')).toBeUndefined();
  });

  it('renders a card panel with host callbacks from context', () => {
    const registry = createConversationWidgetRegistry();
    const registration = registerHypercardWidgetPack({
      registry,
      namespace: 'inventory',
    });
    const onOpenArtifact = vi.fn();
    const onEditCard = vi.fn();
    const rendered = registry.render(
      {
        id: 'w-card',
        type: 'inventory.cards',
        props: {
          items: [
            {
              id: 'card:restock',
              title: 'Restock',
              status: 'success',
              kind: 'card',
              updatedAt: 1,
              artifactId: 'artifact-1',
            },
          ],
        },
      },
      { onOpenArtifact, onEditCard, debug: true },
    );
    expect(rendered).toBeTruthy();
    registration.unregister();
  });
});
