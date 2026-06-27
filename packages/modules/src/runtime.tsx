'use client';

import type { AppWindowModule, ShellRuntimeRegistry, WidgetModule } from '@kernelon/shell';

const appWindowLoaders = {
  'app:onboarding-window': () => import('./apps/onboarding/OnboardingWindow'),
  'app:mentor-window': () => import('./apps/mentor/MentorWindow'),
  'app:growth-archive-window': () => import('./apps/growth-archive/GrowthArchiveWindow'),
  'app:training-window': () => import('./apps/training/TrainingWindow'),
  'app:assessment-window': () => import('./apps/assessment/AssessmentWindow'),
  'app:dashboard-window': () => import('./apps/dashboard/DashboardWindow'),
  'app:resources-window': () => import('./apps/resources/ResourcesWindow'),
} satisfies Record<string, () => Promise<AppWindowModule>>;

const widgetLoaders = {
  'widget:onboarding-progress': () => import('./widgets/OnboardingProgressWidget'),
  'widget:mentor-load': () => import('./widgets/MentorLoadWidget'),
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

function MissingAppWindow() {
  return null;
}

function MissingWidget() {
  return null;
}
