'use client';

import { AppFrame, type AppWindowSurfaceProps } from '@kernelon/shell';

import { MineradioApp } from './MineradioApp';

export default function MusicWindow({ window }: AppWindowSurfaceProps) {
  return (
    <AppFrame
      className="bg-black"
      contentClassName="!bg-black"
      header={false}
      scroll="hidden"
    >
      <MineradioApp window={window} />
    </AppFrame>
  );
}
