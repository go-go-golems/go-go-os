import { describe, expect, it } from 'vitest';
import { mapTimelineEntityToMessage } from './timelineEntityRenderer';

describe('mapTimelineEntityToMessage', () => {
  it('renders hypercard widget results with concise widget prefix', () => {
    const message = mapTimelineEntityToMessage({
      id: 'w-1:result',
      kind: 'tool_result',
      createdAt: 1,
      props: {
        customKind: 'hypercard.widget.v1',
        resultText: 'Widget ready: Low stock items (table, artifact=low-stock-items)',
      },
    });

    expect(message.text).toBe(
      'Widget: Widget ready: Low stock items (table, artifact=low-stock-items)',
    );
  });

  it('renders hypercard card results with concise card prefix', () => {
    const message = mapTimelineEntityToMessage({
      id: 'c-1:result',
      kind: 'tool_result',
      createdAt: 1,
      props: {
        customKind: 'hypercard.card.v2',
        resultText: 'Card ready: Restock plan (template=reportViewer)',
      },
    });

    expect(message.text).toBe('Card: Card ready: Restock plan (template=reportViewer)');
  });
});
