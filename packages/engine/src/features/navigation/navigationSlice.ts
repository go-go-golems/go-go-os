import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type LayoutMode = 'split' | 'drawer' | 'cardChat';

export interface NavEntry {
  card: string;
  param?: string;
}

export interface NavigationState {
  layout: LayoutMode;
  stack: NavEntry[];
  homeCard: string;
}

const initialState: NavigationState = {
  layout: 'split',
  stack: [{ card: 'home' }],
  homeCard: 'home',
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    /** Initialize navigation from stack definition's homeCard. */
    initializeNavigation(state, action: PayloadAction<{ homeCard: string }>) {
      state.homeCard = action.payload.homeCard;
      state.stack = [{ card: action.payload.homeCard }];
    },
    navigate(state, action: PayloadAction<{ card: string; paramValue?: string }>) {
      state.stack.push({ card: action.payload.card, param: action.payload.paramValue });
    },
    goBack(state) {
      if (state.stack.length > 1) state.stack.pop();
    },
    setLayout(state, action: PayloadAction<LayoutMode>) {
      state.layout = action.payload;
      state.stack = [{ card: state.homeCard }];
    },
    /** Reset navigation to homeCard without changing layout. */
    resetNavigation(state) {
      state.stack = [{ card: state.homeCard }];
    },
  },
});

export const { navigate, goBack, setLayout, initializeNavigation, resetNavigation } = navigationSlice.actions;
export const navigationReducer = navigationSlice.reducer;
