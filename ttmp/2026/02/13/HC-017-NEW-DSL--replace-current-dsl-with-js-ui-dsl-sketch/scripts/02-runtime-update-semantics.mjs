#!/usr/bin/env node

/**
 * Experiment: runtime update semantics for bindings/actions + preview mode.
 */

function Act(type, args) {
  return { $: 'act', type, args };
}

function Ev(name) {
  return { $: 'event', name };
}

function deepGet(obj, path) {
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function resolveValue(expr, ctx) {
  if (expr == null || typeof expr !== 'object') return expr;
  if (Array.isArray(expr)) return expr.map((x) => resolveValue(x, ctx));

  if (!('$' in expr)) {
    const out = {};
    for (const [k, v] of Object.entries(expr)) out[k] = resolveValue(v, ctx);
    return out;
  }

  if (expr.$ === 'event') return deepGet(ctx.event?.payload ?? {}, expr.name);
  return undefined;
}

class UIRuntime {
  constructor({ getState, mode = 'interactive' }) {
    this.getState = getState;
    this.mode = mode;
    this.screens = new Map();
    this.globalActions = new Map();
    this.log = [];
  }

  registerScreen(screen) {
    this.screens.set(screen.id, {
      ...screen,
      bindings: screen.bindings ?? {},
      actions: screen.actions ?? {},
    });
  }

  updateBindings(screenId, updater) {
    const prev = this._mustGetScreen(screenId);
    const nextBindings = updater(prev.bindings ?? {});
    this.screens.set(screenId, { ...prev, bindings: nextBindings ?? {} });
    this.log.push(`re-render:${screenId}:bindings`);
  }

  updateActions(screenId, updater) {
    const prev = this._mustGetScreen(screenId);
    const nextActions = updater(prev.actions ?? {});
    this.screens.set(screenId, { ...prev, actions: nextActions ?? {} });
    this.log.push(`re-render:${screenId}:actions`);
  }

  registerAction(type, handler) {
    this.globalActions.set(type, handler);
  }

  emit(screenId, nodeKey, eventName, payload) {
    if (this.mode === 'preview') {
      this.log.push(`preview-ignore:${screenId}:${nodeKey}.${eventName}`);
      return;
    }

    const screen = this._mustGetScreen(screenId);
    const cmd = screen.bindings?.[nodeKey]?.[eventName];
    if (!cmd) {
      this.log.push(`no-binding:${screenId}:${nodeKey}.${eventName}`);
      return;
    }

    if (cmd.$ !== 'act') throw new Error('Unsupported command');
    const resolvedArgs = resolveValue(cmd.args, { event: { name: eventName, payload } });
    this.dispatch(screenId, { type: cmd.type, args: resolvedArgs });
  }

  dispatch(screenId, action) {
    const screen = this._mustGetScreen(screenId);
    const local = screen.actions?.[action.type];
    const global = this.globalActions.get(action.type);
    const handler = local ?? global;

    if (!handler) {
      this.log.push(`unhandled:${action.type}`);
      return;
    }

    const ctx = {
      getState: this.getState,
      dispatch: (nested) => this.dispatch(screenId, nested),
      nav: {
        go: (path) => this.log.push(`nav.go:${path}`),
      },
      log: this.log,
    };

    handler(ctx, action.args ?? {});
  }

  _mustGetScreen(screenId) {
    const s = this.screens.get(screenId);
    if (!s) throw new Error(`screen not found: ${screenId}`);
    return s;
  }
}

function assertContains(haystack, needle, label) {
  const ok = haystack.some((x) => String(x).includes(needle));
  if (!ok) {
    console.error(`FAIL: ${label}`);
    console.error('  wanted:', needle);
    console.error('  got   :', haystack);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS: ${label}`);
}

const runtime = new UIRuntime({
  getState: () => ({ inventory: { selectedSku: null } }),
  mode: 'interactive',
});

runtime.registerScreen({
  id: 'salesLog',
  ui: { t: 'screen', key: 'root' },
  bindings: {
    filter: {
      change: Act('sales.setFilter', { value: Ev('value') }),
    },
  },
  actions: {
    'sales.setFilter': (ctx, args) => {
      ctx.log.push(`setFilter:${args.value}`);
    },
  },
});

runtime.registerAction('sales.openItem', (ctx, args) => {
  ctx.nav.go(`/item/${args.sku}`);
});

runtime.emit('salesLog', 'filter', 'change', { value: 'Kitchen' });
assertContains(runtime.log, 'setFilter:Kitchen', 'initial binding dispatches action');

runtime.updateBindings('salesLog', (bindings) => ({
  ...bindings,
  salesTable: {
    ...(bindings.salesTable ?? {}),
    rowClick: Act('sales.openItem', { sku: Ev('row.sku') }),
  },
}));

runtime.emit('salesLog', 'salesTable', 'rowClick', { row: { sku: 'A-1002' } });
assertContains(runtime.log, 'nav.go:/item/A-1002', 'updated rowClick binding takes effect');

runtime.updateActions('salesLog', (actions) => ({
  ...actions,
  'sales.openItem': (ctx, args) => {
    ctx.log.push(`local-open:${args.sku}`);
    ctx.nav.go(`/detail/${args.sku}`);
  },
}));

runtime.emit('salesLog', 'salesTable', 'rowClick', { row: { sku: 'B-2001' } });
assertContains(runtime.log, 'local-open:B-2001', 'screen-local action overrides global action');
assertContains(runtime.log, 'nav.go:/detail/B-2001', 'screen-local handler executes');

const previewRuntime = new UIRuntime({
  getState: () => ({}),
  mode: 'preview',
});

previewRuntime.registerScreen({
  id: 'previewOnly',
  ui: { t: 'screen', key: 'root' },
  bindings: {
    demoBtn: { press: Act('noop') },
  },
});
previewRuntime.emit('previewOnly', 'demoBtn', 'press', {});
assertContains(previewRuntime.log, 'preview-ignore:previewOnly:demoBtn.press', 'preview mode ignores events');

if (process.exitCode !== 1) {
  console.log('\nRuntime update semantics experiment passed.');
}
