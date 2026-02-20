import { describe, expect, it } from 'vitest';
import type { InlineWidget } from '../../components/widgets';
import { createConversationWidgetRegistry } from './inlineWidgetRegistry';

function sampleWidget(type = 'inventory.timeline'): InlineWidget {
  return {
    id: 'w-1',
    type,
    props: { items: [] },
  };
}

describe('inlineWidgetRegistry', () => {
  it('registers and resolves a renderer by widget type', () => {
    const registry = createConversationWidgetRegistry();
    registry.register('inventory.timeline', (widget) => `rendered:${widget.id}`);
    const renderer = registry.resolve('inventory.timeline');
    expect(renderer).toBeDefined();
    expect(registry.render(sampleWidget(), {})).toBe('rendered:w-1');
  });

  it('supports temporary overrides', () => {
    const registry = createConversationWidgetRegistry();
    registry.register('inventory.timeline', () => 'base');
    const rendered = registry.render(sampleWidget(), {}, {
      'inventory.timeline': () => 'override',
    });
    expect(rendered).toBe('override');
  });

  it('returns null when no renderer is registered', () => {
    const registry = createConversationWidgetRegistry();
    expect(registry.render(sampleWidget('missing.widget'))).toBeNull();
  });

  it('can unregister renderers', () => {
    const registry = createConversationWidgetRegistry();
    registry.register('inventory.timeline', () => 'base');
    registry.unregister('inventory.timeline');
    expect(registry.resolve('inventory.timeline')).toBeUndefined();
  });

  it('supports independent per-window registries', () => {
    const a = createConversationWidgetRegistry();
    const b = createConversationWidgetRegistry();

    a.register('inventory.timeline', () => 'a-only');
    b.register('inventory.timeline', () => 'b-only');

    expect(a.render(sampleWidget())).toBe('a-only');
    expect(b.render(sampleWidget())).toBe('b-only');
  });
});
