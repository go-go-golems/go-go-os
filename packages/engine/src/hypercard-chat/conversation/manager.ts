import type {
  ConversationManager,
  ConversationRuntime,
  ConversationRuntimeFactory,
} from './types';

interface RuntimeEntry {
  runtime: ConversationRuntime;
  refs: number;
}

export interface CreateConversationManagerOptions {
  createRuntime: ConversationRuntimeFactory;
}

export function createConversationManager(
  options: CreateConversationManagerOptions,
): ConversationManager {
  const { createRuntime } = options;
  const runtimes = new Map<string, RuntimeEntry>();

  const normalizeConversationId = (conversationId: string): string =>
    conversationId.trim();

  return {
    getRuntime(conversationId: string): ConversationRuntime {
      const key = normalizeConversationId(conversationId);
      const existing = runtimes.get(key);
      if (existing) {
        existing.refs += 1;
        return existing.runtime;
      }

      const runtime = createRuntime(key);
      runtimes.set(key, { runtime, refs: 1 });
      return runtime;
    },
    releaseRuntime(conversationId: string): void {
      const key = normalizeConversationId(conversationId);
      const existing = runtimes.get(key);
      if (!existing) return;

      existing.refs -= 1;
      if (existing.refs > 0) {
        return;
      }

      existing.runtime.dispose();
      runtimes.delete(key);
    },
  };
}

