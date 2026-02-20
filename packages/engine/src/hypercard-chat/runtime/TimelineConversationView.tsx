import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Btn } from '../../components/widgets/Btn';
import type { InlineWidget } from '../../components/widgets/ChatWindow';
import { useTimelineEntities } from '../conversation/selectors';
import { formatTimelineEntity } from '../artifacts/timelineProjection';
import type { TimelineEntity } from '../timeline/types';
import type { TimelineWidgetItem } from '../types';
import {
  type ConversationWidgetRegistry,
  type InlineWidgetRenderContext,
} from '../widgets/inlineWidgetRegistry';

function normalizeNamespace(value: string | undefined): string {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? trimmed : 'hypercard';
}

function roleLabel(role: string): string {
  if (role === 'user') return 'You:';
  if (role === 'system') return 'System:';
  if (role === 'thinking') return 'Thinking:';
  return 'AI:';
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function summarizeEntity(entity: TimelineEntity): {
  role: 'system' | 'ai' | 'user';
  text: string;
  status: 'complete' | 'streaming' | 'error';
} {
  if (entity.kind === 'tool_call') {
    const name = asString(entity.props.name) ?? 'tool';
    const done = entity.props.done === true;
    return {
      role: 'system',
      text: done ? `Tool ${name} done` : `Tool ${name} running`,
      status: done ? 'complete' : 'streaming',
    };
  }
  if (entity.kind === 'tool_result') {
    const customKind = asString(entity.props.customKind) ?? '';
    const resultText =
      asString(entity.props.resultText) ??
      (typeof entity.props.result === 'string'
        ? entity.props.result
        : JSON.stringify(entity.props.result ?? {}));
    const prefix = customKind ? `Result (${customKind})` : 'Result';
    return {
      role: 'system',
      text: `${prefix}: ${resultText}`,
      status: 'complete',
    };
  }
  if (entity.kind === 'status') {
    const text = asString(entity.props.text) ?? 'status';
    const type = asString(entity.props.type) ?? 'info';
    return {
      role: 'system',
      text: `[${type}] ${text}`,
      status: type === 'error' ? 'error' : 'complete',
    };
  }
  if (entity.kind === 'log') {
    const level = asString(entity.props.level) ?? 'info';
    const text = asString(entity.props.message) ?? 'log';
    return {
      role: 'system',
      text: `[${level}] ${text}`,
      status: 'complete',
    };
  }
  return {
    role: 'system',
    text: `${entity.kind}: ${JSON.stringify(entity.props ?? {})}`,
    status: 'complete',
  };
}

function widgetDescriptorForEntity(
  entity: TimelineEntity,
  namespace: string,
): InlineWidget | undefined {
  const projected = formatTimelineEntity(entity);
  if (!projected) {
    return undefined;
  }

  type WidgetKind = 'timeline' | 'tool' | 'card' | 'widget';
  const kindToType: Record<WidgetKind, { type: string; label: string }> = {
    timeline: { type: `${namespace}.timeline`, label: 'Run Timeline' },
    tool: { type: `${namespace}.timeline`, label: 'Run Timeline' },
    card: { type: `${namespace}.cards`, label: 'Generated Cards' },
    widget: { type: `${namespace}.widgets`, label: 'Generated Widgets' },
  };
  const widgetKind: WidgetKind =
    projected.kind === 'tool' ||
    projected.kind === 'card' ||
    projected.kind === 'widget'
      ? projected.kind
      : 'timeline';
  const mapping = kindToType[widgetKind];
  const item: TimelineWidgetItem = {
    ...projected,
    updatedAt: entity.updatedAt ?? entity.createdAt,
  };

  return {
    id: `${mapping.type}:${entity.id}`,
    type: mapping.type,
    label: mapping.label,
    props: { items: [item] },
  };
}

export interface TimelineConversationViewProps {
  conversationId: string;
  onSend: (text: string) => void;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  headerActions?: ReactNode;
  footer?: ReactNode;
  widgetRegistry: ConversationWidgetRegistry;
  widgetNamespace?: string;
  widgetRenderContext?: InlineWidgetRenderContext;
  debug?: boolean;
}

export function TimelineConversationView({
  conversationId,
  onSend,
  title = 'Chat',
  subtitle,
  placeholder,
  headerActions,
  footer,
  widgetRegistry,
  widgetNamespace = 'hypercard',
  widgetRenderContext = {},
  debug = false,
}: TimelineConversationViewProps) {
  const [input, setInput] = useState('');
  const timelineEntities = useTimelineEntities(conversationId);
  const endRef = useRef<HTMLDivElement>(null);
  const namespace = normalizeNamespace(widgetNamespace);

  const isStreaming = useMemo(
    () =>
      timelineEntities.some(
        (entity) => entity.kind === 'message' && entity.props.streaming === true,
      ),
    [timelineEntities],
  );

  const scrollKey = useMemo(() => {
    if (timelineEntities.length === 0) return '0';
    const last = timelineEntities[timelineEntities.length - 1];
    const content =
      last.kind === 'message' ? String(last.props.content ?? '') : String(last.kind);
    return `${timelineEntities.length}:${last.id}:${content.length}`;
  }, [timelineEntities]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [scrollKey]);

  const send = (text: string) => {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setInput('');
  };

  const renderEntity = (entity: TimelineEntity, index: number) => {
    if (entity.kind === 'message') {
      const roleRaw = asString(entity.props.role) ?? 'assistant';
      const role: 'user' | 'system' | 'ai' | 'thinking' =
        roleRaw === 'user'
          ? 'user'
          : roleRaw === 'system'
            ? 'system'
            : roleRaw === 'thinking'
              ? 'thinking'
              : 'ai';
      const text = asString(entity.props.content) ?? '';
      return (
        <div key={entity.id || index} data-part="chat-message" data-role={role}>
          <div data-part="chat-role">{roleLabel(role)}</div>
          {debug && (
            <div data-part="chat-window-debug-line">
              [{entity.id} | {entity.kind}]
            </div>
          )}
          <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{text}</div>
        </div>
      );
    }

    const widget = widgetDescriptorForEntity(entity, namespace);
    if (widget) {
      const rendered = widgetRegistry.render(widget, widgetRenderContext);
      return (
        <div key={entity.id || index} data-part="chat-message" data-role="system">
          <div data-part="chat-role">System:</div>
          {debug && (
            <div data-part="chat-window-debug-line">
              [{entity.id} | {entity.kind}]
            </div>
          )}
          {widget.label && (
            <div data-part="chat-window-widget-label">{widget.label}</div>
          )}
          <div data-part="chat-window-widget-content">{rendered}</div>
        </div>
      );
    }

    const summary = summarizeEntity(entity);
    return (
      <div key={entity.id || index} data-part="chat-message" data-role={summary.role}>
        <div data-part="chat-role">{roleLabel(summary.role)}</div>
        {debug && (
          <div data-part="chat-window-debug-line">
            [{entity.id} | {entity.kind}]
          </div>
        )}
        <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{summary.text}</div>
        {summary.status === 'error' && (
          <div data-part="chat-window-error">An error occurred</div>
        )}
      </div>
    );
  };

  return (
    <div data-part="chat-window">
      <div data-part="chat-window-header">
        <div data-part="chat-window-header-left">
          <span data-part="chat-window-title">{title}</span>
          {subtitle && <span data-part="chat-window-subtitle">{subtitle}</span>}
        </div>
        <div data-part="chat-window-header-right">
          {headerActions}
          <span data-part="chat-window-msg-count">
            {timelineEntities.length} items
          </span>
        </div>
      </div>

      <div data-part="chat-timeline">
        {timelineEntities.length === 0 && (
          <div data-part="chat-window-welcome">
            <div data-part="chat-window-welcome-title">How can I help?</div>
            <div data-part="chat-window-welcome-hint">
              Ask a question or request data.
            </div>
          </div>
        )}
        {timelineEntities.map(renderEntity)}
        <div ref={endRef} />
      </div>

      <div data-part="chat-composer">
        <input
          data-part="field-input"
          style={{ flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder={
            isStreaming
              ? 'Waiting for response...'
              : (placeholder ?? 'Type a message...')
          }
          disabled={isStreaming}
        />
        <Btn onClick={() => send(input)} disabled={isStreaming}>
          Send
        </Btn>
      </div>

      {footer && <div data-part="chat-window-footer">{footer}</div>}
    </div>
  );
}
