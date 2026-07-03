'use client';

import {
  closeWindow,
  createAppRegistry,
  createAppOpenCommands,
  createDefaultDesktopScreen,
  focusWindow,
  minimizeWindow,
  openWindow,
  resizeWindow,
  restoreWindow,
  toggleWindowFullscreen,
} from '@kernelon/core';
import type {
  CommandDefinition,
  DesktopScreen,
  KernelAppManifest,
  WidgetManifest,
  WindowBounds,
  WindowDescriptor,
} from '@kernelon/core';
import { createStore } from 'zustand/vanilla';

export interface ShellInitialState {
  currentScreenId?: string;
  windows?: WindowDescriptor[];
  launcherOpen?: boolean;
  spotlightOpen?: boolean;
  dockAppIds?: string[];
  apps: KernelAppManifest[];
  widgets?: WidgetManifest[];
  commands?: CommandDefinition[];
  screens?: DesktopScreen[];
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
  openApp(appId: string): void;
  focusWindow(windowId: string): void;
  closeWindow(windowId: string): void;
  minimizeWindow(windowId: string): void;
  resizeWindow(windowId: string, bounds: WindowBounds): void;
  toggleWindowFullscreen(windowId: string, fullscreenBounds: WindowBounds): void;
  toggleLauncher(): void;
  toggleSpotlight(): void;
}

export type ShellStore = ReturnType<typeof createShellStore>;

export function createShellStore(initialState: ShellInitialState) {
  const appRegistry = createAppRegistry(initialState.apps);
  const currentScreenId = initialState.currentScreenId ?? 'screen-home';

  return createStore<ShellState>()((set) => ({
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
    screens: initialState.screens ?? [
      createDefaultDesktopScreen([], {
        screenId: currentScreenId,
        screenName: '新员工工作台',
      }),
    ],
    openApp: (appId) => {
      const app = appRegistry.require(appId);

      set((state) => {
        const existingWindow = state.windows.find((window) => window.appId === app.id);

        return {
          windows: existingWindow
            ? restoreWindow(state.windows, existingWindow.id)
            : openWindow(state.windows, app),
          launcherOpen: false,
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
