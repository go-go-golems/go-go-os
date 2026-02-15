export interface DesktopMenuItem {
  id: string;
  label: string;
  commandId: string;
  shortcut?: string;
  disabled?: boolean;
}

export interface DesktopMenuSection {
  id: string;
  label: string;
  items: DesktopMenuItem[];
}

export interface DesktopIconDef {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
}

export interface DesktopWindowDef {
  id: string;
  title: string;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  focused?: boolean;
}
