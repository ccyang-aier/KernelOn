'use client';

import { ShellCredentialScreen, kernelOnDesktopWallpaper } from '@kernelon/shell';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function LoginScreen({ nextPath }: Readonly<{ nextPath: string }>) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = (await response.json()) as {
        detail?: string;
        user?: { mustChangePassword?: boolean };
      };
      if (!response.ok) {
        setError(body.detail ?? '邮箱或密码不正确');
        return;
      }
      router.replace(body.user?.mustChangePassword ? '/change-password' : nextPath);
      router.refresh();
    } catch {
      setError('登录服务暂时不可用，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellCredentialScreen ariaLabel="KernelOn 登录" wallpaper={kernelOnDesktopWallpaper}>
      <form className="mx-auto w-full max-w-[360px]" onSubmit={handleSubmit}>
        <img
          alt="未登录用户"
          className="mx-auto h-[68px] w-[68px] rounded-full border border-white/45 object-cover shadow-[0_10px_28px_rgba(7,30,35,0.12)]"
          src="/kernelon-assets/avatars/login-placeholder.png"
        />
        <strong className="mt-3 block text-[16px] font-semibold tracking-[-0.01em] drop-shadow-md">
          登录 KernelOn
        </strong>
        <p className="mt-1.5 text-[11px] text-white/75 drop-shadow-md">
          使用组织账号进入你的工作台
        </p>

        <div className="mt-5 grid gap-3">
          <label className="flex h-11 items-center rounded-[15px] border border-white/30 bg-white/12 px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-[20px] transition-colors hover:bg-white/16 focus-within:border-white/50 focus-within:bg-white/16">
            <svg
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="m3.5 6.5 7.2 5.4a2.15 2.15 0 0 0 2.6 0l7.2-5.4M5.5 19h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
              />
            </svg>
            <input
              aria-label="邮箱"
              autoComplete="email"
              autoFocus
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-white outline-none placeholder:text-white/55"
              inputMode="email"
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="邮箱"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="flex h-11 items-center rounded-[15px] border border-white/30 bg-white/12 px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-[20px] transition-colors hover:bg-white/16 focus-within:border-white/50 focus-within:bg-white/16">
            <svg
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M7 10V8a5 5 0 0 1 10 0v2m-10 0h10a2 2 0 0 1 2 2v7H5v-7a2 2 0 0 1 2-2Zm5 3.5v2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
              />
            </svg>
            <input
              aria-label="密码"
              autoComplete="current-password"
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-white outline-none placeholder:text-white/55"
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="密码"
              required
              type="password"
              value={password}
            />
          </label>
          <button
            aria-label="登录"
            className="mt-1 h-11 w-full rounded-[15px] border border-white/40 bg-white/22 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_26px_rgba(0,0,0,0.1)] backdrop-blur-[20px] transition-colors hover:bg-white/30 active:bg-white/20 disabled:cursor-wait disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? '正在登录…' : '登录'}
          </button>
        </div>
        <p className="mt-2.5 min-h-4 text-[11px] text-white drop-shadow-md" role="alert">
          {error}
        </p>
      </form>
    </ShellCredentialScreen>
  );
}
