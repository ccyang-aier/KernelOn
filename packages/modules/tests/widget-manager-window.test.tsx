// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import WidgetManagerWindow from '../src/apps/widget-manager/WidgetManagerWindow';

const shellMocks = vi.hoisted(() => {
  const setPendingWidgetPlacement = vi.fn();
  const minimizeWindow = vi.fn();

  return {
    minimizeWindow,
    setPendingWidgetPlacement,
  };
});

vi.mock('@kernelon/shell', () => ({
  AppFrame: ({
    children,
    header,
    headerSlots,
  }: Readonly<{
    children: ReactNode;
    header?: { density?: string };
    headerSlots?: Readonly<Record<string, ReactNode>>;
  }>) => (
    <div data-header-density={header?.density} data-testid="widget-manager-app-frame">
      {Object.entries(headerSlots ?? {}).map(([id, slot]) => (
        <div data-testid={`widget-manager-header-slot-${id}`} key={id}>
          {slot}
        </div>
      ))}
      {children}
    </div>
  ),
  useShellSelector: <T,>(selector: (state: WidgetManagerShellState) => T): T =>
    selector(widgetManagerShellState),
}));

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
  bounds: { height: 760, width: 1328, x: 48, y: 58 },
  createdAt: 1,
  id: 'window:widget-manager',
  status: 'active',
  title: 'Widgets 管理',
  zIndex: 1,
} as const;

const widgetManagerApp = {
  category: 'system',
  defaultWindow: {
    bounds: { height: 760, width: 1328, x: 48, y: 58 },
    header: {
      density: 'comfortable',
      identity: { title: '' },
      mode: 'standard',
      preset: 'editor',
    },
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
      frameOwner: 'app',
      loaderKey: 'app:widget-manager-window',
    },
  },
} as const;

afterEach(() => {
  cleanup();
});

describe('WidgetManagerWindow', () => {
  it('renders the macOS-style widget gallery chrome from the reference layout', () => {
    render(<WidgetManagerWindow app={widgetManagerApp} window={widgetManagerWindow} />);

    expect(screen.getByTestId('widget-manager-app-frame')).toHaveAttribute(
      'data-header-density',
      'comfortable',
    );
    expect(
      screen.getByTestId('widget-manager-header-slot-widget-manager-title-control'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('widget-manager-header-slot-widget-manager-search-control'),
    ).toBeInTheDocument();

    expect(screen.getByTestId('widget-manager-window')).toHaveClass(
      'grid',
      'grid-cols-[276px_minmax(0,1fr)]',
    );
    expect(screen.getByTestId('widget-manager-window')).toHaveAttribute(
      'data-sidebar-state',
      'expanded',
    );
    expect(screen.getByTestId('widget-manager-title-control')).toHaveClass(
      'absolute',
      'left-1/2',
      '-translate-x-1/2',
    );
    expect(screen.getByTestId('widget-manager-title-control')).toHaveTextContent('Widgets 管理');
    expect(screen.getByPlaceholderText('搜索')).toBeInTheDocument();
    expect(screen.getByTestId('widget-manager-sidebar')).toHaveAttribute(
      'data-surface',
      'frosted-sidebar',
    );

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

  it('smoothly collapses and expands the sidebar from the header control', () => {
    render(<WidgetManagerWindow app={widgetManagerApp} window={widgetManagerWindow} />);

    const toggle = screen.getByRole('button', { name: '收起小组件侧栏' });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAccessibleName('展开小组件侧栏');
    expect(screen.getByTestId('widget-manager-window')).toHaveAttribute(
      'data-sidebar-state',
      'collapsed',
    );
    expect(screen.getByTestId('widget-manager-window')).toHaveClass(
      'grid-cols-[88px_minmax(0,1fr)]',
      'transition-[grid-template-columns]',
    );
    expect(screen.getByTestId('widget-manager-sidebar')).toHaveAttribute('data-collapsed', 'true');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('widget-manager-window')).toHaveAttribute(
      'data-sidebar-state',
      'expanded',
    );
  });
});
