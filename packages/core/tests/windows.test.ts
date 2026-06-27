import { describe, expect, it } from 'vitest';

import { closeWindow, focusWindow, openWindow, type KernelAppManifest } from '../src';

const mentorApp: KernelAppManifest = {
  id: 'mentor',
  name: '导师管理',
  description: '导师库、师徒匹配、带教任务与反馈',
  priority: 'P0',
  category: 'operations',
  icon: 'Handshake',
  defaultWindow: {
    title: '导师管理',
    bounds: { x: 128, y: 88, width: 900, height: 620 },
  },
};

const archiveApp: KernelAppManifest = {
  id: 'growth-archive',
  name: '成长档案',
  description: '新员工个人主页、培养记录、里程碑沉淀',
  priority: 'P1',
  category: 'growth',
  icon: 'Milestone',
  defaultWindow: {
    title: '成长档案',
    bounds: { x: 168, y: 104, width: 860, height: 600 },
  },
};

describe('window model helpers', () => {
  it('opens a focused window and deactivates previous windows', () => {
    const first = openWindow([], mentorApp, { id: 'mentor-window', createdAt: 1 });
    const second = openWindow(first, archiveApp, { id: 'archive-window', createdAt: 2 });

    expect(second).toHaveLength(2);
    expect(second[0]?.status).toBe('inactive');
    expect(second[1]).toMatchObject({
      id: 'archive-window',
      appId: 'growth-archive',
      status: 'active',
      zIndex: 2,
    });
  });

  it('focuses an existing window', () => {
    const windows = openWindow(
      openWindow([], mentorApp, { id: 'mentor-window', createdAt: 1 }),
      archiveApp,
      { id: 'archive-window', createdAt: 2 },
    );

    const focused = focusWindow(windows, 'mentor-window');

    expect(focused.find((window) => window.id === 'mentor-window')?.status).toBe('active');
    expect(focused.find((window) => window.id === 'mentor-window')?.zIndex).toBe(3);
    expect(focused.find((window) => window.id === 'archive-window')?.status).toBe('inactive');
  });

  it('closes a window by id', () => {
    const windows = openWindow([], mentorApp, { id: 'mentor-window', createdAt: 1 });

    expect(closeWindow(windows, 'mentor-window')).toEqual([]);
  });
});
