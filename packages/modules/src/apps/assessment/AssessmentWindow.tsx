import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { LifecycleWorkspace } from '../lifecycle/LifecycleWorkspace';

export default function AssessmentWindow(props: AppWindowSurfaceProps) {
  return <LifecycleWorkspace initialView="assessment" windowProps={props} />;
}
