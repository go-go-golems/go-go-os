import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';
import { chatSessionSlice } from '../state/chatSessionSlice';
import { timelineSlice } from '../state/timelineSlice';
import { clearSemHandlers, handleSem } from '../sem/semRegistry';
import { hypercardArtifactsReducer } from '../../hypercard/artifacts/artifactsSlice';
import {
  ensureChatModulesRegistered,
  resetChatModulesRegistrationForTest,
} from './registerChatModules';

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
      chatSession: chatSessionSlice.reducer,
      hypercardArtifacts: hypercardArtifactsReducer,
    },
  });
}

describe('registerChatModules', () => {
  beforeEach(() => {
    clearSemHandlers();
    resetChatModulesRegistrationForTest();
  });

  it('registers default and hypercard handlers with an idempotent bootstrap', () => {
    ensureChatModulesRegistered();
    ensureChatModulesRegistered();

    const store = createStore();

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.start',
          id: 'msg-1',
          data: {
            role: 'assistant',
          },
        },
      },
      { convId: 'conv-1', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'hypercard.suggestions.v1',
          id: 'evt-suggestions',
          data: {
            suggestions: ['Open card'],
          },
        },
      },
      { convId: 'conv-1', dispatch: store.dispatch }
    );

    const state = store.getState();
    expect(state.timeline.byConvId['conv-1'].byId['msg-1'].kind).toBe('message');
    expect(state.chatSession.byConvId['conv-1'].suggestions).toEqual(['Open card']);
  });
});
