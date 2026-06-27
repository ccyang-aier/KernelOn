import type {
  DesktopGridArea,
  DesktopItem,
  DesktopScreen,
  KernelAppManifest,
  WidgetManifest,
} from './types';

export interface CreateDesktopScreenOptions {
  id: string;
  name: string;
  order?: number;
  items?: DesktopItem[];
}

export interface CreateDesktopLayoutOptions {
  screenId?: string;
  screenName?: string;
  columns?: number;
}

export function createDesktopScreen({
  id,
  name,
  order = 0,
  items = [],
}: CreateDesktopScreenOptions): DesktopScreen {
  return {
    id,
    name,
    order,
    items: [...items],
  };
}

export function createDesktopAppItem(
  app: KernelAppManifest,
  screenId: string,
  grid: DesktopGridArea,
): DesktopItem {
  return {
    id: `desktop-item:${app.id}`,
    kind: 'app',
    targetId: app.id,
    screenId,
    grid,
  };
}

export function createDesktopWidgetItem(
  widget: WidgetManifest,
  screenId: string,
  grid: DesktopGridArea = widget.defaultGrid,
): DesktopItem {
  return {
    id: `desktop-item:${widget.id}`,
    kind: 'widget',
    targetId: widget.id,
    screenId,
    grid,
  };
}

export function createDefaultDesktopScreen(
  apps: KernelAppManifest[],
  options: CreateDesktopLayoutOptions = {},
): DesktopScreen {
  const screenId = options.screenId ?? 'screen-home';
  const columns = options.columns ?? 6;

  return createDesktopScreen({
    id: screenId,
    name: options.screenName ?? 'Home',
    items: apps.map((app, index) =>
      createDesktopAppItem(app, screenId, {
        x: index % columns,
        y: Math.floor(index / columns),
        width: 1,
        height: 1,
      }),
    ),
  });
}

export function moveDesktopItem(
  items: DesktopItem[],
  itemId: string,
  nextGrid: DesktopGridArea,
): DesktopItem[] {
  return items.map((item) => (item.id === itemId ? { ...item, grid: nextGrid } : item));
}

export function doGridAreasOverlap(first: DesktopGridArea, second: DesktopGridArea): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

export function findOverlappingDesktopItems(
  items: DesktopItem[],
  grid: DesktopGridArea,
): DesktopItem[] {
  return items.filter((item) => doGridAreasOverlap(item.grid, grid));
}
