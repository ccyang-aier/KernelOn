import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Page from './page';

describe('Page', () => {
  it('renders an empty KernelOn shell mount', () => {
    render(<Page />);

    expect(screen.getByTestId('kernelon-shell')).toBeInTheDocument();
    expect(screen.queryByText('新员工运作工作台')).not.toBeInTheDocument();
    expect(screen.queryByText('Core Services')).not.toBeInTheDocument();
  });
});
