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
      <form className="mx-auto w-full max-w-[340px]" onSubmit={handleSubmit}>
        <img
          alt="KernelOn"
          className="mx-auto h-[62px] w-[62px] rounded-full border-2 border-white/70 object-cover shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
          src="/kernelon-assets/avatars/current-user.png"
        />
        <strong className="mt-2.5 block text-[14px] font-semibold drop-shadow-md">
          登录 KernelOn
        </strong>
        <p className="mt-1 text-[10px] text-white/70 drop-shadow-md">使用组织账号进入你的工作台</p>

        <div className="mt-3 overflow-hidden rounded-[20px] border border-white/35 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-[14px] focus-within:border-white/60">
          <input
            aria-label="邮箱"
            autoComplete="email"
            autoFocus
            className="h-10 w-full border-0 border-b border-white/20 bg-transparent px-4 text-[12px] text-white outline-none placeholder:text-white/55"
            inputMode="email"
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="邮箱"
            required
            type="email"
            value={email}
          />
          <div className="flex h-10 items-center px-4">
            <input
              aria-label="密码"
              autoComplete="current-password"
              className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-white outline-none placeholder:text-white/55"
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder="密码"
              required
              type="password"
              value={password}
            />
            <button
              aria-label="登录"
              className="grid h-7 w-7 place-items-center rounded-full border border-white/25 bg-white/15 text-sm text-white transition-colors hover:bg-white/25 disabled:cursor-wait disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              →
            </button>
          </div>
        </div>
        <p className="mt-2 min-h-4 text-[10px] text-white drop-shadow-md" role="alert">
          {submitting ? '正在安全登录…' : error}
        </p>
      </form>
    </ShellCredentialScreen>
  );
}
