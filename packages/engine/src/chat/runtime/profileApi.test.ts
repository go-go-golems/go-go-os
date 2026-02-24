import { describe, expect, it, vi } from 'vitest';
import {
  ChatProfileApiError,
  createProfile,
  listProfiles,
  setDefaultProfile,
  updateProfile,
} from './profileApi';

describe('profileApi', () => {
  it('lists profiles with optional registry query param', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [
        { slug: 'default', is_default: false },
        { slug: 'inventory', is_default: true, extensions: { 'webchat.starter_suggestions@v1': { items: ['restock'] } } },
      ],
      text: async () => '',
    } as Response));

    const profiles = await listProfiles('default', {
      basePrefix: '/chat',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(profiles).toEqual([
      { slug: 'default', is_default: false },
      {
        slug: 'inventory',
        is_default: true,
        extensions: { 'webchat.starter_suggestions@v1': { items: ['restock'] } },
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith('/chat/api/chat/profiles?registry=default');
  });

  it('parses indexed-object list payloads from legacy intermediaries', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        '1': { slug: 'inventory', is_default: true },
        '0': { slug: 'default', is_default: false },
      }),
      text: async () => '',
    } as Response));

    const profiles = await listProfiles('default', {
      basePrefix: '/chat',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(profiles.map((profile) => profile.slug)).toEqual(['default', 'inventory']);
  });

  it('decodes extensions in create and update profile responses', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          registry: 'default',
          slug: 'analyst',
          is_default: true,
          extensions: {
            'webchat.starter_suggestions@v1': {
              items: ['Explain top movers'],
            },
          },
        }),
        text: async () => '',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          registry: 'default',
          slug: 'analyst',
          is_default: false,
          extensions: {
            'webchat.starter_suggestions@v1': {
              items: ['Summarize low stock'],
            },
          },
        }),
        text: async () => '',
      } as Response);

    const created = await createProfile(
      {
        slug: 'analyst',
      },
      { basePrefix: '/chat', fetchImpl: fetchImpl as unknown as typeof fetch }
    );
    const updated = await updateProfile(
      'analyst',
      {
        expected_version: 1,
      },
      { basePrefix: '/chat', fetchImpl: fetchImpl as unknown as typeof fetch }
    );

    expect(created.extensions).toEqual({
      'webchat.starter_suggestions@v1': {
        items: ['Explain top movers'],
      },
    });
    expect(updated.extensions).toEqual({
      'webchat.starter_suggestions@v1': {
        items: ['Summarize low stock'],
      },
    });
  });

  it('decodes set default response contract', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        registry: 'default',
        slug: 'inventory',
        is_default: true,
      }),
      text: async () => '',
    } as Response));

    const doc = await setDefaultProfile(
      'inventory',
      {},
      { basePrefix: '/chat', fetchImpl: fetchImpl as unknown as typeof fetch }
    );

    expect(doc).toEqual({
      registry: 'default',
      slug: 'inventory',
      is_default: true,
    });
  });

  it('throws ChatProfileApiError on malformed 200 payload', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ nope: true }),
      text: async () => '',
    } as Response));

    await expect(
      listProfiles('default', { basePrefix: '/chat', fetchImpl: fetchImpl as unknown as typeof fetch })
    ).rejects.toBeInstanceOf(ChatProfileApiError);
  });
});
