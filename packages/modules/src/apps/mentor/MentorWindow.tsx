import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { LifecycleWorkspace } from '../lifecycle/LifecycleWorkspace';

export default function MentorWindow(props: AppWindowSurfaceProps) {
  return <LifecycleWorkspace initialView="mentor" windowProps={props} />;
}
