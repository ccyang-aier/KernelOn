import { defaultDesktopScreens, kernelApps, kernelWidgets } from '@kernelon/catalog';

import { KernelOnWebRuntime } from '../runtime/KernelOnWebRuntime';

const defaultShellState = {
  apps: kernelApps,
  widgets: kernelWidgets,
  screens: defaultDesktopScreens,
};

export default function Page() {
  return <KernelOnWebRuntime initialState={defaultShellState} />;
}
