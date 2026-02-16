import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useCallback, useState } from 'react';
import { defaultResponseMatcher, tokenize } from '../../chat/mocks/fakeResponses';
import type { ColumnConfig } from '../../types';
import { DataTable } from './DataTable';
import {
  ChatWindow,
  type ChatWindowMessage,
  type ChatWindowProps,
  type InlineWidget,
} from './ChatWindow';
import { ListView } from './ListView';
import { ReportView } from './ReportView';

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

/** Hook that simulates streaming like the other chat stories. */
function useSimulatedStream(initialMessages?: ChatWindowMessage[]) {
  const [messages, setMessages] = useState<ChatWindowMessage[]>(
    initialMessages ?? [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  const send = useCallback(
    (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatWindowMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
        status: 'complete',
      };
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatWindowMessage = {
        id: aiMsgId,
        role: 'ai',
        text: '',
        status: 'streaming',
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      const response = defaultResponseMatcher(text);
      const tokens = tokenize(response?.text ?? "I'm not sure about that.");
      const actions = response?.actions;

      let cancelled = false;
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      let elapsed = 400;

      for (let i = 0; i < tokens.length; i++) {
        elapsed += 20 + Math.random() * 50;
        const t = setTimeout(() => {
          if (cancelled) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, text: m.text + tokens[i] } : m,
            ),
          );
        }, elapsed);
        timeouts.push(t);
      }

      elapsed += 50;
      const doneT = setTimeout(() => {
        if (cancelled) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, status: 'complete' as const, actions }
              : m,
          ),
        );
        setIsStreaming(false);
        setCancelFn(null);
      }, elapsed);
      timeouts.push(doneT);

      setCancelFn(() => () => {
        cancelled = true;
        timeouts.forEach(clearTimeout);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, status: 'complete' as const } : m,
          ),
        );
        setIsStreaming(false);
        setCancelFn(null);
      });
    },
    [isStreaming],
  );

  const cancel = useCallback(() => cancelFn?.(), [cancelFn]);

  return { messages, isStreaming, send, cancel, setMessages };
}

/* ── Fake data for inline widgets ── */

const STOCK_DATA = [
  { id: '1', name: 'Widget A', sku: 'WA-100', qty: 2, price: 29.99, status: 'Low' },
  { id: '2', name: 'Gadget B', sku: 'GB-200', qty: 1, price: 49.99, status: 'Critical' },
  { id: '3', name: 'Sprocket C', sku: 'SC-300', qty: 45, price: 12.5, status: 'OK' },
  { id: '4', name: 'Doohickey D', sku: 'DD-400', qty: 8, price: 7.25, status: 'Low' },
  { id: '5', name: 'Thingamajig E', sku: 'TE-500', qty: 120, price: 3.0, status: 'OK' },
];

const STOCK_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Product', width: '1.5fr' },
  { key: 'sku', label: 'SKU', width: '1fr' },
  { key: 'qty', label: 'Qty', width: 60, align: 'right' },
  {
    key: 'price',
    label: 'Price',
    width: 70,
    align: 'right',
    format: (v) => `$${Number(v).toFixed(2)}`,
  },
  {
    key: 'status',
    label: 'Status',
    width: 80,
    cellState: (v) => {
      if (v === 'Critical') return 'error';
      if (v === 'Low') return 'warning';
      return undefined;
    },
  },
];

const DEAL_DATA = [
  { id: 'd1', name: 'Acme Enterprise', value: 120000, stage: 'Negotiation', probability: 75 },
  { id: 'd2', name: 'Beta Corp Renewal', value: 30000, stage: 'Closed Won', probability: 100 },
  { id: 'd3', name: 'Gamma Pilot', value: 18000, stage: 'Qualification', probability: 25 },
  { id: 'd4', name: 'Delta Expansion', value: 85000, stage: 'Proposal', probability: 50 },
];

const DEAL_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Deal', width: '2fr' },
  {
    key: 'value',
    label: 'Value',
    width: 100,
    align: 'right',
    format: (v) => `$${Number(v).toLocaleString()}`,
  },
  { key: 'stage', label: 'Stage', width: '1fr' },
  {
    key: 'probability',
    label: 'Prob %',
    width: 70,
    align: 'right',
    format: (v) => `${v}%`,
  },
];

const REPORT_SECTIONS = [
  { label: 'Total Revenue', value: '$245,000' },
  { label: 'Open Deals', value: '5' },
  { label: 'Win Rate', value: '68%' },
  { label: 'Avg Deal Size', value: '$49,000' },
  { label: 'Pipeline Value', value: '$380,000' },
  { label: 'Forecasted Revenue', value: '$198,000' },
];

const CONTACT_DATA = [
  { id: 'c1', name: 'Alice Johnson', company: 'Acme Corp', email: 'alice@acme.com', role: 'VP Sales' },
  { id: 'c2', name: 'Bob Smith', company: 'Beta Inc', email: 'bob@beta.com', role: 'CTO' },
  { id: 'c3', name: 'Carol Davis', company: 'Gamma LLC', email: 'carol@gamma.com', role: 'Buyer' },
  { id: 'c4', name: 'Dave Wilson', company: 'Delta Co', email: 'dave@delta.com', role: 'Director' },
  { id: 'c5', name: 'Eve Martinez', company: 'Umbrella Ltd', email: 'eve@umbrella.com', role: 'CEO' },
];

const CONTACT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', width: '1.5fr' },
  { key: 'company', label: 'Company', width: '1fr' },
  { key: 'role', label: 'Role', width: '1fr' },
  { key: 'email', label: 'Email', width: '1.5fr' },
];

/* ── Widget renderer ── */

function defaultWidgetRenderer(widget: InlineWidget): ReactNode {
  switch (widget.type) {
    case 'data-table': {
      const p = widget.props as {
        items: Record<string, unknown>[];
        columns: ColumnConfig[];
      };
      return <DataTable items={p.items} columns={p.columns} />;
    }
    case 'list-view': {
      const p = widget.props as {
        items: Record<string, unknown>[];
        columns: ColumnConfig[];
      };
      return <ListView items={p.items} columns={p.columns} />;
    }
    case 'report-view': {
      const p = widget.props as {
        sections: Array<{ label: string; value: string }>;
      };
      return <ReportView sections={p.sections} />;
    }
    default:
      return (
        <div style={{ padding: 8, fontSize: 11, color: '#999' }}>
          Unknown widget: {widget.type}
        </div>
      );
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Meta
   ═══════════════════════════════════════════════════════════════════════ */

const meta = {
  title: 'Widgets/ChatWindow',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/* ═══════════════════════════════════════════════════════════════════════
   Helper wrapper – sizes the chat window to fill the story viewport
   ═══════════════════════════════════════════════════════════════════════ */

function StoryFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   1. Interactive (streaming simulation)
   ═══════════════════════════════════════════════════════════════════════ */

function InteractiveDemo() {
  const { messages, isStreaming, send, cancel } = useSimulatedStream();

  return (
    <StoryFrame>
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
        onSend={send}
        onCancel={cancel}
        suggestions={['Hello!', 'What can you help with?', 'Show me some data', 'Help']}
        title="AI Assistant"
        subtitle="Interactive demo"
        placeholder="Ask me anything…"
        footer={<span>Model: fake-gpt-4 · Streaming enabled</span>}
      />
    </StoryFrame>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

/* ═══════════════════════════════════════════════════════════════════════
   2. Empty / Welcome State
   ═══════════════════════════════════════════════════════════════════════ */

export const Welcome: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[]}
        isStreaming={false}
        onSend={() => {}}
        suggestions={['What is my pipeline?', 'Show low stock items', 'Help me find a contact']}
        title="CRM Assistant"
        subtitle="Powered by AI"
        placeholder="Ask about your CRM data…"
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   3. Custom Welcome Content
   ═══════════════════════════════════════════════════════════════════════ */

export const CustomWelcome: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[]}
        isStreaming={false}
        onSend={() => {}}
        suggestions={['Dashboard', 'Inventory', 'Reports']}
        title="Inventory Bot"
        welcomeContent={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Inventory Assistant</div>
            <div style={{ fontSize: 12, color: '#888', maxWidth: 400 }}>
              I can help you check stock levels, find products, generate reports, and manage your inventory. Try asking a question below!
            </div>
          </div>
        }
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   4. Thinking state
   ═══════════════════════════════════════════════════════════════════════ */

export const Thinking: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'What items are running low on stock?', status: 'complete' },
          { id: '2', role: 'ai', text: '', status: 'streaming' },
        ]}
        isStreaming={true}
        onSend={() => {}}
        onCancel={() => {}}
        title="Inventory Assistant"
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   5. Mid-stream
   ═══════════════════════════════════════════════════════════════════════ */

export const MidStream: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Give me a summary of open deals', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: 'Here are your currently open deals:\n\n• Acme Enterprise License — $120,000 (Negotiation)\n• Gamma Pilot Program — $18,000 (Qualification)',
            status: 'streaming',
          },
        ]}
        isStreaming={true}
        onSend={() => {}}
        onCancel={() => {}}
        title="CRM Assistant"
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   6. Error state
   ═══════════════════════════════════════════════════════════════════════ */

export const ErrorState: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Analyze last quarter revenue', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: 'I encountered an error while processing your request. The analytics service is temporarily unavailable.',
            status: 'error',
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="Analytics Chat"
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   7. Inline DataTable
   ═══════════════════════════════════════════════════════════════════════ */

export const InlineDataTable: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Show me the current stock levels', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              {
                kind: 'text',
                text: 'Here are the current stock levels across all products. Items marked as Critical or Low need attention:',
              },
              {
                kind: 'widget',
                widget: {
                  id: 'stock-table',
                  type: 'data-table',
                  label: 'Stock Levels',
                  props: { items: STOCK_DATA, columns: STOCK_COLUMNS },
                },
              },
              {
                kind: 'text',
                text: '2 items are below the reorder threshold. Would you like me to create purchase orders?',
              },
            ],
            actions: [
              { label: '📦 Create PO', action: 'create-po' },
              { label: '📊 Full Report', action: 'report' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        title="Inventory Assistant"
        renderWidget={defaultWidgetRenderer}
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   8. Inline ReportView
   ═══════════════════════════════════════════════════════════════════════ */

export const InlineReport: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Show me my pipeline summary', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: "Here's your current pipeline summary:" },
              {
                kind: 'widget',
                widget: {
                  id: 'pipeline-report',
                  type: 'report-view',
                  label: 'Pipeline Summary',
                  props: { sections: REPORT_SECTIONS },
                },
              },
              {
                kind: 'text',
                text: 'Your win rate has improved 12% over last quarter. The forecasted revenue of $198K is based on probability-weighted deal values.',
              },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="CRM Assistant"
        renderWidget={defaultWidgetRenderer}
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   9. Multiple widgets in conversation
   ═══════════════════════════════════════════════════════════════════════ */

export const MultipleWidgets: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          {
            id: 'sys',
            role: 'system',
            text: 'Welcome! I can help you explore your CRM data.',
            status: 'complete',
          },
          { id: '1', role: 'user', text: 'Show me my open deals', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'You have 4 deals in your pipeline:' },
              {
                kind: 'widget',
                widget: {
                  id: 'deal-table',
                  type: 'data-table',
                  label: 'Deal Pipeline',
                  props: { items: DEAL_DATA, columns: DEAL_COLUMNS },
                },
              },
              { kind: 'text', text: 'Total pipeline value is $253,000 with a weighted forecast of $134,750.' },
            ],
            actions: [
              { label: '📊 Pipeline Chart', action: 'chart' },
              { label: '➕ New Deal', action: 'new-deal' },
            ],
          },
          { id: '3', role: 'user', text: 'Who are my key contacts?', status: 'complete' },
          {
            id: '4',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here are your 5 active contacts:' },
              {
                kind: 'widget',
                widget: {
                  id: 'contact-table',
                  type: 'data-table',
                  label: 'Contacts',
                  props: { items: CONTACT_DATA, columns: CONTACT_COLUMNS },
                },
              },
              { kind: 'text', text: 'Alice Johnson and Eve Martinez are flagged as VIP contacts.' },
            ],
          },
          {
            id: '5',
            role: 'user',
            text: 'Give me the revenue summary too',
            status: 'complete',
          },
          {
            id: '6',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here\'s your revenue overview:' },
              {
                kind: 'widget',
                widget: {
                  id: 'revenue-report',
                  type: 'report-view',
                  label: 'Revenue Summary',
                  props: { sections: REPORT_SECTIONS },
                },
              },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        title="CRM Assistant"
        subtitle="5 contacts · 4 deals"
        renderWidget={defaultWidgetRenderer}
        footer={<span>Model: gpt-4o · Last synced: 2 min ago</span>}
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   10. Long Conversation
   ═══════════════════════════════════════════════════════════════════════ */

export const LongConversation: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: 's1', role: 'system', text: 'Welcome! How can I help you today?', status: 'complete' },
          { id: 'u1', role: 'user', text: 'How many contacts do I have?', status: 'complete' },
          {
            id: 'a1',
            role: 'ai',
            text: 'You have 7 contacts across 5 companies. 2 are customers, 2 are prospects, 2 are leads, and 1 has churned.',
            status: 'complete',
          },
          { id: 'u2', role: 'user', text: 'Which ones are VIPs?', status: 'complete' },
          {
            id: 'a2',
            role: 'ai',
            text: 'Two contacts are tagged as VIP:\n\n• **Alice Johnson** (Acme Corp) — Active customer\n• **Eve Martinez** (Umbrella Ltd) — Active customer\n\nBoth have active deals in the pipeline.',
            status: 'complete',
            actions: [
              { label: '👤 Alice', action: 'c1' },
              { label: '👤 Eve', action: 'c5' },
            ],
          },
          { id: 'u3', role: 'user', text: 'What deals does Alice have?', status: 'complete' },
          {
            id: 'a3',
            role: 'ai',
            text: 'Alice Johnson has 2 deals:\n\n1. **Acme Enterprise License** — $120,000, Negotiation stage (75% probability)\n2. **Acme Support Renewal** — $30,000, Closed Won\n\nTotal pipeline value: $150,000',
            status: 'complete',
          },
          { id: 'u4', role: 'user', text: 'How is the overall pipeline looking?', status: 'complete' },
          {
            id: 'a4',
            role: 'ai',
            text: 'The pipeline is healthy. You have 5 active deals worth a combined $380,000. The probability-weighted forecast is $198,000. Win rate over the last 90 days is 68%, up from 54% the previous quarter.',
            status: 'complete',
            actions: [{ label: '📊 View Pipeline', action: 'pipeline' }],
          },
          { id: 'u5', role: 'user', text: 'Any deals at risk?', status: 'complete' },
          {
            id: 'a5',
            role: 'ai',
            text: "One deal needs attention:\n\n⚠️ **Gamma Pilot Program** ($18,000) has been in Qualification for 45 days with no activity in the last 2 weeks. Consider scheduling a follow-up call with Carol Davis at Gamma LLC.",
            status: 'complete',
            actions: [
              { label: '📞 Schedule Call', action: 'schedule-call' },
              { label: '👤 Carol Davis', action: 'c3' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        title="CRM Assistant"
        footer={<span>7 contacts · 5 deals · Model: gpt-4o</span>}
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   11. Mixed text + widget in same message (complex layout)
   ═══════════════════════════════════════════════════════════════════════ */

export const MixedContent: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Analyze my inventory and give me a full report', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              {
                kind: 'text',
                text: "I've analyzed your current inventory. Here's the breakdown:",
              },
              {
                kind: 'widget',
                widget: {
                  id: 'inv-table',
                  type: 'data-table',
                  label: 'Current Inventory',
                  props: { items: STOCK_DATA, columns: STOCK_COLUMNS },
                },
              },
              {
                kind: 'text',
                text: 'And here are the key metrics:',
              },
              {
                kind: 'widget',
                widget: {
                  id: 'inv-report',
                  type: 'report-view',
                  label: 'Inventory Metrics',
                  props: {
                    sections: [
                      { label: 'Total Products', value: '5' },
                      { label: 'Total Units', value: '176' },
                      { label: 'Low Stock Items', value: '2' },
                      { label: 'Critical Items', value: '1' },
                      { label: 'Total Value', value: '$4,287.50' },
                      { label: 'Avg Price', value: '$20.55' },
                    ],
                  },
                },
              },
              {
                kind: 'text',
                text: '🔴 Gadget B is at critical level (1 unit). Widget A is also running low with only 2 units remaining. I recommend placing restock orders for both items immediately.',
              },
            ],
            actions: [
              { label: '📦 Restock Critical', action: 'restock-critical' },
              { label: '📦 Restock All Low', action: 'restock-low' },
              { label: '📧 Notify Supplier', action: 'notify' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        title="Inventory Assistant"
        subtitle="Real-time analysis"
        renderWidget={defaultWidgetRenderer}
        footer={<span>Last sync: just now · 5 products tracked</span>}
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   12. Inline ListView with filtering
   ═══════════════════════════════════════════════════════════════════════ */

export const InlineListView: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Show me all contacts with search', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here are all your contacts. You can search and filter the list:' },
              {
                kind: 'widget',
                widget: {
                  id: 'contact-list',
                  type: 'list-view',
                  label: 'Contact Directory',
                  props: {
                    items: CONTACT_DATA,
                    columns: CONTACT_COLUMNS,
                  },
                },
              },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="CRM Chat"
        renderWidget={defaultWidgetRenderer}
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   13. With actions (interactive conversation)
   ═══════════════════════════════════════════════════════════════════════ */

function ActionsDemo() {
  const { messages, isStreaming, send, cancel, setMessages } = useSimulatedStream([
    {
      id: 'sys',
      role: 'system',
      text: 'Welcome! I can help manage your tasks.',
      status: 'complete',
    },
    { id: 'u1', role: 'user', text: 'What should I work on today?', status: 'complete' },
    {
      id: 'a1',
      role: 'ai',
      text: "Based on your priorities, here's what I recommend:\n\n1. 🔴 **Fix login bug** — Critical, due today\n2. 🟡 **Review PR #42** — Medium priority, 2 comments pending\n3. 🟢 **Update docs** — Low priority, can be deferred",
      status: 'complete',
      actions: [
        { label: '✅ Start #1', action: 'start-1' },
        { label: '👀 Review PR', action: 'review-pr' },
        { label: '📋 All Tasks', action: 'all-tasks' },
      ],
    },
  ]);

  return (
    <StoryFrame>
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
        onSend={send}
        onCancel={cancel}
        onAction={(action) => {
          const label = String(action);
          setMessages((prev) => [
            ...prev,
            { id: `u-${Date.now()}`, role: 'user', text: `[Clicked: ${label}]`, status: 'complete' },
            {
              id: `a-${Date.now()}`,
              role: 'ai',
              text: `Got it! Processing action: "${label}". In a real app this would navigate or perform the action.`,
              status: 'complete',
            },
          ]);
        }}
        title="Task Manager"
        placeholder="Ask about your tasks…"
        suggestions={['What is due today?', 'Show all tasks', 'Create a task']}
      />
    </StoryFrame>
  );
}

export const WithActions: Story = {
  render: () => <ActionsDemo />,
};

/* ═══════════════════════════════════════════════════════════════════════
   14. System messages interspersed
   ═══════════════════════════════════════════════════════════════════════ */

export const SystemMessages: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          { id: '1', role: 'system', text: '🔄 Connected to CRM database. 847 records loaded.', status: 'complete' },
          { id: '2', role: 'user', text: 'Show me recent activity', status: 'complete' },
          {
            id: '3',
            role: 'ai',
            text: "Here's the recent activity:\n\n• Alice called Acme Corp (2h ago)\n• Bob sent proposal to Beta Inc (4h ago)\n• Carol logged meeting notes for Gamma LLC (yesterday)",
            status: 'complete',
          },
          { id: '4', role: 'system', text: '⚠️ 2 deals have upcoming deadlines this week.', status: 'complete' },
          { id: '5', role: 'user', text: 'Which deals?', status: 'complete' },
          {
            id: '6',
            role: 'ai',
            text: 'Two deals need attention this week:\n\n1. **Acme Enterprise License** — Proposal deadline: Friday\n2. **Gamma Pilot** — Follow-up call scheduled: Thursday',
            status: 'complete',
            actions: [
              { label: '📅 Calendar', action: 'calendar' },
              { label: '📧 Send Reminders', action: 'reminders' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="CRM Assistant"
        subtitle="Real-time notifications"
      />
    </StoryFrame>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   15. Interactive with inline widgets
   ═══════════════════════════════════════════════════════════════════════ */

function InteractiveWithWidgetsDemo() {
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const smartRespond = useCallback(
    (text: string) => {
      if (isStreaming) return;
      const lower = text.toLowerCase();

      const userMsg: ChatWindowMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
        status: 'complete',
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      // Simulate thinking delay
      setTimeout(() => {
        let aiMsg: ChatWindowMessage;

        if (lower.includes('stock') || lower.includes('inventory')) {
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here are the current stock levels:' },
              {
                kind: 'widget',
                widget: {
                  id: `stock-${Date.now()}`,
                  type: 'data-table',
                  label: 'Stock Levels',
                  props: { items: STOCK_DATA, columns: STOCK_COLUMNS },
                },
              },
              { kind: 'text', text: '2 items need restocking.' },
            ],
            actions: [{ label: '📦 Restock', action: 'restock' }],
          };
        } else if (lower.includes('deal') || lower.includes('pipeline')) {
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Your current deal pipeline:' },
              {
                kind: 'widget',
                widget: {
                  id: `deals-${Date.now()}`,
                  type: 'data-table',
                  label: 'Deals',
                  props: { items: DEAL_DATA, columns: DEAL_COLUMNS },
                },
              },
            ],
          };
        } else if (lower.includes('report') || lower.includes('summary')) {
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: "Here's your summary report:" },
              {
                kind: 'widget',
                widget: {
                  id: `report-${Date.now()}`,
                  type: 'report-view',
                  label: 'Summary',
                  props: { sections: REPORT_SECTIONS },
                },
              },
            ],
          };
        } else if (lower.includes('contact')) {
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: '',
            status: 'complete',
            content: [
              { kind: 'text', text: 'Here are your contacts:' },
              {
                kind: 'widget',
                widget: {
                  id: `contacts-${Date.now()}`,
                  type: 'data-table',
                  label: 'Contacts',
                  props: { items: CONTACT_DATA, columns: CONTACT_COLUMNS },
                },
              },
            ],
          };
        } else {
          const resp = defaultResponseMatcher(text);
          aiMsg = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: resp?.text ?? "I'm not sure about that.",
            status: 'complete',
            actions: resp?.actions,
          };
        }

        setMessages((prev) => [...prev, aiMsg]);
        setIsStreaming(false);
      }, 800);
    },
    [isStreaming],
  );

  return (
    <StoryFrame>
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
        onSend={smartRespond}
        onAction={(a) => alert(`Action: ${JSON.stringify(a)}`)}
        suggestions={[
          'Show stock levels',
          'Show deals',
          'Show contacts',
          'Give me a summary report',
          'Hello!',
        ]}
        title="Smart Assistant"
        subtitle="Try: stock, deals, contacts, report"
        placeholder="Ask about inventory, deals, contacts, or reports…"
        renderWidget={defaultWidgetRenderer}
        footer={<span>Widget-aware responses · Type "stock", "deals", "contacts", or "report"</span>}
      />
    </StoryFrame>
  );
}

export const InteractiveWithWidgets: Story = {
  render: () => <InteractiveWithWidgetsDemo />,
};

/* ═══════════════════════════════════════════════════════════════════════
   16. Narrow / mobile-like width
   ═══════════════════════════════════════════════════════════════════════ */

export const NarrowWidth: Story = {
  render: () => (
    <div style={{ width: 380, height: 600, margin: '20px auto', border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
      <ChatWindow
        messages={[
          { id: '1', role: 'user', text: 'Hi!', status: 'complete' },
          {
            id: '2',
            role: 'ai',
            text: "Hello! I'm your assistant. I work great even in narrow views. How can I help you today?",
            status: 'complete',
            actions: [
              { label: '📋 Tasks', action: 'tasks' },
              { label: '📊 Reports', action: 'reports' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="Assistant"
        suggestions={['Tasks', 'Reports', 'Help']}
      />
    </div>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════
   17. Timestamps and metadata
   ═══════════════════════════════════════════════════════════════════════ */

export const WithTimestamps: Story = {
  render: () => (
    <StoryFrame>
      <ChatWindow
        messages={[
          {
            id: '1',
            role: 'system',
            text: 'Session started.',
            status: 'complete',
            meta: { timestamp: '10:30 AM' },
          },
          {
            id: '2',
            role: 'user',
            text: 'What are the top selling products?',
            status: 'complete',
            meta: { timestamp: '10:31 AM' },
          },
          {
            id: '3',
            role: 'ai',
            text: "Here are your top sellers this month:\n\n1. Thingamajig E — 2,400 units\n2. Sprocket C — 890 units\n3. Widget A — 340 units\n\nThingamajig E continues to dominate with 3x the volume of the runner-up.",
            status: 'complete',
            meta: { timestamp: '10:31 AM' },
            actions: [{ label: '📊 Sales Chart', action: 'chart' }],
          },
          {
            id: '4',
            role: 'user',
            text: 'How does that compare to last month?',
            status: 'complete',
            meta: { timestamp: '10:32 AM' },
          },
          {
            id: '5',
            role: 'ai',
            text: 'Compared to last month:\n\n• Thingamajig E: ↑ 15% (+312 units)\n• Sprocket C: ↓ 3% (-28 units)\n• Widget A: ↑ 22% (+62 units)\n\nOverall sales volume is up 8.4% month-over-month.',
            status: 'complete',
            meta: { timestamp: '10:32 AM' },
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="Sales Intelligence"
        subtitle="Real-time analytics"
        footer={<span>Data as of Feb 15, 2026 · Refreshes every 5 min</span>}
      />
    </StoryFrame>
  ),
};
