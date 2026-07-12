'use client';

import { ShellCredentialScreen, kernelOnDesktopWallpaper } from '@kernelon/shell';
import { RegularLiquidGlass } from '@kernelon/ui/liquidglass';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function LoginScreen({ nextPath }: Readonly<{ nextPath: string }>) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <form className="mx-auto w-full max-w-[320px] -translate-y-[4vh]" onSubmit={handleSubmit}>
        <img
          alt="未登录用户"
          className="mx-auto h-[62px] w-[62px] rounded-full border border-white/35 object-cover shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
          src="/kernelon-assets/avatars/login-placeholder.png"
        />
        <strong className="mt-3 block text-[16px] font-semibold tracking-[-0.01em] drop-shadow-md">
          登录 KernelOn
        </strong>
        <p className="mt-1.5 text-[11px] text-white/75 drop-shadow-md">
          使用组织账号进入你的工作台
        </p>

        <div className="mt-5 grid gap-3">
          <RegularLiquidGlass
            backdropImageSelector="[data-credential-wallpaper]"
            className="h-10 w-full rounded-[14px]"
            radius={14}
          >
            <label className="flex h-full w-full items-center px-3">
              <svg
                aria-hidden="true"
                className="mr-2.5 h-4 w-4 shrink-0 text-white/70"
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
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[12px] text-white outline-none placeholder:text-[10.5px] placeholder:text-white/55"
                inputMode="email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="Email address"
                required
                type="email"
                value={email}
              />
            </label>
          </RegularLiquidGlass>
          <RegularLiquidGlass
            backdropImageSelector="[data-credential-wallpaper]"
            className="h-10 w-full rounded-[14px]"
            radius={14}
          >
            <label className="flex h-full w-full items-center px-3">
              <svg
                aria-hidden="true"
                className="mr-2.5 h-4 w-4 shrink-0 text-white/70"
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
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[12px] text-white outline-none placeholder:text-[10.5px] placeholder:text-white/55"
                onChange={(event) => setPassword(event.currentTarget.value)}
                placeholder="Password"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-white/55 outline-none transition-colors hover:text-white/85"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  {showPassword ? (
                    <>
                      <path
                        d="M3 3l18 18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.8 5.3A10.8 10.8 0 0 1 12 5c4.8 0 8 4.2 9 7a11.7 11.7 0 0 1-2.2 3.6M6.6 6.6A12.2 12.2 0 0 0 3 12c1 2.8 4.2 7 9 7a10 10 0 0 0 4-.8"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                      />
                    </>
                  ) : (
                    <>
                      <path
                        d="M3 12c1-2.8 4.2-7 9-7s8 4.2 9 7c-1 2.8-4.2 7-9 7s-8-4.2-9-7Z"
                        stroke="currentColor"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                      />
                      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                    </>
                  )}
                </svg>
              </button>
            </label>
          </RegularLiquidGlass>
          <RegularLiquidGlass
            backdropImageSelector="[data-credential-wallpaper]"
            className="mt-1 h-10 w-full rounded-[14px]"
            interactive
            radius={14}
          >
            <button
              aria-label="登录"
              className="flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-0 bg-transparent text-[12px] font-semibold text-white outline-none disabled:cursor-wait disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              <span>{submitting ? '正在登录…' : '登录'}</span>
              {!submitting && (
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 12h13m-5-5 5 5-5 5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                  />
                </svg>
              )}
            </button>
          </RegularLiquidGlass>
        </div>
        <p className="mt-2.5 min-h-4 text-[11px] text-white drop-shadow-md" role="alert">
          {error}
        </p>
      </form>
    </ShellCredentialScreen>
  );
}
