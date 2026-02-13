import { HyperCardShell } from '@hypercard/engine';
import { STACK } from './domain/stack';
import { todoSharedActions, todoSharedSelectors } from './app/cardRuntime';

export function App() {
  return (
    <HyperCardShell
      stack={STACK}
      sharedSelectors={todoSharedSelectors}
      sharedActions={todoSharedActions}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'inProgress', icon: '🔥' },
      ]}
    />
  );
}
