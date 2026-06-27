import type { ComponentType } from 'react';

import type {
  DesktopItem,
  KernelAppManifest,
  WidgetManifest,
  WindowDescriptor,
} from '@kernelon/core';

export interface AppWindowSurfaceProps {
  app: KernelAppManifest;
  window: WindowDescriptor;
}

export interface WidgetSurfaceProps {
  item: DesktopItem;
  widget: WidgetManifest;
}

export interface AppWindowModule {
  default: ComponentType<AppWindowSurfaceProps>;
}

export interface WidgetModule {
  default: ComponentType<WidgetSurfaceProps>;
}

export interface ShellRuntimeRegistry {
  loadAppWindow(loaderKey: string): Promise<AppWindowModule>;
  loadWidget(loaderKey: string): Promise<WidgetModule>;
}
