import type { Meta, StoryObj } from '@storybook/react';
import { useSelector } from 'react-redux';
import { HyperCardShell } from '@hypercard/engine';
import { STACK } from '../domain/stack';
import { inventoryActionHandler } from '../app/domainActionHandler';
import { inventoryRenderers } from '../overrides/cardRenderers';
import { selectItems, type InventoryStateSlice } from '../features/inventory/selectors';
import { selectSalesLog, type SalesStateSlice } from '../features/sales/selectors';
import { storeDecorator } from './decorators';
import '../../../../packages/engine/src/theme/classic.css';
import '../../../../packages/engine/src/theme/modern.css';

type AppState = InventoryStateSlice & SalesStateSlice;

function ThemedShell({ themeClass }: { themeClass?: string }) {
  const items = useSelector((s: AppState) => selectItems(s));
  const sales = useSelector((s: AppState) => selectSalesLog(s));

  return (
    <HyperCardShell
      stack={STACK as any}
      domainActionHandler={inventoryActionHandler}
      customRenderers={inventoryRenderers}
      domainData={{ items, salesLog: sales }}
      navShortcuts={[
        { card: 'home', icon: '🏠' },
        { card: 'browse', icon: '📋' },
        { card: 'report', icon: '📊' },
        { card: 'assistant', icon: '💬' },
      ]}
      themeClass={themeClass}
    />
  );
}

const meta = {
  title: 'Pages/Themed',
  component: ThemedShell,
  decorators: [storeDecorator()],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ThemedShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultTheme: Story = { args: {} };
export const ClassicMac: Story = { args: { themeClass: 'theme-classic' } };
export const Modern: Story = { args: { themeClass: 'theme-modern' } };
