import {
  extractArtifactUpsertFromSem,
  registerRuntimeCard,
  type ProjectionPipelineAdapter,
  upsertArtifact,
} from '@hypercard/engine';
import {
  markStreamStart,
  mergeSuggestions,
  replaceSuggestions,
  setModelName,
  setStreamError,
  setTurnStats,
  type TurnStats,
  updateStreamTokens,
} from '../chatSlice';
import { numberField, stringArray, stringField } from '../semHelpers';

function extractMetadata(
  envelope: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const event = envelope.event;
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return undefined;
  }
  const metadata = (event as Record<string, unknown>).metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }
  return metadata as Record<string, unknown>;
}

function extractUsage(
  metadata: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const usage = metadata.usage;
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) {
    return undefined;
  }
  return usage as Record<string, unknown>;
}

export function createInventoryArtifactProjectionAdapter(): ProjectionPipelineAdapter {
  return {
    onEnvelope({ dispatch, envelope }) {
      const type = envelope.event?.type;
      const data = envelope.event?.data ?? {};
      const artifactUpdate = extractArtifactUpsertFromSem(type, data);
      if (!artifactUpdate) return;

      dispatch(upsertArtifact(artifactUpdate));
      if (artifactUpdate.runtimeCardId && artifactUpdate.runtimeCardCode) {
        registerRuntimeCard(artifactUpdate.runtimeCardId, artifactUpdate.runtimeCardCode);
      }
    },
  };
}

export function createChatMetaProjectionAdapter(): ProjectionPipelineAdapter {
  return {
    onEnvelope({ conversationId, dispatch, envelope }) {
      const type = envelope.event?.type;
      const data = envelope.event?.data ?? {};
      const metadata = extractMetadata(envelope as Record<string, unknown>);

      if (type === 'llm.start') {
        if (metadata) {
          const model = stringField(metadata, 'model');
          if (model) {
            dispatch(setModelName({ conversationId, model }));
          }
        }
        dispatch(markStreamStart({ conversationId, time: Date.now() }));
        return;
      }

      if (type === 'llm.delta') {
        if (metadata) {
          const usage = extractUsage(metadata);
          if (usage) {
            const outputTokens = numberField(usage, 'outputTokens');
            if (outputTokens !== undefined) {
              dispatch(updateStreamTokens({ conversationId, outputTokens }));
            }
          }
        }
        return;
      }

      if (type === 'llm.final') {
        if (metadata) {
          const model = stringField(metadata, 'model');
          if (model) {
            dispatch(setModelName({ conversationId, model }));
          }
          const usage = extractUsage(metadata);
          const stats: TurnStats = {};
          if (usage) {
            stats.inputTokens = numberField(usage, 'inputTokens');
            stats.outputTokens = numberField(usage, 'outputTokens');
            stats.cachedTokens = numberField(usage, 'cachedTokens');
            stats.cacheCreationInputTokens = numberField(usage, 'cacheCreationInputTokens');
            stats.cacheReadInputTokens = numberField(usage, 'cacheReadInputTokens');
          }
          stats.durationMs = numberField(metadata, 'durationMs');
          if (
            stats.inputTokens !== undefined ||
            stats.outputTokens !== undefined ||
            stats.durationMs !== undefined
          ) {
            dispatch(setTurnStats({ conversationId, ...stats }));
          }
        }
        return;
      }

      if (type === 'hypercard.suggestions.start' || type === 'hypercard.suggestions.update') {
        const suggestions = stringArray(data.suggestions);
        if (suggestions.length > 0) {
          dispatch(mergeSuggestions({ conversationId, suggestions }));
        }
        return;
      }

      if (type === 'hypercard.suggestions.v1') {
        const suggestions = stringArray(data.suggestions);
        if (suggestions.length > 0) {
          dispatch(replaceSuggestions({ conversationId, suggestions }));
        }
        return;
      }

      if (type === 'ws.error') {
        dispatch(
          setStreamError({
            conversationId,
            message: stringField(data, 'message') ?? 'websocket stream error',
          }),
        );
      }
    },
  };
}
