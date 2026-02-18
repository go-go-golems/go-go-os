import type { ChatWindowMessage, TimelineEntity } from '@hypercard/engine';
import { stripTrailingWhitespace } from '../semHelpers';

function shortText(value: string | undefined, max = 180): string | undefined {
  if (!value) return value;
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

export function mapTimelineEntityToMessage(entity: TimelineEntity): ChatWindowMessage {
  if (entity.kind === 'message') {
    const roleRaw =
      typeof entity.props.role === 'string' ? entity.props.role : 'assistant';
    const role: ChatWindowMessage['role'] =
      roleRaw === 'user' ? 'user' : roleRaw === 'system' ? 'system' : 'ai';
    const text =
      typeof entity.props.content === 'string'
        ? stripTrailingWhitespace(entity.props.content)
        : '';
    const streaming = entity.props.streaming === true;
    return {
      id: entity.id,
      role,
      text,
      status: streaming ? 'streaming' : 'complete',
    };
  }

  if (entity.kind === 'tool_call') {
    const name = typeof entity.props.name === 'string' ? entity.props.name : 'tool';
    const done = entity.props.done === true;
    return {
      id: entity.id,
      role: 'system',
      text: done ? `Tool ${name} done` : `Tool ${name} running`,
      status: done ? 'complete' : 'streaming',
    };
  }

  if (entity.kind === 'tool_result') {
    const customKind =
      typeof entity.props.customKind === 'string' && entity.props.customKind.length > 0
        ? ` (${entity.props.customKind})`
        : '';
    const resultText =
      typeof entity.props.resultText === 'string'
        ? entity.props.resultText
        : shortText(
            typeof entity.props.result === 'string'
              ? entity.props.result
              : JSON.stringify(entity.props.result ?? {}),
          ) ?? '';
    return {
      id: entity.id,
      role: 'system',
      text: stripTrailingWhitespace(`Result${customKind}: ${resultText}`),
      status: 'complete',
    };
  }

  if (entity.kind === 'status') {
    const text = typeof entity.props.text === 'string' ? entity.props.text : 'status';
    const type = typeof entity.props.type === 'string' ? entity.props.type : 'info';
    return {
      id: entity.id,
      role: 'system',
      text: `[${type}] ${text}`,
      status: type === 'error' ? 'error' : 'complete',
    };
  }

  if (entity.kind === 'log') {
    const level =
      typeof entity.props.level === 'string' ? entity.props.level : 'info';
    const text =
      typeof entity.props.message === 'string' ? entity.props.message : 'log';
    return {
      id: entity.id,
      role: 'system',
      text: `[${level}] ${text}`,
      status: 'complete',
    };
  }

  return {
    id: entity.id,
    role: 'system',
    text: `${entity.kind}: ${shortText(JSON.stringify(entity.props ?? {})) ?? ''}`,
    status: 'complete',
  };
}
