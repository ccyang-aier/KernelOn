import { render, screen, within } from '@testing-library/react';
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

    expect(statusBar).toHaveClass('fixed', 'top-0', 'right-0');
    expect(statusBar.getAttribute('style')).toContain('38px');
    expect(statusFrame).toHaveClass('h-[38px]', 'w-[320px]');
    expect(screen.getByText('09:41')).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: '新员工运作' }));

    expect(await screen.findByText('Lazy onboarding window')).toBeInTheDocument();
    expect(runtime.loadAppWindow).toHaveBeenCalledWith('app:onboarding-window');
  });
});
