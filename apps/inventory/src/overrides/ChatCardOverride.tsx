import type { CardDefinition, ChatCardDef, DSLAction, ChatMessage } from '@hypercard/engine';
import { ChatView, DataTable, matchFilter, resolveValue } from '@hypercard/engine';
import type { CardRendererContext } from '@hypercard/engine';
import type { Item, SaleEntry } from '../domain/types';
import { STACK } from '../domain/stack';

import { useSelector, useDispatch } from 'react-redux';
import { selectMessages, type ChatStateSlice } from '../features/chat/selectors';
import { addMessages } from '../features/chat/chatSlice';
import { formatCurrency } from '../domain/formatters';

export function renderChatCard(cardDef: CardDefinition, ctx: CardRendererContext) {
  const def = cardDef as ChatCardDef;
  return <ChatCardInner def={def} ctx={ctx} />;
}

function ChatCardInner({ def, ctx }: { def: ChatCardDef; ctx: CardRendererContext }) {
  const dispatch = useDispatch();
  const messages = useSelector((s: ChatStateSlice) => selectMessages(s));
  const items = (ctx.data.items ?? []) as Item[];
  const sales = (ctx.data.salesLog ?? []) as SaleEntry[];
  const intents = STACK.ai?.intents ?? [];
  const fallback = STACK.ai?.fallback;

  // On first render, add welcome if empty
  const allMsgs: ChatMessage[] = messages.length === 0
    ? [{ role: 'ai', text: def.welcome }]
    : messages;

  function handleSend(text: string) {
    const userMsg: ChatMessage = { role: 'user', text };
    const lower = text.toLowerCase();

    // Find matching intent
    for (const intent of intents) {
      const matched = intent.patterns.find((p) => lower.includes(p));
      if (!matched) continue;

      let responseText = intent.response ?? '';
      let results: unknown[] | undefined;

      if (intent.query) {
        let items2 = [...(ctx.data[intent.query.source] ?? [])] as Record<string, unknown>[];
        if (intent.query.filter) {
          items2 = items2.filter((i) =>
            matchFilter(i, {
              ...intent.query!.filter!,
              value: resolveValue(intent.query!.filter!.value, { settings: ctx.settings, match: matched }),
            }, { settings: ctx.settings, match: matched }),
          );
        }
        if (intent.query.limit) items2 = items2.slice(0, intent.query.limit);
        results = items2;
        responseText = responseText
          .replace('{{threshold}}', String(ctx.settings.lowStockThreshold))
          .replace('{{matchCap}}', matched.charAt(0).toUpperCase() + matched.slice(1));
      }

      if (intent.compute) {
        responseText = computeAIResponse(intent.compute, items, sales, ctx);
        // For bestSellers + margin, also add result items
        if (intent.compute === 'bestSellers') {
          const counts: Record<string, number> = {};
          sales.forEach((s) => { counts[s.sku] = (counts[s.sku] ?? 0) + s.qty; });
          const topSkus = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([sku]) => sku);
          results = items.filter((i) => topSkus.includes(i.sku));
        }
        if (intent.compute === 'marginReport') {
          results = [...items].sort((a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price).slice(0, 4);
        }
      }

      const aiMsg: ChatMessage = {
        role: 'ai',
        text: responseText,
        results,
        actions: intent.actions?.map((a) => ({
          label: a.label,
          action: a.action as unknown,
        })),
      };
      dispatch(addMessages([userMsg, aiMsg]));
      return;
    }

    // Fallback
    if (fallback) {
      const aiMsg: ChatMessage = {
        role: 'ai',
        text: fallback.response,
        actions: fallback.actions?.map((a) => ({
          label: a.label,
          action: a.action as unknown,
        })),
      };
      dispatch(addMessages([userMsg, aiMsg]));
    }
  }

  return (
    <ChatView
      messages={allMsgs}
      suggestions={def.suggestions}
      onSend={handleSend}
      onAction={(action) => {
        const a = action as DSLAction;
        if (a.type === 'aiSend') {
          handleSend((a as any).text);
        } else {
          ctx.dispatch(a);
        }
      }}
      renderResults={(results) => {
        const rows = results as Record<string, unknown>[];
        if (rows.length === 0) return null;
        // If rows have sku, show as inventory table
        if (rows[0]?.sku !== undefined) {
          return (
            <div style={{ marginTop: 3, border: '1px solid #000', background: '#fff', padding: 3 }}>
              <DataTable
                items={rows}
                columns={[
                  { key: 'sku', label: 'SKU', width: 65 },
                  { key: 'qty', label: 'QTY', width: 35 },
                  { key: 'price', label: 'PRICE', width: 55, format: (v) => formatCurrency(v) },
                  { key: 'name', label: 'NAME', width: '1fr' },
                ]}
                onRowClick={(item) => ctx.dispatch({ type: 'navigate', card: 'itemDetail', paramValue: String(item.sku) })}
              />
            </div>
          );
        }
        return (
          <div style={{ fontSize: 10 }}>
            {rows.map((r, i) => <div key={i}>{JSON.stringify(r)}</div>)}
          </div>
        );
      }}
    />
  );
}

function computeAIResponse(compute: string, items: Item[], sales: SaleEntry[], ctx: CardRendererContext): string {
  switch (compute) {
    case 'bestSellers': {
      const counts: Record<string, number> = {};
      sales.forEach((s) => { counts[s.sku] = (counts[s.sku] ?? 0) + s.qty; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return 'Top sellers by volume:\n' + sorted.slice(0, 3).map(([sku, qty]) => `  ${sku}: ${qty} units sold`).join('\n');
    }
    case 'inventoryValue': {
      const rv = items.reduce((a, i) => a + i.price * i.qty, 0);
      const cv = items.reduce((a, i) => a + i.cost * i.qty, 0);
      return `Total retail value: ${formatCurrency(rv)}\nCost basis: ${formatCurrency(cv)}\nPotential profit: ${formatCurrency(rv - cv)}`;
    }
    case 'marginReport': {
      const sorted = [...items].sort((a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price);
      return 'Top margin items:\n' + sorted.slice(0, 4).map((i) =>
        `  ${i.sku} ${i.name}: ${((i.price - i.cost) / i.price * 100).toFixed(0)}%`,
      ).join('\n');
    }
    default:
      return `Unknown compute: ${compute}`;
  }
}
