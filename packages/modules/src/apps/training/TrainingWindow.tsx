import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { MetricRow, ModuleChrome } from '../../components/ModuleChrome';

export default function TrainingWindow({ app }: AppWindowSurfaceProps) {
  return (
    <ModuleChrome title={app.name} description={app.description}>
      <MetricRow label="进行中课程" value="6 门" />
      <MetricRow label="逾期任务" value="2 项" />
    </ModuleChrome>
  );
}
