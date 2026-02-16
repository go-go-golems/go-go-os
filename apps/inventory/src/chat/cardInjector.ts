import type { CardStackDefinition } from '@hypercard/engine';

export interface CardProposal {
  id: string;
  cardId: string;
  title: string;
  icon: string;
  code: string;
}

export interface InjectCardResult {
  created: boolean;
  reason: string;
}

export function injectPluginCard(stack: CardStackDefinition, proposal: CardProposal): InjectCardResult {
  const cardId = proposal.cardId.trim();
  if (!cardId) {
    return { created: false, reason: 'Missing cardId in proposal.' };
  }
  if (!proposal.code.trim()) {
    return { created: false, reason: `Proposal ${proposal.id} has empty code.` };
  }

  if (stack.cards[cardId]) {
    return { created: false, reason: `Card '${cardId}' already exists.` };
  }

  const defineSignature = `defineCard(${JSON.stringify(cardId)}`;
  if (stack.plugin.bundleCode.includes(defineSignature)) {
    return { created: false, reason: `Card '${cardId}' has already been injected into bundle code.` };
  }

  stack.cards[cardId] = {
    id: cardId,
    type: 'plugin',
    title: proposal.title,
    icon: proposal.icon,
    ui: {
      t: 'text',
      value: `Plugin card placeholder: ${cardId}`,
    },
  };

  const defineCall = `\nglobalThis.__stackHost.defineCard(${JSON.stringify(cardId)}, (${proposal.code}));\n`;
  stack.plugin.bundleCode += defineCall;

  return { created: true, reason: `Card '${cardId}' injected.` };
}
