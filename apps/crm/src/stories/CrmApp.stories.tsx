import { generateCardStories } from '@hypercard/engine';
import { crmSharedActions, crmSharedSelectors } from '../app/cardRuntime';
import { createCrmStore } from '../app/store';
import { CRM_STACK } from '../domain/stack';

const snapshotSelector = (state: any) => ({
  navigation: state.navigation,
  contacts: state.contacts,
  companies: state.companies,
  deals: state.deals,
  activities: state.activities,
  runtime: state.hypercardRuntime,
});

const { meta, stories } = generateCardStories({
  stack: CRM_STACK,
  sharedSelectors: crmSharedSelectors,
  sharedActions: crmSharedActions,
  createStore: createCrmStore,
  title: 'CRM',
  navShortcuts: [
    { card: 'home', icon: '🏠' },
    { card: 'contacts', icon: '👤' },
    { card: 'companies', icon: '🏢' },
    { card: 'deals', icon: '💰' },
    { card: 'pipeline', icon: '📊' },
    { card: 'activityLog', icon: '📝' },
  ],
  cardParams: {
    contactDetail: 'c1',
    companyDetail: 'co1',
    dealDetail: 'd1',
  },
  snapshotSelector,
  debugTitle: 'CRM Debug',
});

export default meta;
export const {
  Default,
  Home,
  Contacts,
  ContactDetail,
  AddContact,
  Companies,
  CompanyDetail,
  Deals,
  OpenDeals,
  DealDetail,
  AddDeal,
  Pipeline,
  ActivityLog,
  AddActivity,
} = stories;
