import { NextResponse } from 'next/server';

import {
  apiUrl,
  fetchSessionUser,
  readProblem,
  setSessionCookies,
  type TokenPair,
} from '../../../../server/auth/session';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    password?: unknown;
  } | null;
  if (typeof body?.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json(
      { detail: '请输入邮箱和密码。', errorCode: 'INVALID_LOGIN_INPUT' },
      { status: 400 },
    );
  }

  const upstream = await fetch(apiUrl('/api/v1/auth/login'), {
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': request.headers.get('User-Agent') ?? 'KernelOn Web BFF',
    },
    method: 'POST',
  }).catch(() => null);
  if (!upstream) {
    return NextResponse.json(
      { detail: '无法连接认证服务。', errorCode: 'AUTH_SERVICE_UNAVAILABLE' },
      { status: 503 },
    );
  }
  if (!upstream.ok) {
    return NextResponse.json(await readProblem(upstream), { status: upstream.status });
  }

  const tokens = (await upstream.json()) as TokenPair;
  const user = await fetchSessionUser(tokens.accessToken);
  if (!user) {
    return NextResponse.json(
      { detail: '登录会话未能建立。', errorCode: 'SESSION_ESTABLISHMENT_FAILED' },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ user });
  setSessionCookies(response, tokens);
  return response;
}
