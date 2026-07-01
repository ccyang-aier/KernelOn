const ASSET_ROOT = '/kernelon-assets';

export const kernelOnBrandLogo = `${ASSET_ROOT}/brand/kernelon-logo.png`;
export const kernelOnDesktopWallpaper = `${ASSET_ROOT}/wallpapers/kernelon-flower-wallpaper.png`;
export const kernelOnStatusAvatar = `${ASSET_ROOT}/status/avatar-manager.png`;

export const dockIconAssets = {
  'ai-spotlight': `${ASSET_ROOT}/dock-icons/ai-spotlight.png`,
  assessment: `${ASSET_ROOT}/dock-icons/assessment.png`,
  dashboard: `${ASSET_ROOT}/dock-icons/dashboard.png`,
  document: `${ASSET_ROOT}/dock-icons/document.png`,
  'folder-stack': `${ASSET_ROOT}/dock-icons/growth-archive.png`,
  'growth-archive': `${ASSET_ROOT}/dock-icons/growth-archive.png`,
  launchpad: `${ASSET_ROOT}/dock-icons/launchpad.png`,
  mentor: `${ASSET_ROOT}/dock-icons/mentor.png`,
  onboarding: `${ASSET_ROOT}/dock-icons/onboarding.png`,
  resources: `${ASSET_ROOT}/dock-icons/resources.png`,
  training: `${ASSET_ROOT}/dock-icons/training.png`,
  trash: `${ASSET_ROOT}/dock-icons/trash.png`,
} as const;

export type DockIconAssetKey = keyof typeof dockIconAssets;

const dockIconAssetScales: Partial<Record<DockIconAssetKey, string>> = {
  onboarding: '1.07',
};

export function resolveDockIconAsset(assetKey: string): string {
  return dockIconAssets[assetKey as DockIconAssetKey] ?? dockIconAssets.launchpad;
}

export function resolveDockIconAssetScale(assetKey: string): string {
  return dockIconAssetScales[assetKey as DockIconAssetKey] ?? '1';
}
