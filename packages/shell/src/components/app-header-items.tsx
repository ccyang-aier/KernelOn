'use client';

import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import type { AppHeaderItem } from '@kernelon/core';
import {
  AppHeaderButton,
  AppHeaderGroup,
  AppHeaderSearchField,
  AppHeaderSegmentedControl,
  LiquidGlassSvgFilter,
  cn,
} from '@kernelon/ui';

import type { AppHeaderCommandPayload } from '../app-header';
import { resolveAppHeaderIcon } from './app-header-icons';

export function AppHeaderItems({
  chromeVariant = 'standard',
  items,
  onCommand,
  section,
  slots,
  windowId,
}: Readonly<{
  chromeVariant?: AppHeaderChromeVariant;
  items: AppHeaderItem[];
  onCommand(payload: AppHeaderCommandPayload): void;
  section: string;
  slots: Readonly<Record<string, ReactNode>>;
  windowId: string;
}>) {
  const isTopLayerChrome = chromeVariant === 'top-layer';

  return items.map((item, index) => {
    if (item.type === 'navigation') {
      return (
        <AppHeaderGroup
          key={`${section}:navigation:${index}`}
          onPointerDown={stopHeaderControlDrag}
        >
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
      const Icon = resolveAppHeaderIcon(item.icon);

      if (isTopLayerChrome) {
        return (
          <TopLayerIconGlassButton
            Icon={Icon}
            key={`${section}:button:${item.id}`}
            label={item.label}
            onClick={() =>
              onCommand({
                commandId: item.commandId,
                itemId: item.id,
                type: 'button',
                windowId,
              })
            }
          />
        );
      }

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
      if (isTopLayerChrome) {
        return (
          <TopLayerSegmentedControl
            item={item}
            key={`${section}:segment:${item.id}`}
            onCommand={onCommand}
            windowId={windowId}
          />
        );
      }

      return (
        <AppHeaderSegmentedControl
          key={`${section}:segment:${item.id}`}
          onPointerDown={stopHeaderControlDrag}
          onValueChange={(value) =>
            onCommand({
              commandId: item.commandId ?? `${item.id}.change`,
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

type AppHeaderChromeVariant = 'standard' | 'top-layer';
type AppHeaderSegmentItem = Extract<AppHeaderItem, { type: 'segment' }>;
type AppHeaderSegmentOption = AppHeaderSegmentItem['options'][number];
type AppHeaderGsap = (typeof import('gsap'))['gsap'];

interface AppHeaderTimeline {
  kill(): void;
}

interface SegmentPressTargets {
  button: HTMLElement;
  pulse: HTMLElement | null;
}

let appHeaderGsapPromise: Promise<AppHeaderGsap> | null = null;

function stopHeaderControlDrag(event: ReactPointerEvent<HTMLElement>) {
  event.stopPropagation();
}

function TopLayerIconGlassButton({
  Icon,
  label,
  onClick,
}: Readonly<{
  Icon: ReturnType<typeof resolveAppHeaderIcon>;
  label: string;
  onClick(): void;
}>) {
  return (
    <span
      className={topLayerIconButtonHostClassName}
      data-kernelon-app-header-liquid-button="true"
      onPointerDown={stopHeaderControlDrag}
    >
      <LiquidGlassSvgFilter
        aberrationIntensity={1.7}
        blurAmount={0.31}
        className={topLayerIconGlassClassName}
        containerBorderMode="external"
        cornerRadius={999}
        displacementScale={64}
        elasticity={0.1}
        mode="prominent"
        padding="0px"
        saturation={180}
        style={topLayerIconGlassPlacement}
      >
        <AppHeaderButton
          aria-label={label}
          className={topLayerIconButtonClassName}
          onClick={onClick}
          type="button"
        >
          <Icon
            aria-hidden="true"
            className="relative z-10 size-[21px]"
            strokeWidth={2.25}
          />
          <span className="sr-only">{label}</span>
        </AppHeaderButton>
      </LiquidGlassSvgFilter>
    </span>
  );
}

function TopLayerSegmentedControl({
  item,
  onCommand,
  windowId,
}: Readonly<{
  item: AppHeaderSegmentItem;
  onCommand(payload: AppHeaderCommandPayload): void;
  windowId: string;
}>) {
  const segmentWidth =
    item.options.length * TOP_LAYER_SEGMENT_BUTTON_WIDTH +
    Math.max(0, item.options.length - 1) * TOP_LAYER_SEGMENT_BUTTON_GAP;
  const segmentHostStyle = {
    width: segmentWidth,
  } satisfies CSSProperties;

  return (
    <div
      className={topLayerSegmentGroupHostClassName}
      onPointerDown={stopHeaderControlDrag}
      role="group"
      style={segmentHostStyle}
    >
      <div className={topLayerSegmentGroupClassName} data-kernelon-app-header-segment-group="true">
        {item.options.map((option) => (
          <TopLayerSegmentButton
            item={item}
            key={option.value}
            onCommand={onCommand}
            option={option}
            selected={option.value === item.value}
            windowId={windowId}
          />
        ))}
      </div>
    </div>
  );
}

function TopLayerSegmentButton({
  item,
  onCommand,
  option,
  selected,
  windowId,
}: Readonly<{
  item: AppHeaderSegmentItem;
  onCommand(payload: AppHeaderCommandPayload): void;
  option: AppHeaderSegmentOption;
  selected: boolean;
  windowId: string;
}>) {
  return (
    <span
      className={topLayerSegmentOptionHostClassName}
      data-kernelon-app-header-segment-option="true"
      data-selected={selected ? 'true' : 'false'}
    >
      <LiquidGlassSvgFilter
        aberrationIntensity={selected ? 1.68 : 1.36}
        blurAmount={selected ? 0.32 : 0.28}
        className={topLayerSegmentGlassClassName}
        containerBorderMode="external"
        cornerRadius={999}
        displacementScale={selected ? 64 : 54}
        elasticity={0.09}
        mode={selected ? 'prominent' : 'standard'}
        padding="0px"
        saturation={selected ? 184 : 172}
        style={topLayerSegmentGlassPlacement}
      >
        <button
          aria-pressed={selected}
          className={cn(
            topLayerSegmentButtonClassName,
            selected ? topLayerSegmentButtonActiveClassName : '',
          )}
          data-kernelon-app-header-segment-button="true"
          onClick={(event) => {
            playTopLayerSegmentPress(event);
            onCommand({
              commandId: item.commandId ?? `${item.id}.change`,
              itemId: item.id,
              type: 'segment',
              value: option.value,
              windowId,
            });
          }}
          type="button"
        >
          <span
            aria-hidden="true"
            className={topLayerSegmentPulseClassName}
            data-kernelon-app-header-segment-pulse="true"
          />
          <span className="relative z-20">{option.label}</span>
        </button>
      </LiquidGlassSvgFilter>
    </span>
  );
}

function playTopLayerSegmentPress(event: ReactMouseEvent<HTMLButtonElement>) {
  const button = event.currentTarget;
  const pulse = button.querySelector<HTMLElement>(
    '[data-kernelon-app-header-segment-pulse="true"]',
  );

  void animateTopLayerSegmentPress({ button, pulse }).catch(() => undefined);
}

function animateTopLayerSegmentPress({
  button,
  pulse,
}: SegmentPressTargets): Promise<AppHeaderTimeline> {
  return loadAppHeaderGsap().then((gsap) => {
    const targets = pulse ? [button, pulse] : [button];
    const timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        gsap.set(targets, { clearProps: 'opacity,visibility,transform,filter' });
      },
    });

    gsap.set(targets, {
      force3D: true,
      transformOrigin: '50% 50%',
    });

    if (prefersReducedMotion()) {
      if (pulse) {
        timeline
          .fromTo(
            pulse,
            { autoAlpha: 0, scale: 0.84 },
            { autoAlpha: 0.18, duration: 0.1, scale: 1 },
            0,
          )
          .to(pulse, { autoAlpha: 0, duration: 0.2 }, 0.1);
      }
    } else {
      if (pulse) {
        timeline
          .fromTo(
            pulse,
            { autoAlpha: 0, scale: 0.38 },
            { autoAlpha: 0.38, duration: 0.16, ease: 'sine.out', scale: 1.12 },
            0,
          )
          .to(pulse, { autoAlpha: 0, duration: 0.36, ease: 'power2.out', scale: 1.64 }, 0.08);
      }

      timeline
        .to(button, { duration: 0.1, ease: 'power2.out', scale: 0.97, y: 0.25 }, 0)
        .to(button, { duration: 0.2, ease: 'back.out(1.7)', scale: 1.025, y: -0.25 }, 0.1)
        .to(button, { duration: 0.32, ease: 'elastic.out(1, 0.74)', scale: 1, y: 0 }, 0.24);
    }

    return {
      kill() {
        timeline.kill();
        gsap.set(targets, { clearProps: 'opacity,visibility,transform,filter' });
      },
    };
  });
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function loadAppHeaderGsap(): Promise<AppHeaderGsap> {
  appHeaderGsapPromise ??= import('gsap').then((module) => module.gsap);

  return appHeaderGsapPromise;
}

const TOP_LAYER_CONTROL_SIZE = 42;
const TOP_LAYER_SEGMENT_BUTTON_WIDTH = 96;
const TOP_LAYER_SEGMENT_BUTTON_GAP = 8;

const topLayerIconGlassPlacement = {
  position: 'absolute',
  left: TOP_LAYER_CONTROL_SIZE / 2,
  top: TOP_LAYER_CONTROL_SIZE / 2,
} as const;

const topLayerIconButtonHostClassName =
  'relative h-[42px] w-[42px] shrink-0 overflow-visible';

const topLayerIconGlassClassName = 'z-10 text-white';

const topLayerIconButtonClassName =
  'relative h-[42px] w-[42px] min-w-[42px] gap-0 overflow-hidden rounded-full border-0 bg-transparent px-0 text-white/92 shadow-none outline-none transition-[transform,color,text-shadow] duration-200 ease-out [text-shadow:0_1px_8px_rgba(0,0,0,0.36)] hover:-translate-y-0.5 hover:text-white hover:[text-shadow:0_0_12px_rgba(255,255,255,0.50),0_1px_8px_rgba(0,0,0,0.34)] active:translate-y-0 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-white/75';

const topLayerSegmentGlassPlacement = {
  position: 'absolute',
  left: TOP_LAYER_SEGMENT_BUTTON_WIDTH / 2,
  top: TOP_LAYER_CONTROL_SIZE / 2,
} as const;

const topLayerSegmentGroupHostClassName =
  'relative h-[42px] shrink-0 overflow-visible';

const topLayerSegmentGlassClassName = 'z-10 text-white';

const topLayerSegmentGroupClassName =
  'relative inline-flex h-[42px] shrink-0 items-center gap-2 overflow-visible rounded-full border-0 bg-transparent p-0 shadow-none';

const topLayerSegmentOptionHostClassName =
  'relative h-[42px] w-[96px] shrink-0 overflow-visible';

const topLayerSegmentButtonClassName =
  'relative z-10 inline-flex h-[42px] min-w-[96px] items-center justify-center overflow-hidden rounded-full border-0 bg-transparent px-5 text-[14px] font-bold text-white/72 shadow-none outline-none transition-[color,text-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[1px] hover:text-white focus-visible:ring-2 focus-visible:ring-white/[0.65]';

const topLayerSegmentButtonActiveClassName =
  'text-white [text-shadow:0_0_13px_rgba(255,255,255,0.42),0_1px_10px_rgba(0,0,0,0.32)]';

const topLayerSegmentPulseClassName =
  'pointer-events-none absolute inset-[-10px] z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(232,247,255,0.34),rgba(125,211,252,0.16)_40%,rgba(125,211,252,0)_72%)] opacity-0 mix-blend-screen';
