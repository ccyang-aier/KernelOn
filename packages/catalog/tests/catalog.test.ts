import { describe, expect, it } from 'vitest';

import { defaultDesktopScreens, defaultShellInitialState, kernelApps, kernelWidgets } from '../src';

describe('KernelOn built-in catalog', () => {
  it('keeps catalog metadata separate from desktop placement', () => {
    expect(kernelApps).toHaveLength(12);
    expect(defaultDesktopScreens[0]?.items).toHaveLength(0);
  });

  it('declares Mineradio as a docked app-owned music window', () => {
    expect(kernelApps).toContainEqual(
      expect.objectContaining({
        dockedByDefault: true,
        icon: 'Music',
        id: 'music',
        name: '音乐',
        defaultWindow: expect.objectContaining({
          bounds: { height: 810, width: 1440, x: 36, y: 48 },
        }),
        runtime: {
          window: {
            frameOwner: 'app',
            loaderKey: 'app:music-window',
            mountPolicy: 'keep-alive',
            snapshotPolicy: 'skip',
          },
        },
      }),
    );
  });

  it('does not render a second copy of the shared black meter dock icon', () => {
    expect(kernelApps.find((app) => app.id === 'music')?.dockedByDefault).toBe(true);
    expect(kernelApps.find((app) => app.id === 'dashboard')?.dockedByDefault).toBe(false);
  });

  it('declares Weekly Show as a docked app-owned window', () => {
    expect(kernelApps).toContainEqual(
      expect.objectContaining({
        dockedByDefault: true,
        id: 'weekly-show',
        name: 'Weekly Show',
        runtime: {
          window: {
            frameOwner: 'app',
            loaderKey: 'app:weekly-show-window',
          },
        },
      }),
    );
  });

  it('declares Black Spade Poker as a wide app-owned window', () => {
    expect(kernelApps).toContainEqual(
      expect.objectContaining({
        dockedByDefault: true,
        icon: 'Spade',
        id: 'poker',
        name: '黑桃局',
        runtime: {
          window: {
            frameOwner: 'app',
            loaderKey: 'app:poker-lobby-window',
          },
        },
        defaultWindow: expect.objectContaining({
          bounds: { height: 954, width: 1512, x: 18, y: 34 },
        }),
      }),
    );
  });

  it('declares runtime loader keys for apps and widgets', () => {
    expect(kernelApps.every((app) => app.runtime.window.loaderKey.startsWith('app:'))).toBe(true);
    expect(
      kernelWidgets.every((widget) => widget.runtime.widget.loaderKey.startsWith('widget:')),
    ).toBe(true);
  });

  it('lets lifecycle apps own their shared frame without a duplicate shell header', () => {
    const lifecycleAppIds = ['onboarding', 'mentor', 'growth-archive', 'assessment', 'dashboard'];

    expect(
      kernelApps
        .filter((app) => lifecycleAppIds.includes(app.id))
        .map((app) => [app.id, app.runtime.window.frameOwner]),
    ).toEqual(lifecycleAppIds.map((appId) => [appId, 'app']));
  });

  it('declares Wallpaper as a system personalization app', () => {
    expect(kernelApps).toContainEqual(
      expect.objectContaining({
        category: 'system',
        description: '发现、预览、收藏、上传并应用 KernelOn 桌面壁纸',
        dockedByDefault: false,
        icon: 'Image',
        id: 'wallpaper',
        name: '壁纸管理',
        runtime: {
          window: {
            frameOwner: 'app',
            layer: 'top',
            loaderKey: 'app:wallpaper-window',
          },
        },
      }),
    );
  });

  it('declares Widget Manager as the system entry for desktop widgets', () => {
    expect(kernelApps).toContainEqual(
      expect.objectContaining({
        category: 'system',
        dockedByDefault: true,
        icon: 'Grid2X2',
        id: 'widget-manager',
        name: '小组件管理',
        runtime: {
          window: {
            frameOwner: 'app',
            loaderKey: 'app:widget-manager-window',
          },
        },
      }),
    );
  });

  it('opens Widget Manager with a wide app-owned frame by default', () => {
    const widgetManagerApp = kernelApps.find((app) => app.id === 'widget-manager');

    expect(widgetManagerApp?.defaultWindow.bounds).toEqual({
      height: 760,
      width: 1328,
      x: 48,
      y: 58,
    });
    expect(widgetManagerApp?.defaultWindow.header).toBeUndefined();
    expect(widgetManagerApp?.runtime.window.frameOwner).toBe('app');
  });

  it('declares the full built-in widget set with stable loader keys', () => {
    expect(kernelWidgets.map((widget) => widget.id)).toEqual([
      'onboarding-progress',
      'mentor-load',
      'growth-milestone',
      'training-task',
    ]);
    expect(kernelWidgets.map((widget) => widget.runtime.widget.loaderKey)).toEqual([
      'widget:onboarding-progress',
      'widget:mentor-load',
      'widget:growth-milestone',
      'widget:training-task',
    ]);
  });

  it('declares Wallpaper as an app-owned top-layer frame', () => {
    const wallpaperApp = kernelApps.find((app) => app.id === 'wallpaper');

    expect(wallpaperApp?.defaultWindow.header).toBeUndefined();
    expect(wallpaperApp?.runtime.window).toEqual({
      frameOwner: 'app',
      layer: 'top',
      loaderKey: 'app:wallpaper-window',
    });
  });

  it('exposes a shared default shell state for web and desktop mounts', () => {
    expect(defaultShellInitialState.apps).toBe(kernelApps);
    expect(defaultShellInitialState.widgets).toBe(kernelWidgets);
    expect(defaultShellInitialState.screens).toBe(defaultDesktopScreens);
  });
});
