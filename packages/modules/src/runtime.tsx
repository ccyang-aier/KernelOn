'use client';

import {
  KernelOnShell,
  type AppWindowModule,
  type ShellCredentialUser,
  type ShellInitialState,
  type ShellRuntimeRegistry,
  type WidgetModule,
} from '@kernelon/shell';

import {
  KernelOnRuntimeConfigProvider,
  type KernelOnRuntimeConfig,
} from './runtime-config';

export type { ShellInitialState } from '@kernelon/shell';
export type {
  MineradioAccountCapabilities,
  MineradioDesktopLyricsCapabilities,
  MineradioFileCapabilities,
  MineradioGlobalShortcutCapabilities,
  MineradioPlatformAdapter,
  MineradioUpdaterCapabilities,
  MineradioWallpaperCapabilities,
} from './apps/music/host/contract';

const appWindowLoaders = {
  'app:music-window': () => import('./apps/music/MusicWindow'),
  'app:onboarding-window': () => import('./apps/onboarding/OnboardingWindow'),
  'app:mentor-window': () => import('./apps/mentor/MentorWindow'),
  'app:growth-archive-window': () => import('./apps/growth-archive/GrowthArchiveWindow'),
  'app:training-window': () => import('./apps/training/TrainingWindow'),
  'app:assessment-window': () => import('./apps/assessment/AssessmentWindow'),
  'app:dashboard-window': () => import('./apps/dashboard/DashboardWindow'),
  'app:resources-window': () => import('./apps/resources/ResourcesWindow'),
  'app:weekly-show-window': () => import('./apps/weekly-show/WeeklyShowWindow'),
  'app:wallpaper-window': () => import('./apps/wallpaper/WallpaperWindow'),
  'app:widget-manager-window': () => import('./apps/widget-manager/WidgetManagerWindow'),
} satisfies Record<string, () => Promise<AppWindowModule>>;

const widgetLoaders = {
  'widget:onboarding-progress': () => import('./widgets/OnboardingProgressWidget'),
  'widget:mentor-load': () => import('./widgets/MentorLoadWidget'),
  'widget:growth-milestone': () => import('./widgets/GrowthMilestoneWidget'),
  'widget:training-task': () => import('./widgets/TrainingTaskWidget'),
} satisfies Record<string, () => Promise<WidgetModule>>;

export const kernelModuleRuntime: ShellRuntimeRegistry = {
  loadAppWindow: (loaderKey) => {
    const loader = appWindowLoaders[loaderKey as keyof typeof appWindowLoaders];

    return loader ? loader() : Promise.resolve({ default: MissingAppWindow });
  },
  loadWidget: (loaderKey) => {
    const loader = widgetLoaders[loaderKey as keyof typeof widgetLoaders];

    return loader ? loader() : Promise.resolve({ default: MissingWidget });
  },
};

export function KernelOnModuleRuntime({
  currentUser,
  initialState,
  runtimeConfig,
}: Readonly<{
  currentUser?: ShellCredentialUser;
  initialState: ShellInitialState;
  runtimeConfig?: Partial<KernelOnRuntimeConfig>;
}>) {
  const resolvedRuntimeConfig = {
    ...runtimeConfig,
    mineradioStorageNamespace:
      runtimeConfig?.mineradioStorageNamespace ??
      (currentUser?.id ? `user:${currentUser.id}` : undefined),
  } satisfies Partial<KernelOnRuntimeConfig>;

  return (
    <KernelOnRuntimeConfigProvider value={resolvedRuntimeConfig}>
      <KernelOnShell
        currentUser={currentUser}
        initialState={initialState}
        runtime={kernelModuleRuntime}
      />
    </KernelOnRuntimeConfigProvider>
  );
}

function MissingAppWindow() {
  return null;
}

function MissingWidget() {
  return null;
}
