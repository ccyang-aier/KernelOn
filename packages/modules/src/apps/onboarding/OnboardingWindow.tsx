import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { LifecycleWorkspace } from '../lifecycle/LifecycleWorkspace';

export default function OnboardingWindow(props: AppWindowSurfaceProps) {
  return <LifecycleWorkspace initialView="operations" windowProps={props} />;
}
