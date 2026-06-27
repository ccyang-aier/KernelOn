import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { MetricRow, ModuleChrome } from '../../components/ModuleChrome';

export default function DashboardWindow({ app }: AppWindowSurfaceProps) {
  return (
    <ModuleChrome title={app.name} description={app.description}>
      <MetricRow label="整体进度" value="72%" />
      <MetricRow label="风险新人" value="4 人" />
      <MetricRow label="导师容量" value="83%" />
    </ModuleChrome>
  );
}
