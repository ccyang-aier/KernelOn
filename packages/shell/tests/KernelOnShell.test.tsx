import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { KernelOnShell, type ShellInitialState } from '../src';

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
      defaultWindow: {
        title: '新员工运作',
        bounds: { x: 96, y: 72, width: 960, height: 640 },
      },
    },
  ],
};

describe('KernelOnShell', () => {
  it('renders the shell and opens an app window', async () => {
    const user = userEvent.setup();

    render(<KernelOnShell initialState={initialState} />);

    expect(screen.getByRole('heading', { name: 'KernelOn' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /新员工运作 入职信息/ }));

    expect(screen.getByText('1 active model item(s)')).toBeInTheDocument();
    expect(
      screen.getByText(
        '这里保留业务 App 的窗口边界，后续可在不改动 Shell 的前提下逐步接入真实功能。',
      ),
    ).toBeInTheDocument();
  });

  it('toggles launcher and spotlight state', async () => {
    const user = userEvent.setup();

    render(<KernelOnShell initialState={initialState} />);

    await user.click(screen.getByRole('button', { name: '打开启动台' }));
    expect(screen.getAllByText('新员工运作')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'AI Spotlight' }));
    expect(screen.getByText('搜索 App，或输入“匹配导师张三和新人李四”')).toBeInTheDocument();
  });
});
