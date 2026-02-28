// @ts-check
/// <reference path="./pluginBundle.authoring.d.ts" />
defineStackBundle(({ ui }) => {
  const DEMO_CARDS = [
    { id: 'layouts', title: 'Layouts', focus: 'panel / row / column composition' },
    { id: 'textBadges', title: 'Text and Badges', focus: 'text and badge primitives' },
    { id: 'buttons', title: 'Buttons and Actions', focus: 'button handlers + notify' },
    { id: 'inputs', title: 'Inputs', focus: 'input change events and card state' },
    { id: 'tables', title: 'Tables', focus: 'headers, rows, filtering' },
    { id: 'stateNav', title: 'State and Navigation', focus: 'card/session state and nav intents' },
    { id: 'playground', title: 'Composed Playground', focus: 'all active widgets in one card' },
  ];

  const SAMPLE_TABLE_ROWS = [
    ['widget-a', 'Alpha sensor', 'ok', '12'],
    ['widget-b', 'Beta sensor', 'warn', '3'],
    ['widget-c', 'Gamma sensor', 'ok', '29'],
    ['widget-d', 'Delta sensor', 'error', '0'],
    ['widget-e', 'Epsilon sensor', 'ok', '17'],
  ];

  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    return String(value);
  }

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function navState(globalState) {
    return asRecord(asRecord(globalState).nav);
  }

  function readInputValue(args) {
    return toText(asRecord(args).value);
  }

  function goTo(context, cardId, param) {
    const payload = param ? { cardId, param: toText(param) } : { cardId };
    context.dispatchSystemCommand('nav.go', payload);
  }

  function goHome(context) {
    context.dispatchSystemCommand('nav.go', { cardId: 'home' });
  }

  function back(context) {
    context.dispatchSystemCommand('nav.back');
  }

  function notify(context, message) {
    context.dispatchSystemCommand('notify', { message: toText(message) });
  }

  function isVisibleWithFilter(card, filterText) {
    const query = toText(filterText).trim().toLowerCase();
    if (!query) return true;
    return (
      card.id.toLowerCase().includes(query) ||
      card.title.toLowerCase().includes(query) ||
      card.focus.toLowerCase().includes(query)
    );
  }

  function catalogRows(sessionState) {
    const session = asRecord(sessionState);
    const filter = toText(session.catalogFilter).trim().toLowerCase();
    return DEMO_CARDS.filter((card) => isVisibleWithFilter(card, filter)).map((card, index) => [
      String(index + 1),
      card.title,
      card.focus,
      card.id,
    ]);
  }

  function catalogButtons(sessionState) {
    const session = asRecord(sessionState);
    const filter = toText(session.catalogFilter).trim().toLowerCase();
    return DEMO_CARDS.filter((card) => isVisibleWithFilter(card, filter)).map((card) =>
      ui.button('Open ' + card.title, {
        onClick: {
          handler: 'openDemo',
          args: { cardId: card.id },
        },
      })
    );
  }

  function filteredRows(query) {
    const q = toText(query).trim().toLowerCase();
    if (!q) return SAMPLE_TABLE_ROWS;
    return SAMPLE_TABLE_ROWS.filter((row) => row.some((cell) => toText(cell).toLowerCase().includes(q)));
  }

  function playgroundRows(state) {
    return asArray(asRecord(state).rows)
      .map((row) => (Array.isArray(row) ? row : []))
      .filter((row) => row.length >= 2)
      .map((row) => [toText(row[0]), toText(row[1])]);
  }

  return {
    id: 'hypercardToolsUiDslDemo',
    title: 'HyperCard Tools UI DSL Demos',
    description: 'Demo stack for the active UI DSL widget surface.',
    initialSessionState: {
      catalogFilter: '',
      lastVisited: 'home',
      visitCount: 1,
      note: 'Use this stack as the reference for card authoring.',
    },
    initialCardState: {
      textBadges: { badgeLabel: 'alpha' },
      buttons: { clicks: 0, lastAction: 'none' },
      inputs: { name: '', message: '', search: '' },
      tables: { query: '' },
      stateNav: { scratch: { title: 'untitled', priority: 'low' } },
      playground: {
        draftName: 'sample-widget',
        draftState: 'ready',
        rows: [
          ['sample-widget', 'ready'],
          ['demo-widget', 'draft'],
        ],
      },
    },
    cards: {
      home: {
        render({ sessionState }) {
          const session = asRecord(sessionState);
          const rows = catalogRows(session);
          const buttons = catalogButtons(session);
          return ui.panel([
            ui.text('HyperCard Tools - UI DSL Demo Catalog'),
            ui.text('This stack demonstrates every active UI DSL widget kind.'),
            ui.row([
              ui.text('Filter:'),
              ui.input(toText(session.catalogFilter), { onChange: { handler: 'setCatalogFilter' } }),
            ]),
            ui.table(rows, {
              headers: ['#', 'Demo Card', 'Focus', 'Card ID'],
            }),
            rows.length ? ui.text('Open a demo card:') : ui.badge('No cards matched your filter.'),
            ui.column(buttons),
            ui.row([
              ui.button('Reset Session State', { onClick: { handler: 'resetSessionState' } }),
              ui.button('Show Welcome Toast', { onClick: { handler: 'toastWelcome' } }),
              ui.button('Close Window', { onClick: { handler: 'closeWindow' } }),
            ]),
            ui.text('Last visited: ' + toText(session.lastVisited, 'home')),
            ui.text('Visit count: ' + String(toNumber(session.visitCount, 1))),
          ]);
        },
        handlers: {
          setCatalogFilter({ dispatchSessionAction }, args) {
            dispatchSessionAction('patch', { catalogFilter: readInputValue(args) });
          },
          openDemo({ sessionState, dispatchSessionAction, dispatchSystemCommand }, args) {
            const cardId = toText(asRecord(args).cardId, 'home');
            const nextVisitCount = toNumber(asRecord(sessionState).visitCount, 1) + 1;
            dispatchSessionAction('patch', {
              lastVisited: cardId,
              visitCount: nextVisitCount,
            });
            dispatchSystemCommand('nav.go', { cardId });
          },
          resetSessionState({ dispatchSessionAction }) {
            dispatchSessionAction('reset');
            dispatchSessionAction('patch', {
              catalogFilter: '',
              lastVisited: 'home',
              visitCount: 1,
              note: 'Session state reset from catalog.',
            });
          },
          toastWelcome(context) {
            notify(context, 'HyperCard UI DSL demo stack is ready.');
          },
          closeWindow({ dispatchSystemCommand }) {
            dispatchSystemCommand('window.close');
          },
        },
      },

      layouts: {
        render() {
          return ui.panel([
            ui.text('Layouts Demo'),
            ui.text('Use panel for page sections, row for horizontal alignment, and column for vertical stacks.'),
            ui.panel([
              ui.text('Nested Panel'),
              ui.row([
                ui.badge('left zone'),
                ui.badge('center zone'),
                ui.badge('right zone'),
              ]),
              ui.column([
                ui.text('Column item A'),
                ui.text('Column item B'),
                ui.text('Column item C'),
              ]),
            ]),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: Text/Badges', { onClick: { handler: 'go', args: { cardId: 'textBadges' } } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      textBadges: {
        render({ cardState, sessionState }) {
          const state = asRecord(cardState);
          const session = asRecord(sessionState);
          const badgeLabel = toText(state.badgeLabel, 'alpha');
          return ui.panel([
            ui.text('Text and Badges Demo'),
            ui.text('Badges are useful for compact status highlights.'),
            ui.row([
              ui.text('Badge label:'),
              ui.input(badgeLabel, { onChange: { handler: 'setBadgeLabel' } }),
            ]),
            ui.row([
              ui.badge('status: ' + badgeLabel),
              ui.badge('last: ' + toText(session.lastVisited, 'home')),
              ui.badge('visits: ' + String(toNumber(session.visitCount, 1))),
            ]),
            ui.row([
              ui.button('Toast badge label', { onClick: { handler: 'toastLabel' } }),
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
            ]),
          ]);
        },
        handlers: {
          setBadgeLabel({ dispatchCardAction }, args) {
            dispatchCardAction('patch', { badgeLabel: readInputValue(args) });
          },
          toastLabel({ cardState, dispatchSystemCommand }) {
            const label = toText(asRecord(cardState).badgeLabel, 'updated');
            dispatchSystemCommand('notify', { message: 'Badge label: ' + label });
          },
          back,
          home: goHome,
        },
      },

      buttons: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const clicks = toNumber(state.clicks, 0);
          const lastAction = toText(state.lastAction, 'none');
          return ui.panel([
            ui.text('Buttons and Actions Demo'),
            ui.text('Click buttons to dispatch card/session/system intents.'),
            ui.badge('click count: ' + String(clicks)),
            ui.badge('last action: ' + lastAction),
            ui.row([
              ui.button('Increment', { onClick: { handler: 'increment' } }),
              ui.button('Notify', { onClick: { handler: 'notify' } }),
              ui.button('Reset Card State', { onClick: { handler: 'resetCard' } }),
            ]),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: Inputs', { onClick: { handler: 'go', args: { cardId: 'inputs' } } }),
            ]),
          ]);
        },
        handlers: {
          increment({ cardState, dispatchCardAction, dispatchSessionAction }) {
            const clicks = toNumber(asRecord(cardState).clicks, 0) + 1;
            dispatchCardAction('patch', { clicks, lastAction: 'increment' });
            dispatchSessionAction('set', { path: 'visitCount', value: clicks });
          },
          notify(context) {
            notify(context, 'Button demo emitted a notify system intent.');
          },
          resetCard({ dispatchCardAction }) {
            dispatchCardAction('reset');
            dispatchCardAction('patch', { clicks: 0, lastAction: 'reset' });
          },
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      inputs: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const name = toText(state.name);
          const message = toText(state.message);
          const search = toText(state.search);
          return ui.panel([
            ui.text('Inputs Demo'),
            ui.text('Each input emits onChange payload { value } merged with optional args.'),
            ui.row([
              ui.text('Name:'),
              ui.input(name, { onChange: { handler: 'setField', args: { field: 'name' } } }),
            ]),
            ui.row([
              ui.text('Message:'),
              ui.input(message, { onChange: { handler: 'setField', args: { field: 'message' } } }),
            ]),
            ui.row([
              ui.text('Search:'),
              ui.input(search, { onChange: { handler: 'setField', args: { field: 'search' } } }),
            ]),
            ui.table(
              [
                ['name', name],
                ['message', message],
                ['search', search],
              ],
              { headers: ['Field', 'Value'] }
            ),
            ui.row([
              ui.button('Clear', { onClick: { handler: 'clear' } }),
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
            ]),
          ]);
        },
        handlers: {
          setField({ dispatchCardAction }, args) {
            const payload = asRecord(args);
            const field = toText(payload.field);
            if (!field) {
              return;
            }
            dispatchCardAction('set', {
              path: field,
              value: toText(payload.value),
            });
          },
          clear({ dispatchCardAction }) {
            dispatchCardAction('patch', { name: '', message: '', search: '' });
          },
          back,
          home: goHome,
        },
      },

      tables: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const query = toText(state.query);
          const rows = filteredRows(query);
          return ui.panel([
            ui.text('Tables Demo'),
            ui.text('Table rows can be generated dynamically from card or session state.'),
            ui.row([
              ui.text('Filter rows:'),
              ui.input(query, { onChange: { handler: 'setQuery' } }),
            ]),
            ui.table(rows, {
              headers: ['SKU', 'Name', 'Health', 'Qty'],
            }),
            rows.length === 0 ? ui.badge('No rows matched the filter.') : ui.text('Rows: ' + String(rows.length)),
            ui.row([
              ui.button('Clear Filter', { onClick: { handler: 'clearQuery' } }),
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
            ]),
          ]);
        },
        handlers: {
          setQuery({ dispatchCardAction }, args) {
            dispatchCardAction('patch', { query: readInputValue(args) });
          },
          clearQuery({ dispatchCardAction }) {
            dispatchCardAction('patch', { query: '' });
          },
          back,
          home: goHome,
        },
      },

      stateNav: {
        render({ cardState, sessionState, globalState }) {
          const card = asRecord(cardState);
          const session = asRecord(sessionState);
          const scratch = asRecord(card.scratch);
          const nav = navState(globalState);
          return ui.panel([
            ui.text('State and Navigation Demo'),
            ui.text('This card demonstrates patch/set/reset and nav params.'),
            ui.table(
              [
                ['session.lastVisited', toText(session.lastVisited, 'home')],
                ['session.visitCount', String(toNumber(session.visitCount, 1))],
                ['session.note', toText(session.note)],
                ['nav.current', toText(nav.current)],
                ['nav.param', toText(nav.param, '(none)')],
                ['card.scratch.title', toText(scratch.title, 'untitled')],
                ['card.scratch.priority', toText(scratch.priority, 'low')],
              ],
              { headers: ['Path', 'Value'] }
            ),
            ui.row([
              ui.button('Set title via path', { onClick: { handler: 'setTitlePath' } }),
              ui.button('Toggle priority', { onClick: { handler: 'togglePriority' } }),
              ui.button('Increment session visitCount', { onClick: { handler: 'incrementVisitCount' } }),
            ]),
            ui.row([
              ui.button('Go playground with param', {
                onClick: { handler: 'go', args: { cardId: 'playground', param: 'from-state-nav' } },
              }),
              ui.button('Reset card state', { onClick: { handler: 'resetCardState' } }),
            ]),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
            ]),
          ]);
        },
        handlers: {
          setTitlePath({ dispatchCardAction }) {
            dispatchCardAction('set', {
              path: 'scratch.title',
              value: 'updated-via-set-path',
            });
          },
          togglePriority({ cardState, dispatchCardAction }) {
            const current = toText(asRecord(asRecord(cardState).scratch).priority, 'low');
            dispatchCardAction('set', {
              path: 'scratch.priority',
              value: current === 'low' ? 'high' : 'low',
            });
          },
          incrementVisitCount({ sessionState, dispatchSessionAction }) {
            const next = toNumber(asRecord(sessionState).visitCount, 1) + 1;
            dispatchSessionAction('set', { path: 'visitCount', value: next });
          },
          resetCardState({ dispatchCardAction }) {
            dispatchCardAction('reset');
            dispatchCardAction('patch', { scratch: { title: 'untitled', priority: 'low' } });
          },
          go(context, args) {
            const payload = asRecord(args);
            goTo(context, toText(payload.cardId, 'home'), payload.param);
          },
          back,
          home: goHome,
        },
      },

      playground: {
        render({ cardState, sessionState, globalState }) {
          const card = asRecord(cardState);
          const session = asRecord(sessionState);
          const nav = navState(globalState);
          const draftName = toText(card.draftName, 'sample-widget');
          const draftState = toText(card.draftState, 'ready');
          const rows = playgroundRows(card);
          return ui.panel([
            ui.text('All Widgets Playground'),
            ui.text('Compose panel + row + column + text + badge + button + input + table in one card.'),
            ui.row([
              ui.badge('lastVisited: ' + toText(session.lastVisited, 'home')),
              ui.badge('nav.param: ' + toText(nav.param, '(none)')),
            ]),
            ui.column([
              ui.row([
                ui.text('Name:'),
                ui.input(draftName, { onChange: { handler: 'setDraftField', args: { field: 'draftName' } } }),
              ]),
              ui.row([
                ui.text('State:'),
                ui.input(draftState, { onChange: { handler: 'setDraftField', args: { field: 'draftState' } } }),
              ]),
            ]),
            ui.row([
              ui.button('Add Row', { onClick: { handler: 'addRow' } }),
              ui.button('Clear Rows', { onClick: { handler: 'clearRows' } }),
              ui.button('Notify', { onClick: { handler: 'notify' } }),
            ]),
            ui.table(rows, { headers: ['Name', 'State'] }),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
            ]),
          ]);
        },
        handlers: {
          setDraftField({ dispatchCardAction }, args) {
            const payload = asRecord(args);
            const field = toText(payload.field);
            if (!field) {
              return;
            }
            dispatchCardAction('set', {
              path: field,
              value: toText(payload.value),
            });
          },
          addRow({ cardState, dispatchCardAction }) {
            const card = asRecord(cardState);
            const rows = playgroundRows(card);
            const nextRows = rows.concat([[toText(card.draftName, 'new-widget'), toText(card.draftState, 'draft')]]);
            dispatchCardAction('patch', { rows: nextRows });
          },
          clearRows({ dispatchCardAction }) {
            dispatchCardAction('patch', { rows: [] });
          },
          notify(context) {
            notify(context, 'Playground card emitted a notify intent.');
          },
          back,
          home: goHome,
        },
      },
    },
  };
});
