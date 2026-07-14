'use client';

import { useContext, type CSSProperties, type ReactNode } from 'react';

import type { AppHeaderDescriptor } from '@kernelon/core';
import { cn } from '@kernelon/ui';

import { AppContainerHeader } from './components/app-container-header';
import { AppFrameWindowContext } from './components/app-frame-context';

export interface AppFrameProps {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  header?: AppHeaderDescriptor | false;
  headerSlots?: Readonly<Record<string, ReactNode>>;
  scroll?: 'auto' | 'hidden';
  style?: CSSProperties;
}

export function AppFrame({
  children,
  className,
  contentClassName,
  header,
  headerSlots,
  scroll = 'auto',
  style,
}: AppFrameProps) {
  const windowFrame = useContext(AppFrameWindowContext);

  if (!windowFrame) {
    throw new Error('AppFrame must be rendered inside an AppWindowContainer');
  }

  return (
    <div
      className={cn('flex h-full min-h-0 w-full flex-1 flex-col', className)}
      data-kernelon-app-frame="true"
      style={style}
    >
      {header === false ? null : (
        <AppContainerHeader
          getSourceElement={windowFrame.getSourceElement}
          header={header}
          isFullscreen={windowFrame.isFullscreen}
          onBeginMove={windowFrame.onBeginMove}
          onClose={windowFrame.onClose}
          onCommand={windowFrame.onHeaderCommand}
          onMinimize={windowFrame.onMinimize}
          onToggleFullscreen={windowFrame.onToggleFullscreen}
          slots={headerSlots}
          topLayer={windowFrame.topLayer}
          windowId={windowFrame.windowId}
          windowTitle={windowFrame.windowTitle}
        />
      )}
      <div
        className={cn(
          'relative min-h-0 flex-1 overflow-hidden',
          windowFrame.topLayer
            ? 'bg-[rgba(7,9,12,0.74)]'
            : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.70),rgba(246,250,255,0.48))]',
          contentClassName,
        )}
        data-app-frame-content="true"
      >
        <div
          className={cn('h-full', scroll === 'auto' ? 'overflow-auto' : 'overflow-hidden')}
          data-app-frame-scroll={scroll}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
