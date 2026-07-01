import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { KernelOnShell, type ShellInitialState, type ShellRuntimeRegistry } from '../src';

const initialState: ShellInitialState = {
  apps: [
    {
      id: 'onboarding',
      name: '新员工运作',
      description: '入职信息、阶段流程、状态跟踪、名册总览',
      priority: 'P0',
      category: 'operations',
      icon: 'UserRoundCheck',
      runtime: {
        window: {
          loaderKey: 'app:onboarding-window',
        },
      },
      defaultWindow: {
        title: '新员工运作',
        bounds: { x: 96, y: 72, width: 960, height: 640 },
      },
    },
  ],
  dockAppIds: [],
  widgets: [
    {
      id: 'onboarding-progress',
      name: '入职进度',
      description: '展示新员工入职阶段推进情况',
      defaultGrid: { x: 0, y: 0, width: 2, height: 2 },
      runtime: {
        widget: {
          loaderKey: 'widget:onboarding-progress',
        },
      },
    },
  ],
  screens: [
    {
      id: 'screen-home',
      name: '我的工作台',
      order: 0,
      items: [],
    },
  ],
};

function createRuntime(): ShellRuntimeRegistry {
  return {
    loadAppWindow: vi.fn(async () => ({
      default: function TestAppWindow() {
        return <div>Lazy onboarding window</div>;
      },
    })),
    loadWidget: vi.fn(async () => ({
      default: function TestWidget() {
        return <div>Lazy onboarding widget</div>;
      },
    })),
  };
}

describe('KernelOnShell', () => {
  it('renders an empty shell mount without placeholder page content', () => {
    const runtime = createRuntime();

    render(<KernelOnShell initialState={initialState} runtime={runtime} />);

    expect(screen.getByTestId('kernelon-shell')).toBeInTheDocument();
    expect(screen.queryByText('新员工运作工作台')).not.toBeInTheDocument();
    expect(screen.queryByText('Core Services')).not.toBeInTheDocument();
    expect(screen.queryByText('入职进度')).not.toBeInTheDocument();
    expect(runtime.loadAppWindow).not.toHaveBeenCalled();
    expect(runtime.loadWidget).not.toHaveBeenCalled();
  });

  it('renders the desktop status bar controls in the reference order', async () => {
    const runtime = createRuntime();
    const user = userEvent.setup();

    render(<KernelOnShell initialState={initialState} runtime={runtime} />);

    const statusBar = screen.getByTestId('kernelon-status-bar');
    const statusFrame = statusBar.firstElementChild;
    const statusBrand = screen.getByTestId('kernelon-status-brand');
    const statusControls = screen.getByTestId('kernelon-status-controls');
    const statusBrandLogo = screen.getByTestId('kernelon-status-brand-logo');

    expect(statusBar).toHaveClass('fixed', 'inset-x-0', 'top-[2px]');
    expect(statusBar.getAttribute('style')).toContain('38px');
    expect(statusFrame).toHaveClass('h-[38px]', 'w-full', 'justify-between', 'pl-[14px]');
    expect(statusBrand).toHaveClass('h-full', 'gap-[8px]');
    expect(statusBrand).toHaveTextContent('KernelOn');
    expect(statusControls).toHaveClass('h-[38px]', 'w-[320px]', 'pr-[10px]');
    expect(statusBrandLogo).toHaveAttribute('src', '/kernelon-assets/brand/kernelon-logo.png');
    expect(screen.queryByText('09:41')).not.toBeInTheDocument();
    expect(within(statusBar).queryByLabelText('System time 09:41')).not.toBeInTheDocument();
    expect(
      within(statusBar)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual([
      'Launchpad',
      'Sync status',
      'AI Spotlight',
      'Notifications',
      'Control Center',
      'KernelOn profile',
    ]);

    const launchpadButton = within(statusBar).getByRole('button', { name: 'Launchpad' });
    const syncButton = within(statusBar).getByRole('button', { name: 'Sync status' });
    const spotlightButton = within(statusBar).getByRole('button', { name: 'AI Spotlight' });
    const profileButton = within(statusBar).getByRole('button', { name: 'KernelOn profile' });
    const notificationDot = screen.getByTestId('kernelon-notification-dot');

    expect(launchpadButton).toHaveAttribute('aria-pressed', 'false');
    expect(syncButton).toHaveAttribute(
      'data-icon-variant',
      'material-symbols-light:cloud-done-outline-rounded',
    );
    expect(spotlightButton).toHaveAttribute('aria-pressed', 'false');
    expect(notificationDot).toHaveClass('top-[2px]', 'right-[-2px]', 'size-[7px]');
    expect(profileButton.querySelector('img')).toHaveAttribute(
      'src',
      '/kernelon-assets/status/avatar-manager.png',
    );

    await user.click(launchpadButton);
    await user.click(spotlightButton);

    expect(launchpadButton).toHaveAttribute('aria-pressed', 'true');
    expect(spotlightButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('lazy-loads a widget only when it is present in the desktop layout', async () => {
    const runtime = createRuntime();

    render(
      <KernelOnShell
        initialState={{
          ...initialState,
          screens: [
            {
              id: 'screen-home',
              name: '我的工作台',
              order: 0,
              items: [
                {
                  id: 'desktop-item:onboarding-progress',
                  kind: 'widget',
                  targetId: 'onboarding-progress',
                  screenId: 'screen-home',
                  grid: { x: 0, y: 0, width: 2, height: 2 },
                },
              ],
            },
          ],
        }}
        runtime={runtime}
      />,
    );

    expect(await screen.findByText('Lazy onboarding widget')).toBeInTheDocument();
    expect(runtime.loadWidget).toHaveBeenCalledWith('widget:onboarding-progress');
    expect(runtime.loadAppWindow).not.toHaveBeenCalled();
  });

  it('lazy-loads an app window only when a window exists in shell state', async () => {
    const runtime = createRuntime();

    render(
      <KernelOnShell
        initialState={{
          ...initialState,
          windows: [
            {
              id: 'window:onboarding',
              appId: 'onboarding',
              title: '新员工运作',
              bounds: { x: 96, y: 72, width: 960, height: 640 },
              zIndex: 1,
              status: 'active',
              createdAt: 1,
            },
          ],
        }}
        runtime={runtime}
      />,
    );

    expect(await screen.findByText('Lazy onboarding window')).toBeInTheDocument();
    expect(runtime.loadAppWindow).toHaveBeenCalledWith('app:onboarding-window');
    expect(runtime.loadWidget).not.toHaveBeenCalled();
  });

  it('opens a docked app from the Dock before lazy-loading its window', async () => {
    const runtime = createRuntime();
    const user = userEvent.setup();

    render(
      <KernelOnShell
        initialState={{
          ...initialState,
          dockAppIds: ['onboarding'],
        }}
        runtime={runtime}
      />,
    );

    expect(runtime.loadAppWindow).not.toHaveBeenCalled();

    const onboardingDockButton = screen.getByRole('button', { name: '新员工运作' });

    expect(onboardingDockButton).toHaveStyle('--dock-icon-asset-scale: 1.07');

    await user.click(onboardingDockButton);

    expect(await screen.findByText('Lazy onboarding window')).toBeInTheDocument();
    expect(runtime.loadAppWindow).toHaveBeenCalledWith('app:onboarding-window');
  });

  it('replaces the native desktop context menu with the KernelOn system menu', async () => {
    const runtime = createRuntime();
    const user = userEvent.setup();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1620 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 971 });

    render(<KernelOnShell initialState={initialState} runtime={runtime} />);

    const desktopSurface = screen.getByTestId('kernelon-desktop-surface');
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 338,
      clientY: 168,
    });

    expect(fireEvent(desktopSurface, contextMenuEvent)).toBe(false);
    expect(contextMenuEvent.defaultPrevented).toBe(true);

    const menu = screen.getByRole('menu', { name: 'KernelOn desktop context menu' });
    const submenu = screen.getByRole('menu', { name: '个性化' });

    const menuGlassShell = menu.closest('[data-liquid-glass-menu-shell="main"]');
    const submenuGlassShell = submenu.closest('[data-liquid-glass-menu-shell="submenu"]');
    const menuGlass = menuGlassShell?.querySelector<HTMLElement>('.glass');
    const menuWarp = menuGlassShell?.querySelector<HTMLElement>('.glass__warp');
    const submenuGlass = submenuGlassShell?.querySelector<HTMLElement>('.glass');
    const submenuWarp = submenuGlassShell?.querySelector<HTMLElement>('.glass__warp');

    expect(menu).toHaveAttribute('data-menu-surface', 'liquid-glass-apple');
    expect(menuGlassShell).toHaveStyle({
      height: '200px',
      left: '338px',
      top: '168px',
      width: '274px',
    });
    expect(menuGlass).toHaveStyle({ borderRadius: '22px' });
    expect(menuGlass?.getAttribute('style')).toContain('padding: 0');
    expect(menuWarp?.style.backdropFilter).toBe('blur(6px) saturate(140%)');
    expect(menuGlassShell?.querySelector('feDisplacementMap')?.getAttribute('scale')).toBe('-70');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['新建', '通知与待办', '个性化', 'APP Store', 'AI Spotlight']);
    expect(within(menu).getByRole('menuitem', { name: '个性化' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(
      within(submenu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['壁纸', '小组件', 'Dock 与菜单栏', '桌面排列']);
    expect(submenu).toHaveAttribute('data-menu-surface', 'liquid-glass-apple');
    expect(submenuGlassShell).toHaveStyle({
      height: '156px',
      left: '620px',
      top: '258px',
      width: '236px',
    });
    expect(submenuGlass).toHaveStyle({ borderRadius: '20px' });
    expect(submenuGlass?.getAttribute('style')).toContain('padding: 0');
    expect(submenuWarp?.style.backdropFilter).toBe('blur(6px) saturate(140%)');
    expect(submenuGlassShell?.querySelector('feDisplacementMap')?.getAttribute('scale')).toBe(
      '-70',
    );

    const newItem = within(menu).getByRole('menuitem', { name: '新建' });
    const appStoreItem = within(menu).getByRole('menuitem', { name: 'APP Store' });
    const personalizationItem = within(menu).getByRole('menuitem', { name: '个性化' });

    expect(personalizationItem).toHaveStyle({ fontWeight: '520' });
    expect(personalizationItem).toHaveAttribute('data-highlight-tone', 'dock-glass');
    expect(personalizationItem.getAttribute('style')).not.toContain('linear-gradient');
    expect(personalizationItem.getAttribute('style')).not.toContain('rgba(255, 255, 255, 0.22)');
    expect(personalizationItem.getAttribute('style')).not.toContain('rgba(255, 255, 255, 0.28)');
    expect(personalizationItem.getAttribute('style')).not.toContain('rgba(145, 221, 242, 0.2)');
    expect(personalizationItem.querySelector('[data-highlight-capsule="true"]')).toHaveStyle({
      background:
        'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(238,246,231,0.11) 44%, rgba(104,147,118,0.16) 100%)',
      boxShadow:
        'inset 0 0 0 1px rgba(255,255,255,0.20), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(255,255,255,0.18), 0 4px 10px rgba(5,24,9,0.08)',
    });
    expect(personalizationItem.querySelector('[data-highlight-capsule="true"]')).not.toHaveStyle({
      boxShadow: '0 8px 18px rgba(5,24,9,0.16)',
    });
    expect(within(menu).getAllByTestId('context-menu-item-icon')).toHaveLength(5);
    expect(within(submenu).getAllByTestId('context-menu-item-icon')).toHaveLength(4);
    expect(menu.querySelectorAll('[role="separator"]')).toHaveLength(0);
    expect(submenu.querySelectorAll('[role="separator"]')).toHaveLength(0);
    expect(menuGlassShell?.querySelector('.glass__warp')).toBeInTheDocument();

    await user.hover(newItem);
    expect(newItem).toHaveAttribute('data-interaction-state', 'hovered');
    expect(newItem).toHaveAttribute('data-highlight-tone', 'dock-glass');
    expect(personalizationItem).toHaveAttribute('data-interaction-state', 'idle');

    const newSubmenu = screen.getByRole('menu', { name: '新建' });

    expect(newSubmenu).toHaveStyle({
      height: '156px',
      left: '620px',
      top: '178px',
      width: '236px',
    });
    expect(
      within(newSubmenu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['新人档案', '导师匹配', '培训任务', '资源文档']);

    await user.hover(appStoreItem);
    fireEvent.pointerDown(appStoreItem);
    expect(appStoreItem).toHaveAttribute('data-interaction-state', 'pressed');
    fireEvent.pointerUp(appStoreItem);
    expect(appStoreItem).toHaveAttribute('data-interaction-state', 'hovered');

    await user.hover(personalizationItem);
    const reopenedSubmenu = screen.getByRole('menu', { name: '个性化' });
    const wallpaperItem = within(reopenedSubmenu).getByRole('menuitem', { name: '壁纸' });

    await user.hover(wallpaperItem);
    expect(wallpaperItem).toHaveAttribute('data-interaction-state', 'hovered');

    await user.keyboard('{Escape}');

    await waitForElementToBeRemoved(() =>
      screen.queryByRole('menu', { name: 'KernelOn desktop context menu' }),
    );
  });
});
