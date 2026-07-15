import { afterEach, describe, expect, it, vi } from 'vitest';

import { WallpaperApi } from '../src/apps/wallpaper/api';
import type { KernelOnRuntimeConfig } from '../src/runtime-config';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WallpaperApi', () => {
  it('binds the browser fetch implementation to the global receiver', async () => {
    const nativeFetch = vi.fn(function (this: typeof globalThis) {
      expect(this).toBe(globalThis);
      return Promise.resolve(
        new Response(JSON.stringify({ items: [], providerErrors: [] }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }),
      );
    });
    vi.stubGlobal('fetch', nativeFetch);

    const api = new WallpaperApi({
      apiBaseUrl: '/api/kernelon/v1',
      platform: 'web',
    } as KernelOnRuntimeConfig);

    await expect(api.search('earth', 'video')).resolves.toEqual({
      items: [],
      providerErrors: [],
    });
    expect(nativeFetch).toHaveBeenCalledOnce();
  });
});
