import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { MetricRow, ModuleChrome } from '../../components/ModuleChrome';

export default function OnboardingWindow({ app }: AppWindowSurfaceProps) {
  return (
    <ModuleChrome title={app.name} description={app.description}>
      <MetricRow label="当前批次" value="12 人" />
      <MetricRow label="待跟进事项" value="8 项" />
      <MetricRow label="本周完成率" value="76%" />
    </ModuleChrome>
  );
}
