import type { CardStackDefinition } from '@hypercard/engine';

export interface CardProposal {
  id: string;
  cardId: string;
  title: string;
  icon: string;
  code: string;
  dedupeKey?: string;
  version?: number;
  policy?: Record<string, unknown>;
}

export interface InjectCardResult {
  created: boolean;
  reason: string;
}

const CARD_ID_RE = /^[a-z][a-z0-9_-]{2,63}$/;

export function injectPluginCard(stack: CardStackDefinition, proposal: CardProposal): InjectCardResult {
  const validationError = validateProposal(proposal);
  if (validationError) {
    return { created: false, reason: validationError };
  }

  const cardId = proposal.cardId.trim();
  const code = proposal.code.trim();
  const signature = computeProposalSignature(proposal);
  const signatureMarker = `// hc-proposal-signature:${signature}`;

  if (stack.cards[cardId]) {
    return { created: false, reason: `Card '${cardId}' already exists.` };
  }

  if (stack.plugin.bundleCode.includes(signatureMarker)) {
    return { created: false, reason: `Proposal '${proposal.id}' has already been applied.` };
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

  const defineCall = `\n${signatureMarker}\nglobalThis.__stackHost.defineCard(${JSON.stringify(cardId)}, (${code}));\n`;
  stack.plugin.bundleCode += defineCall;

  return { created: true, reason: `Card '${cardId}' injected.` };
}

function validateProposal(proposal: CardProposal): string | null {
  const cardId = proposal.cardId.trim();
  if (!cardId) {
    return 'Missing cardId in proposal.';
  }
  if (!CARD_ID_RE.test(cardId)) {
    return `Card id '${cardId}' is invalid. Use lowercase letters, numbers, '_' or '-'.`;
  }

  const code = proposal.code.trim();
  if (!code) {
    return `Proposal ${proposal.id} has empty code.`;
  }
  if (!code.includes('render')) {
    return `Proposal ${proposal.id} is missing a render function.`;
  }
  if (!code.includes('ui.')) {
    return `Proposal ${proposal.id} does not use HyperCard UI DSL.`;
  }

  const blockedTokens = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'window.', 'document.'];
  for (const token of blockedTokens) {
    if (code.includes(token)) {
      return `Proposal ${proposal.id} uses forbidden token '${token}'.`;
    }
  }

  return null;
}

function computeProposalSignature(proposal: CardProposal): string {
  const base = `${proposal.dedupeKey ?? ''}|${proposal.cardId}|${proposal.code}`;
  let hash = 2166136261;
  for (let i = 0; i < base.length; i += 1) {
    hash ^= base.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `v${proposal.version ?? 1}-${Math.abs(hash).toString(36)}`;
}
