/**
 * Story: a DesktopShell with a ChatWindow that can open card windows
 * and inject new cards via the plugin runtime.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { createAppStore } from '../../../app/createAppStore';
import type { CardDefinition, CardStackDefinition } from '../../../cards/types';
import type { ColumnConfig } from '../../../types';
import {
  ChatWindow,
  type ChatWindowMessage,
  type InlineWidget,
} from '../../widgets/ChatWindow';
import { DataTable } from '../../widgets/DataTable';
import { ReportView } from '../../widgets/ReportView';
import { DesktopShell } from './DesktopShell';
import { openWindow } from '../../../features/windowing/windowingSlice';
import type { DesktopIconDef } from './types';
import DEMO_PLUGIN_BUNDLE from './DesktopShell.demo.vm.js?raw';

/* ═══════════════════════════════════════════════════════════════════════
   Stack definition — reuses the demo plugin bundle
   ═══════════════════════════════════════════════════════════════════════ */

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

const CARD_META: PluginCardMeta[] = [
  { id: 'home', title: 'Home', icon: '🏠' },
  { id: 'browse', title: 'Browse Items', icon: '📋' },
  { id: 'report', title: 'Reports', icon: '📊' },
  { id: 'chat', title: 'Chat', icon: '💬' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
];

function toPluginCard(card: PluginCardMeta): CardDefinition {
  return {
    id: card.id,
    type: 'plugin',
    title: card.title,
    icon: card.icon,
    ui: { t: 'text', value: `Plugin card: ${card.id}` },
  };
}

const STACK: CardStackDefinition = {
  id: 'chat-desktop-demo',
  name: 'Chat Desktop',
  icon: '💬',
  homeCard: 'home',
  plugin: {
    bundleCode: DEMO_PLUGIN_BUNDLE,
    capabilities: {
      system: ['nav.go', 'nav.back', 'notify'],
    },
  },
  cards: Object.fromEntries(CARD_META.map((c) => [c.id, toPluginCard(c)])),
};

const ICONS: DesktopIconDef[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'browse', label: 'Browse', icon: '📋' },
  { id: 'report', label: 'Reports', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/* ═══════════════════════════════════════════════════════════════════════
   Fake data for inline widgets
   ═══════════════════════════════════════════════════════════════════════ */

const ITEMS_DATA = [
  { id: '1', name: 'Widget A', sku: 'W-1001', qty: 45, price: 12.0, category: 'Widgets' },
  { id: '2', name: 'Gadget B', sku: 'G-2001', qty: 38, price: 25.5, category: 'Gadgets' },
  { id: '3', name: 'Doohickey C', sku: 'P-3001', qty: 73, price: 8.75, category: 'Parts' },
  { id: '4', name: 'Widget D', sku: 'W-1002', qty: 12, price: 15.0, category: 'Widgets' },
  { id: '5', name: 'Gizmo E', sku: 'G-2002', qty: 5, price: 42.0, category: 'Gadgets' },
  { id: '6', name: 'Thingamajig F', sku: 'P-3002', qty: 120, price: 3.25, category: 'Parts' },
];

const ITEMS_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', width: '1.5fr' },
  { key: 'sku', label: 'SKU', width: '1fr' },
  { key: 'qty', label: 'Qty', width: 60, align: 'right' },
  { key: 'price', label: 'Price', width: 70, align: 'right', format: (v) => `$${Number(v).toFixed(2)}` },
  { key: 'category', label: 'Category', width: '1fr' },
];

const REPORT_SECTIONS = [
  { label: 'Total Items', value: '293' },
  { label: 'Total Value', value: '$4,230' },
  { label: 'Low Stock Items', value: '3' },
  { label: 'Top Category', value: 'Parts (73)' },
  { label: 'Avg Price', value: '$17.75' },
];

/* ═══════════════════════════════════════════════════════════════════════
   Widget renderer
   ═══════════════════════════════════════════════════════════════════════ */

function renderWidget(widget: InlineWidget): ReactNode {
  switch (widget.type) {
    case 'data-table': {
      const p = widget.props as { items: Record<string, unknown>[]; columns: ColumnConfig[] };
      return <DataTable items={p.items} columns={p.columns} />;
    }
    case 'report-view': {
      const p = widget.props as { sections: Array<{ label: string; value: string }> };
      return <ReportView sections={p.sections} />;
    }
    default:
      return <div style={{ padding: 8, fontSize: 11 }}>Unknown widget: {widget.type}</div>;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   New-card code templates
   ═══════════════════════════════════════════════════════════════════════ */

/** Template for a dynamically-injected "notes" card */
const NOTES_CARD_CODE = `({ ui }) => ({
  render({ cardState }) {
    var notes = Array.isArray(cardState && cardState.items) ? cardState.items : [];
    var lines = notes.map(function(n) { return ui.text('📝 ' + String(n)); });
    return ui.panel([
      ui.text('Notes (' + notes.length + ')'),
      ui.column(lines.length ? lines : [ui.text('No notes yet.')]),
      ui.button('🏠 Home', { onClick: { handler: 'goHome' } }),
    ]);
  },
  handlers: {
    goHome: function(ctx) { ctx.dispatchSystemCommand('nav.go', { cardId: 'home' }); },
  },
})`;

/** Template for a dynamically-injected "calculator" card */
const CALC_CARD_CODE = `({ ui }) => ({
  render({ cardState }) {
    var val = Number(cardState && cardState.value) || 0;
    return ui.panel([
      ui.text('Calculator'),
      ui.text('Value: ' + val),
      ui.row([
        ui.button('+1', { onClick: { handler: 'inc' } }),
        ui.button('-1', { onClick: { handler: 'dec' } }),
        ui.button('Reset', { onClick: { handler: 'reset' } }),
      ]),
      ui.button('🏠 Home', { onClick: { handler: 'goHome' } }),
    ]);
  },
  handlers: {
    inc: function(ctx) { ctx.dispatchCardAction('patch', { value: (Number(ctx.cardState && ctx.cardState.value) || 0) + 1 }); },
    dec: function(ctx) { ctx.dispatchCardAction('patch', { value: (Number(ctx.cardState && ctx.cardState.value) || 0) - 1 }); },
    reset: function(ctx) { ctx.dispatchCardAction('patch', { value: 0 }); },
    goHome: function(ctx) { ctx.dispatchSystemCommand('nav.go', { cardId: 'home' }); },
  },
})`;

/** Template for a dynamically-injected "todo" card */
const TODO_CARD_CODE = `({ ui }) => ({
  render({ cardState }) {
    var items = Array.isArray(cardState && cardState.todos) ? cardState.todos : ['Buy groceries', 'Fix bug #42'];
    var lines = items.map(function(t, i) {
      return ui.row([
        ui.text('☐ ' + String(t)),
        ui.button('✕', { onClick: { handler: 'remove', args: { index: i } } }),
      ]);
    });
    return ui.panel([
      ui.text('Todo List (' + items.length + ')'),
      ui.column(lines.length ? lines : [ui.text('All done! 🎉')]),
      ui.button('🏠 Home', { onClick: { handler: 'goHome' } }),
    ]);
  },
  handlers: {
    remove: function(ctx, args) {
      var todos = Array.isArray(ctx.cardState && ctx.cardState.todos) ? ctx.cardState.todos.slice() : [];
      var idx = Number(args && args.index);
      if (idx >= 0 && idx < todos.length) todos.splice(idx, 1);
      ctx.dispatchCardAction('patch', { todos: todos });
    },
    goHome: function(ctx) { ctx.dispatchSystemCommand('nav.go', { cardId: 'home' }); },
  },
})`;

interface CardTemplate {
  id: string;
  title: string;
  icon: string;
  code: string;
  description: string;
}

const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'notes', title: 'Notes', icon: '📝', code: NOTES_CARD_CODE, description: 'A simple notes card' },
  { id: 'calculator', title: 'Calculator', icon: '🧮', code: CALC_CARD_CODE, description: 'A counter/calculator' },
  { id: 'todo', title: 'Todo List', icon: '✅', code: TODO_CARD_CODE, description: 'A todo list with remove' },
];

/* ═══════════════════════════════════════════════════════════════════════
   ChatWindow as a desktop window body
   ═══════════════════════════════════════════════════════════════════════ */

let windowCounter = 100;
function nextWindowId(prefix: string) {
  windowCounter += 1;
  return `window:${prefix}:${windowCounter}`;
}

/**
 * ChatWindow wired to open desktop windows on action clicks
 * and inject new plugin cards via the runtime service.
 */
function DesktopChatWindow({ stack }: { stack: CardStackDefinition }) {
  const dispatch = useDispatch();
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [createdCards, setCreatedCards] = useState<string[]>([]);

  // Track which sessions exist for opening card windows
  const sessionCounterRef = useRef(200);
  function nextSessionId() {
    sessionCounterRef.current += 1;
    return `chat-session-${sessionCounterRef.current}`;
  }

  /** Open a card in a new desktop window */
  const openCardWindow = useCallback(
    (cardId: string, param?: string) => {
      const cardDef = stack.cards[cardId];
      if (!cardDef) {
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            text: `⚠️ Card "${cardId}" not found.`,
            status: 'complete',
          },
        ]);
        return;
      }
      const sid = nextSessionId();
      dispatch(
        openWindow({
          id: nextWindowId(cardId),
          title: cardDef.title ?? cardId,
          icon: cardDef.icon,
          bounds: {
            x: 180 + (sessionCounterRef.current % 5) * 30,
            y: 40 + (sessionCounterRef.current % 4) * 25,
            w: 420,
            h: 340,
          },
          content: {
            kind: 'card',
            card: { stackId: stack.id, cardId, cardSessionId: sid, param },
          },
        }),
      );
    },
    [dispatch, stack],
  );

  /** Handle action chip clicks from chat messages */
  const handleAction = useCallback(
    (action: unknown) => {
      if (typeof action !== 'string') return;

      // Actions that open card windows
      const cardActions: Record<string, string> = {
        'open-browse': 'browse',
        'open-report': 'report',
        'open-settings': 'settings',
        'open-home': 'home',
      };

      if (action in cardActions) {
        openCardWindow(cardActions[action]);
        return;
      }

      // Actions for dynamically-created cards
      if (action.startsWith('open-created:')) {
        const cardId = action.replace('open-created:', '');
        openCardWindow(cardId);
        return;
      }

      // "Create card" action
      if (action.startsWith('create-card:')) {
        const templateId = action.replace('create-card:', '');
        const template = CARD_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;

        // Add the card definition to the stack (runtime)
        // In a real app this would call runtimeService.defineCard()
        // For the story we mutate the stack cards directly and open the window
        stack.cards[template.id] = {
          id: template.id,
          type: 'plugin',
          title: template.title,
          icon: template.icon,
          ui: { t: 'text', value: `Plugin card: ${template.id}` },
        };

        setCreatedCards((prev) => [...prev, template.id]);

        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            text: `✅ Card "${template.title}" created and added to the desktop.`,
            status: 'complete',
          },
          {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: `I've created the ${template.icon} ${template.title} card. You can open it from the action below, or find it on the desktop.`,
            status: 'complete',
            actions: [
              { label: `${template.icon} Open ${template.title}`, action: `open-created:${template.id}` },
            ],
          },
        ]);
        return;
      }

      // Default: show a toast-like message
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'system',
          text: `Action dispatched: ${action}`,
          status: 'complete',
        },
      ]);
    },
    [openCardWindow, stack],
  );

  /** Smart response based on keywords */
  const handleSend = useCallback(
    (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatWindowMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
        status: 'complete',
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      // Simulate thinking
      setTimeout(() => {
        const lower = text.toLowerCase();
        let aiMsg: ChatWindowMessage;

        if (lower.includes('browse') || lower.includes('items') || lower.includes('inventory')) {
          aiMsg = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here are the current inventory items:' },
              {
                kind: 'widget',
                widget: {
                  id: `items-${Date.now()}`,
                  type: 'data-table',
                  label: 'Inventory',
                  props: { items: ITEMS_DATA, columns: ITEMS_COLUMNS },
                },
              },
              { kind: 'text', text: 'Click below to open the full Browse window.' },
            ],
            actions: [
              { label: '📋 Open Browse', action: 'open-browse' },
              { label: '📊 Open Reports', action: 'open-report' },
            ],
          };
        } else if (lower.includes('report') || lower.includes('summary') || lower.includes('stats')) {
          aiMsg = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: "Here's the inventory summary:" },
              {
                kind: 'widget',
                widget: {
                  id: `report-${Date.now()}`,
                  type: 'report-view',
                  label: 'Inventory Summary',
                  props: { sections: REPORT_SECTIONS },
                },
              },
            ],
            actions: [
              { label: '📊 Open Full Report', action: 'open-report' },
            ],
          };
        } else if (lower.includes('create') || lower.includes('new card') || lower.includes('add card')) {
          aiMsg = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: "I can create a new card for you! Pick a template below and I'll inject it into the desktop:",
            status: 'complete',
            actions: CARD_TEMPLATES
              .filter((t) => !createdCards.includes(t.id))
              .map((t) => ({
                label: `${t.icon} Create ${t.title}`,
                action: `create-card:${t.id}`,
              }))
              .concat(
                createdCards.length > 0
                  ? [{ label: '📄 Show created cards', action: 'list-created' }]
                  : [],
              ),
          };

          if (CARD_TEMPLATES.every((t) => createdCards.includes(t.id))) {
            aiMsg = {
              id: `ai-${Date.now()}`,
              role: 'ai',
              text: "You've already created all available card templates! Here they are:",
              status: 'complete',
              actions: createdCards.map((id) => {
                const t = CARD_TEMPLATES.find((t) => t.id === id);
                return { label: `${t?.icon ?? '📄'} Open ${t?.title ?? id}`, action: `open-created:${id}` };
              }),
            };
          }
        } else if (lower.includes('settings') || lower.includes('config')) {
          aiMsg = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: 'Opening the Settings card for you.',
            status: 'complete',
            actions: [{ label: '⚙️ Open Settings', action: 'open-settings' }],
          };
        } else if (lower.includes('help')) {
          aiMsg = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: "Here's what I can do:\n\n• **Show items** — Ask about inventory, browse, or items to see an inline table\n• **Show reports** — Ask for stats or summary to see a report widget\n• **Open windows** — I'll open card windows on the desktop\n• **Create cards** — Say \"create a card\" to inject new cards into the runtime\n• **Navigate** — Click any action chip to open the relevant window",
            status: 'complete',
            actions: [
              { label: '📋 Browse', action: 'open-browse' },
              { label: '📊 Reports', action: 'open-report' },
              { label: '⚙️ Settings', action: 'open-settings' },
              { label: '✨ Create a card…', action: 'create-card-prompt' },
            ],
          };
        } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
          aiMsg = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: "Hello! I'm your desktop assistant. I can show you data, open windows, and even create new cards on the fly. Try asking for help!",
            status: 'complete',
          };
        } else {
          aiMsg = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: `I understand you're asking about "${text}". Try:\n• "show items" for inventory data\n• "show report" for stats\n• "create a card" to add new cards\n• "help" for all options`,
            status: 'complete',
            actions: [
              { label: '📋 Browse Items', action: 'open-browse' },
              { label: '✨ Create a card…', action: 'create-card-prompt' },
            ],
          };
        }

        // Special: "create-card-prompt" action actually prompts
        if (
          aiMsg.actions?.some((a) => a.action === 'create-card-prompt')
        ) {
          // Replace it with the real create actions
          aiMsg.actions = aiMsg.actions!.map((a) =>
            a.action === 'create-card-prompt'
              ? { label: '✨ Create a card…', action: 'prompt-create' }
              : a,
          );
        }

        setMessages((prev) => [...prev, aiMsg]);
        setIsStreaming(false);
      }, 600);
    },
    [isStreaming, createdCards],
  );

  /** Handle "prompt-create" specially — insert the template menu */
  const wrappedAction = useCallback(
    (action: unknown) => {
      if (action === 'prompt-create') {
        handleSend('create a card');
        return;
      }
      handleAction(action);
    },
    [handleAction, handleSend],
  );

  return (
    <ChatWindow
      messages={messages}
      isStreaming={isStreaming}
      onSend={handleSend}
      onCancel={() => setIsStreaming(false)}
      onAction={wrappedAction}
      suggestions={[
        'Show me the inventory',
        'Give me a report',
        'Create a card…',
        'Help',
      ]}
      title="Desktop Assistant"
      subtitle="Opens windows · Creates cards"
      placeholder="Ask about items, reports, or create new cards…"
      renderWidget={renderWidget}
      footer={<span>Chat actions open desktop windows · "Create a card" injects plugin code</span>}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Full demo: DesktopShell + ChatWindow side panel
   ═══════════════════════════════════════════════════════════════════════ */

function ChatDesktopFull() {
  const stackRef = useRef<CardStackDefinition>({
    ...STACK,
    cards: { ...STACK.cards },
  });

  const { createStore } = createAppStore({});
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  return (
    <Provider store={storeRef.current}>
      {/*
        Override the theme wrapper sizing so the desktop fills its flex cell
        and the chat panel sits inside the same viewport.
      */}
      <style>{`
        .chat-desktop-layout [data-widget="hypercard"] {
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
        }
      `}</style>
      <div
        className="chat-desktop-layout"
        style={{
          display: 'flex',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
          <DesktopShell stack={stackRef.current} icons={ICONS} />
        </div>
        <div
          style={{
            width: 380,
            flexShrink: 0,
            borderLeft: '2px solid #000',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <DesktopChatWindow stack={stackRef.current} />
        </div>
      </div>
    </Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Meta + Stories
   ═══════════════════════════════════════════════════════════════════════ */

const meta = {
  title: 'Shell/Windowing/Chat Desktop',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <ChatDesktopFull />,
};
