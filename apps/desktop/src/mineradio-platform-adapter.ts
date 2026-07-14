import { invoke } from '@tauri-apps/api/core';
import {
  listen,
  type EventCallback,
  type UnlistenFn,
} from '@tauri-apps/api/event';

import type { MineradioPlatformAdapter } from '@kernelon/modules/runtime';

type MineradioJsonExportRequest = Parameters<
  MineradioPlatformAdapter['files']['exportJsonFile']
>[0];
type MineradioJsonFileResult = Awaited<
  ReturnType<MineradioPlatformAdapter['files']['importJsonFile']>
>;
type MineradioGlobalShortcutAdapter = NonNullable<
  MineradioPlatformAdapter['globalShortcuts']
>;
type MineradioAccountAdapter = NonNullable<MineradioPlatformAdapter['accounts']>;
type MineradioLoginResult = Awaited<
  ReturnType<MineradioAccountAdapter['openNeteaseLogin']>
>;
type MineradioGlobalHotkeyBinding = Parameters<
  MineradioGlobalShortcutAdapter['configure']
>[0][number];
type MineradioGlobalHotkeyConfiguration = Awaited<
  ReturnType<MineradioGlobalShortcutAdapter['configure']>
>;
type MineradioGlobalHotkeyResult = MineradioGlobalHotkeyConfiguration['results'][number];
type MineradioDesktopLyricsAdapter = NonNullable<
  MineradioPlatformAdapter['desktopLyrics']
>;
type MineradioOperationResult = Awaited<
  ReturnType<MineradioDesktopLyricsAdapter['update']>
>;

type InvokeArgs = Record<string, unknown>;

export type MineradioTauriInvoke = <T>(
  command: string,
  args?: InvokeArgs,
) => Promise<T>;
export type MineradioTauriListen = <T>(
  event: string,
  handler: EventCallback<T>,
) => Promise<UnlistenFn>;

export type MineradioTauriAdapterOptions = Readonly<{
  /**
   * KernelOn identity namespace bound to this adapter instance. The shared
   * music module never needs to know about desktop WebView profile storage.
   */
  principal?: string | null;
  /** Native capability probe result supplied by the desktop composition root. */
  wallpaperSupported?: boolean;
}>;

const COMMANDS = {
  clearNeteaseLogin: 'mineradio_clear_netease_login',
  clearQQLogin: 'mineradio_clear_qq_login',
  setDesktopLyricsEnabled: 'mineradio_set_desktop_lyrics_enabled',
  updateDesktopLyrics: 'mineradio_update_desktop_lyrics',
  exportJsonFile: 'mineradio_export_json_file',
  configureGlobalHotkeys: 'mineradio_configure_global_hotkeys',
  importJsonFile: 'mineradio_import_json_file',
  openNeteaseLogin: 'mineradio_open_netease_login',
  openQQLogin: 'mineradio_open_qq_login',
  setWallpaperEnabled: 'mineradio_set_wallpaper_enabled',
  updateWallpaper: 'mineradio_update_wallpaper',
} as const;
const EVENTS = {
  desktopLyricsEnabled: 'mineradio-desktop-lyrics-enabled-state',
  desktopLyricsLock: 'mineradio-desktop-lyrics-lock-state',
  globalHotkey: 'mineradio-global-hotkey',
} as const;

/**
 * Tauri owns native capabilities; the shared Mineradio module owns all player
 * behavior. Capability groups are added here only after their Rust commands
 * exist, so the shared runtime never discovers a half-implemented feature.
 */
export function createTauriMineradioPlatformAdapter(
  invokeCommand: MineradioTauriInvoke = invoke,
  listenEvent: MineradioTauriListen = listen,
  options: MineradioTauriAdapterOptions = {},
): MineradioPlatformAdapter {
  const principal = normalizePrincipal(options.principal);
  const wallpaper: MineradioPlatformAdapter['wallpaper'] =
    options.wallpaperSupported ?? detectWindowsHost()
      ? {
          setEnabled: (enabled, payload) =>
            invokeOperation(invokeCommand, COMMANDS.setWallpaperEnabled, {
              enabled,
              payload,
            }),
          update: (payload) =>
            invokeOperation(invokeCommand, COMMANDS.updateWallpaper, { payload }),
        }
      : undefined;
  return {
    kind: 'tauri',
    accounts: {
      clearNeteaseLogin: () =>
        invokeAccountOperation(invokeCommand, COMMANDS.clearNeteaseLogin, principal),
      clearQQLogin: () =>
        invokeAccountOperation(invokeCommand, COMMANDS.clearQQLogin, principal),
      openNeteaseLogin: () =>
        invokeLogin(invokeCommand, COMMANDS.openNeteaseLogin, principal),
      openQQLogin: () => invokeLogin(invokeCommand, COMMANDS.openQQLogin, principal),
    },
    files: {
      exportJsonFile: (payload) =>
        invokeJsonFileCommand(invokeCommand, COMMANDS.exportJsonFile, { payload }),
      importJsonFile: () =>
        invokeJsonFileCommand(invokeCommand, COMMANDS.importJsonFile),
    },
    desktopLyrics: {
      setEnabled: (enabled, payload) =>
        invokeOperation(invokeCommand, COMMANDS.setDesktopLyricsEnabled, {
          enabled,
          payload,
        }),
      subscribeEnabledState: (callback) =>
        subscribeTauriEvent(
          listenEvent,
          EVENTS.desktopLyricsEnabled,
          parseDesktopLyricsEnabledEvent,
          callback,
        ),
      subscribeLockState: (callback) =>
        subscribeTauriEvent(
          listenEvent,
          EVENTS.desktopLyricsLock,
          parseDesktopLyricsLockEvent,
          callback,
        ),
      update: (payload) =>
        invokeOperation(invokeCommand, COMMANDS.updateDesktopLyrics, { payload }),
    },
    globalShortcuts: {
      configure: (bindings) => configureGlobalHotkeys(invokeCommand, bindings),
      subscribe: (callback) => subscribeGlobalHotkeys(listenEvent, callback),
    },
    ...(wallpaper ? { wallpaper } : {}),
  };
}

async function invokeAccountOperation(
  invokeCommand: MineradioTauriInvoke,
  command: typeof COMMANDS.clearNeteaseLogin | typeof COMMANDS.clearQQLogin,
  principal: string,
): Promise<MineradioOperationResult> {
  try {
    return parseOperationResult(await invokeCommand<unknown>(command, { principal }));
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

async function invokeLogin(
  invokeCommand: MineradioTauriInvoke,
  command: typeof COMMANDS.openNeteaseLogin | typeof COMMANDS.openQQLogin,
  principal: string,
): Promise<MineradioLoginResult> {
  try {
    return parseLoginResult(await invokeCommand<unknown>(command, { principal }));
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

async function invokeJsonFileCommand(
  invokeCommand: MineradioTauriInvoke,
  command: typeof COMMANDS.exportJsonFile | typeof COMMANDS.importJsonFile,
  args?: Readonly<{ payload: MineradioJsonExportRequest }>,
): Promise<MineradioJsonFileResult> {
  try {
    const result = await invokeCommand<unknown>(command, args);
    return parseJsonFileResult(result);
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

async function configureGlobalHotkeys(
  invokeCommand: MineradioTauriInvoke,
  bindings: MineradioGlobalHotkeyBinding[],
): Promise<MineradioGlobalHotkeyConfiguration> {
  const result = await invokeCommand<unknown>(COMMANDS.configureGlobalHotkeys, { bindings });
  return parseGlobalHotkeyConfiguration(result);
}

function subscribeGlobalHotkeys(
  listenEvent: MineradioTauriListen,
  callback: Parameters<MineradioGlobalShortcutAdapter['subscribe']>[0],
): UnlistenFn {
  return subscribeTauriEvent(
    listenEvent,
    EVENTS.globalHotkey,
    parseGlobalHotkeyEvent,
    callback,
  );
}

async function invokeOperation(
  invokeCommand: MineradioTauriInvoke,
  command:
    | typeof COMMANDS.setDesktopLyricsEnabled
    | typeof COMMANDS.updateDesktopLyrics
    | typeof COMMANDS.setWallpaperEnabled
    | typeof COMMANDS.updateWallpaper,
  args: InvokeArgs,
): Promise<MineradioOperationResult> {
  const result = await invokeCommand<unknown>(command, args);
  return parseOperationResult(result);
}

function subscribeTauriEvent<T>(
  listenEvent: MineradioTauriListen,
  eventName: string,
  parsePayload: (payload: unknown) => T | undefined,
  callback: (payload: T) => void,
): UnlistenFn {
  let active = true;
  let unlisten: UnlistenFn | undefined;

  void listenEvent<unknown>(eventName, (event) => {
    if (!active) return;
    const payload = parsePayload(event.payload);
    if (payload) callback(payload);
  }).then(
    (registeredUnlisten) => {
      if (active) {
        unlisten = registeredUnlisten;
      } else {
        registeredUnlisten();
      }
    },
    () => {
      // Subscription has no asynchronous error channel in Mineradio's preload contract.
    },
  );

  return () => {
    if (!active) return;
    active = false;
    unlisten?.();
    unlisten = undefined;
  };
}

function parseOperationResult(value: unknown): MineradioOperationResult {
  if (!isRecord(value) || typeof value.ok !== 'boolean') {
    return { ok: false, error: 'INVALID_TAURI_RESPONSE' };
  }
  return {
    ok: value.ok,
    ...(typeof value.canceled === 'boolean' ? { canceled: value.canceled } : {}),
    ...(typeof value.error === 'string' ? { error: value.error } : {}),
  };
}

function parseLoginResult(value: unknown): MineradioLoginResult {
  if (!isRecord(value) || typeof value.ok !== 'boolean') {
    return { ok: false, error: 'INVALID_TAURI_RESPONSE' };
  }
  return {
    ok: value.ok,
    ...(typeof value.canceled === 'boolean' ? { canceled: value.canceled } : {}),
    ...(typeof value.cookie === 'string' ? { cookie: value.cookie } : {}),
    ...(typeof value.error === 'string' ? { error: value.error } : {}),
    ...(typeof value.message === 'string' ? { message: value.message } : {}),
    ...(typeof value.partial === 'boolean' ? { partial: value.partial } : {}),
    ...(typeof value.reused === 'boolean' ? { reused: value.reused } : {}),
  };
}

function parseJsonFileResult(value: unknown): MineradioJsonFileResult {
  if (!isRecord(value) || typeof value.ok !== 'boolean') {
    return { ok: false, error: 'INVALID_TAURI_RESPONSE' };
  }

  return {
    ok: value.ok,
    ...(typeof value.canceled === 'boolean' ? { canceled: value.canceled } : {}),
    ...(typeof value.error === 'string' ? { error: value.error } : {}),
    ...(typeof value.filePath === 'string' ? { filePath: value.filePath } : {}),
    ...(typeof value.text === 'string' ? { text: value.text } : {}),
  };
}

type GlobalHotkeyConflict = Readonly<{
  reason: string;
  sourceIcon: string;
  sourceName: string;
}>;
type ParsedGlobalHotkeyResult = MineradioGlobalHotkeyResult &
  Readonly<{ conflict?: GlobalHotkeyConflict }>;
type ParsedGlobalHotkeyConfiguration = MineradioGlobalHotkeyConfiguration &
  Readonly<{ ok: true; results: ParsedGlobalHotkeyResult[] }>;

function parseGlobalHotkeyConfiguration(
  value: unknown,
): ParsedGlobalHotkeyConfiguration {
  if (!isRecord(value) || value.ok !== true || !Array.isArray(value.results)) {
    throw new Error('INVALID_TAURI_GLOBAL_HOTKEY_RESPONSE');
  }

  const results = value.results.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.action !== 'string' ||
      typeof item.accelerator !== 'string' ||
      typeof item.ok !== 'boolean'
    ) {
      throw new Error('INVALID_TAURI_GLOBAL_HOTKEY_RESPONSE');
    }

    const conflict = item.conflict;
    if (
      conflict !== undefined &&
      (!isRecord(conflict) ||
        typeof conflict.sourceName !== 'string' ||
        typeof conflict.sourceIcon !== 'string' ||
        typeof conflict.reason !== 'string')
    ) {
      throw new Error('INVALID_TAURI_GLOBAL_HOTKEY_RESPONSE');
    }

    return {
      action: item.action,
      accelerator: item.accelerator,
      ok: item.ok,
      ...(conflict
        ? {
            conflict: {
              reason: conflict.reason as string,
              sourceIcon: conflict.sourceIcon as string,
              sourceName: conflict.sourceName as string,
            },
          }
        : {}),
    };
  });

  return { ok: true, results };
}

function parseGlobalHotkeyEvent(value: unknown): Readonly<{ action: string }> | undefined {
  if (!isRecord(value) || typeof value.action !== 'string' || !value.action) return undefined;
  return { action: value.action };
}

function parseDesktopLyricsEnabledEvent(
  value: unknown,
): Readonly<{ enabled: boolean }> | undefined {
  if (!isRecord(value) || typeof value.enabled !== 'boolean') return undefined;
  return { enabled: value.enabled };
}

function parseDesktopLyricsLockEvent(
  value: unknown,
): Readonly<{ locked: boolean }> | undefined {
  if (!isRecord(value) || typeof value.locked !== 'boolean') return undefined;
  return { locked: value.locked };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : String(error || 'TAURI_INVOKE_FAILED');
}

function normalizePrincipal(principal: string | null | undefined): string {
  const normalized = principal?.trim();
  return normalized ? normalized.slice(0, 512) : 'guest';
}

function detectWindowsHost(): boolean {
  return typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);
}
