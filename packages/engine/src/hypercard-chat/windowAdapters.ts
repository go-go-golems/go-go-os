import type { Dispatch } from 'redux';
import { openWindow, type OpenWindowPayload } from '../desktop/core/state';
import {
  buildArtifactOpenWindowPayload,
  type ArtifactTemplateResolver,
} from './artifacts/artifactRuntime';
import { openRuntimeCardCodeEditor } from './runtime-card-tools/editorLaunch';

export interface WindowHost {
  open: (payload: OpenWindowPayload) => void;
}

export interface ChatWindowAdapter {
  openEventInspector: (conversationId: string) => void;
}

export interface OpenArtifactWindowInput {
  artifactId: string;
  template?: string;
  title?: string;
  stackId?: string;
  runtimeCardId?: string;
  templateResolver?: ArtifactTemplateResolver;
}

export interface ArtifactWindowAdapter {
  openArtifact: (input: OpenArtifactWindowInput) => void;
}

export interface RuntimeCardToolsAdapter {
  openCodeEditor: (cardId: string, code: string) => void;
  openRuntimeCardDebug: () => void;
}

export interface HypercardWindowAdapters {
  chat: ChatWindowAdapter;
  artifacts: ArtifactWindowAdapter;
  runtimeCardTools: RuntimeCardToolsAdapter;
}

export function createReduxWindowHost(dispatch: Dispatch): WindowHost {
  return {
    open(payload: OpenWindowPayload) {
      dispatch(openWindow(payload));
    },
  };
}

export function createChatWindowAdapter(
  host: WindowHost,
  options?: {
    appKeyPrefix?: string;
    bounds?: OpenWindowPayload['bounds'];
  },
): ChatWindowAdapter {
  const appKeyPrefix = options?.appKeyPrefix ?? 'event-viewer';
  const bounds = options?.bounds ?? { x: 880, y: 20, w: 460, h: 560 };

  return {
    openEventInspector(conversationId: string) {
      host.open({
        id: `window:event-viewer:${conversationId}`,
        title: `🔍 Events: ${conversationId}`,
        icon: '🔍',
        bounds,
        content: { kind: 'app', appKey: `${appKeyPrefix}:${conversationId}` },
        dedupeKey: `event-viewer:${conversationId}`,
      });
    },
  };
}

export function createArtifactWindowAdapter(host: WindowHost): ArtifactWindowAdapter {
  return {
    openArtifact(input: OpenArtifactWindowInput) {
      const payload = buildArtifactOpenWindowPayload(input);
      if (payload) {
        host.open(payload);
      }
    },
  };
}

export function createRuntimeCardToolsAdapter(
  host: WindowHost,
  dispatch: Dispatch,
  options?: {
    debugAppKey?: string;
    debugBounds?: OpenWindowPayload['bounds'];
  },
): RuntimeCardToolsAdapter {
  const debugAppKey = options?.debugAppKey ?? 'runtime-card-debug';
  const debugBounds = options?.debugBounds ?? { x: 80, y: 30, w: 560, h: 480 };

  return {
    openCodeEditor(cardId: string, code: string) {
      openRuntimeCardCodeEditor(dispatch, cardId, code);
    },
    openRuntimeCardDebug() {
      host.open({
        id: 'window:runtime-debug',
        title: '🔧 Stacks & Cards',
        icon: '🔧',
        bounds: debugBounds,
        content: { kind: 'app', appKey: debugAppKey },
        dedupeKey: debugAppKey,
      });
    },
  };
}
