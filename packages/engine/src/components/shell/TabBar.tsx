export interface TabDef {
  key: string;
  label: string;
}

export interface TabBarProps {
  tabs: TabDef[];
  active: string;
  onSelect: (key: string) => void;
}

export function TabBar({ tabs, active, onSelect }: TabBarProps) {
  return (
    <div data-part="tab-bar">
      {tabs.map((t) => (
        <div
          key={t.key}
          data-part="tab"
          data-state={active === t.key ? 'active' : undefined}
          onClick={() => onSelect(t.key)}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}
