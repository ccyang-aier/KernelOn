import type { AppHeaderDescriptor } from '@kernelon/core';

import { viewLabels } from './data';
import type { WallpaperView } from './types';

const headerOptions = [
  { label: viewLabels.home, value: 'home' },
  { label: viewLabels.explore, value: 'explore' },
  { label: viewLabels.settings, value: 'settings' },
];

export function createWallpaperHeader(activeView: WallpaperView): AppHeaderDescriptor {
  return {
    center: [
      {
        commandId: 'wallpaper.view',
        id: 'wallpaper-tabs',
        options: headerOptions,
        type: 'segment',
        value: activeView,
      },
    ],
    density: 'comfortable',
    leading: [
      {
        commandId: 'wallpaper.focus-search',
        icon: 'Search',
        id: 'wallpaper-search',
        label: 'Search',
        type: 'button',
      },
    ],
    mode: 'standard',
    preset: 'editor',
    trailing: [
      {
        commandId: 'wallpaper.license',
        icon: 'KeyRound',
        id: 'wallpaper-license',
        label: 'License',
        type: 'button',
      },
      {
        commandId: 'wallpaper.share',
        icon: 'Share2',
        id: 'wallpaper-share',
        label: 'Share',
        type: 'button',
      },
    ],
  };
}

export function isWallpaperView(value: string | undefined): value is WallpaperView {
  return value === 'home' || value === 'explore' || value === 'settings';
}
