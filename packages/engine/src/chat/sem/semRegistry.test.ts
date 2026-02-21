import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { timelineSlice } from '../state/timelineSlice';
import {
  clearSemHandlers,
  handleSem,
  registerDefaultSemHandlers,
  registerSem,
  type SemContext,
} from './semRegistry';

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
    },
  });
}

describe('semRegistry', () => {
  beforeEach(() => {
    clearSemHandlers();
  });

  it('registers a handler and threads SemContext through handleSem', () => {
    const handler = vi.fn();
    registerSem('custom.event', handler);

    const dispatch = vi.fn();
    const ctx: SemContext = { convId: 'conv-custom', dispatch };

    handleSem(
      {
        sem: true,
        event: {
          type: 'custom.event',
          id: 'evt-1',
        },
      },
      ctx
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'custom.event', id: 'evt-1' }),
      expect.objectContaining({ convId: 'conv-custom', dispatch })
    );
  });

  it('routes default handlers into conversation-scoped timeline actions', () => {
    const store = createStore();
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.delta',
          id: 'msg-1',
          data: {
            cumulative: 'Assistant text',
          },
        },
      },
      { convId: 'conv-1', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.thinking.delta',
          id: 'msg-1',
          data: {
            cumulative: 'Thinking text',
          },
        },
      },
      { convId: 'conv-2', dispatch: store.dispatch }
    );

    const state = store.getState().timeline;

    expect(state.byConvId['conv-1'].order).toEqual(['msg-1']);
    expect(state.byConvId['conv-1'].byId['msg-1'].props).toEqual({
      role: 'assistant',
      content: 'Assistant text',
      streaming: true,
    });

    expect(state.byConvId['conv-2'].order).toEqual(['msg-1']);
    expect(state.byConvId['conv-2'].byId['msg-1'].props).toEqual({
      role: 'thinking',
      content: 'Thinking text',
      streaming: true,
    });
  });

  it('does not create message rows for empty llm/thinking streams', () => {
    const store = createStore();
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.start',
          id: 'msg-empty',
          data: {
            role: 'assistant',
          },
        },
      },
      { convId: 'conv-empty', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.delta',
          id: 'msg-empty',
          data: {
            cumulative: '',
          },
        },
      },
      { convId: 'conv-empty', dispatch: store.dispatch }
    );

    handleSem(
      {
        sem: true,
        event: {
          type: 'llm.final',
          id: 'msg-empty',
          data: {
            text: '',
          },
        },
      },
      { convId: 'conv-empty', dispatch: store.dispatch }
    );

    const state = store.getState().timeline;
    expect(state.byConvId['conv-empty']).toBeUndefined();
  });

  it('does not clear extension handlers when registering defaults', () => {
    const extensionHandler = vi.fn();
    registerSem('hypercard.widget.start', extensionHandler);
    registerDefaultSemHandlers();

    handleSem(
      {
        sem: true,
        event: {
          type: 'hypercard.widget.start',
          id: 'evt-widget',
        },
      },
      { convId: 'conv-1', dispatch: vi.fn() }
    );

    expect(extensionHandler).toHaveBeenCalledTimes(1);
  });
});
