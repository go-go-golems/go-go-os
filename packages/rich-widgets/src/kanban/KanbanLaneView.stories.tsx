import type { Meta, StoryObj } from '@storybook/react';
import { KanbanLaneView } from './KanbanLaneView';
import { INITIAL_COLUMNS, INITIAL_TASKS } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof KanbanLaneView> = {
  title: 'RichWidgets/Kanban/LaneView',
  component: KanbanLaneView,
  decorators: [
    (Story) => (
      <div style={{ width: 280, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KanbanLaneView>;

export const Populated: Story = {
  args: {
    column: INITIAL_COLUMNS[0],
    tasks: INITIAL_TASKS.filter((task) => task.col === INITIAL_COLUMNS[0].id),
    total: INITIAL_TASKS.filter((task) => task.col === INITIAL_COLUMNS[0].id).length,
    collapsed: false,
    isDragOver: false,
    onOpenTaskEditor: () => {},
    onToggleCollapsed: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
  },
};

export const EmptyDragTarget: Story = {
  args: {
    column: { id: 'blocked', title: 'Blocked', icon: '⛔' },
    tasks: [],
    total: 0,
    collapsed: false,
    isDragOver: true,
    onOpenTaskEditor: () => {},
    onToggleCollapsed: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
  },
};

export const Collapsed: Story = {
  args: {
    column: INITIAL_COLUMNS[1],
    tasks: INITIAL_TASKS.filter((task) => task.col === INITIAL_COLUMNS[1].id),
    total: INITIAL_TASKS.filter((task) => task.col === INITIAL_COLUMNS[1].id).length,
    collapsed: true,
    isDragOver: false,
    onOpenTaskEditor: () => {},
    onToggleCollapsed: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
  },
};
