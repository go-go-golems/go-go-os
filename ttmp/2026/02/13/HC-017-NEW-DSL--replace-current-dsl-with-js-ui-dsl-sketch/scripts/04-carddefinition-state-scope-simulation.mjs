#!/usr/bin/env node

/**
 * Simulates CardDefinition state scopes + action/selector lookup precedence.
 */

const state = {
  hypercard: {
    global: { currency: 'USD', locale: 'en-US' },
    stacks: {
      inventory: {
        state: { lowStockThreshold: 3 },
        backgrounds: {
          inventoryBg: { state: { selectedCategory: 'All' } },
        },
        cards: {
          salesToday: {
            state: { selectedDate: '2026-02-10' },
            byType: 'list',
          },
        },
        cardTypes: {
          list: { state: { pageSize: 25 } },
          detail: { state: { showAdvanced: false } },
        },
      },
    },
  },
  domain: {
    sales: {
      rows: [
        { id: 's1', date: '2026-02-10', sku: 'A-1002', total: 19.98 },
        { id: 's2', date: '2026-02-09', sku: 'B-2001', total: 24.99 },
      ],
    },
  },
};

function scopePath({ stackId, cardType, backgroundId, cardId, scope }) {
  switch (scope) {
    case 'card':
      return ['hypercard', 'stacks', stackId, 'cards', cardId, 'state'];
    case 'cardType':
      return ['hypercard', 'stacks', stackId, 'cardTypes', cardType, 'state'];
    case 'background':
      return ['hypercard', 'stacks', stackId, 'backgrounds', backgroundId, 'state'];
    case 'stack':
      return ['hypercard', 'stacks', stackId, 'state'];
    case 'global':
      return ['hypercard', 'global'];
    default:
      throw new Error(`unknown scope: ${scope}`);
  }
}

function deepGet(obj, path) {
  return path.reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function deepSet(obj, path, value) {
  const last = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((acc, key) => {
    if (acc[key] == null) acc[key] = {};
    return acc[key];
  }, obj);
  parent[last] = value;
}

function resolveScopedState(runtimeState, ctx, precedence = ['card', 'cardType', 'background', 'stack', 'global']) {
  return precedence.reduce((acc, scope) => {
    const p = scopePath({ ...ctx, scope });
    const fragment = deepGet(runtimeState, p) ?? {};
    return { ...acc, ...fragment };
  }, {});
}

function makeActionRegistry() {
  return {
    card: {
      'filter.setDate': (runtimeState, ctx, args) => {
        const p = [...scopePath({ ...ctx, scope: 'card' }), 'selectedDate'];
        deepSet(runtimeState, p, String(args.value));
      },
    },
    cardType: {
      'view.setPageSize': (runtimeState, ctx, args) => {
        const p = [...scopePath({ ...ctx, scope: 'cardType' }), 'pageSize'];
        deepSet(runtimeState, p, Number(args.value));
      },
    },
    background: {
      'filter.setCategory': (runtimeState, ctx, args) => {
        const p = [...scopePath({ ...ctx, scope: 'background' }), 'selectedCategory'];
        deepSet(runtimeState, p, String(args.value));
      },
    },
    stack: {
      'threshold.set': (runtimeState, ctx, args) => {
        const p = [...scopePath({ ...ctx, scope: 'stack' }), 'lowStockThreshold'];
        deepSet(runtimeState, p, Number(args.value));
      },
    },
    global: {
      'prefs.setCurrency': (runtimeState, ctx, args) => {
        const p = [...scopePath({ ...ctx, scope: 'global' }), 'currency'];
        deepSet(runtimeState, p, String(args.value));
      },
    },
  };
}

function resolveHandler(registry, type, priority = ['card', 'cardType', 'background', 'stack', 'global']) {
  for (const scope of priority) {
    const h = registry[scope]?.[type];
    if (h) return { scope, handler: h };
  }
  return null;
}

function assertEq(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    console.error(`FAIL: ${label}`);
    console.error('  expected:', expected);
    console.error('  actual  :', actual);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

const ctx = {
  stackId: 'inventory',
  cardType: 'list',
  backgroundId: 'inventoryBg',
  cardId: 'salesToday',
};

const merged1 = resolveScopedState(state, ctx);
assertEq(merged1.selectedDate, '2026-02-10', 'card scope value is visible');
assertEq(merged1.pageSize, 25, 'cardType scope value is visible');
assertEq(merged1.selectedCategory, 'All', 'background scope value is visible');
assertEq(merged1.lowStockThreshold, 3, 'stack scope value is visible');
assertEq(merged1.currency, 'USD', 'global scope value is visible');

const registry = makeActionRegistry();

const actions = [
  { type: 'filter.setDate', args: { value: '2026-02-09' } },
  { type: 'view.setPageSize', args: { value: 50 } },
  { type: 'filter.setCategory', args: { value: 'Accessories' } },
  { type: 'threshold.set', args: { value: 5 } },
  { type: 'prefs.setCurrency', args: { value: 'EUR' } },
];

for (const action of actions) {
  const resolved = resolveHandler(registry, action.type);
  if (!resolved) {
    console.error(`FAIL: no handler for ${action.type}`);
    process.exitCode = 1;
    continue;
  }
  resolved.handler(state, ctx, action.args);
  console.log(`HANDLED ${action.type} at scope=${resolved.scope}`);
}

const merged2 = resolveScopedState(state, ctx);
assertEq(merged2.selectedDate, '2026-02-09', 'card action updates card state');
assertEq(merged2.pageSize, 50, 'cardType action updates card-type state');
assertEq(merged2.selectedCategory, 'Accessories', 'background action updates background state');
assertEq(merged2.lowStockThreshold, 5, 'stack action updates stack state');
assertEq(merged2.currency, 'EUR', 'global action updates global state');

if (process.exitCode !== 1) {
  console.log('\nCardDefinition scoped state simulation passed.');
}
