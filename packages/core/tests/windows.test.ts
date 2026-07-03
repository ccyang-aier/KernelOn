import { describe, expect, it } from 'vitest';

import {
  closeWindow,
  focusWindow,
  minimizeWindow,
  openWindow,
  resizeWindow,
  restoreWindow,
  toggleWindowFullscreen,
  type KernelAppManifest,
} from '../src';

const mentorApp: KernelAppManifest = {
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
  runtime: {
    window: {
      loaderKey: 'app:growth-archive-window',
    },
  },
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

  it('minimizes and restores an existing window without losing its bounds', () => {
    const windows = openWindow([], mentorApp, { id: 'mentor-window', createdAt: 1 });

    const minimized = minimizeWindow(windows, 'mentor-window');

    expect(minimized.find((window) => window.id === 'mentor-window')).toMatchObject({
      status: 'minimized',
      bounds: mentorApp.defaultWindow.bounds,
    });

    const restored = restoreWindow(minimized, 'mentor-window');

    expect(restored.find((window) => window.id === 'mentor-window')).toMatchObject({
      status: 'active',
      bounds: mentorApp.defaultWindow.bounds,
      zIndex: 2,
    });
  });

  it('resizes a window while preserving the minimum usable app container size', () => {
    const windows = openWindow([], mentorApp, { id: 'mentor-window', createdAt: 1 });

    const resized = resizeWindow(windows, 'mentor-window', {
      x: 144,
      y: 112,
      width: 1160,
      height: 720,
    });

    expect(resized.find((window) => window.id === 'mentor-window')?.bounds).toEqual({
      x: 144,
      y: 112,
      width: 1160,
      height: 720,
    });

    const clamped = resizeWindow(resized, 'mentor-window', {
      x: 144,
      y: 112,
      width: 220,
      height: 160,
    });

    expect(clamped.find((window) => window.id === 'mentor-window')?.bounds).toEqual({
      x: 144,
      y: 112,
      width: 520,
      height: 360,
    });
  });

  it('toggles a window into fullscreen and restores the previous window bounds', () => {
    const windows = openWindow([], mentorApp, { id: 'mentor-window', createdAt: 1 });
    const fullscreenBounds = { x: 12, y: 46, width: 1416, height: 758 };

    const fullscreen = toggleWindowFullscreen(windows, 'mentor-window', fullscreenBounds);

    expect(fullscreen.find((window) => window.id === 'mentor-window')).toMatchObject({
      bounds: fullscreenBounds,
      mode: 'fullscreen',
      restoreBounds: mentorApp.defaultWindow.bounds,
      status: 'active',
    });

    const restored = toggleWindowFullscreen(fullscreen, 'mentor-window', fullscreenBounds);

    expect(restored.find((window) => window.id === 'mentor-window')).toMatchObject({
      bounds: mentorApp.defaultWindow.bounds,
      mode: 'windowed',
      status: 'active',
    });
    expect(restored.find((window) => window.id === 'mentor-window')?.restoreBounds).toBeUndefined();
  });
});
