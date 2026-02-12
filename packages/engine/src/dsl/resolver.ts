import type { DataFilter, StackSettings } from './types';

export interface ResolveContext {
  settings: StackSettings;
  input?: string;
  match?: string;
}

export function resolveValue(val: string | number, ctx: ResolveContext): string | number {
  if (typeof val === 'string') {
    if (val.startsWith('$settings.')) return ctx.settings[val.slice(10)] as string | number;
    if (val === '$input') return ctx.input ?? '';
    if (val === '$match') return ctx.match ?? '';
  }
  return val;
}

export function matchFilter(
  item: Record<string, unknown>,
  filter: DataFilter,
  ctx: ResolveContext,
): boolean {
  const v = resolveValue(filter.value, ctx);
  const f = item[filter.field];
  switch (filter.op) {
    case '<=': return (f as number) <= (v as number);
    case '>=': return (f as number) >= (v as number);
    case '==': return String(f) === String(v);
    case '!=': return f !== v;
    case '<':  return (f as number) < (v as number);
    case '>':  return (f as number) > (v as number);
    case 'contains':
      return String(f).toLowerCase().includes(String(v).toLowerCase());
    case 'iequals':
      return String(f).toLowerCase() === String(v).toLowerCase();
    default: return true;
  }
}

export function interpolateTemplate(
  template: string,
  record: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(record[key] ?? ''));
}
