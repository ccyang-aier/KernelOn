import { describe, expect, it } from 'vitest';

import { createWallpaperHeader } from '../src/apps/wallpaper/header';

describe('Wallpaper header', () => {
  it('uses the segmented library header outside preview', () => {
    const header = createWallpaperHeader('home');

    expect(header.preset).toBe('editor');
    expect(header.leading).toEqual([
      {
        commandId: 'wallpaper.focus-search',
        icon: 'Search',
        id: 'wallpaper-search',
        label: 'Search',
        type: 'button',
      },
    ]);
    expect(header.center?.[0]?.type).toBe('segment');
  });

  it('switches preview into a back-search-tools header', () => {
    const header = createWallpaperHeader('preview' as never);

    expect(header.preset).toBe('browser');
    expect(header.leading).toEqual([
      {
        backCommandId: 'wallpaper.back',
        type: 'navigation',
      },
    ]);
    expect(header.center).toEqual([
      {
        commandId: 'wallpaper.focus-search',
        icon: 'Search',
        id: 'wallpaper-preview-search',
        label: 'Search',
        type: 'button',
      },
    ]);
    expect(header.center?.some((item) => item.type === 'segment')).toBe(false);
    expect(header.trailing?.map((item) => ('id' in item ? item.id : item.type))).toEqual([
      'wallpaper-license',
      'wallpaper-share',
      'wallpaper-settings',
    ]);
  });
});
