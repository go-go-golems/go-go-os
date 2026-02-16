import type { Meta, StoryObj } from '@storybook/react';
import { InventoryTimelineWidget } from '../features/chat/InventoryTimelineWidget';
import type { TimelineWidgetItem } from '../features/chat/chatSlice';

function at(msAgo: number): number {
  return Date.now() - msAgo;
}

const demoItems: TimelineWidgetItem[] = [
  {
    id: 'card:tc-2',
    title: 'Detailed Inventory Summary',
    status: 'success',
    detail: 'template=reportViewer · artifact=detailed_inventory_summary',
    kind: 'card',
    template: 'reportViewer',
    artifactId: 'detailed_inventory_summary',
    updatedAt: at(5000),
  },
  {
    id: 'widget:tc-2',
    title: 'Inventory Coverage Widget',
    status: 'success',
    detail: 'template=miniKpi · artifact=inventory_coverage',
    kind: 'widget',
    template: 'miniKpi',
    artifactId: 'inventory_coverage',
    updatedAt: at(9000),
  },
  {
    id: 'tool:call-2',
    title: 'Tool inventory_report',
    status: 'running',
    detail: 'args={"low_stock_threshold":5}',
    kind: 'tool',
    updatedAt: at(13000),
  },
  {
    id: 'timeline:status-1',
    title: 'Updating card proposal: Detailed Inventory Summary',
    status: 'info',
    detail: 'timeline status=info',
    kind: 'timeline',
    updatedAt: at(18000),
  },
  {
    id: 'widget:tc-3',
    title: 'Missing structured widget block <hypercard:widget:v1>',
    status: 'error',
    detail: 'timeline status=error',
    kind: 'widget',
    updatedAt: at(24000),
  },
];

const meta = {
  title: 'Widgets/Inventory Timeline',
  component: InventoryTimelineWidget,
  args: {
    items: demoItems,
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 560, maxWidth: '95vw' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InventoryTimelineWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { items: [] },
};

export const ToolOnly: Story = {
  args: {
    items: demoItems.filter((item) => item.kind === 'tool'),
  },
};
