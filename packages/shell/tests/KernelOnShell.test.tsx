import { render, screen } from '@testing-library/react';
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
      dockedByDefault: true,
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
    {
      id: 'mentor',
      name: '导师管理',
      description: '导师库、师徒匹配、带教任务与反馈',
      priority: 'P0',
      category: 'operations',
      icon: 'Handshake',
      runtime: {
        window: {
          loaderKey: 'app:mentor-window',
        },
      },
      defaultWindow: {
        title: '导师管理',
        bounds: { x: 136, y: 96, width: 920, height: 620 },
      },
    },
  ],
  dockAppIds: ['onboarding'],
  widgets: [
    {
      id: 'onboarding-progress',
      name: '入职进度',
      description: '展示新员工入职阶段推进情况',
      defaultGrid: { x: 2, y: 0, width: 2, height: 2 },
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
      items: [
        {
          id: 'desktop-item:onboarding',
          kind: 'app',
          targetId: 'onboarding',
          screenId: 'screen-home',
          grid: { x: 0, y: 0, width: 1, height: 1 },
        },
        {
          id: 'desktop-item:onboarding-progress',
          kind: 'widget',
          targetId: 'onboarding-progress',
          screenId: 'screen-home',
          grid: { x: 1, y: 0, width: 2, height: 2 },
        },
      ],
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
  it('renders the shell and opens an app window lazily', async () => {
    const user = userEvent.setup();
    const runtime = createRuntime();

    render(<KernelOnShell initialState={initialState} runtime={runtime} />);

    expect(screen.getByRole('heading', { name: 'KernelOn' })).toBeInTheDocument();
    expect(runtime.loadAppWindow).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /新员工运作 入职信息/ }));

    expect(screen.getByText('1 active model item(s)')).toBeInTheDocument();
    expect(await screen.findByText('Lazy onboarding window')).toBeInTheDocument();
    expect(runtime.loadAppWindow).toHaveBeenCalledWith('app:onboarding-window');
  });

  it('toggles launcher and spotlight state without loading app windows', async () => {
    const user = userEvent.setup();
    const runtime = createRuntime();

    render(<KernelOnShell initialState={initialState} runtime={runtime} />);

    await user.click(screen.getByRole('button', { name: '打开启动台' }));
    expect(screen.getAllByText('新员工运作')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'AI Spotlight' }));
    expect(screen.getByText('搜索 App，或输入“匹配导师张三和新人李四”')).toBeInTheDocument();
    expect(runtime.loadAppWindow).not.toHaveBeenCalled();
  });

  it('renders only desktop items selected by layout and lazy-loads widgets', async () => {
    const runtime = createRuntime();

    render(<KernelOnShell initialState={initialState} runtime={runtime} />);

    expect(screen.getByText('新员工运作')).toBeInTheDocument();
    expect(screen.queryByText('导师管理')).not.toBeInTheDocument();
    expect(await screen.findByText('Lazy onboarding widget')).toBeInTheDocument();
    expect(runtime.loadWidget).toHaveBeenCalledWith('widget:onboarding-progress');
    expect(runtime.loadAppWindow).not.toHaveBeenCalled();
  });
});
