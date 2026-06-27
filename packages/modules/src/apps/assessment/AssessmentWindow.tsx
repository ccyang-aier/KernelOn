import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { MetricRow, ModuleChrome } from '../../components/ModuleChrome';

export default function AssessmentWindow({ app }: AppWindowSurfaceProps) {
  return (
    <ModuleChrome title={app.name} description={app.description}>
      <MetricRow label="待评估阶段" value="4 个" />
      <MetricRow label="已归档结果" value="27 份" />
    </ModuleChrome>
  );
}
