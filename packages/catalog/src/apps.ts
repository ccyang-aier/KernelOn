import type { KernelAppManifest } from '@kernelon/core';

export const kernelApps: KernelAppManifest[] = [
  {
    id: 'music',
    name: '音乐',
    description: '沉浸式音乐播放、歌词舞台、粒子视觉与 3D 歌单架',
    priority: 'P2',
    category: 'resource',
    icon: 'Music',
    dockedByDefault: true,
    runtime: {
      window: {
        frameOwner: 'app',
        loaderKey: 'app:music-window',
      },
    },
    defaultWindow: {
      title: 'Mineradio',
      bounds: { x: 36, y: 28, width: 1440, height: 850 },
    },
  },
  {
    id: 'onboarding',
    name: '新员工运作',
    description: '入职信息、阶段流程、状态跟踪、名册总览',
    priority: 'P0',
    category: 'operations',
    icon: 'UserRoundCheck',
    dockedByDefault: true,
    runtime: {
      window: {
        loaderKey: 'app:onboarding-window',
      },
    },
    defaultWindow: {
      title: '新员工运作',
      bounds: { x: 96, y: 72, width: 960, height: 640 },
    },
  },
  {
    id: 'mentor',
    name: '导师管理',
    description: '导师库、师徒匹配、带教任务与反馈',
    priority: 'P0',
    category: 'operations',
    icon: 'Handshake',
    dockedByDefault: false,
    runtime: {
      window: {
        loaderKey: 'app:mentor-window',
      },
    },
    defaultWindow: {
      title: '导师管理',
      bounds: { x: 136, y: 96, width: 920, height: 620 },
    },
  },
  {
    id: 'growth-archive',
    name: '成长档案',
    description: '新员工个人主页、培养记录、里程碑沉淀',
    priority: 'P1',
    category: 'growth',
    icon: 'Milestone',
    dockedByDefault: false,
    runtime: {
      window: {
        loaderKey: 'app:growth-archive-window',
      },
    },
    defaultWindow: {
      title: '成长档案',
      bounds: { x: 176, y: 120, width: 880, height: 600 },
    },
  },
  {
    id: 'training',
    name: '培训中心',
    description: '培训任务、资料、打卡与完成度',
    priority: 'P1',
    category: 'growth',
    icon: 'BookOpenCheck',
    dockedByDefault: true,
    runtime: {
      window: {
        loaderKey: 'app:training-window',
      },
    },
    defaultWindow: {
      title: '培训中心',
      bounds: { x: 196, y: 132, width: 860, height: 580 },
    },
  },
  {
    id: 'assessment',
    name: '考核评估',
    description: '阶段考核、评分、结果汇总',
    priority: 'P1',
    category: 'growth',
    icon: 'ClipboardCheck',
    dockedByDefault: true,
    runtime: {
      window: {
        loaderKey: 'app:assessment-window',
      },
    },
    defaultWindow: {
      title: '考核评估',
      bounds: { x: 216, y: 148, width: 860, height: 580 },
    },
  },
  {
    id: 'dashboard',
    name: '数据看板',
    description: '整体进度、导师负载、关键指标可视化',
    priority: 'P2',
    category: 'insight',
    icon: 'ChartSpline',
    dockedByDefault: true,
    runtime: {
      window: {
        loaderKey: 'app:dashboard-window',
      },
    },
    defaultWindow: {
      title: '数据看板',
      bounds: { x: 236, y: 164, width: 960, height: 620 },
    },
  },
  {
    id: 'resources',
    name: '资源库',
    description: '制度、文档、常用链接的统一入口',
    priority: 'P2',
    category: 'resource',
    icon: 'FolderKanban',
    dockedByDefault: true,
    runtime: {
      window: {
        loaderKey: 'app:resources-window',
      },
    },
    defaultWindow: {
      title: '资源库',
      bounds: { x: 256, y: 180, width: 820, height: 560 },
    },
  },
  {
    id: 'weekly-show',
    name: 'Weekly Show',
    description: '每周优秀作品投稿、互动投票与展台沉淀',
    priority: 'P1',
    category: 'growth',
    icon: 'Presentation',
    dockedByDefault: true,
    runtime: {
      window: {
        frameOwner: 'app',
        loaderKey: 'app:weekly-show-window',
      },
    },
    defaultWindow: {
      title: 'Weekly Show',
      bounds: { x: 76, y: 42, width: 1440, height: 820 },
    },
  },
  {
    id: 'widget-manager',
    name: '小组件管理',
    description: 'KernelOn 小组件管理中心，预览、搜索并放置桌面小组件',
    priority: 'P2',
    category: 'system',
    icon: 'Grid2X2',
    dockedByDefault: true,
    runtime: {
      window: {
        frameOwner: 'app',
        loaderKey: 'app:widget-manager-window',
      },
    },
    defaultWindow: {
      title: 'Widgets 管理',
      bounds: { x: 48, y: 58, width: 1328, height: 760 },
    },
  },
  {
    id: 'wallpaper',
    name: '壁纸管理',
    description: '发现、预览、收藏、上传并应用 KernelOn 桌面壁纸',
    priority: 'P2',
    category: 'system',
    icon: 'Image',
    dockedByDefault: false,
    runtime: {
      window: {
        frameOwner: 'app',
        layer: 'top',
        loaderKey: 'app:wallpaper-window',
      },
    },
    defaultWindow: {
      title: 'KernelOn WallPaper',
      bounds: { x: 120, y: 74, width: 1228, height: 768 },
    },
  },
];
