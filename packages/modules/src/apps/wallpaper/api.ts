import type { KernelOnRuntimeConfig } from '../../runtime-config';
import type { WallpaperAsset, WallpaperSource, WallpaperStorageUsage } from './types';

export class WallpaperApi {
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;

  constructor(runtime: KernelOnRuntimeConfig) {
    this.#baseUrl = runtime.apiBaseUrl;
    this.#fetch = runtime.apiFetch ?? fetch;
  }

  async search(query = '', mediaType: 'all' | 'image' | 'video' = 'all', page = 1) {
    const params = new URLSearchParams({
      q: query,
      media_type: mediaType,
      page: String(page),
      limit: '30',
    });
    return this.#json<{ items: WallpaperAsset[]; providerErrors: Record<string, string> }>(
      `/wallpapers?${params}`,
    );
  }

  async sources() {
    const sources = await this.#json<Array<WallpaperSource & { system?: boolean }>>(
      '/wallpaper-sources',
    );
    return sources.map((source) => ({
      ...source,
      url: source.id === 'system' ? 'local://system-library' : `provider://${source.id}`,
      isSystem: source.system ?? source.isSystem ?? true,
      enabled: source.visible === false ? false : source.enabled,
    }));
  }

  current() {
    return this.#json<WallpaperAsset | null>('/me/wallpaper');
  }

  storage() {
    return this.#json<WallpaperStorageUsage>('/me/wallpaper-storage');
  }

  apply(asset: WallpaperAsset) {
    return this.#json<WallpaperAsset>('/me/wallpaper', {
      method: 'PUT',
      body: JSON.stringify({ asset }),
    });
  }

  favorite(asset: WallpaperAsset, liked: boolean) {
    return this.#json<{ id: string; liked: boolean }>(
      `/wallpapers/${encodeURIComponent(asset.id)}/favorite`,
      { method: liked ? 'PUT' : 'DELETE', body: JSON.stringify({ asset }) },
    );
  }

  importAsset(asset: WallpaperAsset, confirm: boolean) {
    return this.#json<{
      estimatedBytes: number;
      licenseName?: string;
      attribution?: string;
      asset?: WallpaperAsset;
    }>(`/wallpapers/${encodeURIComponent(asset.id)}/import`, {
      method: 'POST',
      body: JSON.stringify({ confirm }),
    });
  }

  setSourceVisible(sourceId: string, visible: boolean) {
    return this.#json<{ id: string; visible: boolean }>(
      `/me/wallpaper-source-preferences/${encodeURIComponent(sourceId)}`,
      { method: 'PATCH', body: JSON.stringify({ visible }) },
    );
  }

  async upload(file: File, title: string, posterUrl = ''): Promise<WallpaperAsset> {
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const job = await this.#json<{ id: string; uploadUrl: string }>('/wallpaper-uploads', {
      method: 'POST',
      body: JSON.stringify({
        title,
        mediaType,
        contentType: file.type,
        sizeBytes: file.size,
        posterUrl,
      }),
    });
    return this.#json<WallpaperAsset>(job.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }

  deleteStoredAsset(assetId: string) {
    const [, id] = assetId.split(':', 2);
    return this.#json<void>(`/wallpaper-uploads/${encodeURIComponent(id || '')}`, {
      method: 'DELETE',
    });
  }

  async #json<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (typeof init.body === 'string') headers.set('Content-Type', 'application/json');
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
      throw new Error(problem?.detail || `Wallpaper API request failed (${response.status})`);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}
