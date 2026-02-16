export interface BackendMessage {
  role: string;
  text: string;
}

export interface BackendCompletionRequest {
  conversationId: string;
  messages: BackendMessage[];
  model?: string;
}

export interface BackendCompletionResponse {
  conversationId: string;
  messageId: string;
  streamUrl: string;
}

export interface BackendAction {
  label: string;
  action: Record<string, unknown>;
}

export interface BackendArtifact {
  kind: 'widget' | 'card-proposal';
  id: string;
  widgetType?: string;
  label?: string;
  props?: Record<string, unknown>;
  cardId?: string;
  title?: string;
  icon?: string;
  code?: string;
  dedupeKey?: string;
  version?: number;
  policy?: Record<string, unknown>;
}

export interface BackendTimelineMessage {
  id: string;
  role: string;
  text: string;
  status: 'complete' | 'streaming' | 'error';
  artifacts?: BackendArtifact[];
  actions?: BackendAction[];
}

export interface BackendTimelineResponse {
  conversationId: string;
  messages: BackendTimelineMessage[];
  events: BackendSEMEnvelope[];
  lastSeq: number;
}

export interface BackendSEMEvent {
  type: string;
  id: string;
  seq: number;
  stream_id?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface BackendSEMEnvelope {
  sem: true;
  event: BackendSEMEvent;
}

export interface StreamHandlers {
  onToken: (token: string) => void;
  onArtifact: (artifact: BackendArtifact) => void;
  onDone: (actions: BackendAction[]) => void;
  onError: (error: string) => void;
}

export async function startCompletion(
  request: BackendCompletionRequest,
  baseUrl: string,
): Promise<BackendCompletionResponse> {
  const res = await fetch(`${baseUrl}/api/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Chat backend returned ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as BackendCompletionResponse;
}

export async function fetchTimeline(
  conversationId: string,
  baseUrl: string,
): Promise<BackendTimelineResponse> {
  const url = new URL(`${baseUrl}/api/timeline`);
  url.searchParams.set('conversation_id', conversationId || 'default');

  const res = await fetch(url.toString(), {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Timeline endpoint returned ${res.status} ${res.statusText}`);
  }

  return normalizeTimelineResponse(await res.json());
}

export function connectCompletionStream(streamUrl: string, handlers: StreamHandlers): () => void {
  const ws = new WebSocket(streamUrl);

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(String(event.data)) as unknown;

      if (isSEMEnvelope(parsed)) {
        handleSEMEnvelope(parsed, handlers, ws);
        return;
      }

      handlers.onError('Unknown stream frame shape from backend');
      ws.close();
    } catch {
      handlers.onError('Malformed stream frame from backend');
      ws.close();
    }
  };

  ws.onerror = () => {
    handlers.onError('WebSocket connection error');
  };

  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}

function handleSEMEnvelope(envelope: BackendSEMEnvelope, handlers: StreamHandlers, ws: WebSocket) {
  const eventType = envelope.event.type;
  const data = envelope.event.data ?? {};

  switch (eventType) {
    case 'chat.message.token': {
      const token = typeof data.content === 'string' ? data.content : '';
      if (token) {
        handlers.onToken(token);
      }
      return;
    }
    case 'chat.message.artifact': {
      const artifact = toArtifact(data.artifact);
      if (artifact) {
        handlers.onArtifact(artifact);
      }
      return;
    }
    case 'chat.message.done': {
      handlers.onDone(toActions(data.actions));
      ws.close();
      return;
    }
    case 'chat.message.error': {
      const error = typeof data.error === 'string' ? data.error : 'Unknown stream error';
      handlers.onError(error);
      ws.close();
      return;
    }
    default:
      return;
  }
}

function normalizeTimelineResponse(raw: unknown): BackendTimelineResponse {
  if (!isRecord(raw)) {
    throw new Error('Timeline response is not an object');
  }

  const conversationId = typeof raw.conversationId === 'string' ? raw.conversationId : 'default';
  const messages = Array.isArray(raw.messages)
    ? raw.messages.map(toTimelineMessage).filter((v): v is BackendTimelineMessage => v !== null)
    : [];
  const events = Array.isArray(raw.events)
    ? raw.events.map(toSEMEnvelope).filter((v): v is BackendSEMEnvelope => v !== null)
    : [];
  const lastSeq =
    typeof raw.lastSeq === 'number'
      ? raw.lastSeq
      : Number.isFinite(Number(raw.lastSeq))
        ? Number(raw.lastSeq)
        : 0;

  return {
    conversationId,
    messages,
    events,
    lastSeq,
  };
}

function toTimelineMessage(raw: unknown): BackendTimelineMessage | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.role !== 'string') {
    return null;
  }

  const statusRaw = typeof raw.status === 'string' ? raw.status : 'complete';
  const status: BackendTimelineMessage['status'] =
    statusRaw === 'streaming' || statusRaw === 'error' ? statusRaw : 'complete';

  const artifacts = Array.isArray(raw.artifacts)
    ? raw.artifacts.map(toArtifact).filter((v): v is BackendArtifact => v !== null)
    : undefined;
  const actions = Array.isArray(raw.actions)
    ? raw.actions.map(toAction).filter((v): v is BackendAction => v !== null)
    : undefined;

  return {
    id: raw.id,
    role: raw.role,
    text: typeof raw.text === 'string' ? raw.text : '',
    status,
    artifacts,
    actions,
  };
}

function toSEMEnvelope(raw: unknown): BackendSEMEnvelope | null {
  if (!isRecord(raw) || raw.sem !== true || !isRecord(raw.event)) {
    return null;
  }
  const event = raw.event;
  if (typeof event.type !== 'string' || typeof event.id !== 'string') {
    return null;
  }

  return {
    sem: true,
    event: {
      type: event.type,
      id: event.id,
      seq:
        typeof event.seq === 'number'
          ? event.seq
          : Number.isFinite(Number(event.seq))
            ? Number(event.seq)
            : 0,
      stream_id: typeof event.stream_id === 'string' ? event.stream_id : undefined,
      data: isRecord(event.data) ? event.data : undefined,
      metadata: isRecord(event.metadata) ? event.metadata : undefined,
    },
  };
}

function toActions(raw: unknown): BackendAction[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(toAction).filter((v): v is BackendAction => v !== null);
}

function toAction(raw: unknown): BackendAction | null {
  if (!isRecord(raw) || typeof raw.label !== 'string' || !isRecord(raw.action)) {
    return null;
  }
  return {
    label: raw.label,
    action: raw.action,
  };
}

function toArtifact(raw: unknown): BackendArtifact | null {
  if (!isRecord(raw) || typeof raw.kind !== 'string' || typeof raw.id !== 'string') {
    return null;
  }
  if (raw.kind !== 'widget' && raw.kind !== 'card-proposal') {
    return null;
  }

  return {
    kind: raw.kind,
    id: raw.id,
    widgetType: typeof raw.widgetType === 'string' ? raw.widgetType : undefined,
    label: typeof raw.label === 'string' ? raw.label : undefined,
    props: isRecord(raw.props) ? raw.props : undefined,
    cardId: typeof raw.cardId === 'string' ? raw.cardId : undefined,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    icon: typeof raw.icon === 'string' ? raw.icon : undefined,
    code: typeof raw.code === 'string' ? raw.code : undefined,
    dedupeKey: typeof raw.dedupeKey === 'string' ? raw.dedupeKey : undefined,
    version: typeof raw.version === 'number' ? raw.version : undefined,
    policy: isRecord(raw.policy) ? raw.policy : undefined,
  };
}

function isSEMEnvelope(raw: unknown): raw is BackendSEMEnvelope {
  return (
    isRecord(raw) &&
    raw.sem === true &&
    isRecord(raw.event) &&
    typeof raw.event.type === 'string' &&
    typeof raw.event.id === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
