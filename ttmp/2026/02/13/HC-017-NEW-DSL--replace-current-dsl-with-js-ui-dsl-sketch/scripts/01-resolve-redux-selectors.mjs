#!/usr/bin/env node

/**
 * Experiment: resolve Sel/Param/Ev expressions against Redux-shaped state.
 * Goal: verify selector registry contract and nested event payload lookup.
 */

function Sel(name, args) {
  return { $: 'sel', name, args };
}

function Param(name) {
  return { $: 'param', name };
}

function Ev(name) {
  return { $: 'event', name };
}

function deepGet(obj, path) {
  if (!path) return undefined;
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function resolveValue(expr, ctx) {
  if (
    expr == null ||
    typeof expr === 'string' ||
    typeof expr === 'number' ||
    typeof expr === 'boolean'
  ) {
    return expr;
  }

  if (Array.isArray(expr)) {
    return expr.map((x) => resolveValue(x, ctx));
  }

  if (!isPlainObject(expr)) {
    return undefined;
  }

  if (!('$' in expr)) {
    const out = {};
    for (const [k, v] of Object.entries(expr)) {
      out[k] = resolveValue(v, ctx);
    }
    return out;
  }

  if (expr.$ === 'param') {
    return ctx.params?.[expr.name];
  }

  if (expr.$ === 'event') {
    const payload = ctx.event?.payload ?? {};
    return deepGet(payload, expr.name);
  }

  if (expr.$ === 'sel') {
    const fn = ctx.selectors?.[expr.name];
    if (!fn) return undefined;
    const resolvedArgs = resolveValue(expr.args, ctx);
    return fn(ctx.state, resolvedArgs, ctx);
  }

  return undefined;
}

function assertEq(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) {
    console.error(`FAIL: ${label}`);
    console.error('  expected:', expected);
    console.error('  actual  :', actual);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS: ${label}`);
}

const state = {
  inventory: {
    items: [
      { sku: 'A-1002', qty: 2, category: 'Accessories', price: 9.99 },
      { sku: 'B-2001', qty: 14, category: 'Kitchen', price: 24.99 },
      { sku: 'A-1021', qty: 0, category: 'Accessories', price: 8.99 },
    ],
  },
  sales: {
    filter: 'All',
  },
};

const selectors = {
  'sales.filter': (s) => s.sales.filter,
  'sales.filterOptions': (s) => {
    const cats = [...new Set(s.inventory.items.map((i) => i.category))].sort();
    return [{ label: 'All', value: 'All' }, ...cats.map((c) => ({ label: c, value: c }))];
  },
  'sales.rows': (s, args) => {
    const category = args?.category ?? 'All';
    if (category === 'All') return s.inventory.items;
    return s.inventory.items.filter((i) => i.category === category);
  },
};

const baseCtx = {
  mode: 'interactive',
  state,
  params: { card: 'browse' },
  selectors,
};

assertEq(resolveValue(Sel('sales.filter'), baseCtx), 'All', 'selector reads Redux state');
assertEq(resolveValue(Param('card'), baseCtx), 'browse', 'param resolves from context');
assertEq(
  resolveValue(Sel('sales.rows', { category: 'Accessories' }), baseCtx).length,
  2,
  'selector args are resolved and passed',
);

const eventCtx = {
  ...baseCtx,
  event: {
    name: 'rowClick',
    payload: {
      value: 'Kitchen',
      row: { sku: 'B-2001', qty: 14 },
    },
  },
};

assertEq(resolveValue(Ev('value'), eventCtx), 'Kitchen', 'event top-level payload field');
assertEq(resolveValue(Ev('row.sku'), eventCtx), 'B-2001', 'event nested payload field');
assertEq(
  resolveValue({ sku: Ev('row.sku'), card: Param('card') }, eventCtx),
  { sku: 'B-2001', card: 'browse' },
  'nested object resolves recursively',
);

const uiExpr = {
  filterValue: Sel('sales.filter'),
  filterOptions: Sel('sales.filterOptions'),
  rows: Sel('sales.rows', { category: Ev('value') }),
};

const resolvedUi = resolveValue(uiExpr, eventCtx);
assertEq(resolvedUi.filterValue, 'All', 'composed expression resolves selector value');
assertEq(Array.isArray(resolvedUi.filterOptions), true, 'selector list returned for options');
assertEq(resolvedUi.rows.length, 1, 'event value feeds selector args');

if (process.exitCode !== 1) {
  console.log('\nAll resolver experiments passed.');
}
