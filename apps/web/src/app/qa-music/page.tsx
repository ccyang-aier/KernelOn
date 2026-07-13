import { KernelOnModuleRuntime } from '@kernelon/modules/runtime';

import { resolveWorkspaceInitialState } from '../../features/workspace/resolve-workspace-entry';

export default function MusicQaPage() {
  return <KernelOnModuleRuntime initialState={resolveWorkspaceInitialState({ open: 'music' })} />;
}
