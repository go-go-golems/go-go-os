import type { SemContext, SemEvent } from '../../chat/sem/semRegistry';
import { registerSem } from '../../chat/sem/semRegistry';
import { recordField, stringField } from '../../chat/sem/semHelpers';
import { timelineSlice, type TimelineEntity } from '../../chat/state/timelineSlice';
import type { RenderEntity } from '../../chat/renderers/types';
import { registerRuntimeCard } from '../../plugin-runtime';
import { extractArtifactUpsertFromSem } from '../artifacts/artifactRuntime';
import { upsertArtifact } from '../artifacts/artifactsSlice';

function asDataRecord(ev: SemEvent): Record<string, unknown> {
  if (typeof ev.data === 'object' && ev.data !== null && !Array.isArray(ev.data)) {
    return ev.data as Record<string, unknown>;
  }
  return {};
}

function cardEntityId(data: Record<string, unknown>, fallbackId: string): string {
  const itemId = stringField(data, 'itemId') ?? fallbackId;
  return `card:${itemId}`;
}

function maybeRegisterRuntimeCard(
  data: Record<string, unknown>,
  artifactUpdate: { runtimeCardId?: string; runtimeCardCode?: string } | undefined
) {
  if (artifactUpdate?.runtimeCardId && artifactUpdate?.runtimeCardCode) {
    registerRuntimeCard(artifactUpdate.runtimeCardId, artifactUpdate.runtimeCardCode);
    return;
  }

  const payload = recordField(data, 'data');
  const cardRecord = payload ? recordField(payload, 'card') : undefined;
  const runtimeCardId = cardRecord ? stringField(cardRecord, 'id') : undefined;
  const runtimeCardCode = cardRecord ? stringField(cardRecord, 'code') : undefined;
  if (runtimeCardId && runtimeCardCode) {
    registerRuntimeCard(runtimeCardId, runtimeCardCode);
  }
}

function upsertCardEntity(
  ctx: SemContext,
  ev: SemEvent,
  status: 'running' | 'success' | 'error',
  detail: string,
) {
  const data = asDataRecord(ev);
  const entityId = cardEntityId(data, ev.id);
  const itemId = stringField(data, 'itemId') ?? ev.id;
  const title = stringField(data, 'name') ?? stringField(data, 'title') ?? 'Card';

  const artifactUpdate = extractArtifactUpsertFromSem(ev.type, data);
  if (artifactUpdate) {
    ctx.dispatch(
      upsertArtifact({
        ...artifactUpdate,
        updatedAt: Date.now(),
      })
    );
  }

  if (ev.type === 'hypercard.card.v2') {
    maybeRegisterRuntimeCard(data, artifactUpdate);
  }

  const entity: TimelineEntity = {
    id: entityId,
    kind: 'hypercard_card',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    props: {
      title,
      status,
      detail,
      itemId,
      artifactId: artifactUpdate?.id,
      runtimeCardId: artifactUpdate?.runtimeCardId,
      rawData: data,
    },
  };

  ctx.dispatch(timelineSlice.actions.upsertEntity({ convId: ctx.convId, entity }));
}

export function registerHypercardCardSemHandlers() {
  registerSem('hypercard.card.start', (ev, ctx) => {
    upsertCardEntity(ctx, ev, 'running', 'started');
  });

  registerSem('hypercard.card.update', (ev, ctx) => {
    upsertCardEntity(ctx, ev, 'running', 'updating');
  });

  registerSem('hypercard.card.v2', (ev, ctx) => {
    upsertCardEntity(ctx, ev, 'success', 'ready');
  });

  registerSem('hypercard.card.error', (ev, ctx) => {
    const data = asDataRecord(ev);
    const errorDetail = stringField(data, 'error') ?? 'unknown error';
    upsertCardEntity(ctx, ev, 'error', errorDetail);
  });
}

function emitArtifactIntent(mode: 'open' | 'edit', artifactId: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('hypercard:artifact', {
      detail: {
        mode,
        artifactId,
      },
    })
  );
}

export function HypercardCardRenderer({ e }: { e: RenderEntity }) {
  const title = String(e.props.title ?? 'Card');
  const status = String(e.props.status ?? 'running');
  const detail = String(e.props.detail ?? '');
  const artifactId = e.props.artifactId ? String(e.props.artifactId) : '';
  const runtimeCardId = e.props.runtimeCardId ? String(e.props.runtimeCardId) : '';

  return (
    <div data-part="chat-message" data-role="system">
      <div data-part="chat-role">Card:</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        <strong>{title}</strong> ({status})
        {runtimeCardId ? ` · runtime=${runtimeCardId}` : ''}
        {detail ? ` — ${detail}` : ''}
      </div>
      {artifactId && (
        <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
          <button type="button" data-part="btn" onClick={() => emitArtifactIntent('open', artifactId)}>
            Open
          </button>
          <button type="button" data-part="btn" onClick={() => emitArtifactIntent('edit', artifactId)}>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
