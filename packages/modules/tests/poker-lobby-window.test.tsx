// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppWindowSurfaceProps } from '@kernelon/shell';

import PokerLobbyWindow from '../src/apps/poker/PokerLobbyWindow';

vi.mock('@kernelon/shell', () => ({
  AppFrame: ({
    children,
    headerSlots,
  }: {
    children: ReactNode;
    headerSlots?: Record<string, ReactNode>;
  }) => (
    <div data-testid="poker-app-frame">
      {headerSlots ? <header>{Object.values(headerSlots)}</header> : null}
      {children}
    </div>
  ),
}));

afterEach(cleanup);

describe('PokerLobbyWindow', () => {
  it('renders the dense lobby composition inside an app-owned frame', () => {
    render(<PokerLobbyWindow {...({} as AppWindowSurfaceProps)} />);

    expect(screen.getByTestId('poker-app-frame')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '今晚主桌' })).toBeInTheDocument();
    expect(screen.getByText('今日牌局')).toBeInTheDocument();
    expect(screen.getByText('快速开局')).toBeInTheDocument();
    expect(screen.getByText('赛事预告')).toBeInTheDocument();
    expect(screen.getByText('好友在玩')).toBeInTheDocument();
    expect(screen.getByText('每日任务')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /邀请 .* 同桌/ })).toHaveLength(5);
  });

  it('supports search, table rotation, rewards and opening the room browser', () => {
    render(<PokerLobbyWindow {...({} as AppWindowSurfaceProps)} />);

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索玩家、俱乐部或赛事' }), {
      target: { value: '豪客' },
    });
    expect(screen.getByRole('button', { name: /豪客私人桌/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /深筹常规桌/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索玩家、俱乐部或赛事' }), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: '换一批' }));
    fireEvent.click(screen.getByRole('button', { name: '领取 完成 3 场牌局' }));
    expect(screen.getByRole('status')).toHaveTextContent('奖励已领取');
    expect(screen.getByRole('button', { name: '已领取 完成 3 场牌局' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /深筹常规桌/ }));
    expect(screen.getByTestId('poker-room-browser')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '牌桌大厅' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      '正在牌桌大厅中定位 深筹常规桌 · 10 / 20',
    );

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索房间名称或房主' }), {
      target: { value: 'PandaPro' },
    });
    expect(screen.getByText('翡翠常规桌')).toBeInTheDocument();
    expect(screen.queryByText('王冠深筹')).not.toBeInTheDocument();
  });

  it('closes room-browser feedback loops and exposes complete table interactions', async () => {
    render(<PokerLobbyWindow {...({} as AppWindowSurfaceProps)} />);

    fireEvent.click(screen.getByRole('button', { name: /黑桃会员/ }));
    expect(screen.getByRole('status')).toHaveTextContent('黑桃会员权益面板已准备就绪');

    fireEvent.click(screen.getByRole('button', { name: '128 在线' }));
    expect(screen.getByRole('status')).toHaveTextContent('当前有 128 位牌友在线');

    fireEvent.click(screen.getByRole('button', { name: '查看通知' }));
    expect(screen.getByText('深夜冠军赛将在 21:30 开始')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '邀请 PandaPro 同桌' }));
    expect(screen.getByRole('status')).toHaveTextContent('邀请已发送给 PandaPro');

    fireEvent.click(screen.getByRole('button', { name: '牌桌' }));
    expect(screen.getByTestId('poker-room-browser')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '加入 翡翠常规桌' }));
    const dialog = screen.getByRole('dialog', { name: '确认加入房间' });
    expect(within(dialog).getByText('翡翠常规桌')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: '加入房间' }));
    fireEvent.click(
      await screen.findByRole('button', { name: '进入牌桌' }, { timeout: 4_000 }),
    );

    expect(screen.getByTestId('poker-table-stage')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '底池' }));
    expect(screen.getByRole('slider', { name: '加注金额' })).toHaveValue('1240');
    fireEvent.click(screen.getByRole('button', { name: /加注至/ }));
    expect(screen.getByText('已加注至 1,240')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '聊天' }));
    expect(screen.getByText(/观战聊天已同步/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '返回大厅' }));
    expect(screen.getByRole('heading', { name: '牌桌大厅' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '大厅' }));
    expect(screen.getByRole('heading', { name: '今晚主桌' })).toBeInTheDocument();
  });
});
