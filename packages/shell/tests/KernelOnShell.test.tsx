import {
  fireEvent,
  render,
  screen,
  waitFor,
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

  it('replaces the native desktop context menu with a liquid glass desktop context menu', async () => {
    const runtime = createRuntime();
    const user = userEvent.setup();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1620 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 971 });

    render(<KernelOnShell initialState={initialState} runtime={runtime} />);

    expect(screen.getByTestId('kernelon-desktop-wallpaper')).toHaveAttribute(
      'src',
      '/kernelon-assets/wallpapers/kernelon-flower-wallpaper.png',
    );

    const desktopSurface = screen.getByTestId('kernelon-desktop-surface');
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 338,
      clientY: 168,
    });

    expect(fireEvent(desktopSurface, contextMenuEvent)).toBe(false);
    expect(contextMenuEvent.defaultPrevented).toBe(true);
    expect(desktopSurface).not.toHaveClass('z-10');

    const contextMenuCard = screen.getByTestId('kernelon-liquid-glass-context-card');
    const contextMenuList = screen.getByTestId('kernelon-liquid-glass-context-menu-list');
    const glass = contextMenuCard.closest('.glass');
    const liquidGlassRoot = glass?.parentElement as HTMLElement;
    const warp = glass?.querySelector('.glass__warp');

    expect(
      Array.from(contextMenuList.children).map((item) => item.textContent),
    ).toEqual(['新建', '通知与待办', '个性化', 'APP Store', 'AI Spotlight']);
    expect(screen.getByRole('menu', { name: 'KernelOn desktop context menu' })).toBe(contextMenuList);
    expect(within(contextMenuList).getAllByRole('menuitem')).toHaveLength(5);
    expect(screen.getAllByTestId('kernelon-liquid-glass-context-menu-icon')).toHaveLength(5);
    expect(screen.getAllByTestId('kernelon-liquid-glass-context-menu-chevron')).toHaveLength(2);
    expect(screen.queryByTestId('kernelon-liquid-glass-context-menu-highlight')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kernelon-liquid-glass-context-submenu-card')).not.toBeInTheDocument();

    const personalizationMenuItem = screen
      .getByText('个性化')
      .closest('[data-kernelon-context-menu-item]') as HTMLElement;
    const newMenuItem = screen
      .getByText('新建')
      .closest('[data-kernelon-context-menu-item]') as HTMLElement;
    const spotlightMenuItem = within(contextMenuList).getByRole('menuitem', { name: 'AI Spotlight' });

    fireEvent.click(personalizationMenuItem);

    expect(screen.getByTestId('kernelon-liquid-glass-context-menu-highlight')).toHaveAttribute(
      'data-highlight-capsule',
      'true',
    );
    expect(screen.getByRole('menu', { name: '个性化' })).toBeInTheDocument();
    const submenuLiquidGlassRoot = screen
      .getByTestId('kernelon-liquid-glass-context-submenu-card')
      .closest('.glass')?.parentElement as HTMLElement;

    expect(submenuLiquidGlassRoot).toHaveStyle({
      left: '603px',
      position: 'absolute',
      top: '234px',
    });
    expect(submenuLiquidGlassRoot).not.toHaveStyle({ zIndex: '41' });
    expect(screen.getAllByTestId('kernelon-liquid-glass-context-submenu-icon')).toHaveLength(4);
    expect(within(screen.getByTestId('kernelon-liquid-glass-context-submenu-list')).getAllByRole('menuitem')).toHaveLength(4);
    expect(personalizationMenuItem).toHaveAttribute(
      'data-interaction-state',
      'hovered',
    );
    expect(personalizationMenuItem).toHaveAttribute('aria-expanded', 'true');

    const wallpaperSubmenuItem = within(screen.getByRole('menu', { name: '个性化' })).getByRole(
      'menuitem',
      { name: '壁纸' },
    );

    fireEvent.pointerEnter(wallpaperSubmenuItem);

    expect(wallpaperSubmenuItem).toHaveAttribute('data-interaction-state', 'hovered');
    expect(screen.getByTestId('kernelon-liquid-glass-context-submenu-highlight')).toHaveAttribute(
      'data-highlight-capsule',
      'true',
    );

    fireEvent.pointerDown(personalizationMenuItem);

    expect(personalizationMenuItem).toHaveAttribute('data-interaction-state', 'pressed');

    fireEvent.pointerUp(personalizationMenuItem);

    expect(personalizationMenuItem).toHaveAttribute('data-interaction-state', 'hovered');

    fireEvent.pointerLeave(contextMenuList);

    expect(screen.queryByTestId('kernelon-liquid-glass-context-menu-highlight')).not.toBeInTheDocument();

    fireEvent.pointerEnter(newMenuItem);

    expect(newMenuItem).toHaveAttribute('aria-expanded', 'true');
    expect(personalizationMenuItem).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('menu', { name: '新建' })).toBeInTheDocument();
    expect(within(screen.getByRole('menu', { name: '新建' })).getByRole('menuitem', { name: '新人档案' })).toBeInTheDocument();

    fireEvent.pointerEnter(spotlightMenuItem);

    expect(screen.queryByTestId('kernelon-liquid-glass-context-submenu-card')).not.toBeInTheDocument();

    const statusSpotlightButton = within(screen.getByTestId('kernelon-status-bar')).getByRole(
      'button',
      { name: 'AI Spotlight' },
    );

    expect(statusSpotlightButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(spotlightMenuItem);

    expect(statusSpotlightButton).toHaveAttribute('aria-pressed', 'true');
    expect(liquidGlassRoot).toHaveStyle({ left: '338px', position: 'absolute', top: '168px' });
    expect(liquidGlassRoot).not.toHaveStyle({ zIndex: '40' });
    expect(glass).toHaveStyle({ borderRadius: '32px', padding: '12px 14px' });
    expect(warp).not.toBeNull();
    expect(warp?.getAttribute('style')).toContain('filter: url(');
    expect(warp?.getAttribute('style')).toContain(
      'backdrop-filter: blur(20px) saturate(140%)',
    );
    expect(warp?.getAttribute('style')).toContain('clip-path: inset(0 round 32px)');
    expect(screen.queryByRole('menu', { name: '个性化' })).not.toBeInTheDocument();
    expect(screen.queryByText('Glass Card')).not.toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByTestId('kernelon-liquid-glass-context-card')).not.toBeInTheDocument(),
    );
  });
});
