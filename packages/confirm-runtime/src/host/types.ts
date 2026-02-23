import type { ConfirmRealtimeEvent } from '../types';

export interface ConfirmWindowRegistration {
  requestId: string;
  appKey: string;
  title: string;
  dedupeKey: string;
}

export interface ConfirmRuntimeHostAdapters {
  resolveBaseUrl: () => string;
  resolveSessionId: () => string;
  openRequestWindow: (registration: ConfirmWindowRegistration) => void;
  closeRequestWindow?: (requestId: string) => void;
  onEventObserved?: (event: ConfirmRealtimeEvent) => void;
  onError?: (error: Error) => void;
}
