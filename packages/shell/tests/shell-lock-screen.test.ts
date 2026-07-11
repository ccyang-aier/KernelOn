import { describe, expect, it } from 'vitest';

import { createShellStore } from '../src/shell-store';

describe('Shell lock screen', () => {
  it('locks the full desktop and only unlocks with the configured password', () => {
    localStorage.clear();
    const store = createShellStore({ apps: [] });

    store.getState().lockDesktop('2580');

    expect(store.getState().isDesktopLocked).toBe(true);
    expect(store.getState().unlockDesktop('0000')).toBe(false);
    expect(store.getState().isDesktopLocked).toBe(true);
    expect(store.getState().unlockDesktop('2580')).toBe(true);
    expect(store.getState().isDesktopLocked).toBe(false);
    expect(JSON.parse(localStorage.getItem('kernelon_wallpaper_lock_screen') ?? '{}')).toEqual({
      enabled: true,
      password: '2580',
      version: 1,
    });
  });
});
