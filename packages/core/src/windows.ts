import type { AppHeaderDescriptor } from './app-header';
import type { WindowOpenIntent } from './app-intents';
import type { KernelAppManifest, WindowDescriptor } from './types';

const DEFAULT_MIN_WINDOW_WIDTH = 520;
const DEFAULT_MIN_WINDOW_HEIGHT = 360;

export interface OpenWindowOptions {
  id?: string;
  header?: AppHeaderDescriptor;
  intent?: WindowOpenIntent;
  title?: string;
  createdAt?: number;
}

export interface RestoreWindowOptions {
  header?: AppHeaderDescriptor;
  intent?: WindowOpenIntent;
  title?: string;
}

export interface ResizeWindowOptions {
  minWidth?: number;
  minHeight?: number;
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
    ...(options.header ?? app.defaultWindow.header
      ? { header: options.header ?? app.defaultWindow.header }
      : {}),
    ...(options.intent ? { intent: options.intent } : {}),
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

export function minimizeWindow(windows: WindowDescriptor[], windowId: string): WindowDescriptor[] {
  return windows.map((window) =>
    window.id === windowId ? { ...window, status: 'minimized' } : window,
  );
}

export function restoreWindow(
  windows: WindowDescriptor[],
  windowId: string,
  options: RestoreWindowOptions = {},
): WindowDescriptor[] {
  if (!windows.some((window) => window.id === windowId)) {
    return windows;
  }

  const zIndex = nextZIndex(windows);

  return windows.map((window) => {
    if (window.id === windowId) {
      return {
        ...window,
        ...(options.header ? { header: options.header } : {}),
        ...(options.intent ? { intent: options.intent } : {}),
        ...(options.title ? { title: options.title } : {}),
        status: 'active',
        zIndex,
      };
    }

    return window.status === 'minimized' ? window : { ...window, status: 'inactive' };
  });
}

export function resizeWindow(
  windows: WindowDescriptor[],
  windowId: string,
  bounds: WindowDescriptor['bounds'],
  options: ResizeWindowOptions = {},
): WindowDescriptor[] {
  const minWidth = options.minWidth ?? DEFAULT_MIN_WINDOW_WIDTH;
  const minHeight = options.minHeight ?? DEFAULT_MIN_WINDOW_HEIGHT;
  const nextBounds = {
    ...bounds,
    width: Math.max(minWidth, bounds.width),
    height: Math.max(minHeight, bounds.height),
  };

  return windows.map((window) => {
    if (window.id !== windowId) {
      return window;
    }

    return {
      ...window,
      bounds: nextBounds,
      mode: 'windowed',
      restoreBounds: undefined,
    };
  });
}

export function toggleWindowFullscreen(
  windows: WindowDescriptor[],
  windowId: string,
  fullscreenBounds: WindowDescriptor['bounds'],
): WindowDescriptor[] {
  if (!windows.some((window) => window.id === windowId)) {
    return windows;
  }

  const zIndex = nextZIndex(windows);

  return windows.map((window) => {
    if (window.id !== windowId) {
      return window.status === 'minimized' ? window : { ...window, status: 'inactive' };
    }

    if (window.mode === 'fullscreen') {
      const previousBounds = window.restoreBounds ?? window.bounds;

      return {
        ...window,
        bounds: previousBounds,
        mode: 'windowed',
        restoreBounds: undefined,
        status: 'active',
        zIndex,
      };
    }

    return {
      ...window,
      bounds: fullscreenBounds,
      restoreBounds: window.bounds,
      mode: 'fullscreen',
      status: 'active',
      zIndex,
    };
  });
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
