import type { AppHeaderDescriptor } from '@kernelon/core';

import { viewLabels } from './data';
import type { WallpaperView } from './types';

type WallpaperHeaderView = WallpaperView | 'preview';

const headerOptions = [
  { label: viewLabels.home, value: 'home' },
  { label: viewLabels.explore, value: 'explore' },
  { label: viewLabels.settings, value: 'settings' },
];

export function createWallpaperHeader(activeView: WallpaperHeaderView): AppHeaderDescriptor {
  if (activeView === 'preview') {
    return {
      center: [
        {
          commandId: 'wallpaper.focus-search',
          icon: 'Search',
          id: 'wallpaper-preview-search',
          label: 'Search',
          type: 'button',
        },
      ],
      density: 'comfortable',
      leading: [
        {
          backCommandId: 'wallpaper.back',
          type: 'navigation',
        },
      ],
      mode: 'standard',
      preset: 'browser',
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
        {
          commandId: 'wallpaper.settings',
          icon: 'Settings',
          id: 'wallpaper-settings',
          label: 'Settings',
          type: 'button',
        },
      ],
    };
  }

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
