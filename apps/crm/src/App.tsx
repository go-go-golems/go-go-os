import {
  HyperCardShell,
  StandardDebugPane,
  useStandardDebugHooks,
} from '@hypercard/engine';
import { crmSharedActions, crmSharedSelectors } from './app/cardRuntime';
import { CRM_STACK } from './domain/stack';

const snapshotSelector = (state: any) => ({
  navigation: state.navigation,
  contacts: state.contacts,
  companies: state.companies,
  deals: state.deals,
  activities: state.activities,
  runtime: state.hypercardRuntime,
});

export function App() {
  const debugHooks = useStandardDebugHooks();

  return (
    <HyperCardShell
      stack={CRM_STACK}
      sharedSelectors={crmSharedSelectors}
      sharedActions={crmSharedActions}
      debugHooks={debugHooks}
      layoutMode="debugPane"
      renderDebugPane={() => (
        <StandardDebugPane
          title="CRM Debug"
          snapshotSelector={snapshotSelector}
        />
      )}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'contacts', icon: '👤' },
        { card: 'companies', icon: '🏢' },
        { card: 'deals', icon: '💰' },
        { card: 'pipeline', icon: '📊' },
        { card: 'activityLog', icon: '📝' },
      ]}
    />
  );
}
