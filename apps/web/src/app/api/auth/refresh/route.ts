import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  apiUrl,
  clearSessionCookies,
  readProblem,
  refreshCookieName,
  setSessionCookies,
  type TokenPair,
} from '../../../../server/auth/session';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host') ?? requestUrl.host;
  const protocol = request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(':', '');
  const publicOrigin = `${protocol}://${host}`;
  const requestedNext = requestUrl.searchParams.get('next') ?? '/workspace';
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/workspace';
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(refreshCookieName)?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, publicOrigin));
  }

  const upstream = await fetch(apiUrl('/api/v1/auth/refresh'), {
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': request.headers.get('User-Agent') ?? 'KernelOn Web BFF',
    },
    method: 'POST',
  }).catch(() => null);
  if (!upstream?.ok) {
    const response = NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(next)}&reason=session-expired`, publicOrigin),
    );
    clearSessionCookies(response);
    return response;
  }

  const response = NextResponse.redirect(new URL(next, publicOrigin));
  setSessionCookies(response, (await upstream.json()) as TokenPair);
  return response;
}

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(refreshCookieName)?.value;
  if (!refreshToken) {
    return NextResponse.json({ errorCode: 'SESSION_EXPIRED' }, { status: 401 });
  }
  const upstream = await fetch(apiUrl('/api/v1/auth/refresh'), {
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  }).catch(() => null);
  if (!upstream?.ok) {
    const response = NextResponse.json(
      upstream ? await readProblem(upstream) : { errorCode: 'AUTH_SERVICE_UNAVAILABLE' },
      { status: upstream?.status ?? 503 },
    );
    clearSessionCookies(response);
    return response;
  }
  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, (await upstream.json()) as TokenPair);
  return response;
}
