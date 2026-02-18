import { describe, expect, it } from 'vitest';
import {
  routeIncomingEnvelope,
  sortBufferedEnvelopes,
  type SemEventEnvelope,
} from './webchatClient';

describe('sortBufferedEnvelopes', () => {
  it('orders by stream_id when present', () => {
    const envelopes: SemEventEnvelope[] = [
      { sem: true, event: { type: 'llm.delta', id: '2', stream_id: '1700-2', data: {} } },
      { sem: true, event: { type: 'llm.delta', id: '1', stream_id: '1700-1', data: {} } },
    ];

    const sorted = sortBufferedEnvelopes(envelopes);
    expect(sorted.map((e) => e.event?.id)).toEqual(['1', '2']);
  });

  it('falls back to seq ordering when stream_id missing', () => {
    const envelopes: SemEventEnvelope[] = [
      { sem: true, event: { type: 'tool.start', id: 'b', seq: '101', data: {} } },
      { sem: true, event: { type: 'tool.start', id: 'a', seq: '100', data: {} } },
    ];

    const sorted = sortBufferedEnvelopes(envelopes);
    expect(sorted.map((e) => e.event?.id)).toEqual(['a', 'b']);
  });
});

describe('routeIncomingEnvelope', () => {
  it('emits raw envelope and buffers while hydration is pending', () => {
    const raw: string[] = [];
    const projected: string[] = [];
    const state = { hydrated: false, buffered: [] as SemEventEnvelope[] };
    const envelope: SemEventEnvelope = {
      sem: true,
      event: { type: 'llm.delta', id: 'd1', data: {} },
    };

    routeIncomingEnvelope(state, envelope, {
      onRawEnvelope: (e) => raw.push(e.event?.id ?? ''),
      onEnvelope: (e) => projected.push(e.event?.id ?? ''),
    });

    expect(raw).toEqual(['d1']);
    expect(projected).toEqual([]);
    expect(state.buffered).toEqual([envelope]);
  });

  it('emits raw envelope and forwards for projection when hydrated', () => {
    const raw: string[] = [];
    const projected: string[] = [];
    const state = { hydrated: true, buffered: [] as SemEventEnvelope[] };
    const envelope: SemEventEnvelope = {
      sem: true,
      event: { type: 'llm.final', id: 'f1', data: {} },
    };

    routeIncomingEnvelope(state, envelope, {
      onRawEnvelope: (e) => raw.push(e.event?.id ?? ''),
      onEnvelope: (e) => projected.push(e.event?.id ?? ''),
    });

    expect(raw).toEqual(['f1']);
    expect(projected).toEqual(['f1']);
    expect(state.buffered).toEqual([]);
  });
});
