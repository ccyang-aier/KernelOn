'use client';

import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
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
type AppHeaderGsap = (typeof import('gsap'))['gsap'];

interface AppHeaderTimeline {
  kill(): void;
}

interface SegmentIndicatorTargets {
  indicator: HTMLElement;
  width: number;
  x: number;
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
        aberrationIntensity={1.35}
        blurAmount={0.24}
        className={topLayerIconGlassClassName}
        containerBorderMode="built-in"
        cornerRadius={999}
        displacementScale={56}
        elasticity={0.08}
        mode="standard"
        padding="0px"
        saturation={162}
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
  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const timelineRef = useRef<AppHeaderTimeline | null>(null);
  const disposedRef = useRef(false);
  const segmentWidth =
    item.options.length * TOP_LAYER_SEGMENT_BUTTON_WIDTH + TOP_LAYER_SEGMENT_GROUP_PADDING * 2;
  const segmentHostStyle = {
    width: segmentWidth,
  } satisfies CSSProperties;
  const segmentGlassPlacement = {
    position: 'absolute',
    left: segmentWidth / 2,
    top: TOP_LAYER_CONTROL_SIZE / 2,
  } as const;

  const syncIndicator = useCallback(
    (animate: boolean) => {
      const group = groupRef.current;
      const indicator = indicatorRef.current;
      const activeButton = buttonRefs.current.get(item.value);

      if (!group || !indicator || !activeButton) {
        return;
      }

      const groupRect = group.getBoundingClientRect();
      const activeRect = activeButton.getBoundingClientRect();
      const x = activeRect.left - groupRect.left;
      const width = activeRect.width;

      timelineRef.current?.kill();
      timelineRef.current = null;

      if (!animate || prefersReducedMotion()) {
        indicator.style.opacity = '1';
        indicator.style.transform = `translate3d(${x}px, 0, 0)`;
        indicator.style.width = `${width}px`;
        return;
      }

      void animateTopLayerSegmentIndicator({ indicator, width, x })
        .then((timeline) => {
          if (disposedRef.current) {
            timeline.kill();
            return;
          }

          timelineRef.current = timeline;
        })
        .catch(() => {
          indicator.style.opacity = '1';
          indicator.style.transform = `translate3d(${x}px, 0, 0)`;
          indicator.style.width = `${width}px`;
        });
    },
    [item.value],
  );

  useEffect(() => {
    disposedRef.current = false;
    void loadAppHeaderGsap();
    syncIndicator(false);

    return () => {
      disposedRef.current = true;
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, [syncIndicator]);

  useEffect(() => {
    syncIndicator(true);
  }, [item.options.length, syncIndicator]);

  useEffect(() => {
    const handleResize = () => syncIndicator(false);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [syncIndicator]);

  return (
    <div
      className={topLayerSegmentHostClassName}
      data-kernelon-app-header-liquid-segment="true"
      onPointerDown={stopHeaderControlDrag}
      style={segmentHostStyle}
    >
      <LiquidGlassSvgFilter
        aberrationIntensity={1.18}
        blurAmount={0.22}
        className={topLayerSegmentGlassClassName}
        containerBorderMode="built-in"
        cornerRadius={999}
        displacementScale={50}
        elasticity={0.06}
        mode="standard"
        padding="0px"
        saturation={158}
        style={segmentGlassPlacement}
      >
        <div
          className={topLayerSegmentGroupClassName}
          data-kernelon-app-header-segment-group="true"
          ref={groupRef}
          role="group"
          style={segmentHostStyle}
        >
          <span
            aria-hidden="true"
            className={topLayerSegmentIndicatorClassName}
            data-kernelon-app-header-segment-indicator="true"
            ref={indicatorRef}
          />
          {item.options.map((option) => {
            const selected = option.value === item.value;

            return (
              <button
                aria-pressed={selected}
                className={cn(
                  topLayerSegmentButtonClassName,
                  selected ? topLayerSegmentButtonActiveClassName : '',
                )}
                data-kernelon-app-header-segment-button="true"
                key={option.value}
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
                ref={(node) => {
                  if (node) {
                    buttonRefs.current.set(option.value, node);
                  } else {
                    buttonRefs.current.delete(option.value);
                  }
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
            );
          })}
        </div>
      </LiquidGlassSvgFilter>
    </div>
  );
}

function playTopLayerSegmentPress(event: ReactMouseEvent<HTMLButtonElement>) {
  const button = event.currentTarget;
  const pulse = button.querySelector<HTMLElement>(
    '[data-kernelon-app-header-segment-pulse="true"]',
  );

  void animateTopLayerSegmentPress({ button, pulse }).catch(() => undefined);
}

function animateTopLayerSegmentIndicator({
  indicator,
  width,
  x,
}: SegmentIndicatorTargets): Promise<AppHeaderTimeline> {
  return loadAppHeaderGsap().then((gsap) => {
    const timeline = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => {
        gsap.set(indicator, { clearProps: 'filter' });
      },
    });

    gsap.set(indicator, {
      autoAlpha: 1,
      force3D: true,
      transformOrigin: '50% 50%',
      width,
    });

    timeline
      .to(indicator, { duration: 0.34, x, width }, 0)
      .fromTo(
        indicator,
        { filter: 'brightness(1.32) saturate(1.22)' },
        { duration: 0.5, ease: 'sine.out', filter: 'brightness(1) saturate(1)' },
        0,
      );

    return {
      kill() {
        timeline.kill();
        gsap.set(indicator, { clearProps: 'filter' });
      },
    };
  });
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
            { autoAlpha: 0.32, duration: 0.1, scale: 1 },
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
            { autoAlpha: 0.72, duration: 0.14, ease: 'sine.out', scale: 1.04 },
            0,
          )
          .to(pulse, { autoAlpha: 0, duration: 0.34, ease: 'power2.out', scale: 1.72 }, 0.08);
      }

      timeline
        .to(button, { duration: 0.08, ease: 'power2.out', scale: 0.94, y: 0.5 }, 0)
        .to(button, { duration: 0.15, ease: 'back.out(2.4)', scale: 1.05, y: -0.45 }, 0.08)
        .to(button, { duration: 0.28, ease: 'elastic.out(1.05, 0.62)', scale: 1, y: 0 }, 0.18);
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
const TOP_LAYER_SEGMENT_BUTTON_WIDTH = 94;
const TOP_LAYER_SEGMENT_GROUP_PADDING = 4;

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

const topLayerSegmentHostClassName =
  'relative h-[42px] shrink-0 overflow-visible';

const topLayerSegmentGlassClassName = 'z-10 text-white';

const topLayerSegmentGroupClassName =
  'relative inline-flex h-[42px] shrink-0 items-center gap-0 overflow-hidden rounded-full border-0 bg-transparent p-1 shadow-none';

const topLayerSegmentIndicatorClassName =
  'pointer-events-none absolute top-1 bottom-1 left-0 z-0 w-[94px] rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,0.34),rgba(255,255,255,0.14)_48%,rgba(255,255,255,0.05)),rgba(255,255,255,0.11)] opacity-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.46),inset_0_-12px_24px_rgba(255,255,255,0.07),0_8px_22px_rgba(0,0,0,0.22),0_0_18px_rgba(255,255,255,0.10)] backdrop-blur-[16px] will-change-[transform,width,filter]';

const topLayerSegmentButtonClassName =
  'relative z-10 inline-flex h-[34px] min-w-[94px] items-center justify-center overflow-hidden rounded-full border-0 bg-transparent px-5 text-[14px] font-bold text-white/70 shadow-none outline-none transition-[color,text-shadow] duration-200 ease-out hover:text-white focus-visible:ring-2 focus-visible:ring-white/[0.65]';

const topLayerSegmentButtonActiveClassName =
  'text-white [text-shadow:0_0_12px_rgba(255,255,255,0.36)]';

const topLayerSegmentPulseClassName =
  'pointer-events-none absolute inset-[-8px] z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.58),rgba(255,255,255,0.16)_42%,rgba(125,211,252,0)_70%)] opacity-0 mix-blend-screen';
