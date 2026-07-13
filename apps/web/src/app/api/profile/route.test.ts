import { afterEach, describe, expect, it, vi } from 'vitest';

const { cookieGet } = vi.hoisted(() => ({
  cookieGet: vi.fn<() => { value: string } | undefined>(() => ({ value: 'access-token' })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));

vi.mock('../../../server/auth/session', () => ({
  accessCookieName: 'kernelon_access_token',
  apiUrl: (path: string) => `http://api.test${path}`,
  readProblem: async () => ({ detail: 'upstream failed', errorCode: 'UPSTREAM_FAILED' }),
}));

import { GET, PATCH } from './route';

describe('profile BFF', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cookieGet.mockReturnValue({ value: 'access-token' });
  });

  it('reads the authenticated current-user profile', async () => {
    const profile = {
      avatarUrl: null,
      displayName: '陈思源',
      presenceStatus: 'online',
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(profile), { status: 200 }));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/me'),
      expect.objectContaining({ headers: { Authorization: 'Bearer access-token' } }),
    );
  });

  it('persists avatar and presence through the authenticated API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          avatarUrl: 'data:image/webp;base64,UklGRg==',
          displayName: '陈思源',
          presenceStatus: 'busy',
        }),
        { status: 200 },
      ),
    );
    const request = new Request('http://localhost/api/profile', {
      body: JSON.stringify({
        avatarUrl: 'data:image/webp;base64,UklGRg==',
        displayName: '陈思源',
        presenceStatus: 'busy',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/me'),
      expect.objectContaining({
        body: JSON.stringify({
          avatarUrl: 'data:image/webp;base64,UklGRg==',
          displayName: '陈思源',
          presenceStatus: 'busy',
        }),
        method: 'PATCH',
      }),
    );
  });

  it('rejects an unsupported presence value before calling the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const response = await PATCH(
      new Request('http://localhost/api/profile', {
        body: JSON.stringify({
          avatarUrl: null,
          displayName: '陈思源',
          presenceStatus: 'offline-forever',
        }),
        method: 'PATCH',
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns authentication-required when the profile session is missing', async () => {
    cookieGet.mockReturnValue(undefined);
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const response = await PATCH(
      new Request('http://localhost/api/profile', {
        body: JSON.stringify({
          avatarUrl: null,
          displayName: '陈思源',
          presenceStatus: 'online',
        }),
        method: 'PATCH',
      }),
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
