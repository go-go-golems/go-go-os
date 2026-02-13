import { generateCardStories } from '@hypercard/engine';
import { bookSharedActions, bookSharedSelectors } from '../app/cardRuntime';
import { createBookStore } from '../app/store';
import { BOOK_STACK } from '../domain/stack';

const snapshotSelector = (state: any) => ({
  navigation: state.navigation,
  books: state.books,
  runtime: state.hypercardRuntime,
});

const { meta, stories } = generateCardStories({
  stack: BOOK_STACK,
  sharedSelectors: bookSharedSelectors,
  sharedActions: bookSharedActions,
  createStore: createBookStore,
  title: 'BookTrackerDebug',
  navShortcuts: [
    { card: 'home', icon: '🏠' },
    { card: 'browse', icon: '📋' },
    { card: 'readingNow', icon: '🔥' },
    { card: 'readingReport', icon: '📊' },
    { card: 'addBook', icon: '➕' },
  ],
  cardParams: {
    bookDetail: 'b1',
  },
  snapshotSelector,
  debugTitle: 'Book Tracker Debug',
});

export default meta;
export const {
  Default,
  Home,
  Browse,
  ReadingNow,
  BookDetail,
  AddBook,
  ReadingReport,
} = stories;
