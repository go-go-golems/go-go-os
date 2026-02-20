import { describe, expect, it, vi } from 'vitest';
import { createConversationManager } from './manager';
import type { ConversationRuntime } from './types';

function createMockRuntime(dispose: () => void): ConversationRuntime {
  return {
    getState: () => ({
      conversationId: 'mock',
      connection: { status: 'idle' },
      timeline: { ids: [], byId: {} },
      meta: {},
    }),
    subscribe: () => () => {},
    claimConnection: () => () => {},
    ingestEnvelope: () => {},
    hydrateSnapshot: () => {},
    setConnectionStatus: () => {},
    dispose,
  };
}

describe('createConversationManager', () => {
  it('returns the same runtime for the same conversation id', () => {
    const createRuntime = vi.fn(() => createMockRuntime(vi.fn()));
    const manager = createConversationManager({ createRuntime });

    const a = manager.getRuntime('conv-1');
    const b = manager.getRuntime('conv-1');

    expect(a).toBe(b);
    expect(createRuntime).toHaveBeenCalledTimes(1);
    expect(createRuntime).toHaveBeenCalledWith('conv-1');
  });

  it('returns different runtimes for different conversation ids', () => {
    const createRuntime = vi.fn(() => createMockRuntime(vi.fn()));
    const manager = createConversationManager({ createRuntime });

    const a = manager.getRuntime('conv-1');
    const b = manager.getRuntime('conv-2');

    expect(a).not.toBe(b);
    expect(createRuntime).toHaveBeenCalledTimes(2);
    expect(createRuntime).toHaveBeenNthCalledWith(1, 'conv-1');
    expect(createRuntime).toHaveBeenNthCalledWith(2, 'conv-2');
  });

  it('disposes and removes runtime after last release', () => {
    const dispose = vi.fn();
    const createRuntime = vi.fn(() => createMockRuntime(dispose));
    const manager = createConversationManager({ createRuntime });

    manager.getRuntime('conv-1');
    manager.getRuntime('conv-1');

    manager.releaseRuntime('conv-1');
    expect(dispose).not.toHaveBeenCalled();

    manager.releaseRuntime('conv-1');
    expect(dispose).toHaveBeenCalledTimes(1);

    const next = manager.getRuntime('conv-1');
    expect(next).toBeDefined();
    expect(createRuntime).toHaveBeenCalledTimes(2);
  });
});

