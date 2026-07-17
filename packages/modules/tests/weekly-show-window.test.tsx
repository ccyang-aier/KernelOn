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
    className,
    headerSlots,
  }: {
    children: ReactNode;
    className?: string;
    headerSlots?: Record<string, ReactNode>;
  }) => (
    <div className={className} data-testid="weekly-show-app-frame">
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
    expect(screen.getByTestId('weekly-show-app-frame').className).toContain(
      '[&_[data-kernelon-app-header=true]]:![backdrop-filter:none]',
    );
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
    expect(screen.getByTestId('weekly-show-window')).toHaveAttribute(
      'data-sidebar-state',
      'expanded',
    );
    expect(screen.getByTestId('weekly-show-leading-controls')).toHaveClass('left-[312px]');
    expect(screen.getByRole('button', { name: '收起 Weekly Show 侧栏' }).className).not.toContain(
      'shadow-[0_6px_15px',
    );
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
    expect(screen.getAllByText('5.26 - 6.1')).toHaveLength(2);

    const whaleCard = screen.getByRole('heading', { name: '鲸落之境' }).closest('article');
    expect(whaleCard).not.toBeNull();
    fireEvent.click(within(whaleCard!).getByRole('button', { name: '送咖啡 鲸落之境' }));
    fireEvent.click(within(whaleCard!).getByRole('button', { name: '送鲜花 鲸落之境' }));
    fireEvent.click(within(whaleCard!).getByRole('button', { name: '点赞 鲸落之境' }));
    expect(within(whaleCard!).getByText('送咖啡 129')).toBeInTheDocument();
    expect(within(whaleCard!).getByText('送鲜花 87')).toBeInTheDocument();
    expect(within(whaleCard!).getByText('点赞 987')).toBeInTheDocument();
  });

  it('collapses the sidebar and navigates backward and forward between real views', () => {
    render(<WeeklyShowWindow {...({} as AppWindowSurfaceProps)} />);

    const toggle = screen.getByRole('button', { name: '收起 Weekly Show 侧栏' });
    fireEvent.click(toggle);

    expect(toggle).toHaveAccessibleName('展开 Weekly Show 侧栏');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('weekly-show-window')).toHaveAttribute(
      'data-sidebar-state',
      'collapsed',
    );
    expect(screen.getByTestId('weekly-show-window')).toHaveClass('grid-cols-[96px_minmax(0,1fr)]');
    expect(screen.getByTestId('weekly-show-leading-controls')).toHaveClass('left-[122px]');

    fireEvent.click(screen.getByRole('button', { name: '我的投稿' }));
    expect(screen.getByTestId('weekly-show-submissions')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-show-title-control')).toHaveTextContent('我的投稿');

    const backButton = screen.getByRole('button', { name: '后退' });
    const forwardButton = screen.getByRole('button', { name: '前进' });
    expect(backButton).toBeEnabled();
    expect(forwardButton).toBeDisabled();

    fireEvent.click(backButton);
    expect(screen.getByTestId('weekly-show-stage')).toBeInTheDocument();
    expect(forwardButton).toBeEnabled();

    fireEvent.click(forwardButton);
    expect(screen.getByTestId('weekly-show-submissions')).toBeInTheDocument();
  });

  it('sorts entries, focuses search from the shortcut and exposes header menus', () => {
    render(<WeeklyShowWindow {...({} as AppWindowSurfaceProps)} />);

    fireEvent.click(screen.getByRole('button', { name: /排序：互动得分/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: '最新投稿' }));
    const firstCard = screen.getByTestId('weekly-show-grid').querySelector('article');
    expect(firstCard).not.toBeNull();
    expect(within(firstCard!).getByRole('heading', { name: '晨露微光' })).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('搜索作品、作者或内容');
    fireEvent.keyDown(document.body, { ctrlKey: true, key: 'k' });
    expect(searchInput).toHaveFocus();

    const notifications = screen.getByRole('button', { name: '通知' });
    fireEvent.click(notifications);
    expect(notifications).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('menuitem', { name: '全部标为已读' }));

    fireEvent.click(screen.getByRole('button', { name: '用户菜单' }));
    expect(notifications).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('menuitem', { name: '偏好设置' }));
    expect(screen.getByTestId('weekly-show-settings')).toBeInTheDocument();

    const digestToggle = screen.getByRole('switch', { name: '每周精选摘要' });
    expect(digestToggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(digestToggle);
    expect(digestToggle).toHaveAttribute('aria-checked', 'false');
  });
});
