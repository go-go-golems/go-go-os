import type { Meta, StoryObj } from '@storybook/react';
import { App } from '../App';
import { storeDecorator } from './decorators';

const meta = {
  title: 'Pages/Full App',
  component: App,
  decorators: [storeDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
