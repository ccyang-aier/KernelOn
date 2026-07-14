import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet }),
}));

vi.mock('../../../../server/auth/session', () => ({
  accessCookieName: 'kernelon_access_token',
  apiUrl: (path: string) => new URL(path, 'http://127.0.0.1:8000').toString(),
  clearSessionCookies: (response: NextResponse) =>
    response.cookies.set('kernelon_access_token', '', { maxAge: 0 }),
  refreshCookieName: 'kernelon_refresh_token',
  setSessionCookies: (response: NextResponse, tokens: { accessToken: string }) =>
    response.cookies.set('kernelon_access_token', tokens.accessToken),
}));

import type { NextResponse } from 'next/server';

import { GET, HEAD, POST } from './route';

describe('KernelOn API Web relay', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cookieGet.mockReturnValue({ value: 'access-token' });
  });

  it('relays an authenticated music request without owning provider logic', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ songs: [] }), {
        headers: { 'cache-control': 'no-store', 'content-type': 'application/json' },
      }),
    );

    const response = await GET(
      new Request('http://localhost/api/kernelon/v1/music/search?keywords=radio'),
      { params: Promise.resolve({ path: ['v1', 'music', 'search'] }) },
    );

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'http://127.0.0.1:8000/api/v1/music/search?keywords=radio',
    );
    expect((fetchMock.mock.calls[0]?.[1]?.headers as Headers).get('authorization')).toBe(
      'Bearer access-token',
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ songs: [] });
  });

  it('preserves request bodies for compatibility write calls', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    const request = new Request('http://localhost/api/kernelon/v1/music/login/cookie', {
      body: JSON.stringify({ cookie: 'redacted' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    await POST(request, {
      params: Promise.resolve({ path: ['v1', 'music', 'login', 'cookie'] }),
    });

    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(request.body);
  });

  it('rejects non-music relay paths', async () => {
    const response = await GET(new Request('http://localhost/api/kernelon/v1/admin'), {
      params: Promise.resolve({ path: ['v1', 'admin'] }),
    });

    expect(response.status).toBe(404);
  });

  it('preserves HEAD, Range and partial-content headers for media transport', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        headers: {
          'accept-ranges': 'bytes',
          'content-length': '100',
          'content-range': 'bytes 0-99/1000',
          etag: 'media-etag',
        },
        status: 206,
      }),
    );
    const request = new Request('http://localhost/api/kernelon/v1/music/audio?token=opaque', {
      headers: { 'if-range': 'media-etag', range: 'bytes=0-99' },
      method: 'HEAD',
    });

    const response = await HEAD(request, {
      params: Promise.resolve({ path: ['v1', 'music', 'audio'] }),
    });

    const upstreamInit = fetchMock.mock.calls[0]?.[1];
    expect(upstreamInit?.method).toBe('HEAD');
    expect((upstreamInit?.headers as Headers).get('range')).toBe('bytes=0-99');
    expect((upstreamInit?.headers as Headers).get('if-range')).toBe('media-etag');
    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe('bytes 0-99/1000');
    expect(response.headers.get('etag')).toBe('media-etag');
  });

  it('refreshes an expired access cookie before relaying the original request', async () => {
    cookieGet.mockImplementation((name: string) =>
      name === 'kernelon_refresh_token' ? { value: 'refresh-token' } : undefined,
    );
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        Response.json({
          accessToken: 'new-access-token',
          expiresIn: 900,
          mustChangePassword: false,
          refreshToken: 'new-refresh-token',
        }),
      )
      .mockResolvedValueOnce(Response.json({ songs: [] }));
    const request = new Request('http://localhost/api/kernelon/v1/music/search?keywords=radio');

    const response = await GET(request, {
      params: Promise.resolve({ path: ['v1', 'music', 'search'] }),
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'http://127.0.0.1:8000/api/v1/auth/refresh',
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
      method: 'POST',
      signal: request.signal,
    });
    expect((fetchMock.mock.calls[1]?.[1]?.headers as Headers).get('authorization')).toBe(
      'Bearer new-access-token',
    );
    expect(response.headers.get('set-cookie')).toContain(
      'kernelon_access_token=new-access-token',
    );
  });

  it('streams binary media and preserves its representation headers and abort signal', async () => {
    const bytes = new Uint8Array([0, 1, 2, 255]);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(bytes, {
        headers: {
          'accept-ranges': 'bytes',
          'content-length': String(bytes.byteLength),
          'content-type': 'audio/mpeg',
          'cross-origin-resource-policy': 'cross-origin',
        },
      }),
    );
    const controller = new AbortController();
    const request = new Request('http://localhost/api/kernelon/v1/music/audio?token=opaque', {
      signal: controller.signal,
    });

    const response = await GET(request, {
      params: Promise.resolve({ path: ['v1', 'music', 'audio'] }),
    });

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(request.signal);
    expect(response.headers.get('content-type')).toBe('audio/mpeg');
    expect(response.headers.get('content-length')).toBe('4');
    expect(response.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it('does not turn an aborted refresh into an authentication response', async () => {
    cookieGet.mockImplementation((name: string) =>
      name === 'kernelon_refresh_token' ? { value: 'refresh-token' } : undefined,
    );
    const controller = new AbortController();
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      controller.abort(abortError);
      throw abortError;
    });
    const request = new Request('http://localhost/api/kernelon/v1/music/search', {
      signal: controller.signal,
    });

    await expect(
      GET(request, { params: Promise.resolve({ path: ['v1', 'music', 'search'] }) }),
    ).rejects.toBe(abortError);
  });
});
