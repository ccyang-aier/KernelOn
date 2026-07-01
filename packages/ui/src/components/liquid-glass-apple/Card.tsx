'use client';

import { LiquidGlass, liquidGlassAppleCardDefaults, type LiquidGlassProps } from './LiquidGlass';

export type LiquidGlassCardProps = LiquidGlassProps;

export function LiquidGlassCard({
  displacementScale = liquidGlassAppleCardDefaults.displacementScale,
  blurAmount = liquidGlassAppleCardDefaults.blurAmount,
  saturation = liquidGlassAppleCardDefaults.saturation,
  aberrationIntensity = liquidGlassAppleCardDefaults.aberrationIntensity,
  elasticity = liquidGlassAppleCardDefaults.elasticity,
  cornerRadius = liquidGlassAppleCardDefaults.cornerRadius,
  padding = liquidGlassAppleCardDefaults.padding,
  overLight = liquidGlassAppleCardDefaults.overLight,
  mode = liquidGlassAppleCardDefaults.mode,
  ...props
}: LiquidGlassCardProps) {
  return (
    <LiquidGlass
      aberrationIntensity={aberrationIntensity}
      blurAmount={blurAmount}
      cornerRadius={cornerRadius}
      displacementScale={displacementScale}
      elasticity={elasticity}
      mode={mode}
      overLight={overLight}
      padding={padding}
      saturation={saturation}
      {...props}
    />
  );
}
