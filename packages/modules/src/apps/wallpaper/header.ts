import type { AppHeaderDescriptor } from '@kernelon/core';

import type { WallpaperView } from './types';

type WallpaperHeaderView = WallpaperView | 'preview';

export function createWallpaperHeader(activeView: WallpaperHeaderView): AppHeaderDescriptor {
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
    center: [{ id: 'wallpaper-view-control', type: 'slot' }],
    density: 'comfortable',
    leading: [{ id: 'wallpaper-search-control', type: 'slot' }],
    mode: 'standard',
    preset: 'editor',
    trailing: [
      { id: 'wallpaper-license-control', type: 'slot' },
      { id: 'wallpaper-share-control', type: 'slot' },
    ],
  };
}
