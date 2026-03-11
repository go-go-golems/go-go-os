import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  clearRuntimeSurfaceTypes,
  DEFAULT_RUNTIME_SURFACE_TYPE_ID,
  listRuntimeSurfaceTypes,
  renderRuntimeSurfaceTree,
  validateRuntimeSurfaceTree,
} from './runtimeSurfaceTypeRegistry';
import { registerBuiltInRuntimeSurfaceTypes } from './defaultRuntimeSurfaceTypes';
import { resetBuiltInHypercardRuntimeRegistrationForTest } from '../runtimeDefaults';

describe('runtimeSurfaceTypeRegistry', () => {
  beforeEach(() => {
    clearRuntimeSurfaceTypes();
    resetBuiltInHypercardRuntimeRegistrationForTest();
  });

  it('can stay empty until surface types are registered explicitly', () => {
    expect(listRuntimeSurfaceTypes()).toEqual([]);
    expect(() => validateRuntimeSurfaceTree(DEFAULT_RUNTIME_SURFACE_TYPE_ID, { kind: 'panel', children: [] })).toThrow(
      /unknown runtime surface type/i
    );
  });

  it('registers the baseline ui surface type explicitly', () => {
    registerBuiltInRuntimeSurfaceTypes();
    expect(listRuntimeSurfaceTypes()).toEqual([DEFAULT_RUNTIME_SURFACE_TYPE_ID]);
  });

  it('validates and renders ui.card.v1 trees', () => {
    registerBuiltInRuntimeSurfaceTypes();

    const tree = validateRuntimeSurfaceTree(DEFAULT_RUNTIME_SURFACE_TYPE_ID, {
      kind: 'panel',
      children: [
        { kind: 'text', text: 'Hello runtime surface' },
        {
          kind: 'button',
          props: { label: 'Open' },
        },
      ],
    });

    expect(tree.kind).toBe('panel');

    const markup = renderToStaticMarkup(
      <>{renderRuntimeSurfaceTree(DEFAULT_RUNTIME_SURFACE_TYPE_ID, tree, () => {})}</>,
    );
    expect(markup).toContain('Hello runtime surface');
    expect(markup).toContain('Open');
  });

  it('rejects unknown runtime surface types', () => {
    registerBuiltInRuntimeSurfaceTypes();
    expect(() => validateRuntimeSurfaceTree('missing.v1', { kind: 'panel', children: [] })).toThrow(/unknown runtime surface type/i);
  });
});
