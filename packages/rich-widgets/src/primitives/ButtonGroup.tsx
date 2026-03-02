import { Btn } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';

export interface ButtonGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
  className,
}: ButtonGroupProps<T>) {
  return (
    <div data-part={RICH_PARTS.buttonGroup} className={className}>
      {options.map((opt) => (
        <Btn
          key={opt.value}
          onClick={() => onChange(opt.value)}
          data-state={value === opt.value ? 'active' : undefined}
          style={{ fontSize: 9, padding: '2px 6px' }}
        >
          {opt.label}
        </Btn>
      ))}
    </div>
  );
}
