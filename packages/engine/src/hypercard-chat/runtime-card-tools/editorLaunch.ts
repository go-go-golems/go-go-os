import type { Dispatch } from 'redux';
import { openWindow } from '../../desktop/core/state';
import { getPendingRuntimeCards } from '../../plugin-runtime';

const pendingCode = new Map<string, string>();

/**
 * Stash code for a runtime card editor and open editor window.
 */
export function openRuntimeCardCodeEditor(
  dispatch: Dispatch,
  cardId: string,
  code: string,
): void {
  pendingCode.set(cardId, code);
  dispatch(
    openWindow({
      id: `window:code-editor:${cardId}`,
      title: `✏️ ${cardId}`,
      icon: '✏️',
      bounds: { x: 100, y: 40, w: 600, h: 500 },
      content: { kind: 'app', appKey: `code-editor:${cardId}` },
      dedupeKey: `code-editor:${cardId}`,
    }),
  );
}

/**
 * Resolve initial code for an editor window.
 */
export function getRuntimeCardEditorInitialCode(cardId: string): string {
  const stashed = pendingCode.get(cardId);
  if (stashed !== undefined) {
    pendingCode.delete(cardId);
    return stashed;
  }

  const cards = getPendingRuntimeCards();
  const found = cards.find((card) => card.cardId === cardId);
  return found?.code ?? `// No code found for card: ${cardId}\n`;
}
