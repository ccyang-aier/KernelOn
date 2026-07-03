export type AppOpenSource = 'dock' | 'launcher' | 'notification' | 'spotlight' | 'system' | 'url';

export interface AppViewTarget {
  viewId: string;
  entityId?: string;
  params?: Record<string, string>;
}

export interface AppOpenIntent {
  appId: string;
  source: AppOpenSource;
  view?: AppViewTarget;
}

export interface WindowOpenIntent {
  source: AppOpenSource;
  view?: AppViewTarget;
}

export function toWindowOpenIntent(intent: AppOpenIntent): WindowOpenIntent {
  return {
    source: intent.source,
    view: intent.view,
  };
}
