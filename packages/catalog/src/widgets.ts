import type { WidgetManifest } from '@kernelon/core';

export const kernelWidgets: WidgetManifest[] = [
  {
    id: 'onboarding-progress',
    name: '入职进度',
    description: '展示新员工入职阶段推进情况',
    defaultGrid: { x: 3, y: 0, width: 2, height: 2 },
    runtime: {
      widget: {
        loaderKey: 'widget:onboarding-progress',
      },
    },
  },
  {
    id: 'mentor-load',
    name: '导师负载',
    description: '展示导师带教容量与匹配压力',
    defaultGrid: { x: 0, y: 1, width: 2, height: 2 },
    runtime: {
      widget: {
        loaderKey: 'widget:mentor-load',
      },
    },
  },
];
