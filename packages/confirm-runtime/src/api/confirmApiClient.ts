import type { ConfirmApiClient, ConfirmRequest, SubmitResponsePayload, SubmitScriptEventPayload } from '../types';

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`confirm-api: request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export interface ConfirmApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export function createConfirmApiClient(options: ConfirmApiClientOptions): ConfirmApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = trimTrailingSlash(options.baseUrl);

  return {
    async getRequest(requestId: string) {
      return await parseJsonResponse<ConfirmRequest>(
        await fetchImpl(`${baseUrl}/api/requests/${encodeURIComponent(requestId)}`),
      );
    },

    async submitResponse(requestId: string, payload: SubmitResponsePayload) {
      return await parseJsonResponse<ConfirmRequest | null>(
        await fetchImpl(`${baseUrl}/api/requests/${encodeURIComponent(requestId)}/response`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      );
    },

    async submitScriptEvent(requestId: string, payload: SubmitScriptEventPayload) {
      return await parseJsonResponse<ConfirmRequest | null>(
        await fetchImpl(`${baseUrl}/api/requests/${encodeURIComponent(requestId)}/event`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      );
    },

    async touchRequest(requestId: string) {
      await parseJsonResponse<Record<string, unknown>>(
        await fetchImpl(`${baseUrl}/api/requests/${encodeURIComponent(requestId)}/touch`, {
          method: 'POST',
        }),
      );
    },
  };
}
