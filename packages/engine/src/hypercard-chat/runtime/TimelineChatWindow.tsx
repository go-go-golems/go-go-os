import { type ReactNode, useCallback, useMemo } from 'react';
import { ChatWindow, type InlineWidget } from '../../components/widgets/ChatWindow';
import type { TimelineEntity } from '../timeline/types';
import { type InlineWidgetRenderContext, renderInlineWidget } from '../widgets/inlineWidgetRegistry';
import { buildTimelineDisplayMessages } from './timelineDisplayMessages';

export interface TimelineChatWindowProps {
  timelineEntities: TimelineEntity[];
  isStreaming: boolean;
  onSend: (text: string) => void;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  headerActions?: ReactNode;
  footer?: ReactNode;
  widgetNamespace?: string;
  widgetRenderContext?: InlineWidgetRenderContext;
  debug?: boolean;
}

export function TimelineChatWindow({
  timelineEntities,
  isStreaming,
  onSend,
  title,
  subtitle,
  placeholder,
  headerActions,
  footer,
  widgetNamespace = 'hypercard',
  widgetRenderContext = {},
  debug = false,
}: TimelineChatWindowProps) {
  const messages = useMemo(() => {
    return buildTimelineDisplayMessages(timelineEntities, {
      widgetNamespace,
    }).map((message) => {
      if (!debug || !message.id) {
        return message;
      }
      const badge = `[${message.id} | ${message.status ?? '—'} | ${message.role}]`;
      const existingContent = message.content ?? (message.text ? [{ kind: 'text' as const, text: message.text }] : []);
      return {
        ...message,
        content: [{ kind: 'text' as const, text: badge }, ...existingContent],
      };
    });
  }, [debug, timelineEntities, widgetNamespace]);

  const renderWidget = useCallback(
    (widget: InlineWidget) => renderInlineWidget(widget, widgetRenderContext),
    [widgetRenderContext],
  );

  return (
    <ChatWindow
      messages={messages}
      isStreaming={isStreaming}
      onSend={onSend}
      renderWidget={renderWidget}
      title={title}
      subtitle={subtitle}
      placeholder={placeholder}
      headerActions={headerActions}
      footer={footer}
    />
  );
}
