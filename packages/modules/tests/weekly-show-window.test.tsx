// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppWindowSurfaceProps } from '@kernelon/shell';

import WeeklyShowWindow from '../src/apps/weekly-show/WeeklyShowWindow';

vi.mock('@kernelon/shell', () => ({
  AppFrame: ({
    children,
    headerSlots,
  }: {
    children: ReactNode;
    headerSlots?: Record<string, ReactNode>;
  }) => (
    <div data-testid="weekly-show-app-frame">
      {Object.entries(headerSlots ?? {}).map(([id, slot]) => (
        <div data-testid={`header-slot-${id}`} key={id}>
          {slot}
        </div>
      ))}
      {children}
    </div>
  ),
}));

afterEach(cleanup);

describe('WeeklyShowWindow', () => {
  it('renders the reference stage layout inside an app-owned frame', () => {
    render(<WeeklyShowWindow {...({} as AppWindowSurfaceProps)} />);

    expect(screen.getByTestId('weekly-show-app-frame')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-show-sidebar')).toHaveAttribute(
      'data-surface',
      'frosted-sidebar',
    );
    expect(screen.getByTestId('weekly-show-content-panel')).toHaveAttribute(
      'data-surface',
      'stacked-content-panel',
    );
    expect(screen.getByTestId('weekly-show-sidebar')).not.toHaveClass('backdrop-blur-[30px]');
    expect(screen.queryByTestId('weekly-show-sidebar-divider')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Weekly Show 导航' })).toHaveClass('mr-6');
    expect(screen.getByTestId('weekly-show-content-panel')).toHaveClass(
      'z-20',
      'ml-[-24px]',
      'rounded-l-[28px]',
      'before:rounded-l-[28px]',
      'before:border-l',
      'before:border-[#a9c2d3]',
    );
    expect(screen.getByTestId('weekly-show-content-scroll').tagName).toBe('MAIN');
    expect(screen.getByTestId('weekly-show-content-panel').className).not.toContain(
      'shadow-[-8px_0_28px',
    );
    expect(screen.getByRole('button', { name: '本周舞台' })).toHaveClass('z-10');
    expect(screen.getByTestId('weekly-show-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-show-grid').querySelectorAll('article')).toHaveLength(6);
    expect(screen.getByRole('heading', { name: 'Weekly Show 第 21 期' })).toBeInTheDocument();
    expect(screen.getByText('当巨鲸穿过云海，人与自然在辽阔天际相遇。')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索作品、作者或内容')).toBeInTheDocument();
  });

  it('filters entries, changes week and records a reaction', () => {
    render(<WeeklyShowWindow {...({} as AppWindowSurfaceProps)} />);

    fireEvent.click(screen.getByRole('button', { name: '文化生活' }));
    expect(screen.getByRole('button', { name: '文化生活' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('heading', { name: '鲸落之境' })).not.toBeInTheDocument();
    expect(screen.getByTestId('weekly-show-grid').querySelectorAll('article')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: '全部' }));
    fireEvent.click(screen.getByRole('button', { name: '下一周' }));
    expect(screen.getByRole('heading', { name: 'Weekly Show 第 22 期' })).toBeInTheDocument();

    const whaleCard = screen.getByRole('heading', { name: '鲸落之境' }).closest('article');
    expect(whaleCard).not.toBeNull();
    fireEvent.click(within(whaleCard!).getByRole('button', { name: '点赞 鲸落之境' }));
    expect(within(whaleCard!).getByText('点赞 987')).toBeInTheDocument();
  });
});
