'use client';

import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { ShellCredentialScreen } from './shell-credential-screen';

const currentUserAvatar = '/kernelon-assets/avatars/current-user.png';

export interface ShellCredentialUser {
  avatarUrl?: string | null;
  displayName: string;
}

export function ShellLockScreen({
  onUnlock,
  wallpaper,
  user,
}: Readonly<{
  onUnlock(password: string): boolean;
  wallpaper: string;
  user?: ShellCredentialUser;
}>) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onUnlock(password)) {
      setError('密码不正确');
      return;
    }

    setPassword('');
    setError('');
  };

  return (
    <div aria-modal="true" data-testid="kernelon-lock-screen" role="dialog">
      <ShellCredentialScreen ariaLabel="KernelOn 锁屏" wallpaper={wallpaper}>
        <form className="mx-auto w-full max-w-[330px]" onSubmit={handleSubmit}>
          <img
            alt="当前用户头像"
            className="mx-auto h-[62px] w-[62px] rounded-full border-2 border-white/70 object-cover shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            src={user?.avatarUrl || currentUserAvatar}
          />
          <strong className="mt-2.5 block text-[13px] font-semibold drop-shadow-md">
            {user?.displayName || 'KernelOn 用户'}
          </strong>
          <p className="mt-1 text-[10px] text-white/70 drop-shadow-md">输入密码以解锁工作台</p>

          <div className="mt-3 flex h-10 items-center rounded-full border border-white/35 bg-white/15 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-[14px] transition-colors focus-within:border-white/60">
            <LockKeyhole aria-hidden="true" className="mr-2 h-3.5 w-3.5 text-white/70" />
            <input
              aria-label="锁屏密码"
              autoComplete="current-password"
              autoFocus
              className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-white outline-none placeholder:text-white/55"
              onChange={(event) => {
                setPassword(event.currentTarget.value);
                setError('');
              }}
              placeholder="输入锁屏密码"
              type="password"
              value={password}
            />
            <button
              aria-label="解锁"
              className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-white/15 text-white transition-colors hover:bg-white/25"
              type="submit"
            >
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 min-h-4 text-[10px] text-white drop-shadow-md" role="alert">
            {error}
          </p>
        </form>
      </ShellCredentialScreen>
    </div>
  );
}
