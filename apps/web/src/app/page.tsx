import { defaultShellInitialState } from '@kernelon/catalog';
import { KernelOnModuleRuntime } from '@kernelon/modules/runtime';

export default function Page() {
  return <KernelOnModuleRuntime initialState={defaultShellInitialState} />;
}
