import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WorkspaceShellPage } from '../features/workspace/WorkspaceShellPage';

vi.mock('../server/auth/session', () => ({
  requireSession: vi.fn().mockResolvedValue({
    avatarUrl: null,
    displayName: '测试用户',
  }),
}));

describe('Page', () => {
  it('renders an empty KernelOn shell mount', async () => {
    render(await WorkspaceShellPage({}));

    expect(screen.getByTestId('kernelon-shell')).toBeInTheDocument();
    expect(screen.queryByText('Core Services')).not.toBeInTheDocument();
  });

  it('opens an app window from a workspace URL intent', async () => {
    render(
      await WorkspaceShellPage({
        searchParams: Promise.resolve({
          id: 'newcomer-123',
          open: 'mentor',
          tab: 'pending',
          view: 'match',
        }),
      }),
    );

    expect(await screen.findByTestId('kernelon-app-container-entry:mentor')).toHaveAttribute(
      'data-window-status',
      'active',
    );
  });
});
