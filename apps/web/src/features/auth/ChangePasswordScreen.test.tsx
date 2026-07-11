import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChangePasswordScreen } from './ChangePasswordScreen';

const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, replace }),
}));

describe('ChangePasswordScreen', () => {
  beforeEach(() => vi.clearAllMocks());

  it('changes the temporary password through the BFF and returns to login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    render(<ChangePasswordScreen />);

    fireEvent.change(screen.getByLabelText('当前密码'), {
      target: { value: 'Temporary-123' },
    });
    fireEvent.change(screen.getByLabelText('新密码'), {
      target: { value: 'Permanent-Password-456' },
    });
    fireEvent.click(screen.getByRole('button', { name: '更新密码' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?reason=password-changed'));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/auth/change-password',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
