'use client';

import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

const lockScreenStorageKey = 'kernelon_wallpaper_lock_screen';

export function LockScreenSetup({
  isOpen,
  onApplyLock,
  wallpaper,
}: Readonly<{
  isOpen: boolean;
  onApplyLock(password: string): void;
  wallpaper: string;
}>) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(now),
    [now],
  );

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now),
    [now],
  );

  const enableLockScreen = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (password.trim().length < 4) {
        setError('请输入至少 4 位密码');
        return;
      }

      localStorage.setItem(
        lockScreenStorageKey,
        JSON.stringify({ enabled: true, password, version: 1 }),
      );
      onApplyLock(password);
      setPassword('');
      setError('');
    },
    [onApplyLock, password],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-label="锁屏设置"
      aria-modal="true"
      className="wallpaper-lock-screen"
      data-lock-screen-mode="setup"
      role="dialog"
    >
      <img alt="当前桌面壁纸" className="wallpaper-lock-screen__background" src={wallpaper} />
      <div aria-hidden="true" className="wallpaper-lock-screen__shade" />

      <div className="wallpaper-lock-screen__clock" aria-hidden="true">
        <span>{formattedDate}</span>
        <strong>{formattedTime}</strong>
        <small>KernelOn · 桌面已就绪</small>
      </div>

      <form className="wallpaper-lock-setup" onSubmit={enableLockScreen}>
        <img
          alt="当前用户头像"
          className="wallpaper-lock-setup__avatar"
          src="/kernelon-assets/avatars/current-user.png"
        />
        <div className="wallpaper-lock-setup__heading">
          <span>设置锁屏密码</span>
          <p>离开时保护你的 KernelOn 工作台</p>
        </div>

        <label className="wallpaper-lock-field">
          <span>锁屏密码</span>
          <div>
            <input
              autoFocus
              autoComplete="new-password"
              onChange={(event) => {
                setPassword(event.currentTarget.value);
                setError('');
              }}
              placeholder="至少 4 位密码"
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </label>

        <div className="wallpaper-lock-setup__hint">
          <ShieldCheck aria-hidden="true" />
          <span>密码仅保存在此浏览器中，不会上传或同步。</span>
        </div>
        {error ? (
          <p className="wallpaper-lock-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="wallpaper-lock-setup__actions">
          <button className="wallpaper-lock-button wallpaper-lock-button--primary" type="submit">
            <LockKeyhole aria-hidden="true" />
            应用锁屏
          </button>
        </div>
      </form>
    </div>
  );
}
