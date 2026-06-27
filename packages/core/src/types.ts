export type KernelAppPriority = 'P0' | 'P1' | 'P2';

export type KernelAppCategory = 'operations' | 'growth' | 'insight' | 'resource' | 'system';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface KernelAppManifest {
  id: string;
  name: string;
  description: string;
  priority: KernelAppPriority;
  category: KernelAppCategory;
  icon: string;
  dockedByDefault?: boolean;
  defaultWindow: {
    title?: string;
    bounds: WindowBounds;
  };
}

export type WindowStatus = 'active' | 'inactive' | 'minimized';

export interface WindowDescriptor {
  id: string;
  appId: string;
  title: string;
  bounds: WindowBounds;
  zIndex: number;
  status: WindowStatus;
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
}

export interface CommandDefinition {
  id: string;
  title: string;
  description: string;
  runMode: 'open-app' | 'system' | 'ai-assist';
  appId?: string;
  keywords?: string[];
}
