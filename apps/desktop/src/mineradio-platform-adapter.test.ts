import { describe, expect, it, vi } from 'vitest';

import {
  createTauriMineradioPlatformAdapter,
  type MineradioTauriInvoke,
  type MineradioTauriListen,
} from './mineradio-platform-adapter';

describe('createTauriMineradioPlatformAdapter', () => {
  it('maps JSON export/import to the native command contract', async () => {
    const calls: Array<Readonly<{ args?: Record<string, unknown>; command: string }>> = [];
    const invokeCommand: MineradioTauriInvoke = async <T>(
      command: string,
      args?: Record<string, unknown>,
    ) => {
      calls.push({ command, ...(args ? { args } : {}) });
      return (command === 'mineradio_import_json_file'
        ? { ok: true, filePath: 'C:\\music.json', text: '{"volume":80}' }
        : { ok: true, filePath: 'C:\\export.json' }) as T;
    };
    const adapter = createTauriMineradioPlatformAdapter(invokeCommand);

    await expect(
      adapter.files.exportJsonFile({ defaultName: 'music.json', data: { volume: 80 } }),
    ).resolves.toEqual({ ok: true, filePath: 'C:\\export.json' });
    await expect(adapter.files.importJsonFile()).resolves.toEqual({
      ok: true,
      filePath: 'C:\\music.json',
      text: '{"volume":80}',
    });
    expect(calls).toEqual([
      {
        command: 'mineradio_export_json_file',
        args: { payload: { defaultName: 'music.json', data: { volume: 80 } } },
      },
      { command: 'mineradio_import_json_file' },
    ]);
  });

  it('advertises only fully implemented native capability groups', () => {
    const adapter = createTauriMineradioPlatformAdapter(
      async <T>() => ({ ok: true }) as T,
      undefined,
      { wallpaperSupported: true },
    );

    expect(adapter.kind).toBe('tauri');
    expect(adapter.accounts).toEqual({
      clearNeteaseLogin: expect.any(Function),
      clearQQLogin: expect.any(Function),
      openNeteaseLogin: expect.any(Function),
      openQQLogin: expect.any(Function),
    });
    expect(adapter.globalShortcuts).toEqual({
      configure: expect.any(Function),
      subscribe: expect.any(Function),
    });
    expect(adapter.desktopLyrics).toEqual({
      setEnabled: expect.any(Function),
      subscribeEnabledState: expect.any(Function),
      subscribeLockState: expect.any(Function),
      update: expect.any(Function),
    });
    expect(adapter.wallpaper).toEqual({
      setEnabled: expect.any(Function),
      update: expect.any(Function),
    });
    expect(adapter.updater).toBeUndefined();
  });

  it('maps provider login and clear commands without transforming credential contents', async () => {
    const calls: Array<Readonly<{ args?: Record<string, unknown>; command: string }>> = [];
    const invokeCommand: MineradioTauriInvoke = async <T>(
      command: string,
      args?: Record<string, unknown>,
    ) => {
      calls.push({ command, ...(args ? { args } : {}) });
      if (command === 'mineradio_open_netease_login') {
        return {
          ok: true,
          cookie: 'MUSIC_U=owned-secret; __csrf=csrf',
          reused: true,
        } as T;
      }
      if (command === 'mineradio_open_qq_login') {
        return {
          ok: true,
          cookie: 'uin=o00123; p_skey=account-only',
          partial: true,
        } as T;
      }
      return { ok: true } as T;
    };
    const adapter = createTauriMineradioPlatformAdapter(invokeCommand, undefined, {
      principal: 'kernelon-user-42',
    });

    await expect(adapter.accounts!.openNeteaseLogin()).resolves.toEqual({
      ok: true,
      cookie: 'MUSIC_U=owned-secret; __csrf=csrf',
      reused: true,
    });
    await expect(adapter.accounts!.openQQLogin()).resolves.toEqual({
      ok: true,
      cookie: 'uin=o00123; p_skey=account-only',
      partial: true,
    });
    await expect(adapter.accounts!.clearNeteaseLogin()).resolves.toEqual({ ok: true });
    await expect(adapter.accounts!.clearQQLogin()).resolves.toEqual({ ok: true });
    expect(calls).toEqual([
      {
        command: 'mineradio_open_netease_login',
        args: { principal: 'kernelon-user-42' },
      },
      { command: 'mineradio_open_qq_login', args: { principal: 'kernelon-user-42' } },
      {
        command: 'mineradio_clear_netease_login',
        args: { principal: 'kernelon-user-42' },
      },
      { command: 'mineradio_clear_qq_login', args: { principal: 'kernelon-user-42' } },
    ]);
  });

  it('maps desktop lyrics and wallpaper operations to the source-equivalent commands', async () => {
    const calls: Array<Readonly<{ args?: Record<string, unknown>; command: string }>> = [];
    const invokeCommand: MineradioTauriInvoke = async <T>(
      command: string,
      args?: Record<string, unknown>,
    ) => {
      calls.push({ command, ...(args ? { args } : {}) });
      return { ok: true } as T;
    };
    const adapter = createTauriMineradioPlatformAdapter(invokeCommand, undefined, {
      wallpaperSupported: true,
    });
    const lyrics = { enabled: true, text: 'Mineradio', clickThrough: true };
    const wallpaper = { enabled: true, cover: 'https://example.com/cover.jpg', opacity: 0.8 };

    await expect(adapter.desktopLyrics?.setEnabled(true, lyrics)).resolves.toEqual({ ok: true });
    await expect(adapter.desktopLyrics?.update(lyrics)).resolves.toEqual({ ok: true });
    await expect(adapter.wallpaper?.setEnabled(true, wallpaper)).resolves.toEqual({ ok: true });
    await expect(adapter.wallpaper?.update(wallpaper)).resolves.toEqual({ ok: true });
    expect(calls).toEqual([
      {
        command: 'mineradio_set_desktop_lyrics_enabled',
        args: { enabled: true, payload: lyrics },
      },
      { command: 'mineradio_update_desktop_lyrics', args: { payload: lyrics } },
      {
        command: 'mineradio_set_wallpaper_enabled',
        args: { enabled: true, payload: wallpaper },
      },
      { command: 'mineradio_update_wallpaper', args: { payload: wallpaper } },
    ]);
  });

  it('delivers typed desktop lyric enabled and lock state events with cleanup', async () => {
    const emitters = new Map<string, (payload: unknown) => void>();
    const cleanups = new Map<string, ReturnType<typeof vi.fn>>();
    const listenEvent: MineradioTauriListen = (eventName, handler) => {
      emitters.set(eventName, (payload) =>
        handler({ event: eventName, id: 1, payload } as never),
      );
      const cleanup = vi.fn();
      cleanups.set(eventName, cleanup);
      return Promise.resolve(cleanup);
    };
    const adapter = createTauriMineradioPlatformAdapter(
      async <T>() => ({ ok: true }) as T,
      listenEvent,
    );
    const enabled = vi.fn();
    const locked = vi.fn();

    const unsubscribeEnabled = adapter.desktopLyrics!.subscribeEnabledState(enabled);
    const unsubscribeLocked = adapter.desktopLyrics!.subscribeLockState(locked);
    emitters.get('mineradio-desktop-lyrics-enabled-state')?.({ enabled: true });
    emitters.get('mineradio-desktop-lyrics-enabled-state')?.({ enabled: 'yes' });
    emitters.get('mineradio-desktop-lyrics-lock-state')?.({ locked: false });
    expect(enabled).toHaveBeenCalledOnce();
    expect(enabled).toHaveBeenCalledWith({ enabled: true });
    expect(locked).toHaveBeenCalledOnce();
    expect(locked).toHaveBeenCalledWith({ locked: false });

    await Promise.resolve();
    unsubscribeEnabled();
    unsubscribeLocked();
    expect(cleanups.get('mineradio-desktop-lyrics-enabled-state')).toHaveBeenCalledOnce();
    expect(cleanups.get('mineradio-desktop-lyrics-lock-state')).toHaveBeenCalledOnce();
  });

  it('keeps the Mineradio configure request and conflict response wire contract', async () => {
    const calls: Array<Readonly<{ args?: Record<string, unknown>; command: string }>> = [];
    const invokeCommand: MineradioTauriInvoke = async <T>(
      command: string,
      args?: Record<string, unknown>,
    ) => {
      calls.push({ command, ...(args ? { args } : {}) });
      return ({
        ok: true,
        results: [
          {
            action: 'togglePlay',
            accelerator: 'Control+Alt+Space',
            ok: true,
          },
          {
            action: 'nextTrack',
            accelerator: 'Control+Alt+Right',
            ok: false,
            conflict: {
              sourceName: '系统 / 其他软件',
              sourceIcon: 'warning',
              reason: '该组合键已被占用或被系统保留',
            },
          },
        ],
      }) as T;
    };
    const adapter = createTauriMineradioPlatformAdapter(invokeCommand);
    const bindings = [
      { action: 'togglePlay', accelerator: 'Control+Alt+Space' },
      { action: 'nextTrack', accelerator: 'Control+Alt+Right' },
    ];

    await expect(adapter.globalShortcuts?.configure(bindings)).resolves.toEqual({
      ok: true,
      results: [
        { action: 'togglePlay', accelerator: 'Control+Alt+Space', ok: true },
        {
          action: 'nextTrack',
          accelerator: 'Control+Alt+Right',
          ok: false,
          conflict: {
            sourceName: '系统 / 其他软件',
            sourceIcon: 'warning',
            reason: '该组合键已被占用或被系统保留',
          },
        },
      ],
    });
    expect(calls).toEqual([
      {
        command: 'mineradio_configure_global_hotkeys',
        args: { bindings },
      },
    ]);
  });

  it('delivers typed actions and cleans up when unsubscribe races async listen registration', async () => {
    let emitPayload: ((payload: unknown) => void) | undefined;
    let resolveListen: ((unlisten: () => void) => void) | undefined;
    const nativeUnlisten = vi.fn();
    const listenEvent: MineradioTauriListen = (_event, handler) => {
      emitPayload = (payload) =>
        handler({ event: 'mineradio-global-hotkey', id: 1, payload } as never);
      return new Promise((resolve) => {
        resolveListen = resolve;
      });
    };
    const callback = vi.fn();
    const adapter = createTauriMineradioPlatformAdapter(async <T>() => ({ ok: true }) as T, listenEvent);

    const unsubscribe = adapter.globalShortcuts!.subscribe(callback);
    emitPayload?.({ action: 'nextTrack' });
    emitPayload?.({ nope: true });
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith({ action: 'nextTrack' });

    unsubscribe();
    resolveListen?.(nativeUnlisten);
    await Promise.resolve();

    expect(nativeUnlisten).toHaveBeenCalledOnce();
    emitPayload?.({ action: 'prevTrack' });
    expect(callback).toHaveBeenCalledOnce();
  });

  it('turns invoke failures and malformed responses into explicit operation errors', async () => {
    const rejected = createTauriMineradioPlatformAdapter(async () => {
      throw new Error('IPC unavailable');
    });
    const malformed = createTauriMineradioPlatformAdapter(async <T>() => ({ nope: true }) as T);

    await expect(rejected.files.importJsonFile()).resolves.toEqual({
      ok: false,
      error: 'IPC unavailable',
    });
    await expect(malformed.files.importJsonFile()).resolves.toEqual({
      ok: false,
      error: 'INVALID_TAURI_RESPONSE',
    });
  });

  it('uses a stable guest principal and does not expose unsupported wallpaper hosts', async () => {
    const calls: Array<Readonly<{ args?: Record<string, unknown>; command: string }>> = [];
    const invokeCommand: MineradioTauriInvoke = async <T>(
      command: string,
      args?: Record<string, unknown>,
    ) => {
      calls.push({ command, ...(args ? { args } : {}) });
      return { ok: true, canceled: true } as T;
    };
    const adapter = createTauriMineradioPlatformAdapter(invokeCommand);

    expect(adapter.wallpaper).toBeUndefined();
    await adapter.accounts!.openNeteaseLogin();
    expect(calls).toEqual([
      { command: 'mineradio_open_netease_login', args: { principal: 'guest' } },
    ]);
  });
});
