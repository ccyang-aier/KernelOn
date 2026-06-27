import type { DesktopGridArea, DesktopItem, DesktopScreen, KernelAppManifest } from './types';

export interface CreateDesktopLayoutOptions {
  screenId?: string;
  screenName?: string;
  columns?: number;
}

export function createDefaultDesktopScreen(
  apps: KernelAppManifest[],
  options: CreateDesktopLayoutOptions = {},
): DesktopScreen {
  const screenId = options.screenId ?? 'screen-home';
  const columns = options.columns ?? 6;

  return {
    id: screenId,
    name: options.screenName ?? 'Home',
    order: 0,
    items: apps.map((app, index) => ({
      id: `desktop-item:${app.id}`,
      kind: 'app',
      targetId: app.id,
      screenId,
      grid: {
        x: index % columns,
        y: Math.floor(index / columns),
        width: 1,
        height: 1,
      },
    })),
  };
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
