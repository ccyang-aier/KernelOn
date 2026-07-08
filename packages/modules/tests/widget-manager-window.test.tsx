import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import WidgetManagerWindow from '../src/apps/widget-manager/WidgetManagerWindow';

const shellMocks = vi.hoisted(() => {
  const setHeader = vi.fn();
  const clearHeader = vi.fn();
  const setSlot = vi.fn();
  const clearSlot = vi.fn();
  const registerCommand = vi.fn(() => vi.fn());
  const setPendingWidgetPlacement = vi.fn();
  const minimizeWindow = vi.fn();

  return {
    clearHeader,
    clearSlot,
    minimizeWindow,
    registerCommand,
    setHeader,
    setPendingWidgetPlacement,
    setSlot,
  };
});

vi.mock('@kernelon/shell', async () => {
  const { createContext } = await import('react');
  const headerController = {
    clearHeader: shellMocks.clearHeader,
    clearSlot: shellMocks.clearSlot,
    registerCommand: shellMocks.registerCommand,
    setHeader: shellMocks.setHeader,
    setSlot: shellMocks.setSlot,
    windowId: 'window:widget-manager',
  };

  return {
    AppHeaderContext: createContext(headerController),
    AppHeaderSlot: ({
      children,
      id,
    }: Readonly<{
      children: React.ReactNode;
      id: string;
    }>) => <div data-testid={`widget-manager-header-slot-${id}`}>{children}</div>,
    useShellSelector: <T,>(selector: (state: WidgetManagerShellState) => T): T =>
      selector(widgetManagerShellState),
  };
});

interface WidgetManagerShellState {
  currentScreenId: string;
  minimizeWindow(windowId: string): void;
  screens: Array<{
    id: string;
    items: Array<{
      kind: 'widget';
      targetId: string;
    }>;
  }>;
  setPendingWidgetPlacement(item: { height: number; widgetId: string; width: number }): void;
  widgets: Array<{
    defaultGrid: { height: number; width: number; x: number; y: number };
    id: string;
    name: string;
    runtime: { widget: { loaderKey: string } };
  }>;
}

const widgetManagerShellState: WidgetManagerShellState = {
  currentScreenId: 'screen-home',
  minimizeWindow: shellMocks.minimizeWindow,
  screens: [
    {
      id: 'screen-home',
      items: [],
    },
  ],
  setPendingWidgetPlacement: shellMocks.setPendingWidgetPlacement,
  widgets: [
    {
      defaultGrid: { height: 2, width: 2, x: 0, y: 0 },
      id: 'onboarding-progress',
      name: '入职进度',
      runtime: { widget: { loaderKey: 'widget:onboarding-progress' } },
    },
    {
      defaultGrid: { height: 2, width: 2, x: 0, y: 0 },
      id: 'mentor-load',
      name: '导师负载',
      runtime: { widget: { loaderKey: 'widget:mentor-load' } },
    },
    {
      defaultGrid: { height: 2, width: 2, x: 0, y: 0 },
      id: 'growth-milestone',
      name: '成长里程碑',
      runtime: { widget: { loaderKey: 'widget:growth-milestone' } },
    },
    {
      defaultGrid: { height: 2, width: 2, x: 0, y: 0 },
      id: 'training-task',
      name: '培训任务',
      runtime: { widget: { loaderKey: 'widget:training-task' } },
    },
  ],
};

const widgetManagerWindow = {
  appId: 'widget-manager',
  bounds: { height: 660, width: 960, x: 128, y: 96 },
  createdAt: 1,
  id: 'window:widget-manager',
  status: 'active',
  title: 'Widgets 管理',
  zIndex: 1,
} as const;

const widgetManagerApp = {
  category: 'system',
  defaultWindow: {
    bounds: { height: 660, width: 960, x: 128, y: 96 },
    title: 'Widgets 管理',
  },
  description: 'KernelOn 小组件管理中心',
  dockedByDefault: true,
  icon: 'Grid2X2',
  id: 'widget-manager',
  name: '小组件管理',
  priority: 'P2',
  runtime: {
    window: {
      loaderKey: 'app:widget-manager-window',
    },
  },
} as const;

describe('WidgetManagerWindow', () => {
  it('renders the macOS-style widget gallery chrome from the reference layout', () => {
    shellMocks.setHeader.mockClear();

    render(<WidgetManagerWindow app={widgetManagerApp} window={widgetManagerWindow} />);

    expect(shellMocks.setHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [{ id: 'widget-manager-title-control', type: 'slot' }],
        density: 'comfortable',
        trailing: [{ id: 'widget-manager-search-control', type: 'slot' }],
      }),
    );

    expect(screen.getByTestId('widget-manager-window')).toHaveClass(
      'grid',
      'grid-cols-[244px_minmax(0,1fr)]',
    );
    expect(
      screen.getByTestId('widget-manager-header-slot-widget-manager-title-control'),
    ).toHaveTextContent('Widgets 管理');
    expect(screen.getByPlaceholderText('搜索')).toBeInTheDocument();
    expect(screen.getByTestId('widget-manager-sidebar')).toHaveClass('bg-white/62');

    const toolbar = screen.getByTestId('widget-manager-toolbar');

    expect(within(toolbar).getByRole('button', { name: '全部' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(toolbar).getByRole('button', { name: '全部尺寸' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByTestId('widget-manager-grid')).toHaveClass(
      'grid-cols-[minmax(0,1.12fr)_minmax(0,0.8fr)_minmax(0,0.95fr)]',
    );
  });
});
