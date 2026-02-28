import { type LaunchableAppModule, type LauncherHostContext, type LaunchReason } from '@hypercard/desktop-os';
import { CodeEditorWindow, decodeRuntimeCardEditorInstanceId, getEditorInitialCode, PluginCardSessionHost } from '@hypercard/hypercard-runtime';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { DesktopCommandHandler, DesktopContribution, WindowContentAdapter } from '@hypercard/engine/desktop-react';
import type { ReactNode } from 'react';
import { STACK } from '../domain/stack';

const APP_ID = 'hypercard-tools';
const OPEN_HOME_COMMAND = 'hypercard-tools.open-home';
const WORKSPACE_INSTANCE_PREFIX = 'workspace-';
const SESSION_PREFIX = 'hypercard-tools-session:';

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `hypercard-tools-${Date.now()}`;
}

function buildWorkspaceWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = `${WORKSPACE_INSTANCE_PREFIX}${nextInstanceId()}`;
  return {
    id: `window:${APP_ID}:${instanceId}`,
    title: 'HyperCard Tools',
    icon: '🛠️',
    bounds: { x: 210, y: 72, w: 980, h: 700 },
    content: {
      kind: 'card',
      card: {
        stackId: STACK.id,
        cardId: STACK.homeCard,
        cardSessionId: `${SESSION_PREFIX}${instanceId}`,
      },
    },
    dedupeKey: reason === 'startup' ? `${APP_ID}:startup` : undefined,
  };
}

function createHypercardToolsCardAdapter(): WindowContentAdapter {
  return {
    id: 'hypercard-tools.card-window',
    canRender: (window) => window.content.kind === 'card' && window.content.card?.stackId === STACK.id,
    render: (window) => {
      const cardRef = window.content.card;
      if (window.content.kind !== 'card' || !cardRef || cardRef.stackId !== STACK.id) {
        return null;
      }
      return <PluginCardSessionHost windowId={window.id} sessionId={cardRef.cardSessionId} stack={STACK} />;
    },
  };
}

function renderUnknownInstance(instanceId: string): ReactNode {
  return (
    <section style={{ padding: 12, display: 'grid', gap: 8 }}>
      <strong>HyperCard Tools</strong>
      <span>Unknown hypercard-tools window instance: {instanceId}</span>
    </section>
  );
}

function createHypercardToolsCommandHandler(hostContext: LauncherHostContext): DesktopCommandHandler {
  return {
    id: 'hypercard-tools.commands',
    priority: 120,
    matches: (commandId) => commandId === OPEN_HOME_COMMAND,
    run: () => {
      hostContext.openWindow(buildWorkspaceWindowPayload('command'));
      return 'handled';
    },
  };
}

export const hypercardToolsLauncherModule: LaunchableAppModule = {
  manifest: {
    id: APP_ID,
    name: 'HyperCard Tools',
    icon: '🛠️',
    launch: { mode: 'window' },
    desktop: { order: 85 },
  },
  buildLaunchWindow: (_ctx, reason) => buildWorkspaceWindowPayload(reason),
  createContributions: (hostContext): DesktopContribution[] => [
    {
      id: 'hypercard-tools.contributions',
      commands: [createHypercardToolsCommandHandler(hostContext)],
      windowContentAdapters: [createHypercardToolsCardAdapter()],
    },
  ],
  renderWindow: ({ instanceId }): ReactNode => {
    const ref = decodeRuntimeCardEditorInstanceId(instanceId);
    if (!ref) {
      return renderUnknownInstance(instanceId);
    }

    return <CodeEditorWindow cardId={ref.cardId} initialCode={getEditorInitialCode(ref)} />;
  },
};
