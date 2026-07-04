import type { CommandDefinition, KernelAppManifest } from './types';

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
  commandId?: string;
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

export function createAppHeaderCommands(
  app: KernelAppManifest,
  header?: AppHeaderDescriptor,
): CommandDefinition[] {
  if (!header) {
    return [];
  }

  const headerTitle = header.identity?.title ?? app.defaultWindow.title ?? app.name;
  const commands: CommandDefinition[] = [];

  for (const item of collectHeaderItems(header)) {
    if (item.type === 'button') {
      commands.push(createHeaderCommand(app, headerTitle, item.commandId, item.label, [item.id]));
      continue;
    }

    if (item.type === 'search') {
      commands.push(
        createHeaderCommand(app, headerTitle, item.commandId, item.placeholder, [item.id]),
      );
      continue;
    }

    if (item.type === 'navigation') {
      if (item.backCommandId) {
        commands.push(createHeaderCommand(app, headerTitle, item.backCommandId, '返回', ['back']));
      }

      if (item.forwardCommandId) {
        commands.push(
          createHeaderCommand(app, headerTitle, item.forwardCommandId, '前进', ['forward']),
        );
      }

      continue;
    }

    if (item.type === 'segment') {
      const optionLabels = item.options.map((option) => option.label);

      commands.push(
        createHeaderCommand(
          app,
          headerTitle,
          item.commandId ?? `${item.id}.change`,
          `切换${optionLabels.join('/')}`,
          [item.id, ...optionLabels],
        ),
      );
    }
  }

  return commands;
}

function collectHeaderItems(header: AppHeaderDescriptor): AppHeaderItem[] {
  return [
    ...(header.leading ?? []),
    ...(header.center ?? []),
    ...(header.trailing ?? []),
    ...(header.subbar ?? []),
  ];
}

function createHeaderCommand(
  app: KernelAppManifest,
  headerTitle: string,
  id: string,
  actionTitle: string,
  keywords: string[],
): CommandDefinition {
  return {
    id,
    title: `${headerTitle}：${actionTitle}`,
    description: `${app.name} App 顶部控制层命令`,
    runMode: 'system',
    appId: app.id,
    keywords: [app.name, app.id, app.category, headerTitle, ...keywords],
  };
}
