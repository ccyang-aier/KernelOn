import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { apiUrl, clearSessionCookies, refreshCookieName } from '../../../../server/auth/session';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(refreshCookieName)?.value;
  if (refreshToken) {
    await fetch(apiUrl('/api/v1/auth/logout'), {
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
