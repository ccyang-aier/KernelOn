import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  accessCookieName,
  apiUrl,
  readProblem,
  type SessionUser,
} from '../../../server/auth/session';

const presenceStatuses = new Set(['online', 'away', 'busy', 'invisible']);

async function accessToken() {
  return (await cookies()).get(accessCookieName)?.value;
}

export async function GET() {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json(
      { detail: '登录会话已失效。', errorCode: 'AUTHENTICATION_REQUIRED' },
      { status: 401 },
    );
  }

  const upstream = await fetch(apiUrl('/api/v1/auth/me'), {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!upstream?.ok) {
    return NextResponse.json(
      upstream
        ? await readProblem(upstream)
        : { detail: '用户资料服务暂时不可用。', errorCode: 'PROFILE_SERVICE_UNAVAILABLE' },
      { status: upstream?.status ?? 503 },
    );
  }
  return NextResponse.json((await upstream.json()) as SessionUser);
}

export async function PATCH(request: Request) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json(
      { detail: '登录会话已失效。', errorCode: 'AUTHENTICATION_REQUIRED' },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    avatarUrl?: unknown;
    displayName?: unknown;
    presenceStatus?: unknown;
  } | null;
  if (
    typeof body?.displayName !== 'string' ||
    body.displayName.trim().length === 0 ||
    body.displayName.length > 120 ||
    (body.avatarUrl !== null && typeof body.avatarUrl !== 'string') ||
    (typeof body.avatarUrl === 'string' && body.avatarUrl.length > 1_500_000) ||
    typeof body.presenceStatus !== 'string' ||
    !presenceStatuses.has(body.presenceStatus)
  ) {
    return NextResponse.json(
      { detail: '用户资料输入无效。', errorCode: 'INVALID_PROFILE_INPUT' },
      { status: 400 },
    );
  }

  const upstream = await fetch(apiUrl('/api/v1/auth/me'), {
    body: JSON.stringify({
      avatarUrl: body.avatarUrl,
      displayName: body.displayName.trim(),
      presenceStatus: body.presenceStatus,
    }),
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  }).catch(() => null);
  if (!upstream?.ok) {
    return NextResponse.json(
      upstream
        ? await readProblem(upstream)
        : { detail: '用户资料服务暂时不可用。', errorCode: 'PROFILE_SERVICE_UNAVAILABLE' },
      { status: upstream?.status ?? 503 },
    );
  }
  return NextResponse.json((await upstream.json()) as SessionUser);
}
