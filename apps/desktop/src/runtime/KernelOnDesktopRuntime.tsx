'use client';

import { kernelModuleRuntime } from '@kernelon/modules/runtime';
import { KernelOnShell, type ShellInitialState } from '@kernelon/shell';

export function KernelOnDesktopRuntime({
  initialState,
}: Readonly<{ initialState: ShellInitialState }>) {
  return <KernelOnShell initialState={initialState} runtime={kernelModuleRuntime} />;
}
