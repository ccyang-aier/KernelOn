import { KernelOnShell } from '@kernelon/shell';

import { kernelApps } from '../features/kernel-apps';

export default function Page() {
  return (
    <KernelOnShell
      initialState={{
        apps: kernelApps,
        dockAppIds: kernelApps.filter((app) => app.dockedByDefault).map((app) => app.id),
      }}
    />
  );
}
