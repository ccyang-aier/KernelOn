import type { CommandDefinition, KernelAppManifest } from './types';

export interface CommandRegistry {
  all(): CommandDefinition[];
  get(id: string): CommandDefinition | undefined;
  search(query: string): CommandDefinition[];
}

export function createCommandRegistry(commands: CommandDefinition[]): CommandRegistry {
  const registry = new Map<string, CommandDefinition>();

  for (const command of commands) {
    if (registry.has(command.id)) {
      throw new Error(`Duplicate KernelOn command id: ${command.id}`);
    }

    registry.set(command.id, command);
  }

  return {
    all: () => [...registry.values()],
    get: (id) => registry.get(id),
    search: (query) => searchCommands([...registry.values()], query),
  };
}

export function createAppOpenCommands(apps: KernelAppManifest[]): CommandDefinition[] {
  return apps.map((app) => ({
    id: `open-app:${app.id}`,
    title: `打开${app.name}`,
    description: app.description,
    runMode: 'open-app',
    appId: app.id,
    keywords: [app.name, app.category, app.priority, app.id],
  }));
}

export function searchCommands(commands: CommandDefinition[], query: string): CommandDefinition[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return commands;
  }

  return commands.filter((command) => {
    const haystack = [
      command.id,
      command.title,
      command.description,
      command.runMode,
      command.appId,
      ...(command.keywords ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
