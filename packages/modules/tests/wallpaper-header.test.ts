import { describe, expect, it } from 'vitest';

import { createWallpaperHeader } from '../src/apps/wallpaper/header';

describe('Wallpaper header', () => {
  it('reduces the lock screen header to a single back control', () => {
    const header = createWallpaperHeader('lock' as never);

    expect(header.leading).toEqual([{ id: 'wallpaper-lock-back-control', type: 'slot' }]);
    expect(header.center).toBeUndefined();
    expect(header.trailing).toBeUndefined();
  });

  it('uses a combined wallpaper-owned primary slot outside preview', () => {
    const header = createWallpaperHeader('home');

    expect(header.preset).toBe('editor');
    expect(header.leading).toBeUndefined();
    expect(header.center).toEqual([{ id: 'wallpaper-primary-control', type: 'slot' }]);
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
