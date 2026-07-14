'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import type { WindowDescriptor } from '@kernelon/core';
import { useAppWindowHost } from '@kernelon/shell';

import { useKernelOnRuntimeConfig } from '../../../runtime-config';
import { createBrowserBeatmapCache } from './beatmap-cache';
import type {
  MineradioDesktopWindowFacade,
  MineradioDesktopWindowState,
  MineradioHost,
  MineradioPlatformAdapter,
} from './contract';
import { createBrowserDjAnalyzer } from './dj-analyzer';
import {
  getMineradioNativeCapabilityCoordinator,
  type MineradioNativeCapabilityCoordinator,
} from './native-capability-lifecycle';
import { createNamespacedStorage } from './namespaced-storage';
import { createNamespacedIndexedDb } from './namespaced-indexed-db';
import { createMineradioTransport } from './transport';

/**
 * Composes Mineradio's platform-neutral compatibility host. KernelOn virtual
 * window semantics are shared by Web and Tauri; native capabilities are
 * supplied by the platform adapter at the app composition root.
 */
export function useMineradioHost(descriptor: WindowDescriptor): MineradioHost {
  const appWindow = useAppWindowHost();
  const runtimeConfig = useKernelOnRuntimeConfig();
  const platformAdapter = runtimeConfig.mineradioPlatformAdapter;
  const beatmapCache = useMemo(
    () =>
      typeof window.indexedDB === 'undefined'
        ? undefined
        : createBrowserBeatmapCache(window.indexedDB),
    [],
  );
  const djAnalyzer = useMemo(
    () => createBrowserDjAnalyzer(runtimeConfig.apiBaseUrl),
    [runtimeConfig.apiBaseUrl],
  );
  const localStorage = useMemo(
    () => createNamespacedStorage(window.localStorage, runtimeConfig.mineradioStorageNamespace),
    [runtimeConfig.mineradioStorageNamespace],
  );
  const indexedDB = useMemo(
    () =>
      typeof window.indexedDB === 'undefined'
        ? undefined
        : createNamespacedIndexedDb(window.indexedDB, runtimeConfig.mineradioStorageNamespace),
    [runtimeConfig.mineradioStorageNamespace],
  );
  const apiFetch = useMemo(
    () => runtimeConfig.apiFetch ?? window.fetch.bind(window),
    [runtimeConfig.apiFetch],
  );

  useEffect(() => () => beatmapCache?.close(), [beatmapCache]);
  const [windowController] = useState(() => new MineradioWindowController(appWindow, descriptor));
  const capabilityCoordinator = useMemo(
    () => getMineradioNativeCapabilityCoordinator(platformAdapter),
    [platformAdapter],
  );

  useLayoutEffect(() => {
    windowController.update(appWindow, descriptor);
  }, [appWindow, descriptor, windowController]);

  const desktopWindow = useMemo<MineradioDesktopWindowFacade>(
    () =>
      createDesktopWindowFacade({
        capabilityCoordinator,
        platformAdapter,
        windowController,
      }),
    [capabilityCoordinator, platformAdapter, windowController],
  );

  useEffect(() => {
    const updatePlatformState = () => {
      windowController.setPlatformState({
        focused: document.hasFocus(),
        visible: !document.hidden,
      });
      windowController.notify();
    };

    window.addEventListener('focus', updatePlatformState);
    window.addEventListener('blur', updatePlatformState);
    document.addEventListener('visibilitychange', updatePlatformState);

    return () => {
      window.removeEventListener('focus', updatePlatformState);
      window.removeEventListener('blur', updatePlatformState);
      document.removeEventListener('visibilitychange', updatePlatformState);
    };
  }, [windowController]);

  useEffect(() => {
    windowController.notify();
  }, [descriptor.mode, descriptor.status, windowController]);

  const transport = useMemo(
    () =>
      createMineradioTransport({
        apiBaseUrl: runtimeConfig.apiBaseUrl,
        beatmapCache,
        djAnalyzer,
        fetch: apiFetch,
      }),
    [apiFetch, beatmapCache, djAnalyzer, runtimeConfig.apiBaseUrl],
  );

  return useMemo(
    () => ({
      acquireAppCapabilities() {
        return capabilityCoordinator.acquire();
      },
      bindWindowChrome(root: HTMLElement) {
        const dragRegion = root.querySelector<HTMLElement>('.desktop-drag-region');
        if (!dragRegion) return () => undefined;

        const beginMove = (event: PointerEvent) => {
          if (event.button !== 0) return;
          windowController.appWindow.onBeginMove(
            event as unknown as ReactPointerEvent<HTMLElement>,
          );
        };
        const toggleMaximize = (event: MouseEvent) => {
          if (event.button !== 0) return;
          event.preventDefault();
          windowController.appWindow.onToggleFullscreen();
        };

        dragRegion.addEventListener('pointerdown', beginMove);
        dragRegion.addEventListener('dblclick', toggleMaximize);
        return () => {
          dragRegion.removeEventListener('pointerdown', beginMove);
          dragRegion.removeEventListener('dblclick', toggleMaximize);
        };
      },
      desktopWindow,
      fetch: transport,
      indexedDB,
      localStorage,
    }),
    [capabilityCoordinator, desktopWindow, indexedDB, localStorage, transport, windowController],
  );
}

export { releaseMineradioAppCapabilities } from './native-capability-lifecycle';

interface DesktopWindowFacadeOptions {
  capabilityCoordinator: MineradioNativeCapabilityCoordinator;
  platformAdapter: MineradioPlatformAdapter;
  windowController: MineradioWindowController;
}

function createDesktopWindowFacade({
  capabilityCoordinator,
  platformAdapter,
  windowController,
}: DesktopWindowFacadeOptions): MineradioDesktopWindowFacade {
  const getState = () => windowController.state;
  const { accounts, desktopLyrics, files, globalShortcuts, updater, wallpaper } = platformAdapter;

  return {
    isDesktop: true,
    async close() {
      windowController.appWindow.onClose();
    },
    async exitFullscreenWindowed() {
      if (windowController.descriptor.mode === 'fullscreen') {
        windowController.appWindow.onToggleFullscreen();
      }
    },
    exportJsonFile: (payload) => files.exportJsonFile(payload),
    async getState() {
      return getState();
    },
    importJsonFile: () => files.importJsonFile(),
    async minimize() {
      windowController.appWindow.onMinimize(windowController.appWindow.getSourceElement());
    },
    onStateChange(callback) {
      return windowController.subscribe(callback);
    },
    async toggleFullscreen() {
      windowController.appWindow.onToggleFullscreen();
    },
    async toggleMaximize() {
      windowController.appWindow.onToggleFullscreen();
    },
    ...(accounts
      ? {
          clearNeteaseMusicLogin: () => accounts.clearNeteaseLogin(),
          clearQQMusicLogin: () => accounts.clearQQLogin(),
          openNeteaseMusicLogin: () => accounts.openNeteaseLogin(),
          openQQMusicLogin: () => accounts.openQQLogin(),
        }
      : {}),
    ...(globalShortcuts
      ? {
          configureGlobalHotkeys: (bindings) =>
            capabilityCoordinator.run(() => globalShortcuts.configure(bindings)),
          onGlobalHotkey: (callback) => globalShortcuts.subscribe(callback),
        }
      : {}),
    ...(desktopLyrics
      ? {
          onDesktopLyricsEnabledState: (callback) => desktopLyrics.subscribeEnabledState(callback),
          onDesktopLyricsLockState: (callback) => desktopLyrics.subscribeLockState(callback),
          setDesktopLyricsEnabled: (enabled, payload) =>
            capabilityCoordinator.run(() => desktopLyrics.setEnabled(enabled, payload)),
          updateDesktopLyrics: (payload) => desktopLyrics.update(payload),
        }
      : {}),
    ...(wallpaper
      ? {
          setWallpaperMode: (enabled, payload) =>
            capabilityCoordinator.run(() => wallpaper.setEnabled(enabled, payload)),
          updateWallpaperMode: (payload) => wallpaper.update(payload),
        }
      : {}),
    ...(updater
      ? {
          openUpdateInstaller: (filePath) => updater.openInstaller(filePath),
          restartApp: () => updater.restart(),
        }
      : {}),
  };
}

type AppWindowHost = ReturnType<typeof useAppWindowHost>;

class MineradioWindowController {
  appWindow: AppWindowHost;
  descriptor: WindowDescriptor;
  #platformState = { focused: document.hasFocus(), visible: !document.hidden };
  readonly #subscribers = new Set<(state: MineradioDesktopWindowState) => void>();

  constructor(appWindow: AppWindowHost, descriptor: WindowDescriptor) {
    this.appWindow = appWindow;
    this.descriptor = descriptor;
  }

  get state(): MineradioDesktopWindowState {
    return resolveDesktopWindowState(this.descriptor, this.#platformState);
  }

  notify(): void {
    const state = this.state;
    for (const subscriber of this.#subscribers) subscriber(state);
  }

  setPlatformState(state: { focused: boolean; visible: boolean }): void {
    this.#platformState = state;
  }

  subscribe(callback: (state: MineradioDesktopWindowState) => void): () => void {
    this.#subscribers.add(callback);
    return () => this.#subscribers.delete(callback);
  }

  update(appWindow: AppWindowHost, descriptor: WindowDescriptor): void {
    this.appWindow = appWindow;
    this.descriptor = descriptor;
  }
}

function resolveDesktopWindowState(
  descriptor: WindowDescriptor,
  platform: { focused: boolean; visible: boolean },
): MineradioDesktopWindowState {
  const fullscreen = descriptor.mode === 'fullscreen';
  const minimized = descriptor.status === 'minimized';

  return {
    hasDisplayOnLeft: false,
    isFocused: descriptor.status === 'active' && platform.focused,
    isFullScreen: fullscreen,
    isHtmlFullScreen: false,
    isMaximized: fullscreen,
    isMinimized: minimized,
    isNativeFullScreen: false,
    isPrimaryDisplay: true,
    isVisible: !minimized && platform.visible,
    isWindowFullScreen: fullscreen,
  };
}
