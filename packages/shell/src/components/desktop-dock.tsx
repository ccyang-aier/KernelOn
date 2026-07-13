'use client';

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from 'motion/react';

import type { KernelAppManifest } from '@kernelon/core';

import { resolveDockIconAsset, resolveDockIconAssetScale } from '../visual-assets';

export interface DesktopDockProps {
  apps: KernelAppManifest[];
  dockAppIds: string[];
  onOpenApp(appId: string, dockElement?: HTMLElement): void;
  onToggleLauncher(): void;
  onToggleSpotlight(): void;
}

const DOCK_POINTER_RESTING_X = Number.NaN;
const DOCK_DEFAULT_ICON_MEASURE = 56;
const DOCK_ICON_SPRING = {
  damping: 46,
  mass: 0.24,
  stiffness: 720,
};

export function resolveDockItemMagnification({
  distance,
  iconSize = DOCK_DEFAULT_ICON_MEASURE,
  reducedMotion = false,
}: {
  distance: number;
  iconSize?: number;
  reducedMotion?: boolean;
}): number {
  if (reducedMotion || !Number.isFinite(distance)) {
    return 1;
  }

  const measuredIconSize = Math.max(iconSize, 1);
  const absDistance = Math.abs(distance);
  const falloffStops = [
    { distance: 0, scale: 1.64 },
    { distance: measuredIconSize * 1.1, scale: 1.57 },
    { distance: measuredIconSize * 2.4, scale: 1.41 },
    { distance: measuredIconSize * 3.7, scale: 1.2 },
    { distance: measuredIconSize * 5.2, scale: 1.06 },
    { distance: measuredIconSize * 6.1, scale: 1 },
  ];

  if (absDistance >= falloffStops.at(-1)!.distance) {
    return 1;
  }

  const stopIndex = falloffStops.findIndex((stop) => absDistance <= stop.distance);
  const from = falloffStops[Math.max(stopIndex - 1, 0)];
  const to = falloffStops[stopIndex];
  const range = to.distance - from.distance;
  const progress = range === 0 ? 0 : (absDistance - from.distance) / range;
  const easedProgress = progress * progress * (3 - 2 * progress);

  return from.scale + (to.scale - from.scale) * easedProgress;
}

export function DesktopDock({
  apps,
  dockAppIds,
  onOpenApp,
  onToggleLauncher,
  onToggleSpotlight,
}: DesktopDockProps) {
  const shouldReduceMotion = useReducedMotion();
  const mouseX = useMotionValue(DOCK_POINTER_RESTING_X);
  const [isDockInteracting, setIsDockInteracting] = useState(false);
  const dockApps = dockAppIds
    .map((appId) => apps.find((app) => app.id === appId))
    .filter((app): app is KernelAppManifest => Boolean(app));
  const setDockInteraction = useCallback(
    (isInteracting: boolean) => {
      setIsDockInteracting(isInteracting);

      if (!isInteracting) {
        mouseX.set(DOCK_POINTER_RESTING_X);
      }
    },
    [mouseX],
  );
  const beginDockInteraction = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === 'touch') {
        return;
      }

      setDockInteraction(true);
      mouseX.set(event.clientX);
    },
    [mouseX, setDockInteraction],
  );
  const endDockInteraction = useCallback(() => {
    setDockInteraction(false);
  }, [setDockInteraction]);
  const handleDockBlur = useCallback(
    (event: ReactFocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setDockInteraction(false);
      }
    },
    [setDockInteraction],
  );

  return (
    <motion.nav
      aria-label="KernelOn Dock"
      className="fixed bottom-[clamp(12px,2.2vh,24px)] left-1/2 z-[30] flex h-[var(--dock-rail-height)] w-max max-w-[calc(100vw-20px)] -translate-x-1/2 items-end gap-[var(--dock-gap)] overflow-visible rounded-[clamp(20px,2.2vw,32px)] border border-white/40 px-[var(--dock-pad-x)] py-[var(--dock-pad-y)]"
      data-kernelon-dock-interacting={String(isDockInteracting)}
      data-testid="kernelon-dock"
      onBlur={handleDockBlur}
      onFocus={() => setDockInteraction(true)}
      onPointerCancel={endDockInteraction}
      onPointerEnter={beginDockInteraction}
      onPointerLeave={endDockInteraction}
      onPointerMove={beginDockInteraction}
      style={
        {
          ...dockStyle,
          '--dock-hover-progress': isDockInteracting ? 1 : 0,
        } as CSSProperties
      }
    >
      <DockIconButton
        assetKey="launchpad"
        label="启动台"
        mouseX={mouseX}
        onClick={onToggleLauncher}
        reducedMotion={Boolean(shouldReduceMotion)}
      />
      {dockApps.map((app) => (
        <DockIconButton
          assetKey={app.id}
          key={app.id}
          label={app.name}
          mouseX={mouseX}
          onClick={(event) => onOpenApp(app.id, event.currentTarget)}
          reducedMotion={Boolean(shouldReduceMotion)}
        />
      ))}
      <DockIconButton
        assetKey="ai-spotlight"
        label="AI Spotlight"
        mouseX={mouseX}
        onClick={onToggleSpotlight}
        reducedMotion={Boolean(shouldReduceMotion)}
      />
      <div
        aria-hidden="true"
        className="mx-[1px] h-[calc(var(--dock-icon-size)*0.78)] w-px bg-white/55 shadow-[1px_0_0_rgba(18,35,18,0.20)]"
      />
      <DockIconButton
        assetKey="folder-stack"
        label="资源文件夹"
        mouseX={mouseX}
        reducedMotion={Boolean(shouldReduceMotion)}
      />
      <DockIconButton
        assetKey="document"
        label="最近文档"
        mouseX={mouseX}
        reducedMotion={Boolean(shouldReduceMotion)}
      />
      <DockIconButton
        assetKey="trash"
        label="废纸篓"
        mouseX={mouseX}
        reducedMotion={Boolean(shouldReduceMotion)}
      />
    </motion.nav>
  );
}

interface DockIconButtonProps {
  assetKey: string;
  label: string;
  mouseX: MotionValue<number>;
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  reducedMotion: boolean;
}

function DockIconButton({ assetKey, label, mouseX, onClick, reducedMotion }: DockIconButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const baseIconSizeRef = useRef(DOCK_DEFAULT_ICON_MEASURE);
  const distance = useMotionValue(DOCK_POINTER_RESTING_X);
  const scaleTarget = useTransform(distance, (distanceValue) =>
    resolveDockItemMagnification({
      distance: distanceValue,
      iconSize: baseIconSizeRef.current,
      reducedMotion,
    }),
  );
  const scale = useSpring(scaleTarget, DOCK_ICON_SPRING);

  useAnimationFrame(() => {
    const button = buttonRef.current;
    const pointerX = mouseX.get();

    if (!button || !Number.isFinite(pointerX)) {
      distance.set(DOCK_POINTER_RESTING_X);
      return;
    }

    const rect = button.getBoundingClientRect();
    baseIconSizeRef.current = resolveDockItemBaseSize(button, scale.get());
    distance.set(pointerX - (rect.left + rect.width / 2));
  });

  return (
    <motion.button
      aria-label={label}
      className="group relative flex shrink-0 origin-bottom items-center justify-center rounded-[clamp(12px,1.1vw,16px)] outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      data-kernelon-dock-motion="layout-width"
      data-kernelon-dock-target={assetKey}
      onClick={onClick}
      ref={buttonRef}
      style={
        {
          '--dock-icon-asset-scale': resolveDockIconAssetScale(assetKey),
          '--dock-item-scale': scale,
          height: 'calc(var(--dock-icon-size) * var(--dock-item-scale))',
          transformOrigin: '50% 100%',
          width: 'calc(var(--dock-icon-size) * var(--dock-item-scale))',
          willChange: reducedMotion ? 'auto' : 'width, height',
        } as MotionStyle
      }
      title={label}
      type="button"
    >
      <img
        alt=""
        className="pointer-events-none h-full w-full scale-[var(--dock-icon-asset-scale)] select-none object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.24)] transition duration-200 ease-out group-hover:drop-shadow-[0_14px_16px_rgba(0,0,0,0.28)]"
        draggable={false}
        src={resolveDockIconAsset(assetKey)}
      />
    </motion.button>
  );
}

function resolveDockItemBaseSize(button: HTMLButtonElement | null, currentScale: number): number {
  if (!button) {
    return DOCK_DEFAULT_ICON_MEASURE;
  }

  const width = button.getBoundingClientRect().width;

  if (width <= 0) {
    return DOCK_DEFAULT_ICON_MEASURE;
  }

  return width / Math.max(currentScale, 0.1);
}

const dockGlassSurfaceStyle = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(238,246,231,0.14) 42%, rgba(104,147,118,0.16) 100%), radial-gradient(120% 150% at 18% -18%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0) 66%), radial-gradient(95% 120% at 82% 118%, rgba(58,111,91,0.16) 0%, rgba(58,111,91,0) 60%)',
  backgroundClip: 'padding-box',
  backdropFilter: 'blur(14px) saturate(174%) contrast(106%)',
  WebkitBackdropFilter: 'blur(14px) saturate(174%) contrast(106%)',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,0.28), inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -1px 0 rgba(255,255,255,0.34), inset 0 14px 24px rgba(255,255,255,0.08), inset 0 -18px 26px rgba(36,73,48,0.10), 0 15px 36px rgba(5,24,9,0.22), 0 2px 8px rgba(255,255,255,0.16)',
} as CSSProperties;

const dockStyle = {
  '--dock-gap': 'clamp(7px, 0.6vw, 11px)',
  '--dock-icon-size': 'clamp(32px, 3.7vw, 66px)',
  '--dock-pad-x': 'clamp(9px, 0.9vw, 16px)',
  '--dock-pad-y': 'clamp(5px, 0.55vw, 9px)',
  '--dock-rail-height': 'calc(var(--dock-icon-size) + var(--dock-pad-y) + var(--dock-pad-y))',
  height: 'var(--dock-rail-height)',
  ...dockGlassSurfaceStyle,
} as CSSProperties;
