import { KernelOnModuleRuntime } from '@kernelon/modules/runtime';

import { resolveWorkspaceInitialState } from '../../features/workspace/resolve-workspace-entry';

export default function MusicQualityAssurancePage() {
  return <KernelOnModuleRuntime initialState={resolveWorkspaceInitialState({ open: 'music' })} />;
}
