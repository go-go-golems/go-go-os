import type { ReactNode } from 'react';

export interface WindowChromeProps {
  title: string;
  icon?: string;
  children: ReactNode;
  unstyled?: boolean;
  className?: string;
}

export function WindowChrome({ title, icon, children, unstyled, className }: WindowChromeProps) {
  return (
    <div
      data-widget="hypercard"
      data-state={unstyled ? 'unstyled' : undefined}
      className={className}
    >
      <div data-part="window-frame">
        <div data-part="title-bar">
          <div data-part="close-box" />
          <div data-part="title-text">{icon} {title}</div>
        </div>
        {children}
      </div>
    </div>
  );
}
