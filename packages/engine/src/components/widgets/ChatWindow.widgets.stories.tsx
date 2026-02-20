import type { Meta, StoryObj } from '@storybook/react';
import { ChatWindow, type ChatWindowMessage, renderLegacyTimelineContent } from './ChatWindow';
import {
  CONTACT_COLUMNS,
  CONTACT_DATA,
  REPORT_SECTIONS,
  STOCK_COLUMNS,
  STOCK_DATA,
  StoryFrame,
  defaultWidgetRenderer,
} from './ChatWindow.stories';

const meta = {
  title: 'Engine/Widgets/ChatWindow',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const InlineDataTable: Story = {
  render: () => {
    const messages: ChatWindowMessage[] = [
      { id: '1', role: 'user', text: 'Show me the current stock levels', status: 'complete' },
      {
        id: '2',
        role: 'ai',
        text: '',
        status: 'complete',
        content: [
          {
            kind: 'text',
            text: 'Here are the current stock levels across all products:',
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
        ],
      },
    ];

    return (
      <StoryFrame>
        <ChatWindow
          timelineContent={renderLegacyTimelineContent(messages, { renderWidget: defaultWidgetRenderer })}
          timelineItemCount={messages.length}
          isStreaming={false}
          onSend={() => {}}
          title="Inventory Assistant"
        />
      </StoryFrame>
    );
  },
};

export const InlineReport: Story = {
  render: () => {
    const messages: ChatWindowMessage[] = [
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
        ],
      },
    ];

    return (
      <StoryFrame>
        <ChatWindow
          timelineContent={renderLegacyTimelineContent(messages, { renderWidget: defaultWidgetRenderer })}
          timelineItemCount={messages.length}
          isStreaming={false}
          onSend={() => {}}
          title="CRM Assistant"
        />
      </StoryFrame>
    );
  },
};

export const MultipleWidgets: Story = {
  render: () => {
    const messages: ChatWindowMessage[] = [
      { id: '1', role: 'user', text: 'Show me contacts and stock', status: 'complete' },
      {
        id: '2',
        role: 'ai',
        text: '',
        status: 'complete',
        content: [
          {
            kind: 'widget',
            widget: {
              id: 'contacts',
              type: 'data-table',
              label: 'Contacts',
              props: { items: CONTACT_DATA, columns: CONTACT_COLUMNS },
            },
          },
          {
            kind: 'widget',
            widget: {
              id: 'stock',
              type: 'data-table',
              label: 'Stock',
              props: { items: STOCK_DATA, columns: STOCK_COLUMNS },
            },
          },
        ],
      },
    ];

    return (
      <StoryFrame>
        <ChatWindow
          timelineContent={renderLegacyTimelineContent(messages, { renderWidget: defaultWidgetRenderer })}
          timelineItemCount={messages.length}
          isStreaming={false}
          onSend={() => {}}
          title="Dashboard Assistant"
        />
      </StoryFrame>
    );
  },
};
