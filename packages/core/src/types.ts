import type { WindowOpenIntent } from './app-intents';

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

export type AppHeaderMode = 'standard' | 'composable' | 'immersive';

export type AppHeaderPreset = 'plain' | 'document' | 'browser' | 'dashboard' | 'editor';

export type AppHeaderDensity = 'compact' | 'comfortable';

export type AppHeaderIdentityStatus = 'edited' | 'saving' | 'synced';

export interface AppHeaderIdentity {
  title?: string;
  subtitle?: string;
  status?: AppHeaderIdentityStatus;
}

export interface AppHeaderNavigationItem {
  type: 'navigation';
  backCommandId?: string;
  forwardCommandId?: string;
}

export interface AppHeaderButtonItem {
  type: 'button';
  id: string;
  icon: string;
  label: string;
  commandId: string;
}

export interface AppHeaderSegmentItem {
  type: 'segment';
  id: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}

export interface AppHeaderSearchItem {
  type: 'search';
  id: string;
  placeholder: string;
  commandId: string;
}

export interface AppHeaderSlotItem {
  type: 'slot';
  id: string;
}

export type AppHeaderItem =
  | AppHeaderButtonItem
  | AppHeaderNavigationItem
  | AppHeaderSegmentItem
  | AppHeaderSearchItem
  | AppHeaderSlotItem;

export interface AppHeaderDescriptor {
  mode?: AppHeaderMode;
  preset?: AppHeaderPreset;
  density?: AppHeaderDensity;
  identity?: AppHeaderIdentity;
  leading?: AppHeaderItem[];
  center?: AppHeaderItem[];
  trailing?: AppHeaderItem[];
  subbar?: AppHeaderItem[];
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
    window: RuntimeLoaderReference;
  };
  defaultWindow: {
    title?: string;
    bounds: WindowBounds;
    header?: AppHeaderDescriptor;
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
