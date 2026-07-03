import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Page from './page';

describe('Page', () => {
  it('renders an empty KernelOn shell mount', async () => {
    render(await Page({}));

    expect(screen.getByTestId('kernelon-shell')).toBeInTheDocument();
    expect(screen.queryByText('Core Services')).not.toBeInTheDocument();
  });

  it('opens an app window from a workspace URL intent', async () => {
    render(
      await Page({
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
