import { KernelOnModuleRuntime } from '@kernelon/modules/runtime';

import { resolveWorkspaceInitialState } from '../../features/workspace/resolve-workspace-entry';

export default function WeeklyShowQualityAssurancePage() {
  return (
    <KernelOnModuleRuntime
      initialState={resolveWorkspaceInitialState({ open: 'weekly-show' })}
    />
  );
}
