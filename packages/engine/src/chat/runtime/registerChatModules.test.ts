import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatSessionSlice } from '../state/chatSessionSlice';
import { readSuggestionsEntityProps, ASSISTANT_SUGGESTIONS_ENTITY_ID } from '../state/suggestions';
import { timelineSlice } from '../state/timelineSlice';
import { clearSemHandlers, handleSem } from '../sem/semRegistry';
import { hypercardArtifactsReducer } from '../../hypercard/artifacts/artifactsSlice';
import {
  ensureChatModulesRegistered,
  listChatRuntimeModules,
  registerChatRuntimeModule,
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
    expect(
      readSuggestionsEntityProps(
        state.timeline.byConvId['conv-1'].byId[ASSISTANT_SUGGESTIONS_ENTITY_ID]
      )?.items
    ).toEqual(['Open card']);
  });

  it('exposes module contract registration and applies modules once', () => {
    const beforeEnsure = vi.fn();
    registerChatRuntimeModule({
      id: 'test.before-ensure',
      register: beforeEnsure,
    });

    ensureChatModulesRegistered();
    ensureChatModulesRegistered();
    expect(beforeEnsure).toHaveBeenCalledTimes(1);

    const afterEnsure = vi.fn();
    registerChatRuntimeModule({
      id: 'test.after-ensure',
      register: afterEnsure,
    });
    expect(afterEnsure).toHaveBeenCalledTimes(1);

    const modules = listChatRuntimeModules();
    expect(modules).toContain('chat.default-sem');
    expect(modules).toContain('chat.hypercard-timeline');
    expect(modules).toContain('test.before-ensure');
    expect(modules).toContain('test.after-ensure');
  });
});
