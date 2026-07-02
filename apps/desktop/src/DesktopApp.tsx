import { defaultShellInitialState } from '@kernelon/catalog';
import { KernelOnModuleRuntime } from '@kernelon/modules/runtime';

export function DesktopApp() {
  return <KernelOnModuleRuntime initialState={defaultShellInitialState} />;
}
