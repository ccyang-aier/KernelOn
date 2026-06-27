import { createAppRegistry, closeWindow, focusWindow, openWindow } from '@kernelon/core';
import type { KernelAppManifest, WindowDescriptor } from '@kernelon/core';
import { create } from 'zustand';

import { kernelApps } from '../features/apps';

const appRegistry = createAppRegistry(kernelApps);

export interface ShellState {
  currentScreenId: string;
  windows: WindowDescriptor[];
  launcherOpen: boolean;
  spotlightOpen: boolean;
  dockAppIds: string[];
  apps: KernelAppManifest[];
  openApp(appId: string): void;
  focusWindow(windowId: string): void;
  closeWindow(windowId: string): void;
  toggleLauncher(): void;
  toggleSpotlight(): void;
}

export const useShellStore = create<ShellState>((set) => ({
  currentScreenId: 'screen-home',
  windows: [],
  launcherOpen: false,
  spotlightOpen: false,
  dockAppIds: kernelApps.filter((app) => app.dockedByDefault).map((app) => app.id),
  apps: appRegistry.all(),
  openApp: (appId) => {
    const app = appRegistry.require(appId);

    set((state) => ({
      windows: openWindow(state.windows, app),
      launcherOpen: false,
    }));
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
