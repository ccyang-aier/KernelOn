import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Page from './page';

describe('Page', () => {
  it('renders the KernelOn shell skeleton', () => {
    render(<Page />);

    expect(screen.getByRole('heading', { name: 'KernelOn' })).toBeInTheDocument();
    expect(screen.getByText('Desktop Shell')).toBeInTheDocument();
    expect(screen.getByText('新员工运作')).toBeInTheDocument();
  });
});
