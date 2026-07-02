import type { DesktopScreen, KernelAppManifest, WidgetManifest } from '@kernelon/core';

import { kernelApps } from './apps';
import { defaultDesktopScreens } from './default-desktop';
import { kernelWidgets } from './widgets';

export interface KernelOnDefaultShellState {
  apps: KernelAppManifest[];
  widgets: WidgetManifest[];
  screens: DesktopScreen[];
}

export const defaultShellInitialState: KernelOnDefaultShellState = {
  apps: kernelApps,
  widgets: kernelWidgets,
  screens: defaultDesktopScreens,
};
