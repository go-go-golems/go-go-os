import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../types';
import { MessageRenderer } from '../../chat/renderers/builtin/MessageRenderer';
import type { RenderEntity } from '../../chat/renderers/types';
import { Btn } from './Btn';
import { Chip } from './Chip';

export interface InlineWidget {
  id: string;
  type: string;
  props: Record<string, unknown>;
  label?: string;
}

export type ChatContentBlock =
  | { kind: 'text'; text: string }
  | { kind: 'widget'; widget: InlineWidget };

export interface ChatWindowMessage extends ChatMessage {
  content?: ChatContentBlock[];
}

export interface LegacyTimelineRenderOptions {
  onAction?: (action: unknown) => void;
  renderWidget?: (widget: InlineWidget) => ReactNode;
}

function messageEntity(message: ChatWindowMessage, content: string): RenderEntity {
  return {
    id: message.id ?? `legacy-${Math.random().toString(16).slice(2)}`,
    kind: 'message',
    createdAt: Date.now(),
    props: {
      role: message.role === 'ai' ? 'assistant' : message.role,
      content,
      streaming: message.status === 'streaming',
    },
  };
}

function renderActionChips(message: ChatWindowMessage, options: LegacyTimelineRenderOptions) {
  if (!message.actions || message.status === 'streaming') return null;
  return (
    <div style={{ marginTop: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {message.actions.map((action, index) => (
        <Chip key={`${message.id ?? 'legacy'}-action-${index}`} onClick={() => options.onAction?.(action.action)}>
          {action.label}
        </Chip>
      ))}
    </div>
  );
}

function renderLegacyContentBlocks(
  message: ChatWindowMessage,
  options: LegacyTimelineRenderOptions,
  keyPrefix: string
) {
  const nodes: ReactNode[] = [];
  for (let index = 0; index < (message.content?.length ?? 0); index += 1) {
    const block = message.content?.[index];
    if (!block) continue;

    if (block.kind === 'text') {
      nodes.push(
        <MessageRenderer
          key={`${keyPrefix}-text-${index}`}
          e={messageEntity(message, block.text)}
        />
      );
      continue;
    }

    const renderedWidget = options.renderWidget?.(block.widget);
    if (!renderedWidget) continue;

    nodes.push(
      <div key={`${keyPrefix}-widget-${block.widget.id}`} data-part="chat-window-widget-block">
        {block.widget.label && (
          <div data-part="chat-window-widget-label">{block.widget.label}</div>
        )}
        <div data-part="chat-window-widget-content">{renderedWidget}</div>
      </div>
    );
  }
  return nodes;
}

export function renderLegacyTimelineContent(
  messages: ChatWindowMessage[],
  options: LegacyTimelineRenderOptions = {}
): ReactNode[] {
  const nodes: ReactNode[] = [];

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    const keyPrefix = message.id ?? `legacy-${index}`;

    if (message.content && message.content.length > 0) {
      nodes.push(
        <div key={`${keyPrefix}-blocks`}>
          {renderLegacyContentBlocks(message, options, keyPrefix)}
          {renderActionChips(message, options)}
        </div>
      );
      continue;
    }

    nodes.push(
      <div key={keyPrefix}>
        <MessageRenderer e={messageEntity(message, message.text ?? '')} />
        {message.status === 'error' && (
          <div data-part="chat-window-error">⚠️ An error occurred</div>
        )}
        {renderActionChips(message, options)}
      </div>
    );
  }

  return nodes;
}

export interface ChatWindowProps {
  timelineContent: ReactNode;
  timelineItemCount?: number;
  isStreaming: boolean;
  onSend: (text: string) => void;
  onCancel?: () => void;
  suggestions?: string[];
  showSuggestionsAlways?: boolean;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  welcomeContent?: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
}

function WelcomeScreen({ children }: { children?: ReactNode }) {
  return (
    <div data-part="chat-window-welcome">
      {children ?? (
        <>
          <div data-part="chat-window-welcome-icon">💬</div>
          <div data-part="chat-window-welcome-title">How can I help?</div>
          <div data-part="chat-window-welcome-hint">
            Ask a question, request data, or try one of the suggestions below.
          </div>
        </>
      )}
    </div>
  );
}

export function ChatWindow({
  timelineContent,
  timelineItemCount = 0,
  isStreaming,
  onSend,
  onCancel,
  suggestions,
  showSuggestionsAlways = false,
  title = 'Chat',
  subtitle,
  placeholder,
  welcomeContent,
  footer,
  headerActions,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [timelineContent, timelineItemCount]);

  function send(text: string) {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setInput('');
  }

  const isEmpty = timelineItemCount === 0;

  return (
    <div data-part="chat-window">
      <div data-part="chat-window-header">
        <div data-part="chat-window-header-left">
          <span data-part="chat-window-title">💬 {title}</span>
          {subtitle && (
            <span data-part="chat-window-subtitle">{subtitle}</span>
          )}
        </div>
        <div data-part="chat-window-header-right">
          {headerActions}
          <span data-part="chat-window-msg-count">
            {timelineItemCount} message{timelineItemCount !== 1 ? 's' : ''}
          </span>
          {isStreaming && onCancel && (
            <Btn onClick={onCancel}>⏹ Stop</Btn>
          )}
        </div>
      </div>

      <div data-part="chat-timeline">
        {isEmpty && <WelcomeScreen>{welcomeContent}</WelcomeScreen>}
        {timelineContent}
        <div ref={endRef} />
      </div>

      {suggestions &&
        suggestions.length > 0 &&
        (showSuggestionsAlways || ((isEmpty || timelineItemCount <= 1) && !isStreaming)) && (
          <div data-part="chat-suggestions">
            {suggestions.map((suggestion) => (
              <Chip key={suggestion} onClick={() => send(suggestion)}>
                {suggestion}
              </Chip>
            ))}
          </div>
        )}

      <div data-part="chat-composer">
        <input
          data-part="field-input"
          style={{ flex: 1 }}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && send(input)}
          placeholder={isStreaming ? 'Waiting for response…' : (placeholder ?? 'Type a message…')}
          disabled={isStreaming}
        />
        {isStreaming ? (
          onCancel ? (
            <Btn onClick={onCancel}>⏹ Stop</Btn>
          ) : null
        ) : (
          <Btn onClick={() => send(input)}>Send</Btn>
        )}
      </div>

      {footer && <div data-part="chat-window-footer">{footer}</div>}
    </div>
  );
}
