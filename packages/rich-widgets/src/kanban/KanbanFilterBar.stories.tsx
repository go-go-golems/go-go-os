import type { Meta, StoryObj } from '@storybook/react';
import { KanbanFilterBar } from './KanbanFilterBar';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof KanbanFilterBar> = {
  title: 'RichWidgets/Kanban/FilterBar',
  component: KanbanFilterBar,
};

export default meta;
type Story = StoryObj<typeof KanbanFilterBar>;

export const Default: Story = {
  args: {
    filterTag: null,
    filterPriority: null,
    searchQuery: '',
    onSetFilterTag: () => {},
    onSetFilterPriority: () => {},
    onClearFilters: () => {},
  },
};

export const ActiveFilters: Story = {
  args: {
    filterTag: 'urgent',
    filterPriority: 'high',
    searchQuery: 'auth',
    onSetFilterTag: () => {},
    onSetFilterPriority: () => {},
    onClearFilters: () => {},
  },
};
