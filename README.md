# HyperCard React — DSL-Driven Card Application Framework

A card-based application framework built with React 19, Redux Toolkit, Storybook 10, and Vite. Apps are defined as **card stacks** using a DSL (Domain-Specific Language) — each card declares its UI, bindings, selectors, and actions, and the framework runtime renders and wires everything.

## Architecture

```
packages/engine/   — @hypercard/engine (generic, zero domain knowledge)
  src/
    app/               — createAppStore, createDSLApp, createStoryHelpers
    cards/             — DSL type system, runtime execution, scoped state slice
    chat/              — Streaming chat system (slice, API client, fake stream)
    components/
      shell/           — HyperCardShell, CardRenderer, layouts, ChatSidebar
      widgets/         — 13 generic widgets (DataTable, ListView, FormView, etc.)
    debug/             — debugSlice, StandardDebugPane, useStandardDebugHooks
    features/          — RTK slices (navigation, notifications)
    theme/             — CSS custom properties (base.css, classic.css, modern.css)
    types.ts           — Widget prop types (ColumnConfig, FieldConfig, ChatMessage)
    parts.ts           — data-part name registry

apps/inventory/    — Inventory management (10 cards)
apps/todo/         — Task management (7 cards)
apps/crm/          — CRM with contacts/companies/deals/activities (13 cards)
apps/book-tracker-debug/  — Book tracker with debug pane (6 cards)
```

## Quick Start

```bash
npm install
npm run dev          # Vite dev server (apps/inventory)
npm run storybook    # Storybook (all apps + engine widgets)
npm run build        # Production build (engine + all 4 apps)
npm run typecheck    # TypeScript build check (all workspaces)
npm run lint         # Biome lint/format check
npm run test         # Vitest runtime tests (engine)
```

## Creating an App

### 1. Define domain types + Redux slice

```ts
// features/contacts/contactsSlice.ts
export const contactsSlice = createSlice({ name: 'contacts', ... });
export const contactsReducer = contactsSlice.reducer;
```

### 2. Create the store with `createAppStore`

```ts
// app/store.ts
import { createAppStore } from '@hypercard/engine';
import { contactsReducer } from '../features/contacts/contactsSlice';

export const { store, createStore } = createAppStore({
  contacts: contactsReducer,
});
```

### 3. Define shared selectors + actions bridge

```ts
// app/cardRuntime.ts
import { type SharedSelectorRegistry, type SharedActionRegistry, Act } from '@hypercard/engine';

export const sharedSelectors: SharedSelectorRegistry<RootState> = {
  allContacts: (state) => state.contacts.items,
};

export const sharedActions: SharedActionRegistry<RootState> = {
  'contact.create': (ctx, args) => { ctx.dispatch(addContact(args)); },
};
```

### 4. Define cards (one file per card)

```ts
// domain/cards/contactsCard.ts
import { ui, Sel, Act } from '@hypercard/engine';

export const contactsCard = {
  id: 'contacts',
  type: 'list',
  title: 'Contacts',
  icon: '👤',
  ui: ui.list({ items: Sel('allContacts', 'shared'), columns: [...] }),
  bindings: {
    list: {
      select: Act('nav.go', { card: 'contactDetail', param: Ev('id') }),
    },
  },
};
```

### 5. Assemble the stack

```ts
// domain/stack.ts
export const APP_STACK: CardStackDefinition = {
  id: 'myapp', name: 'My App', icon: '📱', homeCard: 'home',
  cards: { home: homeCard, contacts: contactsCard, ... },
};
```

### 6. Render with HyperCardShell

```tsx
// App.tsx
<HyperCardShell
  stack={APP_STACK}
  sharedSelectors={sharedSelectors}
  sharedActions={sharedActions}
/>
```

### 7. Create Storybook stories with `createStoryHelpers`

```tsx
const { storeDecorator, createStory, FullApp } = createStoryHelpers({
  stack: APP_STACK,
  sharedSelectors, sharedActions,
  createStore,
  navShortcuts: [{ card: 'home', icon: '🏠' }],
});

const meta = { title: 'MyApp', component: FullApp, decorators: [storeDecorator] };
export default meta;
export const Home = createStory('home');
```

## Extension Points

- **`CardStackDefinition`** — Define cards, selectors, actions at card/cardType/background/stack/global scopes
- **`SharedSelectorRegistry` / `SharedActionRegistry`** — Bridge domain state to card DSL
- **`createAppStore(domainReducers)`** — Pre-wired store with engine reducers
- **`createStoryHelpers(config)`** — Storybook decorator + per-card story factory
- **`createDSLApp(config)`** — One-call app factory (store + App component)
- **`ActionDescriptor.to`** — Scope actions to `card`, `shared`, `stack`, etc.
- **CSS Custom Properties** — Override any `--hc-*` token under `[data-widget="hypercard"]`

## Runtime Action Resolution

When an action fires, the runtime resolves handlers in this order:

1. **Built-ins**: `nav.go`, `nav.back`, `toast.show`, `state.set`, `state.setField`, `state.patch`, `state.reset`
2. **Local handlers** (when `to` is `auto` or unset): card → cardType → background → stack → global
3. **Shared handlers**: from the `sharedActions` registry
4. **Unhandled**: console warning with action type + card context

Use `descriptor.to` to skip the cascade: `Act('my.action', args, { to: 'shared' })`.

## Selector Resolution

Selectors resolve in order: card → cardType → background → stack → global → shared.
Use `Sel('name', 'shared')` to go directly to shared selectors.

## Widgets

| Widget | Purpose |
|--------|---------|
| `Btn` | Action button with variants |
| `Chip` | Clickable tag/suggestion |
| `Toast` | Auto-dismiss notification |
| `FieldRow` | Label + input pair |
| `FilterBar` | Filter controls row |
| `DataTable` | Generic data grid |
| `MenuGrid` | Card-style menu |
| `ListView` | Filterable table with footer |
| `DetailView` | Record detail with computed fields |
| `FormView` | Input form with submit |
| `ReportView` | Key-value report sections |
| `ChatView` | Chat timeline with suggestions |
| `StreamingChatView` | Streaming chat with cursor animation |

## Theming

```css
[data-widget="hypercard"].theme-custom {
  --hc-color-bg: #0a1628;
  --hc-color-fg: #e0e8f0;
  --hc-color-accent: #00bcd4;
}
```

## License

MIT
