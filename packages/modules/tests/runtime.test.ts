import { describe, expect, it } from 'vitest';

import { kernelModuleRuntime } from '../src/runtime';

describe('KernelOn module runtime', () => {
  it('loads the Wallpaper window by its stable loader key', async () => {
    const module = await kernelModuleRuntime.loadAppWindow('app:wallpaper-window');

    expect(module.default).toBeInstanceOf(Function);
    expect(module.default.name).toBe('WallpaperWindow');
  });

  it('loads the poker lobby by its stable loader key', async () => {
    const module = await kernelModuleRuntime.loadAppWindow('app:poker-lobby-window');

    expect(module.default).toBeInstanceOf(Function);
    expect(module.default.name).toBe('PokerLobbyWindow');
  });
});
