import { type ReactNode, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatWindow } from '../../components/widgets/ChatWindow';
import {
  getTimelineRendererRegistryVersion,
  resolveTimelineRenderers,
  subscribeTimelineRenderers,
} from '../renderers/rendererRegistry';
import type { RenderEntity, RenderMode } from '../renderers/types';
import {
  type ChatStateSlice,
  selectCurrentTurnStats,
  selectConversationTotalTokens,
  selectModelName,
  selectRenderableTimelineEntities,
  selectTimelineEntityById,
  selectStreamOutputTokens,
  selectStreamStartTime,
  selectSuggestions,
} from '../state/selectors';
import {
  ASSISTANT_SUGGESTIONS_ENTITY_ID,
  DEFAULT_CHAT_SUGGESTIONS,
  readSuggestionsEntityProps,
  STARTER_SUGGESTIONS_ENTITY_ID,
} from '../state/suggestions';
import { timelineSlice } from '../state/timelineSlice';
import { isRecord } from '../utils/guards';
import { useConversation } from '../runtime/useConversation';
import { useCurrentProfile } from '../runtime/useCurrentProfile';
import {
  advancePendingAiTurn,
  beginPendingAiTurn,
  createPendingAiTurnIdleState,
  markPendingAiTurnError,
  shouldShowPendingAiPlaceholder,
} from '../runtime/pendingAiTurnMachine';
import { useProfiles } from '../runtime/useProfiles';
import { useSetProfile } from '../runtime/useSetProfile';
import {
  resolveProfileSelectionChange,
  resolveProfileSelectorValue,
} from './profileSelectorState';
import { StatsFooter } from './StatsFooter';
import { getDebugLogger } from '../debug/debugChannels';

export interface ChatConversationWindowProps {
  convId: string;
  basePrefix?: string;
  title?: string;
  placeholder?: string;
  headerActions?: ReactNode;
  enableProfileSelector?: boolean;
  profileRegistry?: string;
  profileScopeKey?: string;
  renderMode?: RenderMode;
}

const turnLog = getDebugLogger('chat:conversation:turn');

function toRenderEntity(entity: {
  id: string;
  kind: string;
  createdAt: number;
  updatedAt?: number;
  props: unknown;
}): RenderEntity {
  return {
    id: entity.id,
    kind: entity.kind,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    props: isRecord(entity.props) ? entity.props : {},
  };
}

export function ChatConversationWindow({
  convId,
  basePrefix = '',
  title = 'Chat',
  placeholder,
  headerActions,
  enableProfileSelector = false,
  profileRegistry,
  profileScopeKey,
  renderMode = 'normal',
}: ChatConversationWindowProps) {
  const dispatch = useDispatch();
  const { send, connectionStatus, isStreaming } = useConversation(convId, basePrefix, profileScopeKey);
  const { profiles, loading: profilesLoading, error: profileError } = useProfiles(
    basePrefix,
    profileRegistry,
    { enabled: enableProfileSelector, scopeKey: profileScopeKey }
  );
  const currentProfile = useCurrentProfile(profileScopeKey);
  const setProfile = useSetProfile(basePrefix, { scopeKey: profileScopeKey });
  const [pendingTurn, setPendingTurn] = useState(() => createPendingAiTurnIdleState('init'));

  const entities = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectRenderableTimelineEntities(state, convId)
  );
  const starterSuggestionsEntity = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectTimelineEntityById(state, convId, STARTER_SUGGESTIONS_ENTITY_ID)
  );
  const suggestions = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectSuggestions(state, convId)
  );
  const modelName = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectModelName(state, convId)
  );
  const turnStats = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectCurrentTurnStats(state, convId)
  );
  const streamStartTime = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectStreamStartTime(state, convId)
  );
  const streamOutputTokens = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectStreamOutputTokens(state, convId)
  );
  const conversationTotalTokens = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectConversationTotalTokens(state, convId)
  );

  useEffect(() => {
    if (entities.length > 0) {
      return;
    }
    if (readSuggestionsEntityProps(starterSuggestionsEntity)) {
      return;
    }
    dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId,
        entityId: STARTER_SUGGESTIONS_ENTITY_ID,
        source: 'starter',
        suggestions: DEFAULT_CHAT_SUGGESTIONS,
        replace: true,
      })
    );
  }, [convId, dispatch, entities.length, starterSuggestionsEntity]);

  useEffect(() => {
    setPendingTurn((previous) => {
      if (previous.phase !== 'idle') {
        turnLog('turn:reset conv=%s prev=%o reason=conv-change', convId, previous);
      }
      return createPendingAiTurnIdleState('conv-change');
    });
  }, [convId]);

  useEffect(() => {
    setPendingTurn((previous) => {
      const next = advancePendingAiTurn(previous, {
        entities: entities as Array<{ id: string; kind: string; props: unknown }>,
        connectionStatus,
      });
      if (next !== previous) {
        turnLog(
          'turn:transition conv=%s status=%s entities=%d prev=%o next=%o',
          convId,
          connectionStatus,
          entities.length,
          previous,
          next
        );
      }
      return next;
    });
  }, [connectionStatus, convId, entities]);

  const sendWithSuggestionLifecycle = useCallback(
    async (prompt: string) => {
      const startState = beginPendingAiTurn(entities.length);
      turnLog(
        'turn:submit conv=%s promptLen=%d entities=%d state=%o',
        convId,
        prompt.length,
        entities.length,
        startState
      );
      setPendingTurn(startState);
      dispatch(
        timelineSlice.actions.upsertSuggestions({
          convId,
          entityId: STARTER_SUGGESTIONS_ENTITY_ID,
          source: 'starter',
          suggestions: DEFAULT_CHAT_SUGGESTIONS,
          replace: true,
        })
      );
      dispatch(
        timelineSlice.actions.consumeSuggestions({
          convId,
          entityId: STARTER_SUGGESTIONS_ENTITY_ID,
        })
      );
      dispatch(
        timelineSlice.actions.consumeSuggestions({
          convId,
          entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        })
      );
      try {
        await send(prompt);
      } catch (error) {
        const errorState = markPendingAiTurnError('send-error');
        turnLog('turn:error conv=%s error=%o next=%o', convId, error, errorState);
        setPendingTurn(errorState);
        throw error;
      }
    },
    [convId, dispatch, entities.length, send]
  );

  const rendererRegistryVersion = useSyncExternalStore(
    subscribeTimelineRenderers,
    getTimelineRendererRegistryVersion,
    getTimelineRendererRegistryVersion
  );
  const renderers = useMemo(
    () => resolveTimelineRenderers(),
    [rendererRegistryVersion]
  );

  const timelineContent = useMemo(
    () =>
      entities.map((entity) => {
        const renderEntity = toRenderEntity(entity);
        const Renderer = renderers[renderEntity.kind] ?? renderers.default;
        return <Renderer key={renderEntity.id} e={renderEntity} ctx={{ mode: renderMode, convId }} />;
      }),
    [convId, entities, renderMode, renderers]
  );

  const subtitle =
    connectionStatus === 'connected'
      ? 'connected'
      : connectionStatus === 'connecting'
        ? 'connecting…'
        : connectionStatus;
  const defaultProfileSlug = profiles.find((profile) => profile.is_default)?.slug ?? '';
  const selectedProfileValue = resolveProfileSelectorValue(
    profiles,
    currentProfile.profile
  );

  const profileSelector = enableProfileSelector ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <label htmlFor={`chat-profile-${convId}`} style={{ fontSize: 11, opacity: 0.8 }}>
        Profile
      </label>
      <select
        id={`chat-profile-${convId}`}
        value={selectedProfileValue}
        onChange={(event) => {
          const nextProfile = resolveProfileSelectionChange(
            event.target.value,
            defaultProfileSlug
          );
          const resolvedRegistry = profileRegistry ?? currentProfile.registry ?? null;
          if (nextProfile) {
            void setProfile(nextProfile, resolvedRegistry);
            return;
          }
          void setProfile(null, resolvedRegistry);
        }}
        disabled={profilesLoading}
        style={{ fontSize: 11, padding: '1px 4px', maxWidth: 180 }}
      >
        {profilesLoading ? <option value="">Loading…</option> : null}
        {!profilesLoading && profiles.length === 0 ? <option value="">No profiles</option> : null}
        {profiles.map((profile) => (
          <option key={profile.slug} value={profile.slug}>
            {(profile.display_name?.trim() || profile.slug) + (profile.is_default ? ' (default)' : '')}
          </option>
        ))}
      </select>
      {profileError ? (
        <span style={{ fontSize: 10, color: '#b45309' }} title={profileError}>
          profile error
        </span>
      ) : null}
    </div>
  ) : null;

  const composedHeaderActions =
    profileSelector || headerActions
      ? (
          <>
            {profileSelector}
            {headerActions}
          </>
        )
      : undefined;

  return (
    <ChatWindow
      timelineContent={timelineContent}
      timelineItemCount={entities.length}
      conversationTotalTokens={conversationTotalTokens}
      isStreaming={isStreaming}
      showPendingResponseSpinner={shouldShowPendingAiPlaceholder(pendingTurn)}
      onSend={sendWithSuggestionLifecycle}
      suggestions={suggestions}
      showSuggestionsAlways
      title={title}
      subtitle={subtitle}
      placeholder={placeholder}
      headerActions={composedHeaderActions}
      footer={
        <StatsFooter
          modelName={modelName}
          turnStats={turnStats}
          isStreaming={isStreaming}
          streamStartTime={streamStartTime}
          streamOutputTokens={streamOutputTokens}
        />
      }
    />
  );
}
