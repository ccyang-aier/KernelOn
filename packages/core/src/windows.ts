import type { KernelAppManifest, WindowDescriptor } from './types';

export interface OpenWindowOptions {
  id?: string;
  title?: string;
  createdAt?: number;
}

export function openWindow(
  windows: WindowDescriptor[],
  app: KernelAppManifest,
  options: OpenWindowOptions = {},
): WindowDescriptor[] {
  const zIndex = nextZIndex(windows);
  const id = options.id ?? createWindowId(app.id, windows.length + 1);

  const nextWindow: WindowDescriptor = {
    id,
    appId: app.id,
    title: options.title ?? app.defaultWindow.title ?? app.name,
    bounds: app.defaultWindow.bounds,
    zIndex,
    status: 'active',
    createdAt: options.createdAt ?? Date.now(),
  };

  return [...deactivateWindows(windows), nextWindow];
}

export function focusWindow(windows: WindowDescriptor[], windowId: string): WindowDescriptor[] {
  if (!windows.some((window) => window.id === windowId)) {
    return windows;
  }

  const zIndex = nextZIndex(windows);

  return windows.map((window) => {
    if (window.id === windowId) {
      return { ...window, status: 'active', zIndex };
    }

    return window.status === 'minimized' ? window : { ...window, status: 'inactive' };
  });
}

export function closeWindow(windows: WindowDescriptor[], windowId: string): WindowDescriptor[] {
  return windows.filter((window) => window.id !== windowId);
}

function deactivateWindows(windows: WindowDescriptor[]): WindowDescriptor[] {
  return windows.map((window) =>
    window.status === 'minimized' ? window : { ...window, status: 'inactive' },
  );
}

function nextZIndex(windows: WindowDescriptor[]): number {
  return Math.max(0, ...windows.map((window) => window.zIndex)) + 1;
}

function createWindowId(appId: string, sequence: number): string {
  return `${appId}-window-${sequence}`;
}
