import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DesktopIconLayer } from './DesktopIconLayer';
import { DesktopMenuBar } from './DesktopMenuBar';
import type { DesktopIconDef, DesktopMenuSection, DesktopWindowDef } from './types';
import { useWindowInteractionController } from './useWindowInteractionController';
import { WindowLayer } from './WindowLayer';

interface DesktopDemoProps {
  initialWindows: DesktopWindowDef[];
  icons?: DesktopIconDef[];
}

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'inventory', label: 'Inventory', icon: '📦', x: 18, y: 44 },
  { id: 'sales', label: 'Sales', icon: '📈', x: 18, y: 132 },
  { id: 'contacts', label: 'Contacts', icon: '👥', x: 18, y: 220 },
  { id: 'ai-assistant', label: 'AI', icon: '🤖', x: 18, y: 308 },
];

const MENU_SECTIONS: DesktopMenuSection[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new-window', label: 'New Window', commandId: 'file.new-window', shortcut: 'Ctrl+N' },
      { id: 'close-window', label: 'Close Focused', commandId: 'file.close-focused', shortcut: 'Ctrl+W' },
      { separator: true },
      { id: 'about', label: 'About', commandId: 'help.about' },
    ],
  },
  {
    id: 'window',
    label: 'Window',
    items: [
      { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
      { id: 'cascade', label: 'Cascade Windows', commandId: 'window.cascade' },
      { separator: true },
      { id: 'bring-all', label: 'Bring All To Front', commandId: 'window.front' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [{ id: 'about-windowing', label: 'About Windowing', commandId: 'help.about' }],
  },
];

function makeWindow(iconId: string, zIndex: number, icons: DesktopIconDef[]): DesktopWindowDef {
  const icon = icons.find((entry) => entry.id === iconId);
  return {
    id: `window:${iconId}`,
    title: icon?.label ?? iconId,
    icon: icon?.icon,
    x: 120 + (zIndex % 4) * 42,
    y: 72 + (zIndex % 3) * 34,
    width: 320,
    height: 220,
    zIndex,
    focused: true,
  };
}

function DesktopDemo({ initialWindows, icons: iconsProp }: DesktopDemoProps) {
  const icons = iconsProp ?? DESKTOP_ICONS;
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Ready');
  const [windows, setWindows] = useState<DesktopWindowDef[]>(() => initialWindows);
  const windowsRef = useRef<DesktopWindowDef[]>(initialWindows);

  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  const focusWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const maxZIndex = prev.length === 0 ? 1 : Math.max(...prev.map((window) => window.zIndex));
      return prev.map((window) => {
        if (window.id === windowId) {
          return { ...window, focused: true, zIndex: maxZIndex + 1 };
        }
        return { ...window, focused: false };
      });
    });
  }, []);

  const openIconWindow = useCallback(
    (iconId: string) => {
      setSelectedIconId(iconId);
      setWindows((prev) => {
        const maxZIndex = prev.length === 0 ? 0 : Math.max(...prev.map((window) => window.zIndex));
        const existing = prev.find((window) => window.id === `window:${iconId}`);
        if (existing) {
          return prev.map((window) => {
            if (window.id === existing.id) {
              return { ...window, focused: true, zIndex: maxZIndex + 1 };
            }
            return { ...window, focused: false };
          });
        }

        return [...prev.map((window) => ({ ...window, focused: false })), makeWindow(iconId, maxZIndex + 1, icons)];
      });
      setStatusText(`Opened ${iconId}`);
    },
    [icons],
  );

  const closeWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const remaining = prev.filter((window) => window.id !== windowId);
      if (remaining.length === 0) {
        return remaining;
      }
      const highest = remaining.reduce((acc, window) => (window.zIndex > acc.zIndex ? window : acc));
      return remaining.map((window) => ({ ...window, focused: window.id === highest.id }));
    });
  }, []);

  const moveWindow = useCallback((windowId: string, next: { x: number; y: number }) => {
    setWindows((prev) => prev.map((window) => (window.id === windowId ? { ...window, x: next.x, y: next.y } : window)));
  }, []);

  const resizeWindow = useCallback((windowId: string, next: { width: number; height: number }) => {
    setWindows((prev) =>
      prev.map((window) => (window.id === windowId ? { ...window, width: next.width, height: next.height } : window)),
    );
  }, []);

  const { beginMove, beginResize } = useWindowInteractionController({
    getWindowById: (windowId) => windowsRef.current.find((window) => window.id === windowId),
    onMoveWindow: moveWindow,
    onResizeWindow: resizeWindow,
    onFocusWindow: focusWindow,
    constraints: { minX: 0, minY: 0, minWidth: 220, minHeight: 140 },
  });

  const onCommand = useCallback(
    (commandId: string) => {
      if (commandId === 'file.new-window') {
        openIconWindow(icons[0].id);
        return;
      }

      if (commandId === 'file.close-focused') {
        const focused = windows.find((window) => window.focused);
        if (focused) {
          closeWindow(focused.id);
          setStatusText(`Closed ${focused.title}`);
        }
        return;
      }

      if (commandId === 'window.tile') {
        setWindows((prev) =>
          prev.map((window, index) => ({
            ...window,
            x: 120 + (index % 3) * 250,
            y: 52 + Math.floor(index / 3) * 200,
            width: 240,
            height: 180,
          })),
        );
        setStatusText('Tiled windows');
        return;
      }

      if (commandId === 'window.cascade') {
        setWindows((prev) =>
          prev.map((window, index) => ({
            ...window,
            x: 120 + index * 36,
            y: 60 + index * 24,
            width: 320,
            height: 220,
          })),
        );
        setStatusText('Cascaded windows');
        return;
      }

      setStatusText('Windowing shell primitives demo');
    },
    [closeWindow, icons, openIconWindow, windows],
  );

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <DesktopMenuBar
        sections={MENU_SECTIONS}
        activeMenuId={activeMenuId}
        onActiveMenuChange={setActiveMenuId}
        onCommand={onCommand}
      />
      <DesktopIconLayer
        icons={icons}
        selectedIconId={selectedIconId}
        onSelectIcon={setSelectedIconId}
        onOpenIcon={openIconWindow}
      />
      <WindowLayer
        windows={windows}
        onFocusWindow={focusWindow}
        onCloseWindow={closeWindow}
        onWindowDragStart={(windowId, event) => beginMove(windowId, event)}
        onWindowResizeStart={(windowId, event) => beginResize(windowId, event)}
        renderWindowBody={(window) => (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>{window.title}</div>
            <p style={{ margin: 0, lineHeight: 1.4 }}>
              This is a window primitive body. Drag the title bar, resize from the corner, and use desktop icons to
              open/focus app windows.
            </p>
          </div>
        )}
      />
      <div
        data-part="footer-line"
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: 6,
          textAlign: 'left',
          color: '#1f2733',
          fontSize: 10,
        }}
      >
        {statusText}
      </div>
    </div>
  );
}

const meta = {
  title: 'Shell/Windowing/Desktop Primitives',
  component: DesktopDemo,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DesktopDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    initialWindows: [],
  },
};

export const TwoWindowOverlap: Story = {
  args: {
    initialWindows: [
      {
        id: 'window:inventory',
        title: 'Inventory',
        icon: '📦',
        x: 180,
        y: 82,
        width: 340,
        height: 230,
        zIndex: 1,
        focused: false,
      },
      {
        id: 'window:contacts',
        title: 'Contacts',
        icon: '👥',
        x: 270,
        y: 148,
        width: 320,
        height: 220,
        zIndex: 2,
        focused: true,
      },
    ],
  },
};

export const DenseWindowSet: Story = {
  args: {
    initialWindows: [
      {
        id: 'window:inventory',
        title: 'Inventory',
        icon: '📦',
        x: 120,
        y: 60,
        width: 300,
        height: 210,
        zIndex: 1,
        focused: false,
      },
      {
        id: 'window:sales',
        title: 'Sales',
        icon: '📈',
        x: 250,
        y: 90,
        width: 290,
        height: 220,
        zIndex: 2,
        focused: false,
      },
      {
        id: 'window:contacts',
        title: 'Contacts',
        icon: '👥',
        x: 380,
        y: 120,
        width: 300,
        height: 210,
        zIndex: 3,
        focused: false,
      },
      {
        id: 'window:ai-assistant',
        title: 'AI',
        icon: '🤖',
        x: 520,
        y: 158,
        width: 280,
        height: 220,
        zIndex: 4,
        focused: true,
      },
    ],
  },
};

export const WithDialogWindow: Story = {
  args: {
    initialWindows: [
      {
        id: 'window:inventory',
        title: 'Inventory',
        icon: '📦',
        x: 140,
        y: 72,
        width: 340,
        height: 240,
        zIndex: 1,
        focused: false,
      },
      {
        id: 'window:about',
        title: 'About HyperCard Desktop',
        x: 280,
        y: 140,
        width: 300,
        height: 200,
        zIndex: 2,
        focused: true,
        isDialog: true,
      },
    ],
  },
};

const BIG_DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'inventory', label: 'Inventory', icon: '📦', x: 20, y: 16 },
  { id: 'sales', label: 'Sales', icon: '📈', x: 20, y: 104 },
  { id: 'contacts', label: 'Contacts', icon: '👥', x: 20, y: 192 },
  { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖', x: 20, y: 280 },
  { id: 'reports', label: 'Reports', icon: '📊', x: 20, y: 368 },
  { id: 'settings', label: 'Settings', icon: '⚙️', x: 20, y: 456 },
  { id: 'calendar', label: 'Calendar', icon: '📅', x: 20, y: 544 },
  { id: 'notes', label: 'Notes', icon: '📝', x: 20, y: 632 },
  { id: 'mail', label: 'Mail', icon: '✉️', x: 112, y: 16 },
  { id: 'calculator', label: 'Calculator', icon: '🧮', x: 112, y: 104 },
  { id: 'trash', label: 'Trash', icon: '🗑️', x: 112, y: 192 },
];

export const BigDesktopIdle: Story = {
  args: {
    initialWindows: [],
    icons: BIG_DESKTOP_ICONS,
  },
};

export const BigDesktopWorkspace: Story = {
  args: {
    icons: BIG_DESKTOP_ICONS,
    initialWindows: [
      {
        id: 'window:inventory',
        title: 'Inventory — Browse Items',
        icon: '📦',
        x: 220,
        y: 20,
        width: 480,
        height: 360,
        zIndex: 1,
        focused: false,
      },
      {
        id: 'window:contacts',
        title: 'Contacts — All',
        icon: '👥',
        x: 340,
        y: 80,
        width: 420,
        height: 320,
        zIndex: 2,
        focused: false,
      },
      {
        id: 'window:ai-assistant',
        title: 'AI Assistant',
        icon: '🤖',
        x: 780,
        y: 30,
        width: 380,
        height: 500,
        zIndex: 3,
        focused: false,
      },
      {
        id: 'window:reports',
        title: 'Reports — Monthly Summary',
        icon: '📊',
        x: 500,
        y: 300,
        width: 520,
        height: 340,
        zIndex: 4,
        focused: false,
      },
      {
        id: 'window:notes',
        title: 'Notes',
        icon: '📝',
        x: 180,
        y: 420,
        width: 300,
        height: 260,
        zIndex: 5,
        focused: true,
      },
    ],
  },
};

export const BigDesktopSixWindows: Story = {
  args: {
    icons: BIG_DESKTOP_ICONS,
    initialWindows: [
      {
        id: 'window:inventory',
        title: 'Inventory',
        icon: '📦',
        x: 220,
        y: 10,
        width: 400,
        height: 300,
        zIndex: 1,
        focused: false,
      },
      {
        id: 'window:sales',
        title: 'Sales Dashboard',
        icon: '📈',
        x: 640,
        y: 10,
        width: 420,
        height: 280,
        zIndex: 2,
        focused: false,
      },
      {
        id: 'window:contacts',
        title: 'Contacts',
        icon: '👥',
        x: 1080,
        y: 10,
        width: 380,
        height: 300,
        zIndex: 3,
        focused: false,
      },
      {
        id: 'window:reports',
        title: 'Reports',
        icon: '📊',
        x: 220,
        y: 340,
        width: 440,
        height: 320,
        zIndex: 4,
        focused: false,
      },
      {
        id: 'window:ai-assistant',
        title: 'AI Assistant',
        icon: '🤖',
        x: 680,
        y: 320,
        width: 360,
        height: 360,
        zIndex: 5,
        focused: false,
      },
      {
        id: 'window:mail',
        title: 'Mail — Inbox',
        icon: '✉️',
        x: 1060,
        y: 340,
        width: 400,
        height: 320,
        zIndex: 6,
        focused: true,
      },
    ],
  },
};
