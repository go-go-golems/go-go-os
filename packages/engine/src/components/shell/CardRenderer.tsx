import type { ReactNode } from 'react';
import type { CardDefinition, StackData, StackSettings, DSLAction } from '../../dsl/types';

export interface CardRendererContext {
  data: StackData;
  settings: StackSettings;
  dispatch: (action: DSLAction) => void;
  paramValue?: string;
}

export type CardTypeRenderer = (
  cardDef: CardDefinition,
  context: CardRendererContext,
) => ReactNode | null;

export interface CardRendererProps {
  cardId: string;
  cardDef: CardDefinition;
  context: CardRendererContext;
  customRenderers?: Record<string, CardTypeRenderer>;
}

export function CardRenderer({ cardId, cardDef, context, customRenderers }: CardRendererProps) {
  // Check custom renderers first
  const custom = customRenderers?.[cardDef.type];
  if (custom) {
    const result = custom(cardDef, context);
    if (result !== null) return <>{result}</>;
  }

  // Fallback: no built-in renderers in the engine — the app must supply them
  return (
    <div data-part="card" style={{ padding: 16 }}>
      <div data-part="card-title">{cardDef.icon} {cardDef.title}</div>
      <div style={{ fontSize: 11, opacity: 0.6 }}>
        Card type "{cardDef.type}" (id: {cardId}) — no renderer registered
      </div>
    </div>
  );
}
