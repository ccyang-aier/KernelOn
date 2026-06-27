import { KernelOnDesktopRuntime } from './runtime/KernelOnDesktopRuntime';

const emptyShellState = {
  apps: [],
  widgets: [],
  screens: [{ id: 'screen-home', name: '', order: 0, items: [] }],
  dockAppIds: [],
};

export function DesktopApp() {
  return <KernelOnDesktopRuntime initialState={emptyShellState} />;
}
