'use client';

import { type CSSProperties } from 'react';

import type { KernelAppManifest } from '@kernelon/core';

import {
  resolveDockIconAsset,
  resolveDockIconAssetScale,
} from '../visual-assets';

export interface DesktopDockProps {
  apps: KernelAppManifest[];
  dockAppIds: string[];
  onOpenApp(appId: string): void;
  onToggleLauncher(): void;
  onToggleSpotlight(): void;
}

export function DesktopDock({
  apps,
  dockAppIds,
  onOpenApp,
  onToggleLauncher,
  onToggleSpotlight,
}: DesktopDockProps) {
  const dockApps = dockAppIds
    .map((appId) => apps.find((app) => app.id === appId))
    .filter((app): app is KernelAppManifest => Boolean(app));

  return (
    <nav
      aria-label="KernelOn Dock"
      className="fixed bottom-[clamp(12px,2.2vh,24px)] left-1/2 z-20 flex max-w-[calc(100vw-20px)] -translate-x-1/2 items-center gap-[var(--dock-gap)] overflow-x-auto rounded-[clamp(20px,2.2vw,32px)] border border-white/40 px-[var(--dock-pad-x)] py-[var(--dock-pad-y)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="kernelon-dock"
      style={dockStyle}
    >
      <DockIconButton assetKey="launchpad" label="启动台" onClick={onToggleLauncher} />
      {dockApps.map((app) => (
        <DockIconButton
          assetKey={app.id}
          key={app.id}
          label={app.name}
          onClick={() => onOpenApp(app.id)}
        />
      ))}
      <DockIconButton assetKey="ai-spotlight" label="AI Spotlight" onClick={onToggleSpotlight} />
      <div
        aria-hidden="true"
        className="mx-[1px] h-[calc(var(--dock-icon-size)*0.78)] w-px bg-white/55 shadow-[1px_0_0_rgba(18,35,18,0.20)]"
      />
      <DockIconButton assetKey="folder-stack" label="资源文件夹" />
      <DockIconButton assetKey="document" label="最近文档" />
      <DockIconButton assetKey="trash" label="废纸篓" />
    </nav>
  );
}

interface DockIconButtonProps {
  assetKey: string;
  label: string;
  onClick?: () => void;
}

function DockIconButton({ assetKey, label, onClick }: DockIconButtonProps) {
  return (
    <button
      aria-label={label}
      className="group relative flex size-[var(--dock-icon-size)] shrink-0 items-center justify-center rounded-[clamp(12px,1.1vw,16px)] outline-none transition duration-200 ease-out hover:-translate-y-1.5 hover:scale-[1.05] focus-visible:ring-2 focus-visible:ring-white/80"
      onClick={onClick}
      style={
        {
          '--dock-icon-asset-scale': resolveDockIconAssetScale(assetKey),
        } as CSSProperties
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
    </button>
  );
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
  ...dockGlassSurfaceStyle,
} as CSSProperties;
