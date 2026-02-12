// ── Filter ──
export type FilterOp = '<=' | '>=' | '==' | '!=' | '<' | '>' | 'contains' | 'iequals';

export interface DataFilter {
  field: string;
  op: FilterOp;
  value: string | number;
}

// ── DSL Actions (discriminated union) ──
export type NavigateAction = { type: 'navigate'; card: string; paramValue?: string; param?: string };
export type BackAction = { type: 'back' };
export type ToastAction = { type: 'toast'; message: string };

// Domain actions are open-ended – typed in the app layer
export type GenericDSLAction = { type: string; [key: string]: unknown };

export type DSLAction = NavigateAction | BackAction | ToastAction | GenericDSLAction;

// ── Card field types (DSL-level, mapped to widget FieldConfig by card wrappers) ──
export type DSLFieldType = 'label' | 'readonly' | 'text' | 'number' | 'select' | 'tags';

export interface DSLField {
  id: string;
  label?: string;
  type: DSLFieldType;
  value?: string;
  style?: string;
  placeholder?: string;
  required?: boolean;
  default?: unknown;
  step?: number;
  options?: string[];
  highlight?: string;
}

export interface DSLComputedField {
  id: string;
  label: string;
  expr: string;
}

export interface DSLButton {
  label: string;
  action: DSLAction;
  style?: 'primary' | 'danger';
}

export interface DSLFilter {
  field: string;
  type: 'select' | 'text';
  options?: string[];
  placeholder?: string;
}

// ── Card definitions ──
export type CardType = 'menu' | 'list' | 'detail' | 'form' | 'chat' | 'report';

export interface BaseCard {
  type: CardType;
  title: string;
  icon: string;
}

export interface MenuCardDef extends BaseCard {
  type: 'menu';
  fields?: DSLField[];
  buttons?: DSLButton[];
}

export interface ListCardDef extends BaseCard {
  type: 'list';
  dataSource: string;
  columns: string[];
  sortable?: boolean;
  filters?: DSLFilter[];
  dataFilter?: DataFilter;
  rowAction?: DSLAction;
  toolbar?: DSLButton[];
  footer?: { type: 'sum'; field: string; label: string };
  emptyMessage?: string;
}

export interface DetailCardDef extends BaseCard {
  type: 'detail';
  dataSource: string;
  keyField: string;
  fields: DSLField[];
  computed?: DSLComputedField[];
  buttons?: DSLButton[];
}

export interface FormCardDef extends BaseCard {
  type: 'form';
  fields: DSLField[];
  submitAction: DSLAction;
  submitLabel: string;
}

export interface ReportCardDef extends BaseCard {
  type: 'report';
  sections: Array<{ label: string; compute: string }>;
}

export interface ChatCardDef extends BaseCard {
  type: 'chat';
  welcome: string;
  suggestions?: string[];
}

export type CardDefinition =
  | MenuCardDef
  | ListCardDef
  | DetailCardDef
  | FormCardDef
  | ReportCardDef
  | ChatCardDef;

// ── AI Intent ──
export interface IntentQuery {
  source: string;
  filter?: DataFilter;
  limit?: number;
  aggregate?: string;
}

export interface AIIntent {
  patterns: string[];
  response?: string;
  query?: IntentQuery;
  compute?: string;
  actions?: Array<{ label: string; action: DSLAction }>;
}

export interface AIFallback {
  response: string;
  actions: Array<{ label: string; action: DSLAction }>;
}

// ── The Stack (generic) ──
export interface StackSettings {
  [key: string]: unknown;
}

export interface StackData {
  [tableName: string]: Record<string, unknown>[];
}

export interface Stack<
  TData extends StackData = StackData,
  TSettings extends StackSettings = StackSettings,
> {
  name: string;
  icon: string;
  homeCard: string;
  settings: TSettings;
  data: TData;
  cards: Record<string, CardDefinition>;
  ai?: {
    intents: AIIntent[];
    fallback: AIFallback;
  };
}
