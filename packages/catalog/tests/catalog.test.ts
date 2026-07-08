import { describe, expect, it } from 'vitest';

import { defaultDesktopScreens, defaultShellInitialState, kernelApps, kernelWidgets } from '../src';

describe('KernelOn built-in catalog', () => {
  it('keeps catalog metadata separate from desktop placement', () => {
    expect(kernelApps).toHaveLength(9);
    expect(defaultDesktopScreens[0]?.items).toHaveLength(0);
  });

  it('declares runtime loader keys for apps and widgets', () => {
    expect(kernelApps.every((app) => app.runtime.window.loaderKey.startsWith('app:'))).toBe(true);
    expect(
      kernelWidgets.every((widget) => widget.runtime.widget.loaderKey.startsWith('widget:')),
    ).toBe(true);
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
            loaderKey: 'app:widget-manager-window',
          },
        },
      }),
    );
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

  it('keeps Wallpaper default chrome owned by wallpaper slots', () => {
    const wallpaperApp = kernelApps.find((app) => app.id === 'wallpaper');

    expect(wallpaperApp?.defaultWindow.header?.leading).toEqual([
      { id: 'wallpaper-search-control', type: 'slot' },
    ]);
    expect(wallpaperApp?.defaultWindow.header?.center).toEqual([
      { id: 'wallpaper-view-control', type: 'slot' },
    ]);
    expect(wallpaperApp?.defaultWindow.header?.trailing).toEqual([
      { id: 'wallpaper-license-control', type: 'slot' },
      { id: 'wallpaper-share-control', type: 'slot' },
    ]);
  });

  it('exposes a shared default shell state for web and desktop mounts', () => {
    expect(defaultShellInitialState.apps).toBe(kernelApps);
    expect(defaultShellInitialState.widgets).toBe(kernelWidgets);
    expect(defaultShellInitialState.screens).toBe(defaultDesktopScreens);
  });
});
