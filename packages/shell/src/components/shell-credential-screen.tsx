'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

export function ShellCredentialScreen({
  ariaLabel,
  children,
  wallpaper,
}: Readonly<{ ariaLabel: string; children: ReactNode; wallpaper: string }>) {
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

  return (
    <section
      aria-label={ariaLabel}
      className="fixed inset-0 z-[10000] overflow-hidden bg-[#5f8789] text-white"
      data-testid="kernelon-credential-screen"
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
          <time className="mt-[-4px] block text-[clamp(88px,12vw,154px)] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums]">
            {time}
          </time>
        </div>
        <div className="mt-auto w-full max-w-[360px]">{children}</div>
      </div>
    </section>
  );
}
