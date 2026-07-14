// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMineradioTransport } from '../src/apps/music/host/transport';

describe('Mineradio compatibility transport', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/workspace');
  });

  it('maps the frozen Mineradio API path to the canonical music API', async () => {
    const nativeFetch = vi.fn<typeof window.fetch>().mockResolvedValue(
      Response.json({ songs: [] }, { headers: { 'cache-control': 'no-store' } }),
    );
    const transport = createMineradioTransport({
      apiBaseUrl: '/api/kernelon/v1',
      fetch: nativeFetch,
    });

    const response = await transport('/api/search?keywords=radio&limit=20');

    expect(String(nativeFetch.mock.calls[0]?.[0])).toBe(
      `${window.location.origin}/api/kernelon/v1/music/search?keywords=radio&limit=20`,
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ songs: [] });
  });

  it('rewrites nested original media URLs returned by the canonical service', async () => {
    const nativeFetch = vi.fn<typeof window.fetch>().mockResolvedValue(
      Response.json({
        songs: [{ cover: '/api/cover?url=https%3A%2F%2Fmusic.126.net%2Fcover.jpg' }],
        url: '/api/audio?url=https%3A%2F%2Fmusic.126.net%2Fsong.mp3',
      }),
    );
    const transport = createMineradioTransport({
      apiBaseUrl: 'https://api.kernelon.test/api/v1/',
      fetch: nativeFetch,
    });

    const response = await transport('/api/song/url?id=1');

    await expect(response.json()).resolves.toEqual({
      songs: [
        {
          cover:
            'https://api.kernelon.test/api/v1/music/cover?url=https%3A%2F%2Fmusic.126.net%2Fcover.jpg',
        },
      ],
      url: 'https://api.kernelon.test/api/v1/music/audio?url=https%3A%2F%2Fmusic.126.net%2Fsong.mp3',
    });
  });

  it('leaves non-Mineradio requests untouched', async () => {
    const response = new Response('asset');
    const nativeFetch = vi.fn<typeof window.fetch>().mockResolvedValue(response);
    const transport = createMineradioTransport({ apiBaseUrl: '/api/v1', fetch: nativeFetch });

    await expect(transport('https://cdn.example.test/skull.bin')).resolves.toBe(response);
    expect(nativeFetch).toHaveBeenCalledWith('https://cdn.example.test/skull.bin', undefined);
  });

  it('does not translate an already canonical same-origin media URL twice', async () => {
    const response = new Response('audio');
    const nativeFetch = vi.fn<typeof window.fetch>().mockResolvedValue(response);
    const transport = createMineradioTransport({
      apiBaseUrl: '/api/kernelon/v1',
      fetch: nativeFetch,
    });
    const canonicalUrl = '/api/kernelon/v1/music/audio?token=opaque';

    await expect(transport(canonicalUrl)).resolves.toBe(response);
    expect(nativeFetch).toHaveBeenCalledWith(canonicalUrl, undefined);
  });

  it('keeps beatmap cache local and preserves the original response contract', async () => {
    const entries = new Map<string, never>();
    const beatmapCache = {
      close: vi.fn(),
      read: vi.fn(async (key: string) => entries.get(key) ?? null),
      write: vi.fn(async (entry: never) => {
        entries.set((entry as { key: string }).key, entry);
      }),
    };
    const nativeFetch = vi.fn<typeof window.fetch>();
    const transport = createMineradioTransport({
      apiBaseUrl: '/api/v1',
      beatmapCache,
      fetch: nativeFetch,
    });

    const status = await transport('/api/beatmap/cache/status');
    await expect(status.json()).resolves.toMatchObject({ enabled: true, mode: 'disk' });

    const write = await transport('/api/beatmap/cache', {
      body: JSON.stringify({ key: 'netease:1', map: { beats: [1] }, title: 'Mine' }),
      method: 'POST',
    });
    await expect(write.json()).resolves.toMatchObject({ key: 'netease:1', ok: true });

    const read = await transport('/api/beatmap/cache?key=netease%3A1');
    await expect(read.json()).resolves.toMatchObject({
      hit: true,
      key: 'netease:1',
      map: { beats: [1] },
      ok: true,
    });
    expect(nativeFetch).not.toHaveBeenCalled();
  });

  it('runs the frozen podcast DJ analyzer locally instead of on the Web server', async () => {
    const djAnalyzer = {
      analyze: vi.fn(async () => ({ beats: [{ time: 1.25 }], tempoSource: 'source-exact' })),
    };
    const nativeFetch = vi.fn<typeof window.fetch>();
    const transport = createMineradioTransport({
      apiBaseUrl: '/api/v1',
      djAnalyzer,
      fetch: nativeFetch,
    });

    const response = await transport(
      '/api/podcast/dj-beatmap?url=https%3A%2F%2Fmusic.126.net%2Faudio.mp3&duration=3600&intro=180',
    );

    expect(djAnalyzer.analyze).toHaveBeenCalledWith(
      {
        audioUrl: 'https://music.126.net/audio.mp3',
        durationSec: 3600,
        introSec: 180,
      },
      undefined,
    );
    await expect(response.json()).resolves.toEqual({
      map: { beats: [{ time: 1.25 }], tempoSource: 'source-exact' },
      ok: true,
    });
    expect(nativeFetch).not.toHaveBeenCalled();
  });

  it('maps legacy GET mutations to canonical POST without changing the frozen runtime', async () => {
    const nativeFetch = vi
      .fn<typeof window.fetch>()
      .mockResolvedValue(Response.json({ ok: true }));
    const transport = createMineradioTransport({ apiBaseUrl: '/api/v1', fetch: nativeFetch });

    await transport('/api/song/like?id=42&like=true');

    expect(String(nativeFetch.mock.calls[0]?.[0])).toBe(
      `${window.location.origin}/api/v1/music/song/like?id=42&like=true`,
    );
    expect(nativeFetch.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(nativeFetch.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ id: '42', like: true }));
    expect(new Headers(nativeFetch.mock.calls[0]?.[1]?.headers).get('content-type')).toBe(
      'application/json',
    );
  });

  it('moves legacy playlist-create query fields into the canonical POST body', async () => {
    const nativeFetch = vi
      .fn<typeof window.fetch>()
      .mockResolvedValue(Response.json({ ok: true }));
    const transport = createMineradioTransport({ apiBaseUrl: '/api/v1', fetch: nativeFetch });

    await transport('/api/playlist/create?name=Night%20Drive');

    expect(nativeFetch.mock.calls[0]?.[1]).toMatchObject({
      body: JSON.stringify({ name: 'Night Drive', privacy: '0' }),
      method: 'POST',
    });
  });

  it('does not rewrite canonical media paths or user text and drops stale body headers', async () => {
    const nativeFetch = vi.fn<typeof window.fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          canonical: '/api/v1/music/audio?token=opaque',
          comment: '/api/audio is written here as plain text',
          media: '/api/audio?url=https%3A%2F%2Fmusic.126.net%2Fa.mp3',
        }),
        {
          headers: {
            'content-encoding': 'gzip',
            'content-length': '999',
            'content-type': 'application/json',
            etag: 'stale',
          },
        },
      ),
    );
    const transport = createMineradioTransport({ apiBaseUrl: '/api/v1', fetch: nativeFetch });

    const response = await transport('/api/search?keywords=api');

    await expect(response.json()).resolves.toEqual({
      canonical: '/api/v1/music/audio?token=opaque',
      comment: '/api/audio is written here as plain text',
      media: '/api/v1/music/audio?url=https%3A%2F%2Fmusic.126.net%2Fa.mp3',
    });
    expect(response.headers.has('content-encoding')).toBe(false);
    expect(response.headers.has('content-length')).toBe(false);
    expect(response.headers.has('etag')).toBe(false);
  });

  it('propagates AbortError from local handlers instead of converting it to JSON 500', async () => {
    const controller = new AbortController();
    const djAnalyzer = {
      analyze: vi.fn(async (_request: unknown, signal?: AbortSignal) => {
        controller.abort();
        throw signal?.reason ?? new DOMException('Aborted', 'AbortError');
      }),
    };
    const transport = createMineradioTransport({
      apiBaseUrl: '/api/v1',
      djAnalyzer,
      fetch: vi.fn<typeof window.fetch>(),
    });

    await expect(
      transport('/api/podcast/dj-beatmap?url=https%3A%2F%2Fmusic.126.net%2Fa.mp3', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
