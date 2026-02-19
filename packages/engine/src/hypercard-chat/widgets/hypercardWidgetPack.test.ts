import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerHypercardWidgetPack } from './hypercardWidgetPack';
import {
  clearRegisteredInlineWidgetRenderers,
  renderInlineWidget,
  resolveInlineWidgetRenderer,
} from './inlineWidgetRegistry';

describe('registerHypercardWidgetPack', () => {
  beforeEach(() => {
    clearRegisteredInlineWidgetRenderers();
  });

  it('registers timeline/cards/widgets renderers for a namespace', () => {
    registerHypercardWidgetPack({ namespace: 'inventory' });
    expect(resolveInlineWidgetRenderer('inventory.timeline')).toBeDefined();
    expect(resolveInlineWidgetRenderer('inventory.cards')).toBeDefined();
    expect(resolveInlineWidgetRenderer('inventory.widgets')).toBeDefined();
  });

  it('renders a card panel with host callbacks from context', () => {
    registerHypercardWidgetPack({ namespace: 'inventory' });
    const onOpenArtifact = vi.fn();
    const onEditCard = vi.fn();
    const rendered = renderInlineWidget(
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
  });
});
