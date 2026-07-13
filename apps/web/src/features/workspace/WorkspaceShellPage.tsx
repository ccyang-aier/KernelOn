import { KernelOnModuleRuntime } from '@kernelon/modules/runtime';
import { redirect } from 'next/navigation';

import {
  resolveWorkspaceInitialState,
  type WorkspaceSearchParams,
} from './resolve-workspace-entry';
import { requireSession } from '../../server/auth/session';

export interface WorkspacePageProps {
  searchParams?: Promise<WorkspaceSearchParams> | WorkspaceSearchParams;
}

export async function WorkspaceShellPage({ searchParams }: WorkspacePageProps = {}) {
  const [resolvedSearchParams, user] = await Promise.all([
    Promise.resolve(searchParams),
    requireSession('/workspace'),
  ]);
  const initialState = resolveWorkspaceInitialState(resolvedSearchParams);
  if (user.mustChangePassword) {
    redirect('/change-password');
  }

  return <KernelOnModuleRuntime currentUser={user} initialState={initialState} />;
}
