import { useState, type ReactNode } from 'react';

export interface LayoutDrawerProps {
  main: ReactNode;
  drawer: ReactNode;
}

export function LayoutDrawer({ main, drawer }: LayoutDrawerProps) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>{main}</div>
      <div
        data-part="ai-panel"
        data-state={open ? 'open' : 'closed'}
        style={{ maxHeight: open ? 'var(--hc-drawer-max-height, 200px)' : 26, display: 'flex', flexDirection: 'column', transition: 'max-height 0.15s' }}
      >
        <div
          data-part="ai-panel-header"
          style={{ cursor: 'pointer' }}
          onClick={() => setOpen(!open)}
        >
          🤖 AI {open ? '▾' : '▸'}
        </div>
        {open && <div style={{ flex: 1, overflow: 'hidden' }}>{drawer}</div>}
      </div>
    </div>
  );
}
