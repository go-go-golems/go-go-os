import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatProfileListItem } from '../runtime/profileTypes';

export interface ChatProfilesState {
  availableProfiles: ChatProfileListItem[];
  selectedProfile: string | null;
  selectedRegistry: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChatProfilesState = {
  availableProfiles: [],
  selectedProfile: null,
  selectedRegistry: null,
  loading: false,
  error: null,
};

export const chatProfilesSlice = createSlice({
  name: 'chatProfiles',
  initialState,
  reducers: {
    setAvailableProfiles(state, action: PayloadAction<ChatProfileListItem[]>) {
      state.availableProfiles = action.payload;
    },
    setProfileLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setProfileError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.loading = false;
      }
    },
    setSelectedProfile(
      state,
      action: PayloadAction<{ profile: string | null; registry?: string | null }>
    ) {
      state.selectedProfile = action.payload.profile;
      if (action.payload.registry !== undefined) {
        state.selectedRegistry = action.payload.registry;
      }
    },
    clearSelectedProfile(state) {
      state.selectedProfile = null;
      state.selectedRegistry = null;
    },
  },
});

export const chatProfilesReducer = chatProfilesSlice.reducer;
