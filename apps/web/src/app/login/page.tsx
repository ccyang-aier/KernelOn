import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LoginScreen } from '../../features/auth/LoginScreen';
import { accessCookieName, fetchSessionUser, refreshCookieName } from '../../server/auth/session';

export default async function LoginPage({
  searchParams,
}: Readonly<{ searchParams?: Promise<{ next?: string }> }>) {
  const params = (await searchParams) ?? {};
  const requestedNext = params.next ?? '/workspace';
  const nextPath =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/workspace';
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessCookieName)?.value;
  const refreshToken = cookieStore.get(refreshCookieName)?.value;

  if (accessToken && (await fetchSessionUser(accessToken))) {
    redirect(nextPath);
  }
  if (refreshToken) {
    redirect(`/api/auth/refresh?next=${encodeURIComponent(nextPath)}`);
  }

  return <LoginScreen nextPath={nextPath} />;
}
