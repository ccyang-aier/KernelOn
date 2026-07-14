'use client';

import {
  addDesktopWidgetItem,
  closeWindow,
  createAppRegistry,
  createAppOpenCommands,
  createDefaultDesktopScreen,
  focusWindow,
  minimizeWindow,
  moveDesktopItem as moveDesktopLayoutItem,
  openWindow,
  removeDesktopItem as removeDesktopLayoutItem,
  resizeWindow,
  restoreWindow,
  toggleWindowFullscreen,
  toWindowOpenIntent,
} from '@kernelon/core';
import type {
  AppOpenIntent,
  CommandDefinition,
  DesktopGridArea,
  DesktopScreen,
  KernelAppManifest,
  WidgetManifest,
  WindowBounds,
  WindowDescriptor,
  WindowOpenIntent,
} from '@kernelon/core';
import { createStore } from 'zustand/vanilla';

import { kernelOnDesktopWallpaper } from './visual-assets';
import type { DesktopWallpaper } from './wallpaper';

const desktopLockStorageKey = 'kernelon_wallpaper_lock_screen';
export const defaultDesktopLockIdleMinutes = 15;

export interface ShellInitialState {
  currentScreenId?: string;
  desktopWallpaper?: DesktopWallpaper;
  windows?: WindowDescriptor[];
  launcherOpen?: boolean;
  spotlightOpen?: boolean;
  dockAppIds?: string[];
  apps: KernelAppManifest[];
  widgets?: WidgetManifest[];
  commands?: CommandDefinition[];
  screens?: DesktopScreen[];
}

export interface PendingWidgetPlacement {
  widgetId: string;
  width: number;
  height: number;
}

export interface ShellState {
  currentScreenId: string;
  windows: WindowDescriptor[];
  launcherOpen: boolean;
  spotlightOpen: boolean;
  dockAppIds: string[];
  apps: KernelAppManifest[];
  widgets: WidgetManifest[];
  commands: CommandDefinition[];
  screens: DesktopScreen[];
  desktopWallpaper: DesktopWallpaper;
  desktopLockPassword: string | null;
  desktopLockIdleMinutes: number;
  isDesktopLocked: boolean;
  activeDraggedDesktopItemId: string | null;
  pendingWidgetPlacement: PendingWidgetPlacement | null;
  addWidgetToScreen(screenId: string, widgetId: string, grid: DesktopGridArea): void;
  moveDesktopItem(screenId: string, itemId: string, grid: DesktopGridArea): void;
  removeDesktopItem(screenId: string, itemId: string): void;
  setActiveDraggedDesktopItemId(itemId: string | null): void;
  setDesktopWallpaper(wallpaper: DesktopWallpaper): void;
  lockDesktop(password: string, idleMinutes?: number): void;
  activateDesktopLock(): void;
  disableDesktopLock(): void;
  restoreDesktopLock(password: string, idleMinutes?: number): void;
  setDesktopLockIdleMinutes(idleMinutes: number): void;
  unlockDesktop(password: string): boolean;
  setPendingWidgetPlacement(item: PendingWidgetPlacement | null): void;
  openApp(appId: string, options?: OpenShellAppOptions): void;
  openAppIntent(intent: AppOpenIntent): void;
  focusWindow(windowId: string): void;
  closeWindow(windowId: string): void;
  minimizeWindow(windowId: string): void;
  resizeWindow(windowId: string, bounds: WindowBounds): void;
  toggleWindowFullscreen(windowId: string, fullscreenBounds: WindowBounds): void;
  toggleLauncher(): void;
  toggleSpotlight(): void;
}

export interface OpenShellAppOptions {
  intent?: WindowOpenIntent;
  title?: string;
}

export type ShellStore = ReturnType<typeof createShellStore>;

export function createShellStore(initialState: ShellInitialState) {
  const appRegistry = createAppRegistry(initialState.apps);
  const currentScreenId = initialState.currentScreenId ?? 'screen-home';

  return createStore<ShellState>()((set, get) => ({
    currentScreenId,
    windows: initialState.windows ?? [],
    launcherOpen: initialState.launcherOpen ?? false,
    spotlightOpen: initialState.spotlightOpen ?? false,
    dockAppIds:
      initialState.dockAppIds ??
      initialState.apps.filter((app) => app.dockedByDefault).map((app) => app.id),
    apps: appRegistry.all(),
    widgets: initialState.widgets ?? [],
    commands: initialState.commands ?? createAppOpenCommands(appRegistry.all()),
    desktopWallpaper: initialState.desktopWallpaper ?? kernelOnDesktopWallpaper,
    desktopLockPassword: null,
    desktopLockIdleMinutes: defaultDesktopLockIdleMinutes,
    isDesktopLocked: false,
    screens: initialState.screens ?? [
      createDefaultDesktopScreen([], {
        screenId: currentScreenId,
        screenName: '新员工工作台',
      }),
    ],
    activeDraggedDesktopItemId: null,
    pendingWidgetPlacement: null,
    addWidgetToScreen: (screenId, widgetId, grid) => {
      set((state) => {
        const widget = state.widgets.find((candidate) => candidate.id === widgetId);

        if (!widget) {
          return {};
        }

        return {
          screens: state.screens.map((screen) =>
            screen.id === screenId
              ? {
                  ...screen,
                  items: addDesktopWidgetItem(screen.items, widget, screenId, grid),
                }
              : screen,
          ),
        };
      });
    },
    moveDesktopItem: (screenId, itemId, grid) => {
      set((state) => ({
        screens: state.screens.map((screen) =>
          screen.id === screenId
            ? { ...screen, items: moveDesktopLayoutItem(screen.items, itemId, grid) }
            : screen,
        ),
      }));
    },
    removeDesktopItem: (screenId, itemId) => {
      set((state) => ({
        screens: state.screens.map((screen) =>
          screen.id === screenId
            ? { ...screen, items: removeDesktopLayoutItem(screen.items, itemId) }
            : screen,
        ),
      }));
    },
    setActiveDraggedDesktopItemId: (itemId) => {
      set({ activeDraggedDesktopItemId: itemId });
    },
    setDesktopWallpaper: (wallpaper) => {
      set({ desktopWallpaper: wallpaper });
    },
    lockDesktop: (password, idleMinutes = get().desktopLockIdleMinutes) => {
      const normalizedIdleMinutes = normalizeDesktopLockIdleMinutes(idleMinutes);
      set({
        desktopLockIdleMinutes: normalizedIdleMinutes,
        desktopLockPassword: password,
        isDesktopLocked: true,
      });
      persistDesktopLock(password, normalizedIdleMinutes);
    },
    activateDesktopLock: () => {
      if (get().desktopLockPassword) {
        set({ isDesktopLocked: true });
      }
    },
    disableDesktopLock: () => {
      set({
        desktopLockIdleMinutes: defaultDesktopLockIdleMinutes,
        desktopLockPassword: null,
        isDesktopLocked: false,
      });
      removePersistedDesktopLock();
    },
    restoreDesktopLock: (password, idleMinutes = defaultDesktopLockIdleMinutes) => {
      const normalizedIdleMinutes = normalizeDesktopLockIdleMinutes(idleMinutes);
      set({
        desktopLockIdleMinutes: normalizedIdleMinutes,
        desktopLockPassword: password,
        isDesktopLocked: false,
      });
      persistDesktopLock(password, normalizedIdleMinutes);
    },
    setDesktopLockIdleMinutes: (idleMinutes) => {
      const normalizedIdleMinutes = normalizeDesktopLockIdleMinutes(idleMinutes);
      const password = get().desktopLockPassword;
      set({ desktopLockIdleMinutes: normalizedIdleMinutes });

      if (password) {
        persistDesktopLock(password, normalizedIdleMinutes);
      }
    },
    unlockDesktop: (password) => {
      if (password !== get().desktopLockPassword) {
        return false;
      }

      set({ isDesktopLocked: false });
      return true;
    },
    setPendingWidgetPlacement: (item) => {
      set({ pendingWidgetPlacement: item });
    },
    openApp: (appId, options = {}) => {
      const app = appRegistry.require(appId);

      set((state) => {
        const existingWindow = state.windows.find((window) => window.appId === app.id);

        return {
          windows: existingWindow
            ? restoreWindow(state.windows, existingWindow.id, {
                intent: options.intent,
                title: options.title,
              })
            : openWindow(state.windows, app, {
                intent: options.intent,
                title: options.title,
              }),
          launcherOpen: false,
        };
      });
    },
    openAppIntent: (intent) => {
      const app = appRegistry.require(intent.appId);

      set((state) => {
        const existingWindow = state.windows.find((window) => window.appId === app.id);
        const windowIntent = toWindowOpenIntent(intent);

        return {
          windows: existingWindow
            ? restoreWindow(state.windows, existingWindow.id, { intent: windowIntent })
            : openWindow(state.windows, app, { intent: windowIntent }),
          launcherOpen: false,
          spotlightOpen: false,
        };
      });
    },
    focusWindow: (windowId) => {
      set((state) => ({
        windows: focusWindow(state.windows, windowId),
      }));
    },
    closeWindow: (windowId) => {
      set((state) => ({
        windows: closeWindow(state.windows, windowId),
      }));
    },
    minimizeWindow: (windowId) => {
      set((state) => ({
        windows: minimizeWindow(state.windows, windowId),
      }));
    },
    resizeWindow: (windowId, bounds) => {
      set((state) => ({
        windows: resizeWindow(state.windows, windowId, bounds),
      }));
    },
    toggleWindowFullscreen: (windowId, fullscreenBounds) => {
      set((state) => ({
        windows: toggleWindowFullscreen(state.windows, windowId, fullscreenBounds),
      }));
    },
    toggleLauncher: () => {
      set((state) => ({
        launcherOpen: !state.launcherOpen,
      }));
    },
    toggleSpotlight: () => {
      set((state) => ({
        spotlightOpen: !state.spotlightOpen,
      }));
    },
  }));
}

export function normalizeDesktopLockIdleMinutes(idleMinutes: number) {
  if (!Number.isFinite(idleMinutes)) {
    return defaultDesktopLockIdleMinutes;
  }

  return Math.min(120, Math.max(1, Math.round(idleMinutes)));
}

function persistDesktopLock(password: string, idleMinutes: number) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    desktopLockStorageKey,
    JSON.stringify({ enabled: true, idleMinutes, password, version: 2 }),
  );
}

function removePersistedDesktopLock() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(desktopLockStorageKey);
  }
}
