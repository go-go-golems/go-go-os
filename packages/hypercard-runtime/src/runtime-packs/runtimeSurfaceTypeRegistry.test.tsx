import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  clearRuntimeSurfaceTypes,
  DEFAULT_RUNTIME_SURFACE_TYPE_ID,
  listRuntimeSurfaceTypes,
  registerRuntimeSurfaceType,
  renderRuntimeSurfaceTree,
  validateRuntimeSurfaceTree,
} from './runtimeSurfaceTypeRegistry';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE } from '../testRuntimeUi';

describe('runtimeSurfaceTypeRegistry', () => {
  beforeEach(() => {
    clearRuntimeSurfaceTypes();
  });

  it('can stay empty until surface types are registered explicitly', () => {
    expect(listRuntimeSurfaceTypes()).toEqual([]);
    expect(() => validateRuntimeSurfaceTree(DEFAULT_RUNTIME_SURFACE_TYPE_ID, { kind: 'panel', children: [] })).toThrow(
      /unknown runtime surface type/i
    );
  });

  it('registers the baseline ui surface type explicitly', () => {
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
    expect(listRuntimeSurfaceTypes()).toEqual([DEFAULT_RUNTIME_SURFACE_TYPE_ID]);
  });

  it('validates and renders ui.card.v1 trees', () => {
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);

    const tree = validateRuntimeSurfaceTree(DEFAULT_RUNTIME_SURFACE_TYPE_ID, {
      kind: 'panel',
      children: [
        { kind: 'text', text: 'Hello runtime surface' },
        {
          kind: 'button',
          props: { label: 'Open' },
        },
      ],
    }) as { kind: string };

    expect(tree.kind).toBe('panel');

    const markup = renderToStaticMarkup(
      <>{renderRuntimeSurfaceTree(DEFAULT_RUNTIME_SURFACE_TYPE_ID, tree, () => {})}</>,
    );
    expect(markup).toContain('Hello runtime surface');
    expect(markup).toContain('Open');
  });

  it('rejects unknown runtime surface types', () => {
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
    expect(() => validateRuntimeSurfaceTree('missing.v1', { kind: 'panel', children: [] })).toThrow(/unknown runtime surface type/i);
  });
});
