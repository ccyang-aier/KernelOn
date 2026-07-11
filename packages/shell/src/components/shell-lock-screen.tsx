'use client';

import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

const currentUserAvatar = '/kernelon-assets/avatars/current-user.png';

export function ShellLockScreen({
  onUnlock,
  wallpaper,
}: Readonly<{
  onUnlock(password: string): boolean;
  wallpaper: string;
}>) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const date = useMemo(
    () =>
      new Intl.DateTimeFormat('zh-CN', {
        day: 'numeric',
        month: 'long',
        weekday: 'long',
      }).format(now),
    [now],
  );
  const time = useMemo(
    () =>
      new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
      }).format(now),
    [now],
  );

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
    <section
      aria-label="KernelOn 锁屏"
      aria-modal="true"
      className="fixed inset-0 z-[10000] overflow-hidden bg-[#5f8789] text-white"
      data-testid="kernelon-lock-screen"
      role="dialog"
    >
      <img
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-[1.02] select-none object-cover"
        draggable={false}
        src={wallpaper}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,12,16,0.12),rgba(4,12,16,0.01)_48%,rgba(4,12,16,0.3))] backdrop-blur-[2px]" />

      <div className="relative flex h-full flex-col items-center px-6 pt-[7vh] pb-[5vh] text-center">
        <div className="drop-shadow-[0_3px_20px_rgba(0,0,0,0.28)]">
          <p className="m-0 text-[15px] font-semibold tracking-[0.01em]">{date}</p>
          <time className="mt-[-4px] block text-[clamp(88px,12vw,154px)] font-semibold leading-none tracking-[-0.07em]">
            {time}
          </time>
        </div>

        <form className="mt-auto w-full max-w-[330px]" onSubmit={handleSubmit}>
          <img
            alt="当前用户头像"
            className="mx-auto h-[62px] w-[62px] rounded-full border-2 border-white/70 object-cover shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            src={currentUserAvatar}
          />
          <strong className="mt-2.5 block text-[13px] font-semibold drop-shadow-md">
            KernelOn 用户
          </strong>
          <p className="mt-1 text-[10px] text-white/70 drop-shadow-md">输入密码以解锁工作台</p>

          <div className="mt-3 flex h-10 items-center rounded-full border border-white/35 bg-white/15 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-[14px] transition-colors focus-within:border-white/60">
            <LockKeyhole aria-hidden="true" className="mr-2 h-3.5 w-3.5 text-white/70" />
            <input
              aria-label="锁屏密码"
              autoFocus
              autoComplete="current-password"
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
      </div>
    </section>
  );
}
