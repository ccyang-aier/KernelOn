import { defaultDesktopScreens, kernelApps, kernelWidgets } from '@kernelon/catalog';

import { KernelOnDesktopRuntime } from './runtime/KernelOnDesktopRuntime';

export function DesktopApp() {
  return (
    <KernelOnDesktopRuntime
      initialState={{
        apps: kernelApps,
        widgets: kernelWidgets,
        screens: defaultDesktopScreens,
        dockAppIds: kernelApps.filter((app) => app.dockedByDefault).map((app) => app.id),
      }}
    />
  );
}
