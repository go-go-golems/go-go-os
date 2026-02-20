import { registerTimelineRenderer } from '../../chat/renderers/rendererRegistry';
import { registerSem } from '../../chat/sem/semRegistry';
import { stringArray } from '../../chat/sem/semHelpers';
import { chatSessionSlice } from '../../chat/state/chatSessionSlice';
import { HypercardCardRenderer, registerHypercardCardSemHandlers } from './hypercardCard';
import { HypercardWidgetRenderer, registerHypercardWidgetSemHandlers } from './hypercardWidget';

function registerHypercardSuggestionSemHandlers() {
  registerSem('hypercard.suggestions.start', (ev, ctx) => {
    const suggestions = stringArray((ev.data as Record<string, unknown>)?.suggestions);
    if (suggestions.length === 0) return;
    ctx.dispatch(
      chatSessionSlice.actions.mergeSuggestions({
        convId: ctx.convId,
        suggestions,
      })
    );
  });

  registerSem('hypercard.suggestions.update', (ev, ctx) => {
    const suggestions = stringArray((ev.data as Record<string, unknown>)?.suggestions);
    if (suggestions.length === 0) return;
    ctx.dispatch(
      chatSessionSlice.actions.mergeSuggestions({
        convId: ctx.convId,
        suggestions,
      })
    );
  });

  registerSem('hypercard.suggestions.v1', (ev, ctx) => {
    const suggestions = stringArray((ev.data as Record<string, unknown>)?.suggestions);
    if (suggestions.length === 0) return;
    ctx.dispatch(
      chatSessionSlice.actions.replaceSuggestions({
        convId: ctx.convId,
        suggestions,
      })
    );
  });
}

export function registerHypercardTimelineModule() {
  registerHypercardWidgetSemHandlers();
  registerHypercardCardSemHandlers();
  registerHypercardSuggestionSemHandlers();

  registerTimelineRenderer('hypercard_widget', HypercardWidgetRenderer);
  registerTimelineRenderer('hypercard_card', HypercardCardRenderer);
}
