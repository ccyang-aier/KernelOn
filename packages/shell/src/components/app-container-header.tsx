'use client';

import { Maximize2, Minus, X, type LucideIcon } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import type { AppHeaderDescriptor } from '@kernelon/core';
import { AppHeaderTitleBlock, cn } from '@kernelon/ui';

import type { AppHeaderCommandPayload } from '../app-header';
import { AppHeaderItems } from './app-header-items';

interface AppContainerHeaderProps {
  header?: AppHeaderDescriptor;
  isFullscreen: boolean;
  slots?: Readonly<Record<string, ReactNode>>;
  topLayer?: boolean;
  windowId: string;
  windowTitle: string;
  getSourceElement(): HTMLElement | null;
  onBeginMove(event: ReactPointerEvent<HTMLElement>): void;
  onClose(): void;
  onCommand(payload: AppHeaderCommandPayload): void;
  onMinimize(sourceElement: HTMLElement | null): void;
  onToggleFullscreen(): void;
}

export function AppContainerHeader({
  header,
  getSourceElement,
  isFullscreen,
  onBeginMove,
  onClose,
  onCommand,
  onMinimize,
  onToggleFullscreen,
  slots = {},
  topLayer = false,
  windowId,
  windowTitle,
}: AppContainerHeaderProps) {
  const mode = header?.mode ?? 'standard';
  const preset = header?.preset ?? 'plain';
  const density = header?.density ?? 'compact';
  const title = header?.identity?.title ?? windowTitle;
  const subtitle = header?.identity?.subtitle;
  const status = header?.identity?.status
    ? appHeaderStatusLabels[header.identity.status]
    : undefined;
  const hasStructuredHeader = Boolean(
    header?.leading?.length ||
    header?.center?.length ||
    header?.trailing?.length ||
    header?.subbar?.length ||
    subtitle ||
    status ||
    header?.identity?.title,
  );

  return (
    <header
      className={cn(
        topLayer
          ? 'absolute inset-x-0 top-0 z-[120] h-[68px] min-h-[68px] shrink-0 overflow-visible border-0 bg-transparent shadow-none backdrop-blur-0'
          : 'relative shrink-0 overflow-hidden border-b border-[var(--ko-app-header-border)] [background:var(--ko-app-header-surface)] shadow-[var(--ko-app-header-inset-shadow)] backdrop-blur-[22px]',
        topLayer ? '' : density === 'comfortable' ? 'min-h-[56px]' : 'min-h-11',
      )}
      data-app-header-mode={mode}
      data-app-header-preset={preset}
      data-kernelon-app-header="true"
      data-testid={`kernelon-app-header-${windowId}`}
    >
      <div
        className={cn(
          'group absolute z-20 flex -translate-y-1/2 items-center',
          topLayer
            ? 'left-6 top-[31px] gap-2.5'
            : 'left-[var(--ko-app-window-controls-x,16px)] top-[var(--ko-app-window-controls-y,22px)] gap-2.5',
        )}
        data-testid={`kernelon-app-window-traffic-lights-${windowId}`}
        data-app-window-controls="true"
        onDoubleClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <TrafficLightButton
          className="bg-[#ff5f57] shadow-[0_0_0_0.5px_rgba(120,28,22,0.38),inset_0_1px_0_rgba(255,255,255,0.46)]"
          icon={X}
          label={`关闭 ${windowTitle}`}
          onClick={onClose}
        />
        <TrafficLightButton
          className="bg-[#febc2e] shadow-[0_0_0_0.5px_rgba(126,78,0,0.36),inset_0_1px_0_rgba(255,255,255,0.48)]"
          icon={Minus}
          label={`最小化 ${windowTitle}`}
          onClick={() => onMinimize(getSourceElement())}
        />
        <TrafficLightButton
          className="bg-[#28c840] shadow-[0_0_0_0.5px_rgba(20,96,30,0.36),inset_0_1px_0_rgba(255,255,255,0.48)]"
          icon={Maximize2}
          label={`${isFullscreen ? '退出全屏' : '进入全屏'} ${windowTitle}`}
          onClick={onToggleFullscreen}
        />
      </div>
      {mode === 'immersive' ? (
        <div
          className="h-11 cursor-default select-none"
          onDoubleClick={onToggleFullscreen}
          onPointerDown={onBeginMove}
        />
      ) : (
        <div
          className={cn(
            'flex min-h-[var(--ko-app-header-row-height,44px)] min-w-0 cursor-default select-none items-center gap-3 [padding-left:var(--ko-app-header-row-padding-left,7rem)] pr-4',
            hasStructuredHeader ? 'justify-between' : 'justify-center px-28',
            topLayer ? 'min-h-[68px] gap-2.5 px-6 pl-[86px]' : '',
          )}
          data-app-header-row="primary"
          onDoubleClick={onToggleFullscreen}
          onPointerDown={onBeginMove}
        >
          {hasStructuredHeader ? (
            <>
              <div
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2',
                  topLayer ? 'justify-end pr-0' : '',
                )}
                data-testid={`kernelon-app-header-leading-${windowId}`}
                data-app-header-region="leading"
              >
                <AppHeaderItems
                  chromeVariant={topLayer ? 'top-layer' : 'standard'}
                  items={header?.leading ?? []}
                  onCommand={onCommand}
                  section="leading"
                  slots={slots}
                  windowId={windowId}
                />
                <div
                  className={cn('min-w-[120px] max-w-[260px] flex-1', topLayer ? 'hidden' : '')}
                  data-testid={`kernelon-app-header-identity-${windowId}`}
                  data-app-header-region="identity"
                >
                  <AppHeaderTitleBlock status={status} subtitle={subtitle} title={title} />
                </div>
              </div>
              <div
                className={cn(
                  'flex min-w-0 flex-[1.2] items-center justify-center gap-2',
                  topLayer ? 'flex-none' : '',
                )}
                data-testid={`kernelon-app-header-center-${windowId}`}
                data-app-header-region="center"
              >
                <AppHeaderItems
                  chromeVariant={topLayer ? 'top-layer' : 'standard'}
                  items={header?.center ?? []}
                  onCommand={onCommand}
                  section="center"
                  slots={slots}
                  windowId={windowId}
                />
              </div>
              <div
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-end gap-2',
                  topLayer ? 'gap-2.5' : '',
                )}
                data-testid={`kernelon-app-header-trailing-${windowId}`}
                data-app-header-region="trailing"
              >
                <AppHeaderItems
                  chromeVariant={topLayer ? 'top-layer' : 'standard'}
                  items={header?.trailing ?? []}
                  onCommand={onCommand}
                  section="trailing"
                  slots={slots}
                  windowId={windowId}
                />
              </div>
            </>
          ) : (
            <div
              className="flex h-full min-w-0 flex-1 items-center justify-center text-[13px] font-semibold text-[var(--ko-app-header-ink)]"
              data-testid={`kernelon-app-header-identity-${windowId}`}
              data-app-header-region="identity"
            >
              <span className="truncate">{title}</span>
            </div>
          )}
        </div>
      )}
      {mode !== 'immersive' && header?.subbar?.length ? (
        <div
          className="flex min-h-9 min-w-0 items-center gap-2 border-t border-[var(--ko-app-header-border)] bg-[var(--ko-app-header-surface-muted)] px-4 py-1.5 pl-28"
          data-testid={`kernelon-app-header-subbar-${windowId}`}
          data-app-header-region="subbar"
        >
          <AppHeaderItems
            chromeVariant={topLayer ? 'top-layer' : 'standard'}
            items={header.subbar}
            onCommand={onCommand}
            section="subbar"
            slots={slots}
            windowId={windowId}
          />
        </div>
      ) : null}
    </header>
  );
}

function TrafficLightButton({
  className,
  icon: Icon,
  label,
  onClick,
}: Readonly<{
  className: string;
  icon: LucideIcon;
  label: string;
  onClick(): void;
}>) {
  return (
    <button
      aria-label={label}
      className={cn(
        'flex size-3.5 origin-center items-center justify-center rounded-full text-black/82 outline-none transition-[transform,box-shadow,filter] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.24] group-hover:brightness-[1.03] hover:scale-[1.32] focus-visible:ring-2 focus-visible:ring-white/90',
        className,
      )}
      onClick={onClick}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className="size-2.5 opacity-0 transition duration-150 ease-out group-hover:opacity-90"
        strokeWidth={3}
      />
    </button>
  );
}

const appHeaderStatusLabels = {
  edited: 'Edited',
  saving: 'Saving',
  synced: 'Synced',
} as const;
