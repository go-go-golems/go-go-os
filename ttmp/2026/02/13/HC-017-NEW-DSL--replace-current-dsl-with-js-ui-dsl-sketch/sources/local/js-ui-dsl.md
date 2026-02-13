Below is a **complete implementable spec** for a small JS “screen DSL” that supports:

* **UI AST** (widgets + layout)
* **selectors** (state-derived values)
* **actions** (dispatchable commands)
* **bindings** (nodeKey + eventName → action dispatch descriptor)
* **preview mode** (renders UI, ignores bindings/handlers)
* **runtime updates** (update *screen definitions*: bindings + action handlers, not just UI)

I’m writing this as if your dude is implementing a small library + a renderer adapter (DOM/TUI/etc.).

---

# Screen DSL / Runtime Spec (v0.1)

## 0) Goals and non-goals

### Goals

1. Define screens in **plain JS** with a **small UI widget vocabulary**.
2. UI definitions are **data (AST)**: easy to diff, patch, preview, and inspect.
3. UI can reference state via **selectors**.
4. Behavior is wired by **bindings**: `(nodeKey, eventName) → Command`.
5. Behavior is executed by **action handlers** registered at runtime.
6. Support **preview mode**: render UI without executing behavior.
7. Support **updating screen definitions** at runtime: add/replace bindings and action handlers.

### Non-goals (v0.1)

* No requirement for JSX.
* No requirement for a particular state library (Redux/etc.).
* No requirement for a particular renderer (DOM/TUI/etc.).
* No complex effect graph; just “dispatch action → handler runs”.

---

# 1) Terminology

* **Screen Definition**: `{ id, ui, bindings, actions? }`
* **UI AST**: immutable-ish tree of nodes (plain objects).
* **Node Key**: stable string identifier used for bindings and diffing.
* **Selector**: named function `(state, args, ctx) => value`.
* **Action**: `{ $: "act", type, args }` (descriptor) that dispatches.
* **Binding**: maps widget events to Commands.
* **Command**: currently only `ActionDescriptor` (v0.1), but the runtime treats it generically.
* **Mode**: `"interactive"` or `"preview"`.

---

# 2) Data model (TypeScript-ish)

## 2.1 Value expressions

These appear inside props and action args.

```ts
type ValueExpr =
  | null
  | boolean
  | number
  | string
  | ValueExpr[]
  | { [k: string]: ValueExpr }
  | SelExpr
  | ParamExpr
  | EvExpr;

type SelExpr   = { $: "sel"; name: string; args?: ValueExpr };
type ParamExpr = { $: "param"; name: string };
type EvExpr    = { $: "event"; name: string };
```

Helper constructors (recommended API):

```js
Sel(name, args?)   // -> SelExpr
Param(name)        // -> ParamExpr
Ev(name)           // -> EvExpr
```

## 2.2 Commands

v0.1 supports one command type: dispatch an action.

```ts
type Command = ActionDescriptor;

type ActionDescriptor = {
  $: "act";
  type: string;       // e.g. "sales.setFilter"
  args?: ValueExpr;   // any structured data, may include Ev/Sel/Param
};
```

Helper constructor:

```js
Act(type, args?)  // -> ActionDescriptor
```

## 2.3 UI nodes

All nodes share:

```ts
type UINode = {
  t: string;          // widget type e.g. "button"
  key?: string;       // stable node key (REQUIRED for bindable widgets)
  children?: UINode[];// for containers
  [prop: string]: any // widget props (ValueExpr or nested)
};
```

### Required widget set (v0.1)

You can implement more, but these cover your screenshots:

* `screen`
* `toolbar`
* `iconButton`
* `button`
* `select`
* `table`
* `form`
* `field`
* `input`
* `kvTable`
* `row`
* `text`
* `money`
* `spacer`

**Key requirements:**

* Any widget that emits events **MUST** have a `key`.
* Container widgets can have children and may also have keys.

## 2.4 Bindings

Bindings are separate from UI.

```ts
type ScreenBindings = {
  [nodeKey: string]: {
    [eventName: string]: Command
  }
};
```

Example:

```js
bindings: {
  filter: { change: Act("sales.setFilter", { value: Ev("value") }) },
  salesTable: { rowClick: Act("sales.open", { sku: Ev("row.sku") }) }
}
```

## 2.5 Action handlers

Action handlers implement semantics.

```ts
type ActionHandler = (ctx: ActionContext, args: any) => void | Promise<void>;

type ActionRegistry = {
  [actionType: string]: ActionHandler
};
```

**Note:** args passed to handlers are *resolved* (no Sel/Ev/Param objects remain).

## 2.6 Screen definition

```ts
type ScreenDefinition = {
  id: string;
  ui: UINode;                 // root node: t="screen"
  bindings?: ScreenBindings;  // optional (preview-only screens may omit)
  actions?: ActionRegistry;   // optional (can be registered globally instead)
  meta?: { [k: string]: any } // optional
};
```

---

# 3) Selector system

Selectors are a registry:

```ts
type SelectorFn = (state: any, args: any, ctx: RenderContext) => any;

type SelectorRegistry = {
  [name: string]: SelectorFn
};
```

Rules:

1. Selector name is a string, e.g. `"sales.rows"`.
2. `Sel(name, args)` in UI props or action args is resolved via the registry.
3. Missing selector name: resolves to `undefined` (and may be logged).

---

# 4) Event model

Widgets emit events with:

* `nodeKey` (string)
* `eventName` (string)
* `payload` (object)

The runtime routes events to bindings: `bindings[nodeKey]?.[eventName]`.

## 4.1 Standard event names (v0.1)

Your renderer/widgets must normalize to these names:

* `button`, `iconButton`: `press`
* `select`: `change` payload `{ value }`
* `input`: `change` payload `{ value }`, optional `submit` payload `{ value }`
* `table`: `rowClick` payload `{ row, rowIndex }`
* `screen`: optional lifecycle `mount`, `unmount`

You can add more event names later; bindings just match strings.

---

# 5) Expression resolution

This is the core interpreter.

## 5.1 Resolution context

```ts
type RenderContext = {
  mode: "interactive" | "preview";
  state: any;
  params: Record<string, string>;
  selectors: SelectorRegistry;
};

type EventContext = RenderContext & {
  event: { name: string; payload: any };
};
```

## 5.2 `resolveValue(expr, ctx)`

Algorithm (normative):

1. If `expr` is primitive (`null/boolean/number/string`): return as is.
2. If `Array`: resolve each element.
3. If plain object without `$`: resolve each property.
4. If object with `$`:

   * `$:"param"` → return `ctx.params[name]`
   * `$:"event"` → read from `ctx.event.payload` using `name`:

     * If `name` contains dots, treat as path: `"row.sku"` means `payload.row.sku`.
     * If no dot: `payload[name]`.
   * `$:"sel"` → call `selectors[name](ctx.state, resolvedArgs, ctx)`

     * `resolvedArgs` = resolve `args` with `ctx` (no event needed)
5. Unknown `$` value: return `undefined`.

---

# 6) Command execution

## 6.1 `executeCommand(cmd, ctx)`

v0.1 only supports ActionDescriptor:

If `cmd.$ === "act"`:

1. Resolve `cmd.args` using `EventContext` (so `Ev(...)` works).
2. Dispatch `{ type: cmd.type, args: resolvedArgs }`.

---

# 7) Runtime architecture

You will implement a `UIRuntime` that manages:

* registered screens
* registered selectors
* action handlers
* rendering through a renderer adapter
* updates to screen definitions (UI and/or bindings/actions)

## 7.1 Renderer adapter interface

Renderer is platform-specific (DOM/TUI). The runtime stays platform-neutral.

```ts
type Renderer = {
  render(tree: RenderTree, mountPoint: any): void;
};

type RenderTree = any; // adapter-defined representation
```

But to build a render tree, the adapter needs a normalized node representation:

Runtime must provide the adapter a structure where every node has:

* type `t`
* resolved props (actual values)
* children
* event emit function (only in interactive mode)

### Required adapter hook: event emission

The adapter must call:

```ts
runtime.emit(screenId, nodeKey, eventName, payload)
```

---

# 8) Interactive vs Preview

## 8.1 Preview mode

* Selectors resolve normally (using provided `state`).
* `emit(...)` does nothing (or logs).
* Buttons/inputs can render as disabled; that’s renderer choice.
* Bindings/actions can be absent.

## 8.2 Interactive mode

* `emit` routes to bindings and dispatches actions.
* Action handlers run.

---

# 9) Action dispatch and handler lookup

Dispatch flow:

1. Runtime receives `{ type, args }`.
2. Handler resolution order (normative):

   1. screen-local handlers: `screen.actions[type]` if present
   2. global handlers: `runtime.actions[type]` if present
3. If handler missing: no-op (and may log).

`ActionContext` passed to handler:

```ts
type ActionContext = {
  dispatch: (actionDesc: ActionDescriptor) => void;
  getState: () => any;
  setState?: (nextState: any) => void; // optional if your store supports it
  nav?: { go(path: string): void; back(): void }; // optional
  // plus anything else your app provides
};
```

---

# 10) Updating screen definitions (the thing you asked for)

This spec supports updates to:

* UI AST (`screen.ui`)
* bindings (`screen.bindings`)
* action handlers (`screen.actions`)

All updates are **atomic** and **replace-by-new-object** (immutable-ish).

## 10.1 Core API

```ts
runtime.registerScreen(screenDef: ScreenDefinition): void;

runtime.updateScreen(screenId: string, updater: (prev: ScreenDefinition) => ScreenDefinition): void;

// Convenience helpers
runtime.updateBindings(screenId: string, updater: (prev: ScreenBindings) => ScreenBindings): void;
runtime.updateActions(screenId: string, updater: (prev: ActionRegistry) => ActionRegistry): void;

runtime.registerAction(type: string, handler: ActionHandler): void;
runtime.updateAction(type: string, updater: (prev?: ActionHandler) => ActionHandler): void;
```

### Semantics

* After any update, runtime triggers a re-render for that screen (if mounted).
* Updates must preserve `screen.id`.

## 10.2 Example: add a new widget callback (no UI change)

Add table `rowClick` binding after initial load:

```js
runtime.updateBindings("salesLog", (b = {}) => ({
  ...b,
  salesTable: {
    ...(b.salesTable || {}),
    rowClick: Act("sales.openDetails", { sku: Ev("row.sku") }),
  },
}));
```

## 10.3 Example: add a new action handler (screen-local)

```js
runtime.updateActions("salesLog", (a = {}) => ({
  ...a,
  "sales.openDetails": (ctx, { sku }) => ctx.nav.go(`/item/${sku}`),
}));
```

## 10.4 Example: replace an existing binding

```js
runtime.updateBindings("salesLog", (b) => ({
  ...b,
  filter: {
    ...(b.filter || {}),
    change: Act("sales.setFilterAndRefresh", { value: Ev("value") })
  }
}));
```

## 10.5 Example: wrap an action with extra behavior

```js
runtime.updateAction("sales.openDetails", (prev) => (ctx, args) => {
  ctx.dispatch(Act("analytics.track", { name: "open_details", ...args }));
  if (prev) return prev(ctx, args);
});
```

---

# 11) Optional: Extensions / layering (plugin-friendly)

If you want multiple contributors to “extend” a screen without stomping each other, implement *extensions* as patches with deterministic precedence.

## 11.1 Extension type

```ts
type ScreenExtension = {
  id: string;                  // extension id
  screens?: {
    [screenId: string]: {
      bindings?: ScreenBindings;
      actions?: ActionRegistry;
      uiPatch?: (ui: UINode) => UINode; // optional structural patch
    }
  }
  priority?: number; // higher wins on conflict
};
```

## 11.2 Merge rules (normative)

* Apply extensions by ascending `priority`.
* For bindings:

  * merge `nodeKey`, then merge `eventName`
  * later extension wins on same `(nodeKey,eventName)`
* For actions:

  * later extension wins on same `actionType`
* For `uiPatch`:

  * composed left-to-right

This gives you “update screen definition” via adding/removing extensions.

---

# 12) Validation rules (minimal but important)

Runtime should validate on register/update:

1. `screen.id` is non-empty.
2. `screen.ui.t === "screen"`.
3. Node keys:

   * keys must be unique within a screen (recommended strict).
4. Bindings must reference existing `nodeKey` (recommended warning if not).
5. In preview mode, bindings/actions may be omitted.

---

# 13) Reference widget semantics (so renderer can be built)

This is intentionally lightweight.

## 13.1 `screen`

Props: `{ id, title?, header?, body? }`

* `header`: a node (often `toolbar`)
* `body`: node or array of nodes

## 13.2 `toolbar`

Props: `{ left?: UINode[], right?: UINode | string }`

## 13.3 `button`, `iconButton`

Props: `{ key, label?, icon?, intent?, disabled? }`
Events: `press` payload `{}`

## 13.4 `select`

Props: `{ key, value, options }`

* `options`: array of `{ label, value }`
  Events: `change` payload `{ value }`

## 13.5 `table`

Props: `{ key, columns, rows }`

* `columns`: array of `{ key, title, align?, format? }`
* `rows`: array of objects
  Events: `rowClick` payload `{ row, rowIndex }`

## 13.6 `form`, `field`, `input`

* `input` events: `change` `{ value }`

## 13.7 `kvTable`

Props: `{ rows }` rows: array of `[label, value]`

---

# 14) Minimal authoring API (recommended)

Implement these helpers:

```js
// expressions
Sel(name, args)
Param(name)
Ev(name)
Act(type, args)

// ui factory
ui.screen(props)
ui.toolbar(props)
ui.button(props)
ui.iconButton(props)
ui.select(props)
ui.table(props)
ui.form(props)
ui.field(props)
ui.input(props)
ui.kvTable(props)
ui.row(...children)
ui.text(value)
ui.money(value)
ui.spacer()
```

And optionally:

```js
defineScreen(factoryFn) // passes { ui, Sel, Param, Ev, Act } and returns ScreenDefinition
```

---

# 15) End-to-end example (compact)

```js
export const SalesLog = {
  id: "salesLog",
  ui: ui.screen({
    id: "salesLog",
    title: "Sales Log",
    header: ui.toolbar({
      left: [
        ui.iconButton({ key:"back", icon:"back" }),
        ui.iconButton({ key:"home", icon:"home" }),
      ],
      right: ui.text("Sales Log"),
    }),
    body: [
      ui.select({ key:"filter", value: Sel("sales.filter"), options: Sel("sales.filterOptions") }),
      ui.table({
        key: "salesTable",
        columns: [
          { key:"date", title:"DATE" },
          { key:"sku",  title:"SKU"  },
          { key:"qty",  title:"QTY"  },
          { key:"total",title:"TOTAL", format:"money" },
        ],
        rows: Sel("sales.rows"),
      }),
    ],
  }),
  bindings: {
    back:  { press: Act("nav.back") },
    home:  { press: Act("nav.go", { to:"home" }) },
    filter:{ change: Act("sales.setFilter", { value: Ev("value") }) },
  },
  actions: {
    "sales.setFilter": (ctx, { value }) => ctx.dispatch(Act("sales._setFilterState", { value })),
  }
};
```

Later, update behavior:

```js
runtime.updateBindings("salesLog", (b) => ({
  ...b,
  salesTable: { ...(b.salesTable||{}), rowClick: Act("sales.openItem", { sku: Ev("row.sku") }) }
}));

runtime.updateActions("salesLog", (a) => ({
  ...a,
  "sales.openItem": (ctx, { sku }) => ctx.nav.go(`/item/${sku}`)
}));
```

---

If you want, I can also write a **1-file “reference implementation skeleton”** (no extra features) that includes:

* screen registry
* expression resolver
* event router
* action dispatch
* mode switching
* a tiny “renderer adapter” interface stub

…but the above is already enough for someone to implement cleanly and consistently.

