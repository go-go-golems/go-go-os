import { describe, expect, it, vi } from 'vitest';
import { listProfiles } from './profileApi';

describe('profileApi', () => {
  it('lists profiles with optional registry query param', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [{ slug: 'default' }],
      text: async () => '',
    } as Response));

    const profiles = await listProfiles('default', {
      basePrefix: '/chat',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(profiles).toEqual([{ slug: 'default' }]);
    expect(fetchImpl).toHaveBeenCalledWith('/chat/api/chat/profiles?registry=default');
  });
});
