import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { useEffect, useRef } from 'react';
import type { SemRegistry } from '../sem/registry';
import type { SemEnvelope } from '../sem/types';
import { type ProjectionPipelineAdapter, projectSemEnvelope } from './projectionPipeline';

export interface ProjectedChatConnectionStatus {
  status: string;
}

export interface ProjectedChatClientHandlers {
  onRawEnvelope?: (envelope: SemEnvelope) => void;
  onEnvelope: (envelope: SemEnvelope) => void;
  onStatus?: (status: string) => void;
  onError?: (error: string) => void;
}

export interface ProjectedChatClient {
  connect: () => void;
  close: () => void;
}

export type ProjectedChatClientFactory = (handlers: ProjectedChatClientHandlers) => ProjectedChatClient;

export interface UseProjectedChatConnectionInput {
  conversationId: string;
  dispatch: Dispatch<UnknownAction>;
  semRegistry: SemRegistry;
  adapters?: ProjectionPipelineAdapter[];
  createClient: ProjectedChatClientFactory;
  onRawEnvelope?: (envelope: SemEnvelope) => void;
  onStatus?: (status: string) => void;
  onError?: (error: string) => void;
  shouldProjectEnvelope?: (envelope: SemEnvelope) => boolean;
}

export function useProjectedChatConnection({
  conversationId,
  dispatch,
  semRegistry,
  adapters = [],
  createClient,
  onRawEnvelope,
  onStatus,
  onError,
  shouldProjectEnvelope,
}: UseProjectedChatConnectionInput): void {
  const clientRef = useRef<ProjectedChatClient | null>(null);

  useEffect(() => {
    const client = createClient({
      onRawEnvelope,
      onEnvelope: (envelope) => {
        if (shouldProjectEnvelope && !shouldProjectEnvelope(envelope)) {
          return;
        }
        projectSemEnvelope({
          conversationId,
          dispatch,
          semRegistry,
          envelope,
          adapters,
        });
      },
      onStatus,
      onError,
    });
    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [
    adapters,
    conversationId,
    createClient,
    dispatch,
    onError,
    onRawEnvelope,
    onStatus,
    semRegistry,
    shouldProjectEnvelope,
  ]);
}
