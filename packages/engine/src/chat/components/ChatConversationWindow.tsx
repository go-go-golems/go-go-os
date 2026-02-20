import { type ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ChatWindow } from '../../components/widgets/ChatWindow';
import {
  registerDefaultTimelineRenderers,
  resolveTimelineRenderers,
} from '../renderers/rendererRegistry';
import type { RenderEntity } from '../renderers/types';
import {
  type ChatStateSlice,
  selectConnectionStatus,
  selectCurrentTurnStats,
  selectModelName,
  selectStreamOutputTokens,
  selectStreamStartTime,
  selectSuggestions,
  selectTimelineEntities,
} from '../state/selectors';
import { isRecord } from '../utils/guards';
import { useConversation } from '../runtime/useConversation';
import { StatsFooter } from './StatsFooter';

export interface ChatConversationWindowProps {
  convId: string;
  basePrefix?: string;
  title?: string;
  placeholder?: string;
  headerActions?: ReactNode;
}

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
}: ChatConversationWindowProps) {
  const { send, connectionStatus, isStreaming } = useConversation(convId, basePrefix);

  const entities = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectTimelineEntities(state, convId)
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

  const renderers = useMemo(() => {
    registerDefaultTimelineRenderers();
    return resolveTimelineRenderers();
  }, []);

  const timelineContent = useMemo(
    () =>
      entities.map((entity) => {
        const renderEntity = toRenderEntity(entity);
        const Renderer = renderers[renderEntity.kind] ?? renderers.default;
        return <Renderer key={renderEntity.id} e={renderEntity} />;
      }),
    [entities, renderers]
  );

  const subtitle =
    connectionStatus === 'connected'
      ? 'connected'
      : connectionStatus === 'connecting'
        ? 'connecting…'
        : connectionStatus;

  return (
    <ChatWindow
      timelineContent={timelineContent}
      timelineItemCount={entities.length}
      isStreaming={isStreaming}
      onSend={send}
      suggestions={suggestions}
      showSuggestionsAlways
      title={title}
      subtitle={subtitle}
      placeholder={placeholder}
      headerActions={headerActions}
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
