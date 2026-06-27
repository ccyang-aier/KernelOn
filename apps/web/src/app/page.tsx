import { defaultDesktopScreens, kernelApps, kernelWidgets } from '@kernelon/catalog';

import { KernelOnWebRuntime } from '../runtime/KernelOnWebRuntime';

export default function Page() {
  return (
    <KernelOnWebRuntime
      initialState={{
        apps: kernelApps,
        widgets: kernelWidgets,
        screens: defaultDesktopScreens,
        dockAppIds: kernelApps.filter((app) => app.dockedByDefault).map((app) => app.id),
      }}
    />
  );
}
