import { describe, expect, it } from 'vitest';

import { createAppOpenCommands, createCommandRegistry, type KernelAppManifest } from '../src';

const onboardingApp: KernelAppManifest = {
  id: 'onboarding',
  name: '新员工运作',
  description: '入职信息、阶段流程、状态跟踪、名册总览',
  priority: 'P0',
  category: 'operations',
  icon: 'UserRoundCheck',
  runtime: {
    window: {
      loaderKey: 'app:onboarding-window',
    },
  },
  defaultWindow: {
    bounds: { x: 96, y: 72, width: 960, height: 640 },
  },
};

describe('command model helpers', () => {
  it('creates open-app commands from app manifests', () => {
    const commands = createAppOpenCommands([onboardingApp]);

    expect(commands).toEqual([
      expect.objectContaining({
        id: 'open-app:onboarding',
        title: '打开新员工运作',
        runMode: 'open-app',
        appId: 'onboarding',
      }),
    ]);
  });

  it('indexes and searches commands', () => {
    const registry = createCommandRegistry(createAppOpenCommands([onboardingApp]));

    expect(registry.get('open-app:onboarding')?.appId).toBe('onboarding');
    expect(registry.search('新人')).toHaveLength(0);
    expect(registry.search('新员工')).toHaveLength(1);
  });
});
