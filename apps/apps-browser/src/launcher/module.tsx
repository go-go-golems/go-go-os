import type { LaunchableAppModule, LauncherHostContext, LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type {
  DesktopCommandHandler,
  DesktopCommandInvocation,
  DesktopContribution,
  WindowContentAdapter,
} from '@hypercard/engine/desktop-react';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../app/store';
import { AppsFolderWindow } from '../components/AppsFolderWindow';
import { DocBrowserWindow } from '../components/doc-browser/DocBrowserWindow';
import { GetInfoWindowByAppId } from '../components/GetInfoWindowByAppId';
import { HealthDashboardWindow } from '../components/HealthDashboardWindow';
import { ModuleBrowserWindow } from '../components/ModuleBrowserWindow';

const APP_CONTENT_KIND = 'app' as const;
const APP_KEY_FOLDER = 'apps-browser:folder';
const APP_KEY_BROWSER = 'apps-browser:browser';
const APP_KEY_HEALTH = 'apps-browser:health';
const APP_KEY_GET_INFO_PREFIX = 'apps-browser:get-info:';
const APP_KEY_DOCS_PREFIX = 'apps-browser:docs:';
const COMMAND_OPEN_BROWSER = 'apps-browser.open-browser';
const COMMAND_GET_INFO = 'apps-browser.get-info';
const COMMAND_OPEN_HEALTH = 'apps-browser.open-health';
const COMMAND_OPEN_DOCS = 'apps-browser.open-docs';
const COMMAND_OPEN_DOC_PAGE = 'apps-browser.open-doc-page';
const COMMAND_SEARCH_DOCS = 'apps-browser.search-docs';

function buildFolderWindowPayload(reason: LaunchReason): OpenWindowPayload {
  return {
    id: 'window:apps-browser:folder',
    title: 'Mounted Apps',
    icon: '\uD83D\uDCC2',
    bounds: { x: 100, y: 60, w: 520, h: 400 },
    content: { kind: APP_CONTENT_KIND, appKey: APP_KEY_FOLDER },
    dedupeKey: reason === 'startup' ? 'apps-browser:folder:startup' : 'apps-browser:folder',
  };
}

export function buildBrowserWindowPayload(initialAppId?: string): OpenWindowPayload {
  return {
    id: `window:apps-browser:browser:${initialAppId ?? 'default'}`,
    title: 'Module Browser',
    icon: '\uD83D\uDD0D',
    bounds: { x: 120, y: 40, w: 780, h: 560 },
    content: { kind: APP_CONTENT_KIND, appKey: `${APP_KEY_BROWSER}${initialAppId ? `:${initialAppId}` : ''}` },
    dedupeKey: 'apps-browser:browser',
  };
}

export function buildHealthWindowPayload(): OpenWindowPayload {
  return {
    id: 'window:apps-browser:health',
    title: 'Health Dashboard',
    icon: '\u2764',
    bounds: { x: 140, y: 80, w: 600, h: 480 },
    content: { kind: APP_CONTENT_KIND, appKey: APP_KEY_HEALTH },
    dedupeKey: 'apps-browser:health',
  };
}

export function buildDocBrowserWindowPayload(opts?: {
  moduleId?: string;
  slug?: string;
  query?: string;
}): OpenWindowPayload {
  const suffix = opts?.moduleId
    ? opts.slug
      ? `${opts.moduleId}:${opts.slug}`
      : opts.moduleId
    : opts?.query
      ? `search:${opts.query}`
      : 'home';
  return {
    id: `window:apps-browser:docs:${suffix}`,
    title: 'Documentation',
    icon: '\uD83D\uDCD6',
    bounds: { x: 160, y: 60, w: 700, h: 520 },
    content: {
      kind: APP_CONTENT_KIND,
      appKey: `${APP_KEY_DOCS_PREFIX}${suffix}`,
    },
    dedupeKey: 'apps-browser:docs',
  };
}

export function buildGetInfoWindowPayload(appId: string, appName?: string): OpenWindowPayload {
  return {
    id: `window:apps-browser:get-info:${appId}`,
    title: `${appName ?? appId} \u2014 Get Info`,
    icon: '\u2139\uFE0F',
    bounds: { x: 200, y: 100, w: 440, h: 520 },
    content: {
      kind: APP_CONTENT_KIND,
      appKey: `${APP_KEY_GET_INFO_PREFIX}${appId}`,
    },
    dedupeKey: `apps-browser:get-info:${appId}`,
  };
}

function createAppsBrowserAdapter(hostContext: LauncherHostContext): WindowContentAdapter {
  return {
    id: 'apps-browser.windows',
    canRender: (window) =>
      window.content.kind === APP_CONTENT_KIND &&
      typeof window.content.appKey === 'string' &&
      window.content.appKey.startsWith('apps-browser:'),
    render: (window) => {
      const appKey = window.content.appKey as string;
      let content: ReactNode = null;

      if (appKey === APP_KEY_FOLDER) {
        content = <AppsFolderWindow onOpenApp={(appId) => hostContext.openWindow(buildBrowserWindowPayload(appId))} />;
      }

      if (content == null && appKey.startsWith(APP_KEY_BROWSER)) {
        const initialAppId = appKey.split(':').slice(2).join(':') || undefined;
        content = <ModuleBrowserWindow initialAppId={initialAppId} />;
      }

      if (content == null && appKey === APP_KEY_HEALTH) {
        content = <HealthDashboardWindow onClickModule={(appId) => hostContext.openWindow(buildGetInfoWindowPayload(appId))} />;
      }

      if (content == null && appKey.startsWith(APP_KEY_DOCS_PREFIX)) {
        const suffix = appKey.slice(APP_KEY_DOCS_PREFIX.length);
        const parts = suffix.split(':');
        if (parts[0] === 'home' || suffix === '') {
          content = <DocBrowserWindow />;
        } else if (parts[0] === 'search') {
          content = <DocBrowserWindow initialScreen="search" initialQuery={parts.slice(1).join(':')} />;
        } else if (parts.length >= 2) {
          content = <DocBrowserWindow initialModuleId={parts[0]} initialSlug={parts.slice(1).join(':')} />;
        } else {
          content = <DocBrowserWindow initialModuleId={parts[0]} />;
        }
      }

      if (content == null && appKey.startsWith(APP_KEY_GET_INFO_PREFIX)) {
        const appId = appKey.slice(APP_KEY_GET_INFO_PREFIX.length);
        if (appId) {
          content = (
            <GetInfoWindowByAppId
              appId={appId}
              onOpenInBrowser={() => hostContext.openWindow(buildBrowserWindowPayload(appId))}
              onOpenDoc={(moduleId, slug) =>
                hostContext.openWindow(buildDocBrowserWindowPayload({ moduleId, slug }))
              }
            />
          );
        }
      }

      if (content == null) {
        return null;
      }
      return <AppsBrowserHost>{content}</AppsBrowserHost>;
    },
  };
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveAppFromInvocation(invocation: DesktopCommandInvocation): { appId?: string; appName?: string } {
  const payload = invocation.payload ?? {};
  return {
    appId: asNonEmptyString(payload.appId) ?? asNonEmptyString(invocation.contextTarget?.appId),
    appName: asNonEmptyString(payload.appName),
  };
}

function createAppsBrowserCommandHandler(hostContext: LauncherHostContext): DesktopCommandHandler {
  return {
    id: 'apps-browser.commands',
    priority: 220,
    matches: (commandId) =>
      commandId === COMMAND_OPEN_BROWSER ||
      commandId === COMMAND_GET_INFO ||
      commandId === COMMAND_OPEN_HEALTH ||
      commandId === COMMAND_OPEN_DOCS ||
      commandId === COMMAND_OPEN_DOC_PAGE ||
      commandId === COMMAND_SEARCH_DOCS,
    run: (commandId, _ctx, invocation) => {
      const { appId, appName } = resolveAppFromInvocation(invocation);
      const payload = invocation.payload ?? {};
      if (commandId === COMMAND_OPEN_HEALTH) {
        hostContext.openWindow(buildHealthWindowPayload());
        return 'handled';
      }
      if (commandId === COMMAND_OPEN_BROWSER) {
        hostContext.openWindow(buildBrowserWindowPayload(appId));
        return 'handled';
      }
      if (commandId === COMMAND_GET_INFO && appId) {
        hostContext.openWindow(buildGetInfoWindowPayload(appId, appName));
        return 'handled';
      }
      if (commandId === COMMAND_OPEN_DOCS) {
        hostContext.openWindow(buildDocBrowserWindowPayload(appId ? { moduleId: appId } : undefined));
        return 'handled';
      }
      if (commandId === COMMAND_OPEN_DOC_PAGE) {
        const slug = asNonEmptyString(payload.slug);
        if (appId && slug) {
          hostContext.openWindow(buildDocBrowserWindowPayload({ moduleId: appId, slug }));
          return 'handled';
        }
        return 'pass';
      }
      if (commandId === COMMAND_SEARCH_DOCS) {
        const query = asNonEmptyString(payload.query);
        hostContext.openWindow(buildDocBrowserWindowPayload(query ? { query } : undefined));
        return 'handled';
      }
      return 'pass';
    },
  };
}

function AppsBrowserHost({ children }: { children: ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createAppsBrowserStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createAppsBrowserStore();
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
}

export const appsBrowserLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'apps-browser',
    name: 'Apps Browser',
    icon: '\uD83D\uDCC2',
    launch: { mode: 'window' },
    desktop: { order: 90 },
  },

  buildLaunchWindow: (_ctx, reason) => {
    return buildFolderWindowPayload(reason);
  },

  createContributions: (hostContext): DesktopContribution[] => [
    {
      id: 'apps-browser.desktop-contributions',
      windowContentAdapters: [createAppsBrowserAdapter(hostContext)],
      commands: [createAppsBrowserCommandHandler(hostContext)],
    },
  ],

  renderWindow: ({ windowId }): ReactNode => (
    <AppsBrowserHost key={windowId}>
      <AppsFolderWindow />
    </AppsBrowserHost>
  ),
};
