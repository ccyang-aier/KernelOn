import { defaultDesktopScreens, kernelApps, kernelWidgets } from '@kernelon/catalog';

import { KernelOnDesktopRuntime } from './runtime/KernelOnDesktopRuntime';

const defaultShellState = {
  apps: kernelApps,
  widgets: kernelWidgets,
  screens: defaultDesktopScreens,
};

export function DesktopApp() {
  return <KernelOnDesktopRuntime initialState={defaultShellState} />;
}
