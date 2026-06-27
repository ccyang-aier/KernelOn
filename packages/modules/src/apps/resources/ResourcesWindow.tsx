import type { AppWindowSurfaceProps } from '@kernelon/shell';

import { MetricRow, ModuleChrome } from '../../components/ModuleChrome';

export default function ResourcesWindow({ app }: AppWindowSurfaceProps) {
  return (
    <ModuleChrome title={app.name} description={app.description}>
      <MetricRow label="制度文档" value="24 份" />
      <MetricRow label="常用链接" value="16 个" />
    </ModuleChrome>
  );
}
