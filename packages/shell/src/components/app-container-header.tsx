'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Columns3,
  Download,
  Edit3,
  Files,
  LayoutGrid,
  ListFilter,
  Maximize2,
  Minus,
  MoreHorizontal,
  PanelTop,
  RefreshCw,
  Save,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react';
import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';

import type { AppHeaderDescriptor, AppHeaderItem } from '@kernelon/core';
import {
  AppHeaderButton,
  AppHeaderGroup,
  AppHeaderSearchField,
  AppHeaderSegmentedControl,
  AppHeaderTitleBlock,
  cn,
} from '@kernelon/ui';

import type { AppHeaderCommandPayload } from '../app-header';

interface AppContainerHeaderProps {
  header?: AppHeaderDescriptor;
  isFullscreen: boolean;
  slots?: Readonly<Record<string, ReactNode>>;
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
  windowId,
  windowTitle,
}: AppContainerHeaderProps) {
  const mode = header?.mode ?? 'standard';
  const preset = header?.preset ?? 'plain';
  const density = header?.density ?? 'compact';
  const title = header?.identity?.title ?? windowTitle;
  const subtitle = header?.identity?.subtitle;
  const status = header?.identity?.status ? appHeaderStatusLabels[header.identity.status] : undefined;
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
        'relative shrink-0 overflow-hidden border-b border-white/42 bg-white/48 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-[22px]',
        density === 'comfortable' ? 'min-h-[56px]' : 'min-h-11',
      )}
      data-app-header-mode={mode}
      data-app-header-preset={preset}
      data-testid={`kernelon-app-header-${windowId}`}
    >
      <div
        className="group absolute left-4 top-[22px] z-20 flex -translate-y-1/2 items-center gap-2.5"
        data-testid={`kernelon-app-window-traffic-lights-${windowId}`}
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
            'flex min-h-11 min-w-0 cursor-default select-none items-center gap-3 pl-28 pr-4',
            hasStructuredHeader ? 'justify-between' : 'justify-center px-28',
          )}
          onDoubleClick={onToggleFullscreen}
          onPointerDown={onBeginMove}
        >
          {hasStructuredHeader ? (
            <>
              <div
                className="flex min-w-0 flex-1 items-center gap-2"
                data-testid={`kernelon-app-header-leading-${windowId}`}
              >
                {renderHeaderItems({
                  items: header?.leading ?? [],
                  onCommand,
                  section: 'leading',
                  slots,
                  windowId,
                })}
                <div
                  className="min-w-[120px] max-w-[260px] flex-1"
                  data-testid={`kernelon-app-header-identity-${windowId}`}
                >
                  <AppHeaderTitleBlock status={status} subtitle={subtitle} title={title} />
                </div>
              </div>
              <div
                className="flex min-w-0 flex-[1.2] items-center justify-center gap-2"
                data-testid={`kernelon-app-header-center-${windowId}`}
              >
                {renderHeaderItems({
                  items: header?.center ?? [],
                  onCommand,
                  section: 'center',
                  slots,
                  windowId,
                })}
              </div>
              <div
                className="flex min-w-0 flex-1 items-center justify-end gap-2"
                data-testid={`kernelon-app-header-trailing-${windowId}`}
              >
                {renderHeaderItems({
                  items: header?.trailing ?? [],
                  onCommand,
                  section: 'trailing',
                  slots,
                  windowId,
                })}
              </div>
            </>
          ) : (
            <div
              className="flex h-full min-w-0 flex-1 items-center justify-center text-[13px] font-semibold text-[#1f2937]/82"
              data-testid={`kernelon-app-header-identity-${windowId}`}
            >
              <span className="truncate">{title}</span>
            </div>
          )}
        </div>
      )}
      {mode !== 'immersive' && header?.subbar?.length ? (
        <div
          className="flex min-h-9 min-w-0 items-center gap-2 border-t border-white/36 bg-white/26 px-4 py-1.5 pl-28"
          data-testid={`kernelon-app-header-subbar-${windowId}`}
        >
          {renderHeaderItems({
            items: header.subbar,
            onCommand,
            section: 'subbar',
            slots,
            windowId,
          })}
        </div>
      ) : null}
    </header>
  );
}

function renderHeaderItems({
  items,
  onCommand,
  section,
  slots,
  windowId,
}: Readonly<{
  items: AppHeaderItem[];
  onCommand(payload: AppHeaderCommandPayload): void;
  section: string;
  slots: Readonly<Record<string, ReactNode>>;
  windowId: string;
}>) {
  return items.map((item, index) => {
    if (item.type === 'navigation') {
      return (
        <AppHeaderGroup key={`${section}:navigation:${index}`} onPointerDown={stopHeaderControlDrag}>
          <AppHeaderButton
            aria-label="Back"
            className="h-7 w-7 px-0"
            disabled={!item.backCommandId}
            onClick={() => {
              if (item.backCommandId) {
                onCommand({
                  commandId: item.backCommandId,
                  itemId: `${section}:back`,
                  type: 'navigation',
                  windowId,
                });
              }
            }}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </AppHeaderButton>
          <AppHeaderButton
            aria-label="Forward"
            className="h-7 w-7 px-0"
            disabled={!item.forwardCommandId}
            onClick={() => {
              if (item.forwardCommandId) {
                onCommand({
                  commandId: item.forwardCommandId,
                  itemId: `${section}:forward`,
                  type: 'navigation',
                  windowId,
                });
              }
            }}
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </AppHeaderButton>
        </AppHeaderGroup>
      );
    }

    if (item.type === 'button') {
      const Icon = resolveHeaderIcon(item.icon);

      return (
        <AppHeaderButton
          aria-label={item.label}
          key={`${section}:button:${item.id}`}
          onClick={() =>
            onCommand({
              commandId: item.commandId,
              itemId: item.id,
              type: 'button',
              windowId,
            })
          }
          onPointerDown={stopHeaderControlDrag}
        >
          <Icon aria-hidden="true" className="size-3.5" />
          <span className="truncate">{item.label}</span>
        </AppHeaderButton>
      );
    }

    if (item.type === 'segment') {
      return (
        <AppHeaderSegmentedControl
          key={`${section}:segment:${item.id}`}
          onPointerDown={stopHeaderControlDrag}
          onValueChange={(value) =>
            onCommand({
              commandId: `${item.id}.change`,
              itemId: item.id,
              type: 'segment',
              value,
              windowId,
            })
          }
          options={item.options}
          value={item.value}
        />
      );
    }

    if (item.type === 'search') {
      return (
        <AppHeaderSearchField
          key={`${section}:search:${item.id}`}
          leadingIcon={<Search aria-hidden="true" className="size-3.5" />}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onCommand({
                commandId: item.commandId,
                itemId: item.id,
                type: 'search',
                value: event.currentTarget.value,
                windowId,
              });
            }
          }}
          onPointerDown={stopHeaderControlDrag}
          placeholder={item.placeholder}
        />
      );
    }

    return (
      <div
        className="contents"
        key={`${section}:slot:${item.id}`}
        onPointerDown={stopHeaderControlDrag}
      >
        {slots[item.id] ?? null}
      </div>
    );
  });
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

function stopHeaderControlDrag(event: ReactPointerEvent<HTMLElement>) {
  event.stopPropagation();
}

function resolveHeaderIcon(icon: string): LucideIcon {
  return headerIcons[icon] ?? Circle;
}

const appHeaderStatusLabels = {
  edited: 'Edited',
  saving: 'Saving',
  synced: 'Synced',
} as const;

const headerIcons: Record<string, LucideIcon> = {
  Check,
  Columns3,
  Download,
  Edit3,
  Files,
  LayoutGrid,
  ListFilter,
  MoreHorizontal,
  PanelTop,
  RefreshCw,
  Save,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Upload,
};
