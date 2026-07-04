import { describe, expect, it } from 'vitest';

import {
  createAppHeaderCommands,
  createAppOpenCommands,
  createCommandRegistry,
  type KernelAppManifest,
} from '../src';

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

  it('creates discoverable commands from app header descriptors', () => {
    const commands = createAppHeaderCommands(onboardingApp, {
      identity: { title: '新员工运作' },
      leading: [{ type: 'navigation', backCommandId: 'onboarding.nav.back' }],
      center: [
        {
          type: 'segment',
          id: 'onboarding-view',
          commandId: 'onboarding.view.change',
          value: 'active',
          options: [
            { label: '进行中', value: 'active' },
            { label: '已完成', value: 'done' },
          ],
        },
      ],
      trailing: [
        {
          type: 'button',
          id: 'refresh',
          icon: 'RefreshCw',
          label: '刷新新人列表',
          commandId: 'onboarding.refresh',
        },
        {
          type: 'search',
          id: 'search',
          placeholder: '搜索新人',
          commandId: 'onboarding.search',
        },
        { type: 'slot', id: 'custom-actions' },
      ],
    });

    expect(commands).toEqual([
      expect.objectContaining({
        id: 'onboarding.nav.back',
        title: '新员工运作：返回',
        runMode: 'system',
        appId: 'onboarding',
      }),
      expect.objectContaining({
        id: 'onboarding.view.change',
        title: '新员工运作：切换进行中/已完成',
        runMode: 'system',
        appId: 'onboarding',
      }),
      expect.objectContaining({
        id: 'onboarding.refresh',
        title: '新员工运作：刷新新人列表',
        runMode: 'system',
        appId: 'onboarding',
      }),
      expect.objectContaining({
        id: 'onboarding.search',
        title: '新员工运作：搜索新人',
        runMode: 'system',
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
