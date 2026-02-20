import type { ConversationTimeline, TimelineEntity, TimelineRootState, TimelineState } from './types';

const EMPTY_CONVERSATION: ConversationTimeline = {
  byId: {},
  order: [],
};

function timelineState(state: TimelineRootState): TimelineState | undefined {
  return state.timeline ?? state.timelineCore;
}

export function selectConversationTimeline(
  state: TimelineRootState,
  convId: string,
): ConversationTimeline {
  return timelineState(state)?.conversations?.[convId] ?? EMPTY_CONVERSATION;
}

export function selectTimelineEntityById(
  state: TimelineRootState,
  convId: string,
  entityId: string,
): TimelineEntity | undefined {
  return selectConversationTimeline(state, convId).byId[entityId];
}
