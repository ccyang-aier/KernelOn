import { redirect } from 'next/navigation';

import { ChangePasswordScreen } from '../../features/auth/ChangePasswordScreen';
import { requireSession } from '../../server/auth/session';

export default async function ChangePasswordPage() {
  const user = await requireSession('/change-password');
  if (!user.mustChangePassword) {
    redirect('/workspace');
  }
  return <ChangePasswordScreen />;
}
