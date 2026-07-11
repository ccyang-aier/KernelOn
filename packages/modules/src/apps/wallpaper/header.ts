import type { AppHeaderDescriptor } from '@kernelon/core';

import type { WallpaperView } from './types';

type WallpaperHeaderView = WallpaperView | 'preview' | 'lock';

export function createWallpaperHeader(activeView: WallpaperHeaderView): AppHeaderDescriptor {
  if (activeView === 'lock') {
    return {
      density: 'comfortable',
      leading: [{ id: 'wallpaper-lock-back-control', type: 'slot' }],
      mode: 'standard',
      preset: 'browser',
    };
  }

  if (activeView === 'preview') {
    return {
      center: [{ id: 'wallpaper-search-control', type: 'slot' }],
      density: 'comfortable',
      leading: [{ id: 'wallpaper-back-control', type: 'slot' }],
      mode: 'standard',
      preset: 'browser',
      trailing: [
        { id: 'wallpaper-license-control', type: 'slot' },
        { id: 'wallpaper-share-control', type: 'slot' },
        { id: 'wallpaper-settings-control', type: 'slot' },
      ],
    };
  }

  return {
    center: [{ id: 'wallpaper-primary-control', type: 'slot' }],
    density: 'comfortable',
    mode: 'standard',
    preset: 'editor',
    trailing: [
      { id: 'wallpaper-license-control', type: 'slot' },
      { id: 'wallpaper-share-control', type: 'slot' },
    ],
  };
}
