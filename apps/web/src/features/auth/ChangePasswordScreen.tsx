'use client';

import { ShellCredentialScreen, kernelOnDesktopWallpaper } from '@kernelon/shell';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 10) {
      setError('新密码至少需要 10 位');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        body: JSON.stringify({ currentPassword, newPassword }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = (await response.json()) as { detail?: string };
      if (!response.ok) {
        setError(body.detail ?? '密码修改失败');
        return;
      }
      router.replace('/login?reason=password-changed');
      router.refresh();
    } catch {
      setError('认证服务暂时不可用');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellCredentialScreen ariaLabel="KernelOn 首次改密" wallpaper={kernelOnDesktopWallpaper}>
      <form className="mx-auto w-full max-w-[340px]" onSubmit={submit}>
        <strong className="block text-[14px] font-semibold drop-shadow-md">设置你的正式密码</strong>
        <p className="mt-1 text-[10px] text-white/70">首次登录需要更换临时密码</p>
        <div className="mt-3 overflow-hidden rounded-[20px] border border-white/35 bg-white/15 backdrop-blur-[14px]">
          <input
            aria-label="当前密码"
            autoComplete="current-password"
            className="h-10 w-full border-0 border-b border-white/20 bg-transparent px-4 text-[12px] text-white outline-none placeholder:text-white/55"
            onChange={(event) => setCurrentPassword(event.currentTarget.value)}
            placeholder="当前临时密码"
            required
            type="password"
            value={currentPassword}
          />
          <input
            aria-label="新密码"
            autoComplete="new-password"
            className="h-10 w-full border-0 bg-transparent px-4 text-[12px] text-white outline-none placeholder:text-white/55"
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            placeholder="至少 10 位新密码"
            required
            type="password"
            value={newPassword}
          />
        </div>
        <button
          className="mt-3 h-9 rounded-full border border-white/35 bg-white/20 px-5 text-[12px] font-semibold text-white backdrop-blur-md hover:bg-white/30 disabled:opacity-50"
          disabled={submitting}
          type="submit"
        >
          {submitting ? '正在保存…' : '更新密码'}
        </button>
        <p className="mt-2 min-h-4 text-[10px] text-white" role="alert">
          {error}
        </p>
      </form>
    </ShellCredentialScreen>
  );
}
