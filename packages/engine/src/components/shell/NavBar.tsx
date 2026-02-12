import type { CardDefinition, DSLAction } from '../../dsl/types';
import { Btn } from '../widgets/Btn';

export interface NavBarProps {
  currentCard: string;
  cardDef?: CardDefinition;
  navDepth: number;
  onAction: (action: DSLAction) => void;
  shortcuts?: Array<{ card: string; icon: string }>;
}

export function NavBar({ currentCard, cardDef, navDepth, onAction, shortcuts }: NavBarProps) {
  return (
    <div data-part="nav-bar">
      {navDepth > 1 && (
        <Btn onClick={() => onAction({ type: 'back' })}>⬅</Btn>
      )}
      {shortcuts?.map((s) => (
        <Btn
          key={s.card}
          active={currentCard === s.card}
          onClick={() => onAction({ type: 'navigate', card: s.card })}
        >
          {s.icon}
        </Btn>
      ))}
      {cardDef && (
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>
          {cardDef.icon} {cardDef.title}
        </span>
      )}
    </div>
  );
}
