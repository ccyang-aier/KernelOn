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
          className="mx-auto h-[68px] w-[68px] rounded-full border border-white/60 object-cover shadow-[0_12px_32px_rgba(0,0,0,0.2)] ring-4 ring-white/10"
          src="/kernelon-assets/avatars/login-placeholder.png"
        />
        <strong className="mt-3 block text-[16px] font-semibold tracking-[-0.01em] drop-shadow-md">
          登录 KernelOn
        </strong>
        <p className="mt-1.5 text-[11px] text-white/75 drop-shadow-md">
          使用组织账号进入你的工作台
        </p>

        <div className="mt-5 grid gap-3">
          <input
            aria-label="邮箱"
            autoComplete="email"
            autoFocus
            className="h-11 w-full rounded-[15px] border border-white/30 bg-white/14 px-4 text-[13px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(0,0,0,0.1)] outline-none backdrop-blur-[16px] transition placeholder:text-white/55 hover:bg-white/18 focus:border-white/65 focus:bg-white/20 focus:ring-2 focus:ring-white/15"
            inputMode="email"
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="邮箱"
            required
            type="email"
            value={email}
          />
          <input
            aria-label="密码"
            autoComplete="current-password"
            className="h-11 w-full rounded-[15px] border border-white/30 bg-white/14 px-4 text-[13px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(0,0,0,0.1)] outline-none backdrop-blur-[16px] transition placeholder:text-white/55 hover:bg-white/18 focus:border-white/65 focus:bg-white/20 focus:ring-2 focus:ring-white/15"
            onChange={(event) => setPassword(event.currentTarget.value)}
            placeholder="密码"
            required
            type="password"
            value={password}
          />
          <button
            aria-label="登录"
            className="mt-1 h-11 w-full rounded-[15px] border border-white/60 bg-white/90 text-[13px] font-semibold text-slate-800 shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 disabled:cursor-wait disabled:opacity-60"
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
