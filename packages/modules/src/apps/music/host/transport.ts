import {
  compactBeatmapCachePayload,
  type MineradioBeatmapCache,
} from './beatmap-cache';
import type { MineradioDjAnalyzer } from './dj-analyzer';

const originalApiPrefix = '/api';
const canonicalPostRoutes = new Set([
  '/api/logout',
  '/api/playlist/create',
  '/api/qq/logout',
  '/api/song/like',
]);
const updateRoutes = new Set([
  '/api/update/download',
  '/api/update/download/status',
  '/api/update/latest',
  '/api/update/patch',
  '/api/update/patch/status',
]);

export interface MineradioTransportOptions {
  apiBaseUrl: string;
  beatmapCache?: MineradioBeatmapCache;
  djAnalyzer?: MineradioDjAnalyzer;
  fetch: typeof window.fetch;
}

/**
 * Translates Mineradio's frozen `/api/*` protocol to KernelOn's canonical
 * Litestar music API. The ported runtime stays unchanged; Web and Tauri only
 * provide a different API base URL at composition time.
 */
export function createMineradioTransport({
  apiBaseUrl,
  beatmapCache,
  djAnalyzer,
  fetch: nativeFetch,
}: MineradioTransportOptions): typeof window.fetch {
  const musicApiBaseUrl = `${stripTrailingSlash(apiBaseUrl)}/music`;
  const canonicalMusicUrl = new URL(musicApiBaseUrl, window.location.href);

  return async (input, init) => {
    const originalUrl = resolveRequestUrl(input);
    if (!isOriginalMineradioApiUrl(originalUrl, canonicalMusicUrl)) {
      return nativeFetch(input, init);
    }

    if (originalUrl.pathname === '/api/beatmap/cache/status') {
      throwIfAborted(resolveRequestSignal(input, init));
      return jsonResponse({
        dir: beatmapCache ? 'IndexedDB' : '',
        drive: '',
        enabled: Boolean(beatmapCache),
        mode: beatmapCache ? 'disk' : 'memory-only',
        reason: beatmapCache ? '' : 'INDEXEDDB_UNAVAILABLE',
      });
    }

    if (originalUrl.pathname === '/api/beatmap/cache') {
      return handleBeatmapCacheRequest(
        input,
        init,
        originalUrl,
        beatmapCache,
        resolveRequestSignal(input, init),
      );
    }

    if (originalUrl.pathname === '/api/podcast/dj-beatmap') {
      return handleDjBeatmapRequest(originalUrl, resolveRequestSignal(input, init), djAnalyzer);
    }

    if (updateRoutes.has(originalUrl.pathname)) {
      return handleUnavailableUpdateRequest(originalUrl);
    }

    const targetUrl = new URL(
      `${musicApiBaseUrl}${originalUrl.pathname.slice(originalApiPrefix.length)}${originalUrl.search}`,
      window.location.href,
    );
    const requestInit = canonicalRequestInit(originalUrl, input, init);
    const response = await nativeFetch(copyRequestInput(input, targetUrl), requestInit);

    return rewriteMineradioJsonUrls(response, musicApiBaseUrl);
  };
}

function canonicalRequestInit(
  originalUrl: URL,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): RequestInit | undefined {
  if (!canonicalPostRoutes.has(originalUrl.pathname)) return init;

  const legacyBody = legacyMutationBody(originalUrl);
  if (!legacyBody) return { ...init, method: 'POST' };

  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  headers.set('content-type', 'application/json');
  return {
    ...init,
    body: JSON.stringify(legacyBody),
    headers,
    method: 'POST',
  };
}

function legacyMutationBody(url: URL): Record<string, unknown> | undefined {
  if (url.pathname === '/api/song/like') {
    return {
      id: url.searchParams.get('id') ?? '',
      like: url.searchParams.get('like') !== 'false',
    };
  }
  if (url.pathname === '/api/playlist/create') {
    return {
      name: url.searchParams.get('name') ?? '',
      privacy: url.searchParams.get('privacy') ?? '0',
    };
  }
  return undefined;
}

async function handleDjBeatmapRequest(
  url: URL,
  signal: AbortSignal | null | undefined,
  analyzer: MineradioDjAnalyzer | undefined,
): Promise<Response> {
  const audioUrl = url.searchParams.get('url') ?? '';
  if (!/^https?:\/\//i.test(audioUrl)) {
    return jsonResponse({ error: 'INVALID_AUDIO_URL', ok: false }, 400);
  }
  if (!analyzer) return jsonResponse({ error: 'DJ_ANALYZER_UNAVAILABLE', ok: false }, 500);

  try {
    const durationSec = Math.max(0, Number(url.searchParams.get('duration')) || 0);
    const intro = url.searchParams.get('intro');
    const map = await analyzer.analyze(
      {
        audioUrl,
        durationSec,
        ...(intro === null ? {} : { introSec: Number(intro) || 180 }),
      },
      signal ?? undefined,
    );
    return jsonResponse({ map, ok: true });
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) throw error;
    return jsonResponse({ error: errorMessage(error, 'DJ_ANALYSIS_FAILED'), ok: false }, 500);
  }
}

function handleUnavailableUpdateRequest(url: URL): Response {
  if (url.pathname === '/api/update/latest') {
    return jsonResponse({
      configured: false,
      currentVersion: '1.1.1',
      latestVersion: '1.1.1',
      preview: false,
      reason: 'KERNELON_HOST_MANAGED',
      release: {
        downloadUrl: '',
        htmlUrl: '',
        name: 'Mineradio v1.1.1',
        notes: '',
        summary: '当前版本，更新由 KernelOn 宿主管理。',
        tagName: 'v1.1.1',
        version: '1.1.1',
      },
      updateAvailable: false,
    });
  }
  if (url.pathname.endsWith('/status')) {
    return jsonResponse({ error: 'UPDATE_JOB_NOT_FOUND', ok: false }, 404);
  }
  return jsonResponse({ error: 'NO_UPDATE_AVAILABLE', ok: false }, 400);
}

async function handleBeatmapCacheRequest(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  url: URL,
  cache: MineradioBeatmapCache | undefined,
  signal: AbortSignal | undefined,
): Promise<Response> {
  throwIfAborted(signal);
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (!cache) {
    return jsonResponse({
      enabled: false,
      hit: false,
      mode: 'memory-only',
      ok: false,
      reason: 'INDEXEDDB_UNAVAILABLE',
    });
  }

  if (method === 'GET') {
    const key = url.searchParams.get('key') ?? '';
    try {
      const entry = await cache.read(key);
      throwIfAborted(signal);
      return jsonResponse(
        entry
          ? {
              hit: true,
              key: entry.key || key,
              map: entry.map,
              meta: entry.meta,
              ok: true,
              savedAt: entry.savedAt,
            }
          : { hit: false, key, ok: true },
      );
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) throw error;
      return jsonResponse({
        enabled: false,
        hit: false,
        key,
        mode: 'memory-only',
        ok: false,
        reason: errorMessage(error, 'BEAT_CACHE_READ_FAILED'),
      });
    }
  }

  if (method === 'POST') {
    try {
      const payload = compactBeatmapCachePayload(await readRequestJson(input, init));
      if (!payload) return jsonResponse({ error: 'INVALID_BEATMAP_CACHE_PAYLOAD', ok: false });
      await cache.write(payload);
      throwIfAborted(signal);
      return jsonResponse({
        dir: 'IndexedDB',
        key: payload.key,
        ok: true,
        savedAt: payload.savedAt,
      });
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) throw error;
      return jsonResponse({
        enabled: false,
        mode: 'memory-only',
        ok: false,
        reason: errorMessage(error, 'BEAT_CACHE_WRITE_FAILED'),
      });
    }
  }

  return jsonResponse({ error: 'METHOD_NOT_ALLOWED', ok: false }, 405);
}

async function readRequestJson(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): Promise<unknown> {
  if (typeof init?.body === 'string') return JSON.parse(init.body);
  if (input instanceof Request) return input.clone().json();
  return null;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return Response.json(payload, {
    headers: {
      'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      expires: '0',
      pragma: 'no-cache',
    },
    status,
  });
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function resolveRequestUrl(input: RequestInfo | URL): URL {
  if (input instanceof Request) return new URL(input.url, window.location.href);
  return new URL(String(input), window.location.href);
}

function isOriginalMineradioApiUrl(url: URL, canonicalMusicUrl: URL): boolean {
  const canonicalPath = stripTrailingSlash(canonicalMusicUrl.pathname);
  return (
    url.origin === window.location.origin &&
    url.pathname.startsWith(`${originalApiPrefix}/`) &&
    !(
      url.origin === canonicalMusicUrl.origin &&
      (url.pathname === canonicalPath || url.pathname.startsWith(`${canonicalPath}/`))
    )
  );
}

function copyRequestInput(input: RequestInfo | URL, targetUrl: URL): RequestInfo | URL {
  if (input instanceof Request) return new Request(targetUrl, input);
  return targetUrl;
}

async function rewriteMineradioJsonUrls(
  response: Response,
  musicApiBaseUrl: string,
): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) return response;

  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return new Response(text, cloneResponseInit(response));
  }

  const rewritten = rewriteValue(payload, musicApiBaseUrl);
  const init = cloneResponseInit(response);
  const headers = new Headers(init.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(JSON.stringify(rewritten), { ...init, headers });
}

function rewriteValue(value: unknown, musicApiBaseUrl: string): unknown {
  if (
    typeof value === 'string' &&
    (value.startsWith('/api/audio?') || value.startsWith('/api/cover?'))
  ) {
    return `${musicApiBaseUrl}${value.slice(originalApiPrefix.length)}`;
  }
  if (Array.isArray(value)) return value.map((item) => rewriteValue(item, musicApiBaseUrl));
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, rewriteValue(item, musicApiBaseUrl)]),
  );
}

function resolveRequestSignal(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): AbortSignal | undefined {
  return init?.signal ?? (input instanceof Request ? input.signal : undefined) ?? undefined;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError');
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

function cloneResponseInit(response: Response): ResponseInit {
  return {
    headers: new Headers(response.headers),
    status: response.status,
    statusText: response.statusText,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
