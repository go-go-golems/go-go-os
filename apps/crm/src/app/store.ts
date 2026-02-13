import { createAppStore, streamingChatReducer } from '@hypercard/engine';
import { contactsReducer } from '../features/contacts/contactsSlice';
import { companiesReducer } from '../features/companies/companiesSlice';
import { dealsReducer } from '../features/deals/dealsSlice';
import { activitiesReducer } from '../features/activities/activitiesSlice';

export const { store, createStore: createCrmStore } = createAppStore({
  contacts: contactsReducer,
  companies: companiesReducer,
  deals: dealsReducer,
  activities: activitiesReducer,
  streamingChat: streamingChatReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
