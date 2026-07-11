import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';

export const accessCookieName = 'kernelon_access_token';
export const refreshCookieName = 'kernelon_refresh_token';

const apiBaseUrl = process.env.KERNELON_API_URL ?? 'http://127.0.0.1:8000';

export interface SessionUser {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  id: string;
  mustChangePassword: boolean;
  status: string;
}

export interface TokenPair {
  accessToken: string;
  expiresIn: number;
  mustChangePassword: boolean;
  refreshToken: string;
}

export function apiUrl(path: string): string {
  return new URL(path, apiBaseUrl).toString();
}

export async function fetchSessionUser(accessToken: string): Promise<SessionUser | null> {
  const response = await fetch(apiUrl('/api/v1/auth/me'), {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.ok ? ((await response.json()) as SessionUser) : null;
}

export async function requireSession(nextPath = '/workspace'): Promise<SessionUser> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessCookieName)?.value;
  const refreshToken = cookieStore.get(refreshCookieName)?.value;

  if (accessToken) {
    const user = await fetchSessionUser(accessToken);
    if (user) {
      return user;
    }
  }

  if (refreshToken) {
    redirect(`/api/auth/refresh?next=${encodeURIComponent(nextPath)}`);
  }

  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

export function setSessionCookies(response: NextResponse, tokens: TokenPair): void {
  const shared = {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  response.cookies.set(accessCookieName, tokens.accessToken, {
    ...shared,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(refreshCookieName, tokens.refreshToken, {
    ...shared,
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(accessCookieName, '', { httpOnly: true, maxAge: 0, path: '/' });
  response.cookies.set(refreshCookieName, '', { httpOnly: true, maxAge: 0, path: '/' });
}

export async function readProblem(
  response: Response,
): Promise<{ detail: string; errorCode: string }> {
  try {
    const body = (await response.json()) as { detail?: string; errorCode?: string };
    return {
      detail: body.detail ?? '请求未能完成，请稍后重试。',
      errorCode: body.errorCode ?? 'AUTH_REQUEST_FAILED',
    };
  } catch {
    return { detail: '认证服务暂时不可用。', errorCode: 'AUTH_SERVICE_UNAVAILABLE' };
  }
}
