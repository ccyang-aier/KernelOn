import { describe, expect, it } from 'vitest';

import { createWallpaperHeader } from '../src/apps/wallpaper/header';

describe('Wallpaper header', () => {
  it('uses wallpaper-owned slots outside preview instead of shell liquid controls', () => {
    const header = createWallpaperHeader('home');

    expect(header.preset).toBe('editor');
    expect(header.leading).toEqual([{ id: 'wallpaper-search-control', type: 'slot' }]);
    expect(header.center).toEqual([{ id: 'wallpaper-view-control', type: 'slot' }]);
    expect(header.trailing).toEqual([
      { id: 'wallpaper-license-control', type: 'slot' },
      { id: 'wallpaper-share-control', type: 'slot' },
    ]);
    expect(header.center?.some((item) => item.type === 'segment')).toBe(false);
  });

  it('switches preview into wallpaper-owned back-search-tools slots', () => {
    const header = createWallpaperHeader('preview' as never);

    expect(header.preset).toBe('browser');
    expect(header.leading).toEqual([{ id: 'wallpaper-back-control', type: 'slot' }]);
    expect(header.center).toEqual([{ id: 'wallpaper-search-control', type: 'slot' }]);
    expect(header.center?.some((item) => item.type === 'segment')).toBe(false);
    expect(header.trailing?.map((item) => ('id' in item ? item.id : item.type))).toEqual([
      'wallpaper-license-control',
      'wallpaper-share-control',
      'wallpaper-settings-control',
    ]);
  });
});
