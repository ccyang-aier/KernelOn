import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  AppHeaderSlot,
  KernelOnShell,
  kernelOnDefaultCursor,
  type ShellInitialState,
  type ShellRuntimeRegistry,
  useAppHeader,
} from '../src';

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

    expect(screen.getByTestId('kernelon-shell')).toHaveAttribute(
      'data-kernelon-cursor-scope',
      'true',
    );
    expect(kernelOnDefaultCursor).toBe('/kernelon-assets/cursors/cursor-arrow-solid.svg');
    expect(screen.queryByText('新员工运作工作台')).not.toBeInTheDocument();
    expect(screen.queryByText('Core Services')).not.toBeInTheDocument();
    expect(screen.queryByText('入职进度')).not.toBeInTheDocument();
    expect(runtime.loadAppWindow).not.toHaveBeenCalled();
    expect(runtime.loadWidget).not.toHaveBeenCalled();
  });

  it('emits a water ripple only when clicking the empty desktop surface', () => {
    const runtime = createRuntime();

    render(<KernelOnShell initialState={initialState} runtime={runtime} />);

    const desktopSurface = screen.getByTestId('kernelon-desktop-surface');

    expect(screen.getByTestId('kernelon-desktop-click-ripple-layer')).toBeInTheDocument();
    expect(screen.queryByTestId('kernelon-desktop-click-ripple')).not.toBeInTheDocument();

    fireEvent.pointerDown(desktopSurface, {
      button: 2,
      clientX: 180,
      clientY: 140,
    });

    expect(screen.queryByTestId('kernelon-desktop-click-ripple')).not.toBeInTheDocument();

    fireEvent.pointerDown(desktopSurface, {
      button: 0,
      clientX: 220,
      clientY: 180,
    });

    const ripple = screen.getByTestId('kernelon-desktop-click-ripple');

    expect(ripple).toHaveStyle({
      height: '96px',
      left: '220px',
      top: '180px',
      width: '96px',
    });
    expect(ripple.querySelectorAll('[data-ripple-part="wave-halo"]')).toHaveLength(2);
    expect(
      Array.from(ripple.querySelectorAll('[data-ripple-part="wave-ring"]')).map((wave) =>
        wave.getAttribute('data-ripple-wave'),
      ),
    ).toEqual(['0', '1']);
    expect(ripple.querySelector('[data-ripple-part="core"]')).toBeInTheDocument();
  });

  it('renders the desktop status bar controls in the reference order', async () => {
    const runtime = createRuntime();
    const user = userEvent.setup();

    render(<KernelOnShell initialState={initialState} runtime={runtime} />);

    const statusBar = screen.getByTestId('kernelon-status-bar');
    const statusFrame = statusBar.firstElementChild;
    const statusGlass = screen.getByTestId('kernelon-status-glass');
    const statusBrand = screen.getByTestId('kernelon-status-brand');
    const statusBrandLogoButton = screen.getByTestId('kernelon-status-brand-logo-button');
    const statusBrandWordmarkButton = screen.getByTestId(
      'kernelon-status-brand-wordmark-button',
    );
    const statusControls = screen.getByTestId('kernelon-status-controls');
    const statusBrandLogo = screen.getByTestId('kernelon-status-brand-logo');
    const statusBrandWordmark = screen.getByTestId('kernelon-status-brand-wordmark');
    const statusSurface = statusGlass.closest('.glass');
    const statusWarp = statusSurface?.querySelector('.glass__warp');

    expect(statusBar).toHaveClass('fixed', 'inset-x-0', 'top-0');
    expect(statusBar).not.toHaveClass('top-[2px]');
    expect(statusBar.getAttribute('style')).toContain('40px');
    expect(statusFrame).toHaveAttribute('data-slot', 'liquid-glass-svg-filter');
    expect(statusFrame).toHaveStyle({
      height: '0px',
      left: '0px',
      overflow: 'visible',
      position: 'absolute',
      top: '0px',
      width: '0px',
    });
    expect(statusGlass).toHaveClass(
      'h-[40px]',
      'w-screen',
      'justify-between',
      'px-[14px]',
      'pt-[2px]',
    );
    expect(statusGlass).toHaveStyle({
      boxShadow:
        'inset 0 -1px 0 rgba(232,248,250,0.16), inset 0 1px 0 rgba(255,255,255,0.06)',
    });
    expect(statusSurface).toHaveAttribute('data-liquid-glass-container-border-mode', 'external');
    expect(statusSurface).toHaveStyle({ borderRadius: '0px', boxShadow: 'none', padding: '0px' });
    expect(
      statusFrame?.querySelector('[data-liquid-glass-container-border]'),
    ).not.toBeInTheDocument();
    expect(statusWarp).toHaveAttribute('data-liquid-glass-render-mode', 'full');
    expect(statusWarp?.getAttribute('style')).toContain('filter: url(');
    expect(statusWarp?.getAttribute('style')).toContain('backdrop-filter: blur(');
    expect(statusWarp?.getAttribute('style')).toContain('clip-path: inset(0 round 0px)');
    expect(statusBrand).toHaveClass('h-[38px]', 'justify-start', 'gap-[4px]');
    expect(statusBrand).not.toHaveAttribute('data-kernelon-status-feedback', 'gsap-press');
    expect(statusBrand).toHaveTextContent('KernelOn');
    expect(statusBrandLogoButton).toHaveAttribute('data-kernelon-status-feedback', 'gsap-press');
    expect(statusBrandWordmarkButton).toHaveAttribute(
      'data-kernelon-status-feedback',
      'gsap-press',
    );
    expect(statusControls).toHaveClass('h-[38px]', 'w-[500px]', 'justify-end');
    expect(statusControls).not.toHaveClass('pr-[10px]');
    expect(statusBrandLogo).toHaveAttribute(
      'src',
      '/kernelon-assets/brand/kernelon-logo-speedboat.png',
    );
    expect(statusBrandLogo).toHaveClass('h-[30px]', 'w-[30px]');
    expect(statusBrandLogo).not.toHaveClass('-ml-[3px]');
    expect(statusBrandWordmark).toHaveClass('font-semibold');
    expect(screen.queryByText('09:41')).not.toBeInTheDocument();
    expect(within(statusBar).queryByLabelText('System time 09:41')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'KernelOn profile' })).not.toBeInTheDocument();
    expect(screen.getByTestId('kernelon-status-time')).toHaveTextContent(
      /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{1,2} \d{1,2}:\d{2} (AM|PM)$/,
    );
    const statusButtons = within(statusBar).getAllByRole('button');
    const statusButtonLabels = statusButtons.map((button) => button.getAttribute('aria-label'));

    expect(statusButtonLabels.slice(0, 10)).toEqual([
      'KernelOn logo',
      'KernelOn wordmark',
      'Theme',
      'Volume',
      'Bluetooth',
      'Wi-Fi',
      'Battery',
      'AI Spotlight',
      'Notifications',
      'Control Center',
    ]);
    expect(statusButtonLabels.at(-1)).toMatch(
      /^System time [A-Z][a-z]{2} [A-Z][a-z]{2} \d{1,2} \d{1,2}:\d{2} (AM|PM)$/,
    );
    statusButtons.forEach((button) => {
      expect(button).toHaveAttribute('data-kernelon-status-feedback', 'gsap-press');
      expect(
        button.querySelector('[data-kernelon-status-feedback-aura="true"]'),
      ).toBeInTheDocument();
      expect(
        button.querySelector('[data-kernelon-status-feedback-glyph="true"]'),
      ).toBeInTheDocument();
    });

    const spotlightButton = within(statusBar).getByRole('button', { name: 'AI Spotlight' });
    const notificationDot = screen.getByTestId('kernelon-notification-dot');
    const statusTime = screen.getByTestId('kernelon-status-time');

    expect(spotlightButton).toHaveAttribute('aria-pressed', 'false');
    expect(notificationDot).toHaveClass('top-[2px]', 'right-[-2px]', 'size-[7px]');
    expect(statusTime).toHaveClass('font-normal');

    await user.click(spotlightButton);

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

  it('renders a managed App Header with navigation, identity, center tools, trailing actions, and subbar', async () => {
    const runtime = createRuntime();

    render(
      <KernelOnShell
        initialState={{
          ...initialState,
          apps: [
            {
              ...initialState.apps[0],
              defaultWindow: {
                ...initialState.apps[0].defaultWindow,
                header: {
                  mode: 'standard',
                  preset: 'dashboard',
                  identity: {
                    title: 'Mentor Matching',
                    subtitle: 'Queue - Edited',
                    status: 'edited',
                  },
                  leading: [{ type: 'navigation', backCommandId: 'mentor.back' }],
                  center: [
                    {
                      type: 'segment',
                      id: 'matching-view',
                      value: 'pending',
                      options: [
                        { label: 'Pending', value: 'pending' },
                        { label: 'Assigned', value: 'assigned' },
                      ],
                    },
                  ],
                  trailing: [
                    {
                      type: 'button',
                      id: 'refresh',
                      icon: 'RefreshCw',
                      label: 'Refresh mentors',
                      commandId: 'mentor.refresh',
                    },
                    {
                      type: 'search',
                      id: 'mentor-search',
                      placeholder: 'Search mentors',
                      commandId: 'mentor.search',
                    },
                  ],
                  subbar: [
                    {
                      type: 'button',
                      id: 'filters',
                      icon: 'ListFilter',
                      label: 'Open filters',
                      commandId: 'mentor.filters',
                    },
                  ],
                },
              },
            },
          ],
          windows: [
            {
              id: 'window:onboarding',
              appId: 'onboarding',
              title: 'Fallback title',
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

    const appContainer = await screen.findByTestId('kernelon-app-container-window:onboarding');
    const appHeader = within(appContainer).getByTestId('kernelon-app-header-window:onboarding');

    expect(appHeader).toHaveAttribute('data-app-header-mode', 'standard');
    expect(appHeader).toHaveAttribute('data-app-header-preset', 'dashboard');
    expect(within(appHeader).getByTestId('kernelon-app-header-leading-window:onboarding')).toBeInTheDocument();
    expect(within(appHeader).getByTestId('kernelon-app-header-center-window:onboarding')).toBeInTheDocument();
    expect(within(appHeader).getByTestId('kernelon-app-header-trailing-window:onboarding')).toBeInTheDocument();
    expect(within(appHeader).getByTestId('kernelon-app-header-subbar-window:onboarding')).toBeInTheDocument();
    expect(within(appHeader).getByText('Mentor Matching')).toBeInTheDocument();
    expect(within(appHeader).getByText('Queue - Edited')).toBeInTheDocument();
    expect(within(appHeader).getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(within(appHeader).getByRole('button', { name: 'Pending' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(appHeader).getByRole('button', { name: 'Assigned' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(within(appHeader).getByRole('button', { name: 'Refresh mentors' })).toBeInTheDocument();
    expect(within(appHeader).getByPlaceholderText('Search mentors')).toBeInTheDocument();
    expect(within(appHeader).getByRole('button', { name: 'Open filters' })).toBeInTheDocument();
    expect(within(appHeader).queryByText('Fallback title')).not.toBeInTheDocument();
  });

  it('keeps App Header controls from starting window drag interactions', async () => {
    const runtime = createRuntime();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

    render(
      <KernelOnShell
        initialState={{
          ...initialState,
          apps: [
            {
              ...initialState.apps[0],
              defaultWindow: {
                ...initialState.apps[0].defaultWindow,
                header: {
                  identity: { title: 'Controlled App' },
                  trailing: [
                    {
                      type: 'button',
                      id: 'refresh',
                      icon: 'RefreshCw',
                      label: 'Refresh mentors',
                      commandId: 'mentor.refresh',
                    },
                  ],
                },
              },
            },
          ],
          windows: [
            {
              id: 'window:onboarding',
              appId: 'onboarding',
              title: 'Controlled App',
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

    const appContainer = await screen.findByTestId('kernelon-app-container-window:onboarding');
    const refreshButton = within(appContainer).getByRole('button', { name: 'Refresh mentors' });

    fireEvent.pointerDown(refreshButton, { button: 0, clientX: 420, clientY: 92 });
    fireEvent.pointerMove(appContainer, { clientX: 720, clientY: 220 });
    fireEvent.pointerUp(refreshButton, { clientX: 720, clientY: 220 });

    expect(appContainer).toHaveStyle({
      left: '96px',
      top: '72px',
    });
  });

  it('lets a lazy-loaded app update its App Header and fill controlled slots', async () => {
    const user = userEvent.setup();
    const saveHandler = vi.fn();
    const runtime: ShellRuntimeRegistry = {
      loadAppWindow: vi.fn(async () => ({
        default: function RuntimeHeaderWindow() {
          const header = useAppHeader();

          useEffect(() => {
            const unregisterSave = header.registerCommand('runtime.save', saveHandler);

            header.setHeader({
              mode: 'composable',
              identity: {
                title: 'Runtime Header',
                subtitle: 'Updated by app',
                status: 'saving',
              },
              trailing: [
                { type: 'slot', id: 'runtime-actions' },
                {
                  type: 'button',
                  id: 'save',
                  icon: 'Save',
                  label: 'Save runtime header',
                  commandId: 'runtime.save',
                },
              ],
            });

            return unregisterSave;
          }, [header]);

          return (
            <>
              <AppHeaderSlot id="runtime-actions">
                <button type="button">Custom review action</button>
              </AppHeaderSlot>
              <div>Runtime app body</div>
            </>
          );
        },
      })),
      loadWidget: vi.fn(async () => ({
        default: function TestWidget() {
          return <div>Lazy onboarding widget</div>;
        },
      })),
    };

    render(
      <KernelOnShell
        initialState={{
          ...initialState,
          windows: [
            {
              id: 'window:onboarding',
              appId: 'onboarding',
              title: 'Fallback title',
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

    const appContainer = await screen.findByTestId('kernelon-app-container-window:onboarding');
    const appHeader = within(appContainer).getByTestId('kernelon-app-header-window:onboarding');

    expect(await within(appHeader).findByText('Runtime Header')).toBeInTheDocument();
    expect(within(appHeader).getByText('Updated by app')).toBeInTheDocument();
    expect(within(appHeader).getByRole('button', { name: 'Custom review action' })).toBeInTheDocument();

    await user.click(within(appHeader).getByRole('button', { name: 'Save runtime header' }));

    expect(saveHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'runtime.save',
        itemId: 'save',
        type: 'button',
        windowId: 'window:onboarding',
      }),
    );
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

  it('mounts app content inside a macOS-like container that minimizes and restores from the Dock', async () => {
    const runtime = createRuntime();
    const user = userEvent.setup();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

    render(
      <KernelOnShell
        initialState={{
          ...initialState,
          dockAppIds: ['onboarding'],
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

    const appContainer = await screen.findByTestId('kernelon-app-container-window:onboarding');
    const onboardingDockButton = within(screen.getByTestId('kernelon-dock')).getAllByRole(
      'button',
    )[1];

    expect(appContainer).toHaveAttribute('data-window-mode', 'windowed');
    expect(appContainer).toHaveAttribute('data-window-status', 'active');
    expect(appContainer).toHaveAttribute('data-window-transition-mode', 'genie-managed');
    expect(appContainer).toHaveAttribute('data-genie-effect-source', 'window:onboarding');
    expect(onboardingDockButton).toHaveAttribute('data-kernelon-dock-target', 'onboarding');
    expect(screen.getByTestId('kernelon-genie-effect-layer')).toBeInTheDocument();
    expect(appContainer).toHaveClass('will-change-transform', 'rounded-[26px]', 'border-white/60');
    expect(appContainer).toHaveStyle({
      height: '640px',
      left: '96px',
      top: '72px',
      width: '960px',
    });
    const trafficLights = within(appContainer).getByTestId(
      'kernelon-app-window-traffic-lights-window:onboarding',
    );
    const trafficLightButtons = within(trafficLights).getAllByRole('button');
    const closeTrafficLight = trafficLightButtons.at(0) as HTMLElement;

    expect(trafficLights).toHaveClass('group', 'gap-2.5');
    expect(trafficLightButtons).toHaveLength(3);
    expect(closeTrafficLight).toHaveClass(
      'origin-center',
      'group-hover:scale-[1.24]',
      'hover:scale-[1.32]',
      'text-black/82',
    );
    expect(closeTrafficLight.querySelector('svg')).toHaveClass(
      'size-2.5',
      'group-hover:opacity-90',
    );
    expect(await within(appContainer).findByText('Lazy onboarding window')).toBeInTheDocument();
    expect(
      within(appContainer).getByRole('button', { name: '最小化 新员工运作' }),
    ).toBeInTheDocument();
    expect(
      within(appContainer).getByRole('button', { name: '进入全屏 新员工运作' }),
    ).toBeInTheDocument();
    expect(
      within(appContainer).getByTestId('kernelon-app-window-resize-se-window:onboarding'),
    ).toBeInTheDocument();

    await user.click(within(appContainer).getByRole('button', { name: '最小化 新员工运作' }));

    await waitFor(() =>
      expect(
        screen.queryByTestId('kernelon-app-container-window:onboarding'),
      ).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: '新员工运作' }));

    expect(
      await screen.findByTestId('kernelon-app-container-window:onboarding'),
    ).toBeInTheDocument();
  });

  it('expands an app container to fullscreen and restores its previous bounds', async () => {
    const runtime = createRuntime();
    const user = userEvent.setup();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

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

    const appContainer = await screen.findByTestId('kernelon-app-container-window:onboarding');

    await user.click(within(appContainer).getByRole('button', { name: '进入全屏 新员工运作' }));

    expect(appContainer).toHaveAttribute('data-window-mode', 'fullscreen');
    expect(appContainer).toHaveClass('rounded-none', 'border-transparent');
    await waitFor(() =>
      expect(appContainer).toHaveStyle({
        height: '900px',
        left: '0px',
        top: '0px',
        width: '1440px',
      }),
    );
    expect(
      screen.queryByTestId('kernelon-app-window-resize-se-window:onboarding'),
    ).not.toBeInTheDocument();

    await user.click(within(appContainer).getByRole('button', { name: '退出全屏 新员工运作' }));

    expect(appContainer).toHaveAttribute('data-window-mode', 'windowed');
    await waitFor(() =>
      expect(appContainer).toHaveStyle({
        height: '640px',
        left: '96px',
        top: '72px',
        width: '960px',
      }),
    );
    expect(
      within(appContainer).getByTestId('kernelon-app-window-resize-se-window:onboarding'),
    ).toBeInTheDocument();
  });

  it('keeps default app windows above the Dock safe area on compact viewports', async () => {
    const runtime = createRuntime();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });

    render(
      <KernelOnShell
        initialState={{
          ...initialState,
          apps: [
            {
              ...initialState.apps[0],
              defaultWindow: {
                title: 'Onboarding',
                bounds: { x: 216, y: 148, width: 860, height: 580 },
              },
            },
          ],
          dockAppIds: ['onboarding'],
          windows: [
            {
              id: 'window:onboarding',
              appId: 'onboarding',
              title: 'Onboarding',
              bounds: { x: 216, y: 148, width: 860, height: 580 },
              zIndex: 1,
              status: 'active',
              createdAt: 1,
            },
          ],
        }}
        runtime={runtime}
      />,
    );

    const appContainer = await screen.findByTestId('kernelon-app-container-window:onboarding');

    expect(appContainer).toHaveStyle({
      height: '580px',
      top: '52px',
      width: '860px',
    });
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

    expect(Array.from(contextMenuList.children).map((item) => item.textContent)).toEqual([
      '新建',
      '通知与待办',
      '个性化',
      'APP Store',
      'AI Spotlight',
    ]);
    expect(screen.getByRole('menu', { name: 'KernelOn desktop context menu' })).toBe(
      contextMenuList,
    );
    expect(within(contextMenuList).getAllByRole('menuitem')).toHaveLength(5);
    expect(screen.getAllByTestId('kernelon-liquid-glass-context-menu-icon')).toHaveLength(5);
    expect(screen.getAllByTestId('kernelon-liquid-glass-context-menu-chevron')).toHaveLength(2);
    expect(
      screen.queryByTestId('kernelon-liquid-glass-context-menu-highlight'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('kernelon-liquid-glass-context-submenu-card'),
    ).not.toBeInTheDocument();

    const personalizationMenuItem = screen
      .getByText('个性化')
      .closest('[data-kernelon-context-menu-item]') as HTMLElement;
    const newMenuItem = screen
      .getByText('新建')
      .closest('[data-kernelon-context-menu-item]') as HTMLElement;
    const spotlightMenuItem = within(contextMenuList).getByRole('menuitem', {
      name: 'AI Spotlight',
    });
    const spotlightIcon = within(spotlightMenuItem).getByTestId(
      'kernelon-liquid-glass-context-menu-icon',
    );

    expect(spotlightIcon.querySelector('svg')).toHaveClass('lucide-scan-search');

    fireEvent.click(personalizationMenuItem);

    expect(screen.getByTestId('kernelon-liquid-glass-context-menu-highlight')).toHaveAttribute(
      'data-highlight-capsule',
      'true',
    );
    expect(screen.getByRole('menu', { name: '个性化' })).toBeInTheDocument();
    const submenuLiquidGlassRoot = screen
      .getByTestId('kernelon-liquid-glass-context-submenu-card')
      .closest('.glass')?.parentElement as HTMLElement;
    const submenuGlass = screen
      .getByTestId('kernelon-liquid-glass-context-submenu-card')
      .closest('.glass');
    const submenuWarp = submenuGlass?.querySelector('.glass__warp');

    expect(submenuLiquidGlassRoot).toHaveStyle({
      left: '603px',
      position: 'absolute',
      top: '234px',
    });
    expect(submenuLiquidGlassRoot).not.toHaveStyle({ zIndex: '41' });
    expect(submenuGlass).toHaveStyle({ borderRadius: '16px', padding: '10px 11px' });
    expect(submenuWarp?.getAttribute('style')).toContain('clip-path: inset(0 round 16px)');
    expect(screen.getAllByTestId('kernelon-liquid-glass-context-submenu-icon')).toHaveLength(4);
    expect(
      within(screen.getByTestId('kernelon-liquid-glass-context-submenu-list')).getAllByRole(
        'menuitem',
      ),
    ).toHaveLength(4);
    expect(personalizationMenuItem).toHaveAttribute('data-interaction-state', 'hovered');
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

    expect(
      screen.queryByTestId('kernelon-liquid-glass-context-menu-highlight'),
    ).not.toBeInTheDocument();

    fireEvent.pointerEnter(newMenuItem);

    expect(newMenuItem).toHaveAttribute('aria-expanded', 'true');
    expect(personalizationMenuItem).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('menu', { name: '新建' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('menu', { name: '新建' })).getByRole('menuitem', {
        name: '新人档案',
      }),
    ).toBeInTheDocument();

    fireEvent.pointerEnter(spotlightMenuItem);

    expect(
      screen.queryByTestId('kernelon-liquid-glass-context-submenu-card'),
    ).not.toBeInTheDocument();

    const statusSpotlightButton = within(screen.getByTestId('kernelon-status-bar')).getByRole(
      'button',
      { name: 'AI Spotlight' },
    );

    expect(statusSpotlightButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(spotlightMenuItem);

    expect(statusSpotlightButton).toHaveAttribute('aria-pressed', 'true');
    expect(liquidGlassRoot).toHaveStyle({ left: '338px', position: 'absolute', top: '168px' });
    expect(liquidGlassRoot).not.toHaveStyle({ zIndex: '40' });
    expect(glass).toHaveStyle({ borderRadius: '16px', padding: '12px 14px' });
    expect(warp).not.toBeNull();
    expect(warp?.getAttribute('style')).toContain('filter: url(');
    expect(warp?.getAttribute('style')).toContain('backdrop-filter: blur(20px) saturate(140%)');
    expect(warp?.getAttribute('style')).toContain('clip-path: inset(0 round 16px)');
    expect(screen.queryByRole('menu', { name: '个性化' })).not.toBeInTheDocument();
    expect(screen.queryByText('Glass Card')).not.toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByTestId('kernelon-liquid-glass-context-card')).not.toBeInTheDocument(),
    );
  });
});
