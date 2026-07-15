import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { LifecycleWorkspace } from '../lifecycle/LifecycleWorkspace';

export default function DashboardWindow(props: AppWindowSurfaceProps) {
  return <LifecycleWorkspace initialView="dashboard" windowProps={props} />;
}
