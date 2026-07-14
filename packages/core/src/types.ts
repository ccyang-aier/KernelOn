import type { WindowOpenIntent } from './app-intents';
import type { AppHeaderDescriptor } from './app-header';

export type KernelAppPriority = 'P0' | 'P1' | 'P2';

export type KernelAppCategory = 'operations' | 'growth' | 'insight' | 'resource' | 'system';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RuntimeLoaderReference {
  loaderKey: string;
}

export type AppFrameOwner = 'container' | 'app';

export type AppWindowLayer = 'workspace' | 'top';

export type AppWindowMountPolicy = 'unmount-on-minimize' | 'keep-alive';

export type AppWindowSnapshotPolicy = 'mount-app' | 'skip';

export interface AppWindowRuntimeReference extends RuntimeLoaderReference {
  frameOwner?: AppFrameOwner;
  layer?: AppWindowLayer;
  mountPolicy?: AppWindowMountPolicy;
  snapshotPolicy?: AppWindowSnapshotPolicy;
}

export interface KernelAppManifest {
  id: string;
  name: string;
  description: string;
  priority: KernelAppPriority;
  category: KernelAppCategory;
  icon: string;
  dockedByDefault?: boolean;
  runtime: {
    window: AppWindowRuntimeReference;
  };
  defaultWindow: {
    title?: string;
    bounds: WindowBounds;
    header?: AppHeaderDescriptor;
    mode?: WindowMode;
  };
}

export type WindowStatus = 'active' | 'inactive' | 'minimized';
export type WindowMode = 'windowed' | 'fullscreen';

export interface WindowDescriptor {
  id: string;
  appId: string;
  title: string;
  bounds: WindowBounds;
  header?: AppHeaderDescriptor;
  intent?: WindowOpenIntent;
  restoreBounds?: WindowBounds;
  zIndex: number;
  status: WindowStatus;
  mode?: WindowMode;
  createdAt: number;
}

export interface DesktopGridArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopItem {
  id: string;
  kind: 'app' | 'widget';
  targetId: string;
  screenId: string;
  grid: DesktopGridArea;
}

export interface DesktopScreen {
  id: string;
  name: string;
  order: number;
  items: DesktopItem[];
}

export interface WidgetManifest {
  id: string;
  name: string;
  description: string;
  defaultGrid: DesktopGridArea;
  runtime: {
    widget: RuntimeLoaderReference;
  };
}

export interface CommandDefinition {
  id: string;
  title: string;
  description: string;
  runMode: 'open-app' | 'system' | 'ai-assist';
  appId?: string;
  keywords?: string[];
}
