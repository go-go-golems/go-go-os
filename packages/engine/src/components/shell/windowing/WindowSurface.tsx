import type { PointerEvent, ReactNode } from 'react';
import { PARTS } from '../../../parts';
import type { DesktopWindowDef } from './types';
import { WindowResizeHandle } from './WindowResizeHandle';
import { WindowTitleBar } from './WindowTitleBar';

export interface WindowSurfaceProps {
  window: DesktopWindowDef;
  children?: ReactNode;
  onFocusWindow?: (windowId: string) => void;
  onCloseWindow?: (windowId: string) => void;
  onWindowDragStart?: (windowId: string, event: PointerEvent<HTMLDivElement>) => void;
  onWindowResizeStart?: (windowId: string, event: PointerEvent<HTMLButtonElement>) => void;
}

export function WindowSurface({
  window,
  children,
  onFocusWindow,
  onCloseWindow,
  onWindowDragStart,
  onWindowResizeStart,
}: WindowSurfaceProps) {
  return (
    <section
      data-part={PARTS.windowingWindow}
      data-state={window.focused ? 'focused' : undefined}
      role="dialog"
      aria-modal={false}
      aria-label={window.title}
      style={{
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      }}
      onMouseDown={() => onFocusWindow?.(window.id)}
      onFocus={() => onFocusWindow?.(window.id)}
    >
      <WindowTitleBar
        title={window.title}
        icon={window.icon}
        focused={window.focused}
        onClose={() => onCloseWindow?.(window.id)}
        onPointerDown={(event) => onWindowDragStart?.(window.id, event)}
      />
      <div data-part={PARTS.windowingWindowBody}>{children}</div>
      <WindowResizeHandle onPointerDown={(event) => onWindowResizeStart?.(window.id, event)} />
    </section>
  );
}
