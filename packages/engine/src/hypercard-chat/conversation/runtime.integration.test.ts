import { describe, expect, it, vi } from 'vitest';
import { createSemRegistry } from '../sem/registry';
import { createConversationRuntime } from './runtime';

describe('conversation runtime integration', () => {
  it('keeps a single transport connection for two window claims', () => {
    const connect = vi.fn();
    const close = vi.fn();

    const runtime = createConversationRuntime({
      conversationId: 'conv-1',
      semRegistry: createSemRegistry(),
      createClient: () => ({
        connect,
        close,
      }),
    });

    const releaseWindowA = runtime.claimConnection();
    const releaseWindowB = runtime.claimConnection();
    expect(connect).toHaveBeenCalledTimes(1);

    releaseWindowA();
    expect(close).toHaveBeenCalledTimes(0);

    releaseWindowB();
    expect(close).toHaveBeenCalledTimes(1);
  });
});

