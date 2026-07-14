// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@kernelon/shell', () => ({
  AppFrame: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../src/apps/music/MineradioApp', () => ({
  MineradioApp: () => <div data-testid="ported-mineradio-app" />,
}));

import MusicWindow from '../src/apps/music/MusicWindow';

describe('Mineradio window adapter', () => {
  it('mounts the owned Mineradio runtime without an iframe boundary', () => {
    render(<MusicWindow app={{} as never} window={{} as never} />);

    expect(screen.getByTestId('ported-mineradio-app')).not.toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
  });
});
