'use client';

import { Check, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

const lockScreenStorageKey = 'kernelon_wallpaper_lock_screen';

type LockScreenConfig = Readonly<{
  enabled: boolean;
  password: string;
}>;

export function LockScreenSetup({
  isOpen,
  onClose,
  wallpaper,
}: Readonly<{
  isOpen: boolean;
  onClose(): void;
  wallpaper: string;
}>) {
  const [config, setConfig] = useState<LockScreenConfig>(() => readLockScreenConfig());
  const [mode, setMode] = useState<'setup' | 'locked'>(() =>
    readLockScreenConfig().enabled ? 'locked' : 'setup',
  );
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
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

  const saveConfig = useCallback((nextConfig: LockScreenConfig) => {
    localStorage.setItem(lockScreenStorageKey, JSON.stringify(nextConfig));
    setConfig(nextConfig);
  }, []);

  const handleClose = useCallback(() => {
    setPassword('');
    setConfirmation('');
    setError('');
    onClose();
  }, [onClose]);

  const enableLockScreen = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (password.length < 4) {
        setError('请设置至少 4 位锁屏密码。');
        return;
      }

      if (password !== confirmation) {
        setError('两次输入的密码不一致，请重新确认。');
        return;
      }

      saveConfig({ enabled: true, password });
      setMode('locked');
      setPassword('');
      setConfirmation('');
      setError('');
    },
    [confirmation, password, saveConfig],
  );

  const unlock = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (password !== config.password) {
        setError('密码不正确，请重试。');
        return;
      }

      setPassword('');
      setError('');
      onClose();
    },
    [config.password, onClose, password],
  );

  const resetLockScreen = useCallback(() => {
    saveConfig({ enabled: false, password: '' });
    setMode('setup');
    setPassword('');
    setConfirmation('');
    setError('');
  }, [saveConfig]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-label="锁屏设置"
      aria-modal="true"
      className="wallpaper-lock-screen"
      data-lock-screen-mode={mode}
      role="dialog"
    >
      <img alt="当前桌面壁纸" className="wallpaper-lock-screen__background" src={wallpaper} />
      <div aria-hidden="true" className="wallpaper-lock-screen__shade" />

      <button
        aria-label="关闭锁屏设置"
        className="wallpaper-lock-screen__close"
        onClick={handleClose}
        type="button"
      >
        <X />
      </button>

      <div className="wallpaper-lock-screen__clock" aria-hidden="true">
        <span>{formattedDate}</span>
        <strong>{formattedTime}</strong>
        <small>KernelOn · 桌面已就绪</small>
      </div>

      {mode === 'setup' ? (
        <form className="wallpaper-lock-setup" onSubmit={enableLockScreen}>
          <div className="wallpaper-lock-setup__icon">
            <KeyRound aria-hidden="true" />
          </div>
          <div className="wallpaper-lock-setup__heading">
            <span>设置锁屏</span>
            <h2>让你的桌面保持私密</h2>
            <p>锁屏会使用当前桌面壁纸，并在离开时保护你的 KernelOn 工作台。</p>
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

          <label className="wallpaper-lock-field">
            <span>确认密码</span>
            <div>
              <input
                autoComplete="new-password"
                onChange={(event) => {
                  setConfirmation(event.currentTarget.value);
                  setError('');
                }}
                placeholder="再次输入密码"
                type={showPassword ? 'text' : 'password'}
                value={confirmation}
              />
              {confirmation && confirmation === password ? <Check aria-hidden="true" /> : null}
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
            <button
              className="wallpaper-lock-button wallpaper-lock-button--secondary"
              onClick={handleClose}
              type="button"
            >
              稍后设置
            </button>
            <button className="wallpaper-lock-button wallpaper-lock-button--primary" type="submit">
              <LockKeyhole aria-hidden="true" />
              启用并立即锁屏
            </button>
          </div>
        </form>
      ) : (
        <form className="wallpaper-lock-unlock" onSubmit={unlock}>
          <div className="wallpaper-lock-unlock__avatar">KO</div>
          <strong>KernelOn 用户</strong>
          <span>输入密码以返回桌面</span>
          <div className="wallpaper-lock-unlock__field">
            <LockKeyhole aria-hidden="true" />
            <input
              autoFocus
              autoComplete="current-password"
              onChange={(event) => {
                setPassword(event.currentTarget.value);
                setError('');
              }}
              placeholder="输入锁屏密码"
              type="password"
              value={password}
            />
            <button aria-label="解锁" type="submit">
              →
            </button>
          </div>
          {error ? (
            <p className="wallpaper-lock-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="wallpaper-lock-unlock__actions">
            <button onClick={resetLockScreen} type="button">
              重新设置密码
            </button>
            <span aria-hidden="true" />
            <button onClick={handleClose} type="button">
              返回壁纸应用
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function readLockScreenConfig(): LockScreenConfig {
  if (typeof window === 'undefined') {
    return { enabled: false, password: '' };
  }

  try {
    const saved = localStorage.getItem(lockScreenStorageKey);
    return saved ? (JSON.parse(saved) as LockScreenConfig) : { enabled: false, password: '' };
  } catch {
    return { enabled: false, password: '' };
  }
}
