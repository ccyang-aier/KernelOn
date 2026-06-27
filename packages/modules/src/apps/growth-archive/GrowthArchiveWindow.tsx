import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { MetricRow, ModuleChrome } from '../../components/ModuleChrome';

export default function GrowthArchiveWindow({ app }: AppWindowSurfaceProps) {
  return (
    <ModuleChrome title={app.name} description={app.description}>
      <MetricRow label="已建档新人" value="42 人" />
      <MetricRow label="本月里程碑" value="19 条" />
    </ModuleChrome>
  );
}
