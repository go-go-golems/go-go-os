import type { Meta, StoryObj } from '@storybook/react';
import { ChatWindow, type ChatWindowMessage, renderLegacyTimelineContent } from './ChatWindow';
import { StoryFrame, useSimulatedStream } from './ChatWindow.stories';

const meta = {
  title: 'Engine/Widgets/ChatWindow',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

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
      text: "Based on your priorities, here's what I recommend.",
      status: 'complete',
      actions: [
        { label: '✅ Start #1', action: 'start-1' },
        { label: '👀 Review PR', action: 'review-pr' },
      ],
    },
  ]);

  return (
    <StoryFrame>
      <ChatWindow
        timelineContent={renderLegacyTimelineContent(messages, {
          onAction: (action) => {
            const label = String(action);
            setMessages((prev) => [
              ...prev,
              { id: `u-${Date.now()}`, role: 'user', text: `[Clicked: ${label}]`, status: 'complete' },
              {
                id: `a-${Date.now()}`,
                role: 'ai',
                text: `Processing action: "${label}"`,
                status: 'complete',
              },
            ]);
          },
        })}
        timelineItemCount={messages.length}
        isStreaming={isStreaming}
        onSend={send}
        onCancel={cancel}
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

export const NarrowWidth: Story = {
  render: () => {
    const messages: ChatWindowMessage[] = [
      { id: '1', role: 'user', text: 'Hi!', status: 'complete' },
      {
        id: '2',
        role: 'ai',
        text: "Hello! I'm your assistant.",
        status: 'complete',
      },
    ];
    return (
      <div
        style={{
          width: 380,
          height: 600,
          margin: '20px auto',
          border: '1px solid #ccc',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <ChatWindow
          timelineContent={renderLegacyTimelineContent(messages)}
          timelineItemCount={messages.length}
          isStreaming={false}
          onSend={() => {}}
          title="Assistant"
          suggestions={['Tasks', 'Reports', 'Help']}
        />
      </div>
    );
  },
};
