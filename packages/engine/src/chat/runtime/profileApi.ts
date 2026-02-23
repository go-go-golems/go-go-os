import {
  type ChatCurrentProfilePayload,
  type ChatProfileDocument,
  type ChatProfileListItem,
} from './profileTypes';

function resolveBasePrefix(basePrefix?: string): string {
  return typeof basePrefix === 'string' ? basePrefix.replace(/\/$/, '') : '';
}

function withRegistry(url: string, registry?: string): string {
  const normalized = String(registry ?? '').trim();
  if (!normalized) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}registry=${encodeURIComponent(normalized)}`;
}

function toErrorMessage(body: string, fallback: string): string {
  const normalized = String(body ?? '').trim();
  return normalized.length > 0 ? normalized : fallback;
}

export class ChatProfileApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(options: { message: string; status: number; url: string }) {
    super(options.message);
    this.name = 'ChatProfileApiError';
    this.status = options.status;
    this.url = options.url;
  }
}

interface FetchOptions {
  basePrefix?: string;
  fetchImpl?: typeof fetch;
}

async function parseJsonOrThrow<T>(response: Response, url: string, fallback: string): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new ChatProfileApiError({
      status: response.status,
      url,
      message: toErrorMessage(body, fallback),
    });
  }
  return response.json() as Promise<T>;
}

export async function listProfiles(
  registry?: string,
  options: FetchOptions = {}
): Promise<ChatProfileListItem[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = withRegistry(`${resolveBasePrefix(options.basePrefix)}/api/chat/profiles`, registry);
  const response = await fetchImpl(url);
  return parseJsonOrThrow<ChatProfileListItem[]>(response, url, `profile list request failed (${response.status})`);
}

export async function getProfile(
  slug: string,
  registry?: string,
  options: FetchOptions = {}
): Promise<ChatProfileDocument> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = withRegistry(`${resolveBasePrefix(options.basePrefix)}/api/chat/profiles/${encodeURIComponent(slug)}`, registry);
  const response = await fetchImpl(url);
  return parseJsonOrThrow<ChatProfileDocument>(response, url, `profile request failed (${response.status})`);
}

export async function createProfile(
  payload: Record<string, unknown>,
  options: FetchOptions = {}
): Promise<ChatProfileDocument> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${resolveBasePrefix(options.basePrefix)}/api/chat/profiles`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<ChatProfileDocument>(response, url, `profile create failed (${response.status})`);
}

export async function updateProfile(
  slug: string,
  payload: Record<string, unknown>,
  options: FetchOptions = {}
): Promise<ChatProfileDocument> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${resolveBasePrefix(options.basePrefix)}/api/chat/profiles/${encodeURIComponent(slug)}`;
  const response = await fetchImpl(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<ChatProfileDocument>(response, url, `profile update failed (${response.status})`);
}

export async function deleteProfile(
  slug: string,
  options: FetchOptions & { registry?: string; expectedVersion?: number } = {}
): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  let url = withRegistry(`${resolveBasePrefix(options.basePrefix)}/api/chat/profiles/${encodeURIComponent(slug)}`, options.registry);
  if (typeof options.expectedVersion === 'number' && Number.isFinite(options.expectedVersion) && options.expectedVersion > 0) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}expected_version=${Math.trunc(options.expectedVersion)}`;
  }
  const response = await fetchImpl(url, { method: 'DELETE' });
  if (!response.ok) {
    const body = await response.text();
    throw new ChatProfileApiError({
      status: response.status,
      url,
      message: toErrorMessage(body, `profile delete failed (${response.status})`),
    });
  }
}

export async function setDefaultProfile(
  slug: string,
  payload: Record<string, unknown> = {},
  options: FetchOptions = {}
): Promise<ChatProfileDocument> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${resolveBasePrefix(options.basePrefix)}/api/chat/profiles/${encodeURIComponent(slug)}/default`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<ChatProfileDocument>(response, url, `set default profile failed (${response.status})`);
}

export async function getCurrentProfile(options: FetchOptions = {}): Promise<ChatCurrentProfilePayload> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${resolveBasePrefix(options.basePrefix)}/api/chat/profile`;
  const response = await fetchImpl(url);
  return parseJsonOrThrow<ChatCurrentProfilePayload>(response, url, `current profile request failed (${response.status})`);
}

export async function setCurrentProfile(slug: string, options: FetchOptions = {}): Promise<ChatCurrentProfilePayload> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${resolveBasePrefix(options.basePrefix)}/api/chat/profile`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slug }),
  });
  return parseJsonOrThrow<ChatCurrentProfilePayload>(response, url, `set current profile failed (${response.status})`);
}
