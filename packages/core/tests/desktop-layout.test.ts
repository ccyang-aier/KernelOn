import { describe, expect, it } from 'vitest';

import {
  createDesktopAppItem,
  createDesktopScreen,
  createDesktopWidgetItem,
  createDefaultDesktopScreen,
  doGridAreasOverlap,
  findOverlappingDesktopItems,
  addDesktopWidgetItem,
  moveDesktopItem,
  removeDesktopItem,
  type KernelAppManifest,
  type WidgetManifest,
} from '../src';

const apps: KernelAppManifest[] = [
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
      bounds: { x: 136, y: 96, width: 920, height: 620 },
    },
  },
];

describe('desktop layout helpers', () => {
  it('creates desktop screens from explicit user-selected items', () => {
    const widget: WidgetManifest = {
      id: 'onboarding-progress',
      name: '入职进度',
      description: '展示新员工入职阶段推进情况',
      defaultGrid: { x: 2, y: 0, width: 2, height: 2 },
      runtime: {
        widget: {
          loaderKey: 'widget:onboarding-progress',
        },
      },
    };

    const screen = createDesktopScreen({
      id: 'screen-home',
      name: '我的工作台',
      items: [
        createDesktopAppItem(apps[0], 'screen-home', { x: 0, y: 0, width: 1, height: 1 }),
        createDesktopWidgetItem(widget, 'screen-home', widget.defaultGrid),
      ],
    });

    expect(screen.items).toEqual([
      expect.objectContaining({ kind: 'app', targetId: 'onboarding' }),
      expect.objectContaining({ kind: 'widget', targetId: 'onboarding-progress' }),
    ]);
  });

  it('creates a deterministic default desktop screen', () => {
    const screen = createDefaultDesktopScreen(apps, { columns: 1 });

    expect(screen.items.map((item) => item.grid)).toEqual([
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 0, y: 1, width: 1, height: 1 },
    ]);
  });

  it('moves desktop items immutably', () => {
    const screen = createDefaultDesktopScreen(apps);
    const moved = moveDesktopItem(screen.items, 'desktop-item:mentor', {
      x: 2,
      y: 1,
      width: 1,
      height: 1,
    });

    expect(moved).not.toBe(screen.items);
    expect(moved.find((item) => item.id === 'desktop-item:mentor')?.grid.x).toBe(2);
  });

  it('adds multiple instances of the same widget with stable unique item ids', () => {
    const widget: WidgetManifest = {
      id: 'training-task',
      name: '培训与打卡',
      description: '培训任务状态与一键签到签退快速入口',
      defaultGrid: { x: 0, y: 3, width: 4, height: 2 },
      runtime: {
        widget: {
          loaderKey: 'widget:training-task',
        },
      },
    };

    const firstAdd = addDesktopWidgetItem([], widget, 'screen-home');
    const secondAdd = addDesktopWidgetItem(firstAdd, widget, 'screen-home', {
      x: 1,
      y: 4,
      width: 4,
      height: 2,
    });

    expect(firstAdd).toHaveLength(1);
    expect(secondAdd).toHaveLength(2);
    expect(secondAdd.map((item) => item.id)).toEqual([
      'desktop-item:training-task',
      'desktop-item:training-task:2',
    ]);
    expect(secondAdd[1]?.grid).toEqual({ x: 1, y: 4, width: 4, height: 2 });
  });

  it('removes desktop items immutably', () => {
    const screen = createDefaultDesktopScreen(apps);
    const removed = removeDesktopItem(screen.items, 'desktop-item:onboarding');

    expect(removed).not.toBe(screen.items);
    expect(removed.map((item) => item.id)).toEqual(['desktop-item:mentor']);
  });

  it('finds overlapping grid areas', () => {
    const screen = createDefaultDesktopScreen(apps);

    expect(
      doGridAreasOverlap({ x: 0, y: 0, width: 2, height: 2 }, { x: 1, y: 1, width: 1, height: 1 }),
    ).toBe(true);
    expect(
      findOverlappingDesktopItems(screen.items, { x: 0, y: 0, width: 1, height: 1 }),
    ).toHaveLength(1);
  });
});
