import { describe, expect, it, vi } from 'vitest';

import type {
  MineradioGlobalShortcutCapabilities,
  MineradioPlatformAdapter,
} from '../src/apps/music/host/contract';
import {
  getMineradioNativeCapabilityCoordinator,
  releaseMineradioAppCapabilities,
} from '../src/apps/music/host/native-capability-lifecycle';

describe('Mineradio native capability lifecycle', () => {
  it('releases shortcuts and native overlays when its KernelOn window closes', async () => {
    const configure = vi.fn(async () => ({ results: [] }));
    const setDesktopLyricsEnabled = vi.fn(async () => ({ ok: true }));
    const setWallpaperEnabled = vi.fn(async () => ({ ok: true }));
    const adapter = {
      kind: 'tauri',
      files: {
        exportJsonFile: vi.fn(async () => ({ ok: true })),
        importJsonFile: vi.fn(async () => ({ ok: true })),
      },
      globalShortcuts: {
        configure,
        subscribe: vi.fn(() => () => undefined),
      },
      desktopLyrics: {
        setEnabled: setDesktopLyricsEnabled,
        subscribeEnabledState: vi.fn(() => () => undefined),
        subscribeLockState: vi.fn(() => () => undefined),
        update: vi.fn(async () => ({ ok: true })),
      },
      wallpaper: {
        setEnabled: setWallpaperEnabled,
        update: vi.fn(async () => ({ ok: true })),
      },
    } satisfies MineradioPlatformAdapter;

    await releaseMineradioAppCapabilities(adapter);

    expect(configure).toHaveBeenCalledWith([]);
    expect(setDesktopLyricsEnabled).toHaveBeenCalledWith(false, { enabled: false });
    expect(setWallpaperEnabled).toHaveBeenCalledWith(false, { enabled: false });
  });

  it('contains host cleanup failures and handles Web adapters without native capabilities', async () => {
    const adapter = {
      kind: 'web',
      files: {
        exportJsonFile: vi.fn(async () => {
          throw new Error('unused');
        }),
        importJsonFile: vi.fn(async () => ({ ok: false })),
      },
    } satisfies MineradioPlatformAdapter;

    await expect(releaseMineradioAppCapabilities(adapter)).resolves.toBeUndefined();
  });

  it('cancels a StrictMode cleanup when the replacement generation acquires in the same turn', async () => {
    const configure = vi.fn(async () => ({ results: [] }));
    const adapter = createShortcutAdapter(configure);
    const coordinator = getMineradioNativeCapabilityCoordinator(adapter);

    const releaseFirst = coordinator.acquire();
    releaseFirst();
    const releaseReplacement = coordinator.acquire();
    await flushMicrotasks();

    expect(configure).not.toHaveBeenCalled();

    releaseReplacement();
    await flushMicrotasks();

    expect(configure).toHaveBeenCalledOnce();
    expect(configure).toHaveBeenLastCalledWith([]);
  });

  it('serializes a rapid reopen after an in-flight release so the new enabled state wins', async () => {
    let resolveRelease!: (value: { results: [] }) => void;
    const releasePending = new Promise<{ results: [] }>((resolve) => {
      resolveRelease = resolve;
    });
    const configure = vi
      .fn()
      .mockImplementationOnce(() => releasePending)
      .mockImplementation(async () => ({ results: [] }));
    const adapter = createShortcutAdapter(configure);
    const coordinator = getMineradioNativeCapabilityCoordinator(adapter);
    const releaseOldGeneration = coordinator.acquire();

    releaseOldGeneration();
    await flushMicrotasks();
    expect(configure).toHaveBeenCalledWith([]);

    coordinator.acquire();
    const nextBindings = [{ accelerator: 'Ctrl+Alt+Space', action: 'togglePlay' }];
    const enableNewGeneration = coordinator.run(() =>
      adapter.globalShortcuts!.configure(nextBindings),
    );
    expect(configure).toHaveBeenCalledOnce();

    resolveRelease({ results: [] });
    await enableNewGeneration;

    expect(configure).toHaveBeenCalledTimes(2);
    expect(configure).toHaveBeenLastCalledWith(nextBindings);
  });
});

function createShortcutAdapter(configure: MineradioGlobalShortcutCapabilities['configure']) {
  return {
    kind: 'tauri',
    files: {
      exportJsonFile: vi.fn(async () => ({ ok: true })),
      importJsonFile: vi.fn(async () => ({ ok: true })),
    },
    globalShortcuts: {
      configure,
      subscribe: vi.fn(() => () => undefined),
    },
  } as unknown as MineradioPlatformAdapter;
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
