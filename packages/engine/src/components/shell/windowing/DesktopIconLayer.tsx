import { PARTS } from '../../../parts';
import type { DesktopIconDef } from './types';

export interface DesktopIconLayerProps {
  icons: DesktopIconDef[];
  selectedIconId: string | null;
  onSelectIcon?: (iconId: string) => void;
  onOpenIcon?: (iconId: string) => void;
}

export function DesktopIconLayer({ icons, selectedIconId, onSelectIcon, onOpenIcon }: DesktopIconLayerProps) {
  return (
    <ul data-part={PARTS.windowingIconLayer} aria-label="Desktop icons">
      {icons.map((icon) => {
        const isSelected = selectedIconId === icon.id;

        return (
          <li key={icon.id}>
            <button
              type="button"
              data-part={PARTS.windowingIcon}
              data-state={isSelected ? 'selected' : undefined}
              aria-pressed={isSelected}
              aria-label={icon.label}
              style={{ left: icon.x, top: icon.y }}
              onClick={() => onSelectIcon?.(icon.id)}
              onDoubleClick={() => onOpenIcon?.(icon.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenIcon?.(icon.id);
                }
              }}
            >
              <span data-part={PARTS.windowingIconGlyph} aria-hidden="true">
                {icon.icon}
              </span>
              <span data-part={PARTS.windowingIconLabel}>{icon.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
