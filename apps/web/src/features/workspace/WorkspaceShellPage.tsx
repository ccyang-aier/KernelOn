import { KernelOnModuleRuntime } from '@kernelon/modules/runtime';

import {
  resolveWorkspaceInitialState,
  type WorkspaceSearchParams,
} from './resolve-workspace-entry';

export interface WorkspacePageProps {
  searchParams?: Promise<WorkspaceSearchParams> | WorkspaceSearchParams;
}

export async function WorkspaceShellPage({ searchParams }: WorkspacePageProps = {}) {
  const initialState = resolveWorkspaceInitialState(await Promise.resolve(searchParams));

  return <KernelOnModuleRuntime initialState={initialState} />;
}
