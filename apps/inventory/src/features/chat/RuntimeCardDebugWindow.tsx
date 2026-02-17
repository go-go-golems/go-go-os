import {
  RuntimeCardDebugWindow as EngineRuntimeCardDebugWindow,
  openRuntimeCardCodeEditor,
} from '@hypercard/engine';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { STACK } from '../../domain/stack';

export function RuntimeCardDebugWindow() {
  const dispatch = useDispatch();

  const stack = useMemo(
    () => ({
      id: STACK.id,
      name: STACK.name,
      homeCard: STACK.homeCard,
      cards: Object.values(STACK.cards).map((card) => ({
        id: card.id,
        title: card.title,
        icon: card.icon,
        type: card.type,
      })),
    }),
    [],
  );

  return (
    <EngineRuntimeCardDebugWindow
      stack={stack}
      onOpenCodeEditor={(cardId, code) => openRuntimeCardCodeEditor(dispatch, cardId, code)}
    />
  );
}
