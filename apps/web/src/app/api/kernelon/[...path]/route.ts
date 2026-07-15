import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  accessCookieName,
  apiUrl,
  clearSessionCookies,
  refreshCookieName,
  setSessionCookies,
  type TokenPair,
} from '../../../../server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = Readonly<{ params: Promise<{ path: string[] }> }>;

export const GET = relayKernelOnApi;
export const HEAD = relayKernelOnApi;
export const POST = relayKernelOnApi;
export const PUT = relayKernelOnApi;
export const PATCH = relayKernelOnApi;
export const DELETE = relayKernelOnApi;

async function relayKernelOnApi(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  if (
    path[0] !== 'v1' ||
    ![
      'lifecycle',
      'music',
      'wallpapers',
      'wallpaper-sources',
      'wallpaper-uploads',
      'wallpaper-media',
      'me',
    ].includes(path[1] ?? '')
  ) {
    return NextResponse.json({ error: 'Unknown KernelOn API relay path' }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const targetUrl = new URL(`/api/${path.map(encodeURIComponent).join('/')}`, apiUrl('/'));
  targetUrl.search = requestUrl.search;

  const cookieStore = await cookies();
  let accessToken = cookieStore.get(accessCookieName)?.value;
  const refreshToken = cookieStore.get(refreshCookieName)?.value;
  let refreshedTokens: TokenPair | null = null;
  if (!accessToken && refreshToken) {
    refreshedTokens = await refreshSession(refreshToken, request.signal);
    accessToken = refreshedTokens?.accessToken;
  }
  if (!accessToken) {
    const response = NextResponse.json({ error: 'KernelOn login required' }, { status: 401 });
    if (refreshToken) clearSessionCookies(response);
    return response;
  }

  const headers = new Headers();
  copyRequestHeader(request.headers, headers, 'accept');
  copyRequestHeader(request.headers, headers, 'content-type');
  copyRequestHeader(request.headers, headers, 'if-range');
  copyRequestHeader(request.headers, headers, 'range');
  copyRequestHeader(request.headers, headers, 'x-request-id');
  headers.set('authorization', `Bearer ${accessToken}`);

  const upstreamInit: RequestInit & { duplex: 'half' } = {
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    cache: 'no-store',
    duplex: 'half',
    headers,
    method: request.method,
    redirect: 'manual',
    signal: request.signal,
  };
  const upstream = await fetch(targetUrl, upstreamInit);

  const response = new NextResponse(upstream.body, {
    headers: filterResponseHeaders(upstream.headers),
    status: upstream.status,
    statusText: upstream.statusText,
  });
  if (refreshedTokens) setSessionCookies(response, refreshedTokens);
  return response;
}

async function refreshSession(
  refreshToken: string,
  signal: AbortSignal,
): Promise<TokenPair | null> {
  const response = await fetch(apiUrl('/api/v1/auth/refresh'), {
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    signal,
  }).catch((error: unknown) => {
    if (signal.aborted) throw signal.reason ?? error;
    return null;
  });
  if (!response?.ok) return null;
  const body = (await response.json().catch(() => null)) as TokenPair | null;
  return body?.accessToken && body.refreshToken ? body : null;
}

function copyRequestHeader(source: Headers, target: Headers, name: string): void {
  const value = source.get(name);
  if (value) target.set(name, value);
}

function filterResponseHeaders(source: Headers): Headers {
  const target = new Headers();
  for (const name of [
    'accept-ranges',
    'cache-control',
    'content-length',
    'content-range',
    'content-type',
    'cross-origin-resource-policy',
    'expires',
    'etag',
    'last-modified',
    'location',
    'pragma',
    'x-request-id',
  ]) {
    const value = source.get(name);
    if (value) target.set(name, value);
  }
  return target;
}
