import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { Act, defineCardStack, ui } from '../../../cards/helpers';
import { hypercardRuntimeReducer } from '../../../cards/runtimeStateSlice';
import type { CardStackDefinition } from '../../../cards/types';
import { notificationsReducer } from '../../../features/notifications/notificationsSlice';
import { openWindow, windowingReducer } from '../../../features/windowing/windowingSlice';
import { CardSessionHost, type CardSessionHostProps } from './CardSessionHost';

// ── Demo stacks ──

/** Stack with two navigable cards — menu → detail → back */
const NAV_STACK: CardStackDefinition = defineCardStack({
  id: 'nav-demo',
  name: 'Nav Demo',
  icon: '🧭',
  homeCard: 'list',
  cards: {
    list: {
      id: 'list',
      type: 'menu',
      title: 'Item List',
      icon: '📋',
      ui: ui.menu({
        icon: '📋',
        labels: [{ value: 'Items' }],
        buttons: [
          { label: '🔍 View Widget A', action: Act('nav.go', { card: 'detail', param: 'widget-a' }) },
          { label: '🔍 View Widget B', action: Act('nav.go', { card: 'detail', param: 'widget-b' }) },
          { label: '🔍 View Widget C', action: Act('nav.go', { card: 'detail', param: 'widget-c' }) },
        ],
      }),
    },
    detail: {
      id: 'detail',
      type: 'detail',
      title: 'Item Detail',
      icon: '📄',
      ui: ui.detail({
        record: {
          name: 'Widget A',
          sku: 'W-1001',
          category: 'Widgets',
          price: '$12.00',
          stock: '45 units',
          supplier: 'Acme Corp',
          lastRestock: 'Feb 10, 2026',
        },
        fields: [
          { id: 'name', label: 'Name', type: 'readonly' },
          { id: 'sku', label: 'SKU', type: 'readonly' },
          { id: 'category', label: 'Category', type: 'readonly' },
          { id: 'price', label: 'Price', type: 'readonly' },
          { id: 'stock', label: 'Stock', type: 'readonly' },
          { id: 'supplier', label: 'Supplier', type: 'readonly' },
          { id: 'lastRestock', label: 'Last Restock', type: 'readonly' },
        ],
        actions: [
          { label: '← Back', action: Act('nav.back') },
          { label: '🛒 Reorder', action: Act('toast', { message: 'Reorder placed' }) },
        ],
      }),
      bindings: {
        backBtn: {
          press: Act('nav.back'),
        },
      },
    },
  },
});

/** Chat card stack with conversation history */
const CHAT_STACK: CardStackDefinition = defineCardStack({
  id: 'chat-demo',
  name: 'Chat Demo',
  icon: '💬',
  homeCard: 'chat',
  cards: {
    chat: {
      id: 'chat',
      type: 'chat',
      title: 'Assistant',
      icon: '💬',
      ui: ui.chat({
        key: 'chatView',
        messages: [
          { role: 'assistant', content: 'Hello! How can I help you today?' },
          { role: 'user', content: 'Show me the inventory report.' },
          {
            role: 'assistant',
            content:
              'Here is a summary:\n\n• **Widgets**: 45 items ($540.00)\n• **Gadgets**: 38 items ($969.00)\n• **Parts**: 73 items ($237.25)\n\nTotal value: **$1,746.25**\n\nWould you like more details on any category?',
          },
          { role: 'user', content: 'Which items are low on stock?' },
          {
            role: 'assistant',
            content:
              'These items are below the reorder threshold:\n\n1. **Gizmo E** (G-2002) — 5 units remaining\n2. **Widget D** (W-1002) — 12 units remaining\n\nShall I create a purchase order?',
          },
        ],
        placeholder: 'Type a message…',
        suggestions: ['Show all items', 'Generate purchase order', 'Export to CSV'],
      }),
    },
  },
});

/** Report card stack with data rows */
const REPORT_STACK: CardStackDefinition = defineCardStack({
  id: 'report-demo',
  name: 'Report Demo',
  icon: '📊',
  homeCard: 'report',
  cards: {
    report: {
      id: 'report',
      type: 'report',
      title: 'Monthly Report',
      icon: '📊',
      ui: ui.report({
        sections: [
          { label: 'Gross Revenue', value: '$12,450.00' },
          { label: 'Net Revenue', value: '$10,830.00' },
          { label: 'Refunds', value: '$620.00' },
          { label: 'Items in Stock', value: '156' },
          { label: 'Low Stock Alerts', value: '3' },
          { label: 'Out of Stock', value: '0' },
          { label: 'Orders This Month', value: '89' },
          { label: 'Avg. Order Value', value: '$139.89' },
        ],
        actions: [{ label: '📄 Export CSV', action: Act('toast', { message: 'Export not available in demo' }) }],
      }),
    },
  },
});

/** List card stack with data and filters */
const LIST_STACK: CardStackDefinition = defineCardStack({
  id: 'list-demo',
  name: 'List Demo',
  icon: '📋',
  homeCard: 'browse',
  cards: {
    browse: {
      id: 'browse',
      type: 'list',
      title: 'Browse Items',
      icon: '📋',
      ui: ui.list({
        key: 'browseList',
        items: [
          { id: '1', sku: 'W-1001', name: 'Widget A', category: 'Widgets', price: '$12.00', qty: 45 },
          { id: '2', sku: 'G-2001', name: 'Gadget B', category: 'Gadgets', price: '$25.50', qty: 38 },
          { id: '3', sku: 'P-3001', name: 'Doohickey C', category: 'Parts', price: '$8.75', qty: 73 },
          { id: '4', sku: 'W-1002', name: 'Widget D', category: 'Widgets', price: '$15.00', qty: 12 },
          { id: '5', sku: 'G-2002', name: 'Gizmo E', category: 'Gadgets', price: '$42.00', qty: 5 },
          { id: '6', sku: 'P-3002', name: 'Thingamajig F', category: 'Parts', price: '$3.25', qty: 120 },
        ],
        columns: [
          { id: 'sku', label: 'SKU' },
          { id: 'name', label: 'Name' },
          { id: 'category', label: 'Category' },
          { id: 'price', label: 'Price' },
          { id: 'qty', label: 'Qty' },
        ],
        filters: [
          { field: 'category', type: 'select', options: ['All', 'Widgets', 'Gadgets', 'Parts'] },
          { field: '_search', type: 'text', placeholder: 'Search name or SKU…' },
        ],
        searchFields: ['name', 'sku'],
        rowKey: 'id',
        emptyMessage: 'No items found',
        footer: { countLabel: 'items' },
      }),
    },
  },
});

// ── Store factories ──

function createStoreWithSession(stack: CardStackDefinition, sessionId: string, cardId?: string) {
  const store = configureStore({
    reducer: {
      hypercardRuntime: hypercardRuntimeReducer,
      windowing: windowingReducer,
      notifications: notificationsReducer,
    },
  });

  store.dispatch(
    openWindow({
      id: `window:${sessionId}`,
      title: stack.cards[cardId ?? stack.homeCard]?.title ?? 'Window',
      bounds: { x: 0, y: 0, w: 400, h: 300 },
      content: {
        kind: 'card',
        card: {
          stackId: stack.id,
          cardId: cardId ?? stack.homeCard,
          cardSessionId: sessionId,
        },
      },
    }),
  );

  return store;
}

// ── Story wrapper ──

function CardSessionHostWrapper(props: CardSessionHostProps) {
  const store = createStoreWithSession(props.stack, props.sessionId);
  return (
    <Provider store={store}>
      <div style={{ width: 440, height: 380, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
        <CardSessionHost {...props} />
      </div>
    </Provider>
  );
}

// ── Meta ──

const meta = {
  title: 'Shell/Windowing/CardSessionHost',
  component: CardSessionHostWrapper,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CardSessionHostWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──

/** Menu card with nav buttons — click to navigate within session */
export const NavigableMenu: Story = {
  args: {
    windowId: 'window:s1',
    sessionId: 's1',
    stack: NAV_STACK,
  },
};

/** Chat card with conversation history */
export const ChatCard: Story = {
  args: {
    windowId: 'window:s2',
    sessionId: 's2',
    stack: CHAT_STACK,
  },
};

/** Report card with data rows and action buttons */
export const ReportCard: Story = {
  args: {
    windowId: 'window:s3',
    sessionId: 's3',
    stack: REPORT_STACK,
  },
};

/** List card with data, columns, filters, and search */
export const ListCard: Story = {
  args: {
    windowId: 'window:s4',
    sessionId: 's4',
    stack: LIST_STACK,
  },
};

/** Preview mode — interactions disabled */
export const PreviewMode: Story = {
  args: {
    windowId: 'window:s5',
    sessionId: 's5',
    stack: NAV_STACK,
    mode: 'preview',
  },
};

/** Two session hosts side by side — proves session isolation */
export const TwoSessionsIsolated: Story = {
  args: {
    windowId: 'window:session-a',
    sessionId: 'session-a',
    stack: NAV_STACK,
  },
  render: () => {
    const storeA = createStoreWithSession(NAV_STACK, 'session-a');
    const storeB = createStoreWithSession(NAV_STACK, 'session-b');
    return (
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4, fontFamily: 'monospace', fontSize: 11 }}>
            Session A (session-a)
          </div>
          <Provider store={storeA}>
            <div style={{ width: 380, height: 340, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
              <CardSessionHost windowId="window:session-a" sessionId="session-a" stack={NAV_STACK} />
            </div>
          </Provider>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4, fontFamily: 'monospace', fontSize: 11 }}>
            Session B (session-b)
          </div>
          <Provider store={storeB}>
            <div style={{ width: 380, height: 340, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
              <CardSessionHost windowId="window:session-b" sessionId="session-b" stack={NAV_STACK} />
            </div>
          </Provider>
        </div>
      </div>
    );
  },
};
