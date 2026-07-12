import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginScreen } from './LoginScreen';

const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, replace }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits credentials through the Web BFF and enters the workspace', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ user: { displayName: 'Alice' } }), { status: 200 }),
    );
    render(<LoginScreen nextPath="/workspace" />);

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'Secret-password-123' } });
    fireEvent.click(screen.getByLabelText('登录'));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/workspace'));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('keeps the user on the login screen when credentials are rejected', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: '邮箱或密码不正确' }), { status: 401 }),
    );
    render(<LoginScreen nextPath="/workspace" />);

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByLabelText('登录'));

    expect(await screen.findByText('邮箱或密码不正确')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('toggles password visibility without submitting the form', () => {
    render(<LoginScreen nextPath="/workspace" />);

    const password = screen.getByLabelText('密码');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: '显示密码' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: '隐藏密码' })).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('starts the liquid-glass pulse when the login button is hovered', async () => {
    render(<LoginScreen nextPath="/workspace" />);

    const button = screen.getByRole('button', { name: '登录' });
    const glass = button.closest('[data-interactive-liquid-glass="true"]');
    const surface = glass?.querySelector<HTMLElement>('[data-config]');
    expect(glass).not.toBeNull();
    expect(surface).not.toBeNull();
    const regularConfig = surface?.dataset.config;

    fireEvent(glass as Element, new Event('pointerenter'));
    await waitFor(() => expect(surface?.dataset.config).not.toBe(regularConfig));
    fireEvent(glass as Element, new Event('pointerleave'));
  });
});
