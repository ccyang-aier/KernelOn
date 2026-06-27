import { createDesktopScreen, type DesktopScreen } from '@kernelon/core';

export const defaultDesktopScreens: DesktopScreen[] = [
  createDesktopScreen({
    id: 'screen-home',
    name: '新员工工作台',
    items: [],
  }),
];
