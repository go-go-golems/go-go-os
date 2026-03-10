import { Btn } from '@hypercard/engine';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { Separator } from '../primitives/Separator';
import { ALL_PRIORITIES, ALL_TAGS, PRIORITY_LABELS, TAG_LABELS, type Priority, type TagId } from './types';

export interface KanbanFilterBarProps {
  filterTag: TagId | null;
  filterPriority: Priority | null;
  searchQuery: string;
  onSetFilterTag: (tag: TagId | null) => void;
  onSetFilterPriority: (priority: Priority | null) => void;
  onClearFilters: () => void;
}

export function KanbanFilterBar({
  filterTag,
  filterPriority,
  searchQuery,
  onSetFilterTag,
  onSetFilterPriority,
  onClearFilters,
}: KanbanFilterBarProps) {
  const hasFilters = Boolean(filterTag || filterPriority || searchQuery);

  return (
    <WidgetToolbar>
      {ALL_TAGS.map((tag) => (
        <Btn
          key={tag}
          onClick={() => onSetFilterTag(filterTag === tag ? null : tag)}
          data-state={filterTag === tag ? 'active' : undefined}
          style={{ fontSize: 9, padding: '1px 5px' }}
        >
          {TAG_LABELS[tag]}
        </Btn>
      ))}

      <Separator />

      {ALL_PRIORITIES.map((priority) => (
        <Btn
          key={priority}
          onClick={() => onSetFilterPriority(filterPriority === priority ? null : priority)}
          data-state={filterPriority === priority ? 'active' : undefined}
          style={{ fontSize: 9, padding: '1px 5px' }}
        >
          {PRIORITY_LABELS[priority]}
        </Btn>
      ))}

      {hasFilters ? (
        <>
          <Separator />
          <Btn onClick={onClearFilters} style={{ fontSize: 9 }}>
            ✕ Clear
          </Btn>
        </>
      ) : null}
    </WidgetToolbar>
  );
}
