import {
  formatAppKey,
  type LaunchableAppModule,
  type LaunchableAppRenderParams,
} from '@hypercard/desktop-os';
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { DesktopIconLayer, type DesktopIconDef } from '@hypercard/engine/desktop-react';
import {
  richWidgetsLauncherActions,
  richWidgetsLauncherReducer,
} from './richWidgetsLauncherState';
import { useMemo, useState, type ReactNode } from 'react';
import { RICH_PARTS } from '../parts';

import { LogViewer } from '../log-viewer/LogViewer';
import { ChartView } from '../chart-view/ChartView';
import { MacWrite } from '../mac-write/MacWrite';
import { KanbanBoard } from '../kanban/KanbanBoard';
import { MacRepl } from '../repl/MacRepl';
import { NodeEditor } from '../node-editor/NodeEditor';
import { Oscilloscope } from '../oscilloscope/Oscilloscope';
import { LogicAnalyzer } from '../logic-analyzer/LogicAnalyzer';
import { MacCalendar } from '../calendar/MacCalendar';
import { GraphNavigator } from '../graph-navigator/GraphNavigator';
import { MacCalc } from '../calculator/MacCalc';
import { DeepResearch } from '../deep-research/DeepResearch';
import { GameFinder } from '../game-finder/GameFinder';
import { RetroMusicPlayer } from '../music-player/RetroMusicPlayer';
import { StreamLauncher } from '../stream-launcher/StreamLauncher';
import { SteamLauncher } from '../steam-launcher/SteamLauncher';
import { YouTubeRetro } from '../youtube-retro/YouTubeRetro';
import { ChatBrowser } from '../chat-browser/ChatBrowser';
import { SystemModeler } from '../system-modeler/SystemModeler';
import { ControlRoom } from '../control-room/ControlRoom';

type LaunchReason = 'icon' | 'menu' | 'command' | 'startup';
type RichWidgetsInstanceId = 'folder' | `widget~${string}`;

interface RichWidgetDef {
  id: string;
  name: string;
  icon: string;
  order: number;
  w: number;
  h: number;
  render: () => ReactNode;
}

export const RICH_WIDGETS: readonly RichWidgetDef[] = [
  { id: 'log-viewer', name: 'Log Viewer', icon: '\uD83D\uDCCB', order: 100, w: 900, h: 600, render: () => <LogViewer /> },
  { id: 'chart-view', name: 'Chart View', icon: '\uD83D\uDCC8', order: 101, w: 800, h: 560, render: () => <ChartView /> },
  { id: 'mac-write', name: 'MacWrite', icon: '\u270D\uFE0F', order: 102, w: 800, h: 620, render: () => <MacWrite /> },
  { id: 'kanban-board', name: 'Kanban Board', icon: '\uD83D\uDCCB', order: 103, w: 960, h: 640, render: () => <KanbanBoard /> },
  { id: 'mac-repl', name: 'MacRepl', icon: '\uD83D\uDCBB', order: 104, w: 720, h: 480, render: () => <MacRepl /> },
  { id: 'node-editor', name: 'Node Editor', icon: '\uD83D\uDD17', order: 105, w: 900, h: 600, render: () => <NodeEditor /> },
  { id: 'oscilloscope', name: 'Oscilloscope', icon: '\uD83D\uDCDF', order: 106, w: 800, h: 560, render: () => <Oscilloscope /> },
  { id: 'logic-analyzer', name: 'Logic Analyzer', icon: '\uD83D\uDD0C', order: 107, w: 900, h: 560, render: () => <LogicAnalyzer /> },
  { id: 'mac-calendar', name: 'Calendar', icon: '\uD83D\uDCC5', order: 108, w: 840, h: 600, render: () => <MacCalendar /> },
  { id: 'graph-navigator', name: 'Graph Navigator', icon: '\uD83C\uDF10', order: 109, w: 900, h: 640, render: () => <GraphNavigator /> },
  { id: 'mac-calc', name: 'MacCalc', icon: '\uD83E\uDDEE', order: 110, w: 880, h: 600, render: () => <MacCalc /> },
  { id: 'deep-research', name: 'Deep Research', icon: '\uD83D\uDD0D', order: 111, w: 860, h: 620, render: () => <DeepResearch /> },
  { id: 'game-finder', name: 'Game Finder', icon: '\uD83C\uDFAE', order: 112, w: 900, h: 640, render: () => <GameFinder /> },
  { id: 'retro-music-player', name: 'Music Player', icon: '\uD83C\uDFB5', order: 113, w: 880, h: 600, render: () => <RetroMusicPlayer /> },
  { id: 'stream-launcher', name: 'Streams', icon: '\uD83D\uDCFA', order: 114, w: 900, h: 640, render: () => <StreamLauncher /> },
  { id: 'steam-launcher', name: 'Game Library', icon: '\uD83D\uDD79\uFE0F', order: 115, w: 960, h: 680, render: () => <SteamLauncher /> },
  { id: 'youtube-retro', name: 'RetroTube', icon: '\uD83C\uDFAC', order: 116, w: 960, h: 680, render: () => <YouTubeRetro /> },
  { id: 'chat-browser', name: 'Chat Browser', icon: '\uD83D\uDDC4\uFE0F', order: 117, w: 900, h: 600, render: () => <ChatBrowser /> },
  { id: 'system-modeler', name: 'SystemModeler', icon: '\uD83D\uDDA5\uFE0F', order: 118, w: 960, h: 640, render: () => <SystemModeler /> },
  { id: 'control-room', name: 'Control Room', icon: '\uD83C\uDFDB\uFE0F', order: 119, w: 960, h: 700, render: () => <ControlRoom /> },
];

const RICH_WIDGETS_BY_ID = new Map(RICH_WIDGETS.map((widget) => [widget.id, widget]));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWidgetWindow(
  widget: RichWidgetDef,
  reason: LaunchReason,
): OpenWindowPayload {
  return {
    id: `window:rich-widgets:${widget.id}`,
    title: widget.name,
    icon: widget.icon,
    bounds: {
      x: 100 + Math.floor(Math.random() * 80),
      y: 60 + Math.floor(Math.random() * 40),
      w: widget.w,
      h: widget.h,
    },
    content: {
      kind: 'app' as const,
      appKey: formatAppKey('rich-widgets', `widget~${widget.id}`),
    },
    dedupeKey: reason === 'startup' ? `rich-widgets:${widget.id}:startup` : `rich-widgets:${widget.id}`,
  };
}

function buildFolderWindow(reason: LaunchReason): OpenWindowPayload {
  return {
    id: 'window:rich-widgets:folder',
    title: 'Rich Widgets',
    icon: '\uD83D\uDDC2\uFE0F',
    bounds: { x: 150, y: 48, w: 980, h: 640 },
    content: {
      kind: 'app',
      appKey: formatAppKey('rich-widgets', 'folder'),
    },
    dedupeKey: reason === 'startup' ? 'rich-widgets:folder:startup' : 'rich-widgets:folder',
  };
}

function widget(widgetDef: RichWidgetDef): LaunchableAppModule {
  const { id, name, icon, order, render } = widgetDef;
  return {
    manifest: { id, name, icon, launch: { mode: 'window' }, desktop: { order } },
    buildLaunchWindow: (
      ctx: { dispatch: (action: unknown) => unknown },
      reason: LaunchReason,
    ) => {
      ctx.dispatch(richWidgetsLauncherActions.markLaunched({ appId: id, reason }));
      return buildWidgetWindow(widgetDef, reason);
    },
    renderWindow: () => render(),
  };
}

function RichWidgetsFolderWindow({
  dispatchWindowAction,
}: {
  dispatchWindowAction: (action: unknown) => unknown;
}) {
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const icons = useMemo<DesktopIconDef[]>(
    () =>
      RICH_WIDGETS.map((widget) => ({
        id: widget.id,
        label: widget.name,
        icon: widget.icon,
        kind: 'app',
        appId: 'rich-widgets',
      })),
    [],
  );

  return (
    <section data-part={RICH_PARTS.rwLauncher}>
      <header data-part={RICH_PARTS.rwLauncherHeader}>
        <strong>Rich Widgets</strong>
        <span data-part={RICH_PARTS.rwLauncherHint}>
          Double-click an icon to open the widget in its own launcher window.
        </span>
      </header>
      <DesktopIconLayer
        icons={icons}
        selectedIconId={selectedIconId}
        onSelectIcon={setSelectedIconId}
        onOpenIcon={(iconId: string) => {
          const widget = RICH_WIDGETS_BY_ID.get(iconId);
          if (!widget) {
            return;
          }
          setSelectedIconId(iconId);
          dispatchWindowAction(openWindow(buildWidgetWindow(widget, 'icon')));
        }}
      />
    </section>
  );
}

function renderRichWidgetsWindow(
  instanceId: RichWidgetsInstanceId,
  dispatchWindowAction: (action: unknown) => unknown,
): ReactNode {
  if (instanceId === 'folder') {
    return <RichWidgetsFolderWindow dispatchWindowAction={dispatchWindowAction} />;
  }

  const widgetId = instanceId.replace(/^widget~/, '').trim();
  const widget = RICH_WIDGETS_BY_ID.get(widgetId);
  if (!widget) {
    return (
      <section style={{ padding: 12, display: 'grid', gap: 8 }}>
        <strong>Unknown rich widget window</strong>
        <span>Unable to resolve widget instance: {instanceId}</span>
      </section>
    );
  }

  return <>{widget.render()}</>;
}

export const richWidgetsLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'rich-widgets',
    name: 'Rich Widgets',
    icon: '\uD83D\uDDC2\uFE0F',
    launch: { mode: 'window' },
    desktop: {
      order: 999,
    },
  },
  buildLaunchWindow: (_ctx: { dispatch: (action: unknown) => unknown }, reason: LaunchReason) => buildFolderWindow(reason),
  renderWindow: ({ instanceId, ctx }: LaunchableAppRenderParams) =>
    renderRichWidgetsWindow(instanceId as RichWidgetsInstanceId, ctx.dispatch),
};

function widgetModule(
  id: string,
  name: string,
  icon: string,
  order: number,
  w: number,
  h: number,
  render: () => ReactNode,
): LaunchableAppModule {
  return widget({ id, name, icon, order, w, h, render });
}

// ---------------------------------------------------------------------------
// Widget launcher modules
// ---------------------------------------------------------------------------

export const logViewerModule: LaunchableAppModule = {
  ...widgetModule(
    'log-viewer', 'Log Viewer', '\uD83D\uDCCB', 100, 900, 600,
    () => <LogViewer />,
  ),
  state: {
    stateKey: 'app_rich_widgets',
    reducer: richWidgetsLauncherReducer,
  },
};

export const chartViewModule = widgetModule(
  'chart-view', 'Chart View', '\uD83D\uDCC8', 101, 800, 560,
  () => <ChartView />,
);

export const macWriteModule = widgetModule(
  'mac-write', 'MacWrite', '\u270D\uFE0F', 102, 800, 620,
  () => <MacWrite />,
);

export const kanbanBoardModule = widgetModule(
  'kanban-board', 'Kanban Board', '\uD83D\uDCCB', 103, 960, 640,
  () => <KanbanBoard />,
);

export const macReplModule = widgetModule(
  'mac-repl', 'MacRepl', '\uD83D\uDCBB', 104, 720, 480,
  () => <MacRepl />,
);

export const nodeEditorModule = widgetModule(
  'node-editor', 'Node Editor', '\uD83D\uDD17', 105, 900, 600,
  () => <NodeEditor />,
);

export const oscilloscopeModule = widgetModule(
  'oscilloscope', 'Oscilloscope', '\uD83D\uDCDF', 106, 800, 560,
  () => <Oscilloscope />,
);

export const logicAnalyzerModule = widgetModule(
  'logic-analyzer', 'Logic Analyzer', '\uD83D\uDD0C', 107, 900, 560,
  () => <LogicAnalyzer />,
);

export const macCalendarModule = widgetModule(
  'mac-calendar', 'Calendar', '\uD83D\uDCC5', 108, 840, 600,
  () => <MacCalendar />,
);

export const graphNavigatorModule = widgetModule(
  'graph-navigator', 'Graph Navigator', '\uD83C\uDF10', 109, 900, 640,
  () => <GraphNavigator />,
);

export const macCalcModule = widgetModule(
  'mac-calc', 'MacCalc', '\uD83E\uDDEE', 110, 880, 600,
  () => <MacCalc />,
);

export const deepResearchModule = widgetModule(
  'deep-research', 'Deep Research', '\uD83D\uDD0D', 111, 860, 620,
  () => <DeepResearch />,
);

export const gameFinderModule = widgetModule(
  'game-finder', 'Game Finder', '\uD83C\uDFAE', 112, 900, 640,
  () => <GameFinder />,
);

export const retroMusicPlayerModule = widgetModule(
  'retro-music-player', 'Music Player', '\uD83C\uDFB5', 113, 880, 600,
  () => <RetroMusicPlayer />,
);

export const streamLauncherModule = widgetModule(
  'stream-launcher', 'Streams', '\uD83D\uDCFA', 114, 900, 640,
  () => <StreamLauncher />,
);

export const steamLauncherModule = widgetModule(
  'steam-launcher', 'Game Library', '\uD83D\uDD79\uFE0F', 115, 960, 680,
  () => <SteamLauncher />,
);

export const youtubeRetroModule = widgetModule(
  'youtube-retro', 'RetroTube', '\uD83C\uDFAC', 116, 960, 680,
  () => <YouTubeRetro />,
);

export const chatBrowserModule = widgetModule(
  'chat-browser', 'Chat Browser', '\uD83D\uDDC4\uFE0F', 117, 900, 600,
  () => <ChatBrowser />,
);

export const systemModelerModule = widgetModule(
  'system-modeler', 'SystemModeler', '\uD83D\uDDA5\uFE0F', 118, 960, 640,
  () => <SystemModeler />,
);

export const controlRoomModule = widgetModule(
  'control-room', 'Control Room', '\uD83C\uDFDB\uFE0F', 119, 960, 700,
  () => <ControlRoom />,
);

// ---------------------------------------------------------------------------
// All modules as a single array for convenience
// ---------------------------------------------------------------------------

export const RICH_WIDGET_MODULES: readonly LaunchableAppModule[] = [
  logViewerModule,
  chartViewModule,
  macWriteModule,
  kanbanBoardModule,
  macReplModule,
  nodeEditorModule,
  oscilloscopeModule,
  logicAnalyzerModule,
  macCalendarModule,
  graphNavigatorModule,
  macCalcModule,
  deepResearchModule,
  gameFinderModule,
  retroMusicPlayerModule,
  streamLauncherModule,
  steamLauncherModule,
  youtubeRetroModule,
  chatBrowserModule,
  systemModelerModule,
  controlRoomModule,
];
