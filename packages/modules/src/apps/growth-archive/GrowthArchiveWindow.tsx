import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { LifecycleWorkspace } from '../lifecycle/LifecycleWorkspace';

export default function GrowthArchiveWindow(props: AppWindowSurfaceProps) {
  return <LifecycleWorkspace initialView="growth" windowProps={props} />;
}
