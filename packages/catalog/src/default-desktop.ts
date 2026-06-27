import {
  createDesktopAppItem,
  createDesktopScreen,
  createDesktopWidgetItem,
  type DesktopScreen,
} from '@kernelon/core';

import { kernelApps } from './apps';
import { kernelWidgets } from './widgets';

export const defaultDesktopScreens: DesktopScreen[] = [
  createDesktopScreen({
    id: 'screen-home',
    name: '新员工工作台',
    items: [
      createDesktopAppItem(kernelApps[0], 'screen-home', { x: 0, y: 0, width: 1, height: 1 }),
      createDesktopAppItem(kernelApps[1], 'screen-home', { x: 1, y: 0, width: 1, height: 1 }),
      createDesktopWidgetItem(kernelWidgets[0], 'screen-home', {
        x: 2,
        y: 0,
        width: 2,
        height: 2,
      }),
      createDesktopWidgetItem(kernelWidgets[1], 'screen-home', {
        x: 4,
        y: 0,
        width: 2,
        height: 2,
      }),
    ],
  }),
];
