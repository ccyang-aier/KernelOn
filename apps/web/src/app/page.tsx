import { KernelOnWebRuntime } from '../runtime/KernelOnWebRuntime';

const emptyShellState = {
  apps: [],
  widgets: [],
  screens: [{ id: 'screen-home', name: '', order: 0, items: [] }],
  dockAppIds: [],
};

export default function Page() {
  return <KernelOnWebRuntime initialState={emptyShellState} />;
}
