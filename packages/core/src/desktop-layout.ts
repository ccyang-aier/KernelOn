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

export function addDesktopWidgetItem(
  items: DesktopItem[],
  widget: WidgetManifest,
  screenId: string,
  grid: DesktopGridArea = widget.defaultGrid,
): DesktopItem[] {
  return [
    ...items,
    {
      id: resolveNextDesktopItemId(`desktop-item:${widget.id}`, items),
      kind: 'widget',
      targetId: widget.id,
      screenId,
      grid,
    },
  ];
}

export function removeDesktopItem(items: DesktopItem[], itemId: string): DesktopItem[] {
  return items.filter((item) => item.id !== itemId);
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

function resolveNextDesktopItemId(baseId: string, items: DesktopItem[]): string {
  const existingIds = new Set(items.map((item) => item.id));

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  for (let index = 2; ; index += 1) {
    const candidateId = `${baseId}:${index}`;

    if (!existingIds.has(candidateId)) {
      return candidateId;
    }
  }
}
