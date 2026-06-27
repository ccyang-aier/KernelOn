import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { MetricRow, ModuleChrome } from '../../components/ModuleChrome';

export default function MentorWindow({ app }: AppWindowSurfaceProps) {
  return (
    <ModuleChrome title={app.name} description={app.description}>
      <MetricRow label="可用导师" value="18 人" />
      <MetricRow label="高负载导师" value="3 人" />
      <MetricRow label="待匹配新人" value="5 人" />
    </ModuleChrome>
  );
}
