import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  accessCookieName,
  apiUrl,
  clearSessionCookies,
  readProblem,
} from '../../../../server/auth/session';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessCookieName)?.value;
  const body = (await request.json().catch(() => null)) as {
    currentPassword?: unknown;
    newPassword?: unknown;
  } | null;
  if (
    !accessToken ||
    typeof body?.currentPassword !== 'string' ||
    typeof body.newPassword !== 'string'
  ) {
    return NextResponse.json(
      { detail: '登录会话或密码输入无效。', errorCode: 'INVALID_PASSWORD_CHANGE_INPUT' },
      { status: 400 },
    );
  }
  const upstream = await fetch(apiUrl('/api/v1/auth/change-password'), {
    body: JSON.stringify(body),
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).catch(() => null);
  if (!upstream?.ok) {
    return NextResponse.json(
      upstream ? await readProblem(upstream) : { detail: '认证服务暂时不可用。' },
      { status: upstream?.status ?? 503 },
    );
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
